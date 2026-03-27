import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class MembershipService {
  /**
   * 获取会员套餐列表
   */
  async getMembershipPlans(role?: number) {
    const client = getSupabaseClient();
    
    let query = client
      .from('membership_plans')
      .select('*')
      .eq('is_active', 1)
      .order('price', { ascending: true });

    if (role !== undefined) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw new Error(`查询会员套餐失败: ${error.message}`);
    return data;
  }

  /**
   * 购买会员
   */
  async buyMembership(userId: number, planId: number) {
    const client = getSupabaseClient();

    // 获取套餐信息
    const { data: plan, error: planError } = await client
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (planError) throw new Error(`查询套餐失败: ${planError.message}`);
    if (!plan) throw new Error('套餐不存在');

    // 创建支付记录
    const paymentNo = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    
    const { data: payment, error: paymentError } = await client
      .from('payments')
      .insert({
        user_id: userId,
        target_type: 1, // 会员
        target_id: planId,
        amount: plan.price,
        payment_no: paymentNo,
        status: 0, // 待支付
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) throw new Error(`创建支付记录失败: ${paymentError.message}`);

    // TODO: 调用微信支付创建预支付订单
    
    return {
      payment_id: payment.id,
      payment_no: paymentNo,
      amount: plan.price,
      plan_name: plan.name,
    };
  }

  /**
   * 支付成功回调处理
   */
  async handlePaymentSuccess(paymentNo: string, transactionId: string) {
    const client = getSupabaseClient();

    // 获取支付记录
    const { data: payment, error: paymentError } = await client
      .from('payments')
      .select(`
        *,
        membership_plans!payments_target_id_fkey (*)
      `)
      .eq('payment_no', paymentNo)
      .maybeSingle();

    if (paymentError) throw new Error(`查询支付记录失败: ${paymentError.message}`);
    if (!payment) throw new Error('支付记录不存在');
    if (payment.status === 1) throw new Error('订单已处理');

    const plan = payment.membership_plans;
    const userId = payment.user_id;

    // 计算会员到期时间
    const now = new Date();
    const expireAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    // 更新用户会员状态
    const { error: userError } = await client
      .from('users')
      .update({
        membership_type: 1,
        membership_expire_at: expireAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) throw new Error(`更新会员状态失败: ${userError.message}`);

    // 更新支付记录
    const { error: updateError } = await client
      .from('payments')
      .update({
        status: 1, // 已支付
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) throw new Error(`更新支付状态失败: ${updateError.message}`);

    // 触发分佣
    await this.triggerCommission(userId, payment.id, plan.price);

    return { success: true, expire_at: expireAt };
  }

  /**
   * 触发分佣逻辑
   */
  private async triggerCommission(userId: number, paymentId: number, amount: number) {
    const client = getSupabaseClient();

    // 获取用户信息（包含推荐人）
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) return;

    const commissions: Array<{
      user_id: number;
      from_user_id: number;
      payment_id: number;
      level_type: number;
      amount: number;
      rate: number;
      status: number;
      created_at: string;
    }> = [];

    // 一级推荐人分佣
    if (user.inviter_id) {
      commissions.push({
        user_id: user.inviter_id,
        from_user_id: userId,
        payment_id: paymentId,
        level_type: 1, // 一级
        amount: amount * 0.2, // 20%
        rate: 20,
        status: 0,
        created_at: new Date().toISOString(),
      });
    }

    // 二级推荐人分佣
    if (user.inviter_2nd_id) {
      commissions.push({
        user_id: user.inviter_2nd_id,
        from_user_id: userId,
        payment_id: paymentId,
        level_type: 2, // 二级
        amount: amount * 0.1, // 10%
        rate: 10,
        status: 0,
        created_at: new Date().toISOString(),
      });
    }

    // 城市代理分佣
    if (user.city_agent_id) {
      commissions.push({
        user_id: user.city_agent_id,
        from_user_id: userId,
        payment_id: paymentId,
        level_type: 3, // 城市代理
        amount: amount * 0.05, // 5%
        rate: 5,
        status: 0,
        created_at: new Date().toISOString(),
      });
    }

    // 机构分佣
    if (user.affiliated_org_id) {
      commissions.push({
        user_id: user.affiliated_org_id,
        from_user_id: userId,
        payment_id: paymentId,
        level_type: 4, // 机构
        amount: amount * 0.1, // 10%
        rate: 10,
        status: 0,
        created_at: new Date().toISOString(),
      });
    }

    // 批量插入佣金记录
    if (commissions.length > 0) {
      const { error: commissionError } = await client
        .from('commissions')
        .insert(commissions as any);

      if (commissionError) {
        console.error('创建佣金记录失败:', commissionError.message);
      }
    }
  }

  /**
   * 获取用户会员信息
   */
  async getUserMembership(userId: number) {
    const client = getSupabaseClient();
    
    const { data: user, error } = await client
      .from('users')
      .select('membership_type, membership_expire_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw new Error(`查询会员信息失败: ${error.message}`);

    const isActive = 
      user?.membership_type === 1 && 
      user?.membership_expire_at && 
      new Date(user.membership_expire_at) > new Date();

    return {
      is_member: isActive,
      membership_type: user?.membership_type || 0,
      expire_at: user?.membership_expire_at,
      days_remaining: isActive 
        ? Math.ceil((new Date(user.membership_expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  }
}
