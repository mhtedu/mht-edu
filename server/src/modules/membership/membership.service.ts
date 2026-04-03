import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class MembershipService {
  /**
   * 获取会员套餐列表
   */
  async getMembershipPlans(role?: number) {
    let sql = 'SELECT * FROM membership_plans WHERE is_active = 1';
    const params: any[] = [];

    if (role !== undefined) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY price ASC';

    const [data] = await db.query(sql, params) as [any[], any];
    return data;
  }

  /**
   * 购买会员（按角色独立）
   */
  async buyMembership(userId: number, planId: number, role?: number) {
    // 获取套餐信息
    const [plans] = await db.query(
      'SELECT * FROM membership_plans WHERE id = ?',
      [planId]
    ) as [any[], any];

    if (plans.length === 0) {
      throw new Error('套餐不存在');
    }

    const plan = plans[0] as any;
    // 使用传入的角色或套餐的角色
    const targetRole = role !== undefined ? role : plan.role;

    // 创建支付记录
    const paymentNo = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const [result] = await db.query(
      `INSERT INTO payments (user_id, membership_id, amount, payment_no, status, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [userId, planId, plan.price, paymentNo]
    ) as [any, any];

    return {
      payment_id: (result as any).insertId,
      payment_no: paymentNo,
      amount: plan.price,
      plan_name: plan.name,
      role: targetRole,
    };
  }

  /**
   * 支付成功回调处理（按角色独立）
   */
  async handlePaymentSuccess(paymentNo: string, transactionId: string) {
    // 获取支付记录
    const [payments] = await db.query(
      `SELECT p.*, mp.duration_days, mp.name as plan_name, mp.role as plan_role
       FROM payments p
       LEFT JOIN membership_plans mp ON p.membership_id = mp.id
       WHERE p.payment_no = ?`,
      [paymentNo]
    ) as [any[], any];

    if (payments.length === 0) {
      throw new Error('支付记录不存在');
    }

    const payment = payments[0] as any;

    if (payment.status === 1) {
      throw new Error('订单已处理');
    }

    const plan = payment;
    const userId = payment.user_id;
    const role = plan.plan_role;

    // 计算会员到期时间
    const now = new Date();
    const expireAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    // 更新用户角色会员状态（在角色会员表中）
    try {
      // 先检查是否存在记录
      const [existing] = await db.query(
        'SELECT id FROM user_role_memberships WHERE user_id = ? AND role = ?',
        [userId, role]
      ) as [any[], any];

      if (existing.length > 0) {
        // 更新现有记录
        await db.query(
          `UPDATE user_role_memberships 
           SET membership_type = 1, expire_at = ?, updated_at = NOW() 
           WHERE user_id = ? AND role = ?`,
          [expireAt, userId, role]
        );
      } else {
        // 插入新记录
        await db.query(
          `INSERT INTO user_role_memberships (user_id, role, membership_type, expire_at, created_at)
           VALUES (?, ?, 1, ?, NOW())`,
          [userId, role, expireAt]
        );
      }
    } catch (error) {
      console.log('角色会员表不存在，更新用户表');
      // 回退到更新用户表
      await db.query(
        `UPDATE users SET membership_type = 1, membership_expire_at = ?, updated_at = NOW() WHERE id = ?`,
        [expireAt, userId]
      );
    }

    // 更新支付记录
    await db.query(
      `UPDATE payments SET status = 1, transaction_id = ?, paid_at = NOW() WHERE id = ?`,
      [transactionId, payment.id]
    );

    // 触发分佣
    await this.triggerCommission(userId, payment.id, plan.price);

    return { success: true, expire_at: expireAt, role };
  }

  /**
   * 触发分佣逻辑
   */
  private async triggerCommission(userId: number, paymentId: number, amount: number) {
    // 获取用户信息（包含推荐人）
    const [users] = await db.query(
      'SELECT id, inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id FROM users WHERE id = ?',
      [userId]
    ) as [any[], any];

    if (users.length === 0) return;

    const user = users[0] as any;

    const commissions: Array<{
      user_id: number;
      from_user_id: number;
      payment_id: number;
      level_type: number;
      amount: number;
      rate: number;
      status: number;
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
      });
    }

    // 批量插入佣金记录
    if (commissions.length > 0) {
      for (const commission of commissions) {
        await db.query(
          `INSERT INTO commissions (user_id, from_user_id, payment_id, level_type, amount, rate, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [commission.user_id, commission.from_user_id, commission.payment_id, 
           commission.level_type, commission.amount, commission.rate, commission.status]
        );
      }
    }
  }

  /**
   * 获取用户会员信息（指定角色）
   */
  async getUserMembership(userId: number, role?: number) {
    // 尝试从角色会员表获取
    try {
      let sql = 'SELECT role, membership_type, expire_at FROM user_role_memberships WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (role !== undefined) {
        sql += ' AND role = ?';
        params.push(role);
      }
      
      const [memberships] = await db.query(sql, params) as [any[], any];

      if (memberships.length > 0) {
        const membership = memberships[0] as any;
        const isActive =
          membership?.membership_type === 1 &&
          membership?.expire_at &&
          new Date(membership.expire_at) > new Date();

        return {
          is_member: isActive,
          membership_type: membership?.membership_type || 0,
          expire_at: membership?.expire_at,
          role: membership?.role,
          days_remaining: isActive
            ? Math.ceil((new Date(membership.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0,
        };
      }
    } catch (error) {
      console.log('角色会员表不存在，回退到用户表');
    }

    // 回退到用户表
    const [users] = await db.query(
      'SELECT membership_type, membership_expire_at FROM users WHERE id = ?',
      [userId]
    ) as [any[], any];

    if (users.length === 0) {
      throw new Error('用户不存在');
    }

    const user = users[0] as any;

    const isActive =
      user?.membership_type === 1 &&
      user?.membership_expire_at &&
      new Date(user.membership_expire_at) > new Date();

    return {
      is_member: isActive,
      membership_type: user?.membership_type || 0,
      expire_at: user?.membership_expire_at,
      role: role || 0,
      days_remaining: isActive
        ? Math.ceil((new Date(user.membership_expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  }
}
