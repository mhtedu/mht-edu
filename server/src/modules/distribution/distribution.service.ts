import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class DistributionService {
  /**
   * 获取邀请信息
   */
  async getInviteInfo(userId: number) {
    const client = getSupabaseClient();

    // 获取用户基本信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, nickname, avatar, inviter_id')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);

    // 统计一级邀请人数
    const { count: level1Count, error: count1Error } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', userId);

    if (count1Error) throw new Error(`统计邀请人数失败: ${count1Error.message}`);

    // 统计二级邀请人数
    const { count: level2Count, error: count2Error } = await client
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_2nd_id', userId);

    if (count2Error) throw new Error(`统计二级邀请人数失败: ${count2Error.message}`);

    // 统计佣金总额
    const { data: commissionStats, error: statsError } = await client
      .from('commissions')
      .select('amount, status')
      .eq('user_id', userId);

    if (statsError) throw new Error(`统计佣金失败: ${statsError.message}`);

    const totalCommission = commissionStats?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
    const settledCommission = commissionStats?.filter(c => c.status === 1).reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
    const withdrawnCommission = commissionStats?.filter(c => c.status === 2).reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;

    // 生成邀请码（基于用户ID）
    const inviteCode = this.generateInviteCode(userId);

    return {
      user: {
        id: user?.id,
        nickname: user?.nickname,
        avatar: user?.avatar,
      },
      inviter_id: user?.inviter_id,
      invite_code: inviteCode,
      invite_link: `https://your-domain.com/invite?code=${inviteCode}`,
      statistics: {
        level1_count: level1Count || 0,
        level2_count: level2Count || 0,
        total_commission: totalCommission.toFixed(2),
        settled_commission: settledCommission.toFixed(2),
        withdrawn_commission: withdrawnCommission.toFixed(2),
        available_commission: (settledCommission - withdrawnCommission).toFixed(2),
      },
    };
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(userId: number): string {
    // 简单的邀请码生成逻辑：用户ID转36进制
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let num = userId;
    
    while (num > 0 || code.length < 4) {
      code = chars[num % chars.length] + code;
      num = Math.floor(num / chars.length);
    }
    
    return code.padStart(6, 'X');
  }

  /**
   * 绑定邀请关系
   */
  async bindInviter(userId: number, inviteCode: string) {
    const client = getSupabaseClient();

    // 解析邀请码获取推荐人ID
    const inviterId = this.parseInviteCode(inviteCode);
    if (!inviterId) {
      throw new Error('邀请码无效');
    }

    // 不能邀请自己
    if (inviterId === userId) {
      throw new Error('不能使用自己的邀请码');
    }

    // 检查用户是否已有推荐人
    const { data: user, error: userError } = await client
      .from('users')
      .select('inviter_id')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw new Error(`查询用户失败: ${userError.message}`);
    if (user?.inviter_id) {
      throw new Error('您已有推荐人，无法重复绑定');
    }

    // 验证推荐人是否存在
    const { data: inviter, error: inviterError } = await client
      .from('users')
      .select('id, inviter_id')
      .eq('id', inviterId)
      .maybeSingle();

    if (inviterError || !inviter) {
      throw new Error('推荐人不存在');
    }

    // 更新邀请关系
    const { error: updateError } = await client
      .from('users')
      .update({
        inviter_id: inviterId,
        inviter_2nd_id: inviter.inviter_id || null, // 二级推荐人
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw new Error(`绑定邀请关系失败: ${updateError.message}`);

    return {
      success: true,
      inviter_id: inviterId,
    };
  }

  /**
   * 解析邀请码
   */
  private parseInviteCode(code: string): number | null {
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let num = 0;
      
      for (let i = 0; i < code.length; i++) {
        const index = chars.indexOf(code[i].toUpperCase());
        if (index === -1) continue;
        num = num * chars.length + index;
      }
      
      return num > 0 ? num : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取佣金明细
   */
  async getCommissionList(userId: number, page: number = 1, pageSize: number = 20) {
    const client = getSupabaseClient();

    const { data, error, count } = await client
      .from('commissions')
      .select(`
        *,
        users!commissions_from_user_id_fkey (id, nickname, avatar)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`查询佣金明细失败: ${error.message}`);

    return {
      list: data,
      total: count,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * 申请提现
   */
  async applyWithdraw(userId: number, amount: number, accountInfo: { type: string; account: string; name: string }) {
    const client = getSupabaseClient();

    // 检查可提现金额
    const { data: commissions, error: commissionError } = await client
      .from('commissions')
      .select('amount, status')
      .eq('user_id', userId)
      .eq('status', 1); // 已结算

    if (commissionError) throw new Error(`查询佣金失败: ${commissionError.message}`);

    const availableAmount = commissions?.reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
    
    if (availableAmount < amount) {
      throw new Error(`可提现金额不足，当前可提现：${availableAmount.toFixed(2)}元`);
    }

    if (amount < 10) {
      throw new Error('提现金额最低10元');
    }

    // TODO: 创建提现记录并调用支付接口打款
    
    return {
      success: true,
      amount,
      message: '提现申请已提交，预计1-3个工作日到账',
    };
  }

  /**
   * 获取我的邀请列表
   */
  async getInviteList(userId: number, level: 1 | 2 = 1, page: number = 1, pageSize: number = 20) {
    const client = getSupabaseClient();

    const field = level === 1 ? 'inviter_id' : 'inviter_2nd_id';
    
    const { data, error, count } = await client
      .from('users')
      .select('id, nickname, avatar, created_at', { count: 'exact' })
      .eq(field, userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`查询邀请列表失败: ${error.message}`);

    return {
      list: data,
      total: count,
      page,
      page_size: pageSize,
      level,
    };
  }
}
