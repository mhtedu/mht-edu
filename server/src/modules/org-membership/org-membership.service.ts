import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class OrgMembershipService {
  // ==================== 机构会员套餐 ====================

  /**
   * 获取机构会员套餐列表
   */
  async getOrgMembershipPlans() {
    return executeQuery(`
      SELECT * FROM org_membership_plans 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `);
  }

  /**
   * 获取机构会员信息
   */
  async getOrgMembership(orgId: number) {
    const memberships = await executeQuery(`
      SELECT om.*, omp.name as plan_name, omp.type as plan_type, omp.features
      FROM org_memberships om
      LEFT JOIN org_membership_plans omp ON om.membership_type = omp.type
      WHERE om.org_id = ? AND om.expire_at > NOW()
      ORDER BY om.expire_at DESC
      LIMIT 1
    `, [orgId]);

    if (memberships.length === 0) {
      return {
        is_member: false,
        membership_type: 0,
        plan_name: null,
        expire_at: null,
        teacher_quota: 0,
        used_quota: 0,
        remaining_quota: 0,
        features: [],
      };
    }

    const membership = memberships[0] as any;
    return {
      is_member: true,
      membership_type: membership.membership_type,
      plan_name: membership.plan_name,
      expire_at: membership.expire_at,
      teacher_quota: membership.teacher_quota,
      used_quota: membership.used_quota,
      remaining_quota: membership.teacher_quota - membership.used_quota,
      features: membership.features ? JSON.parse(membership.features) : [],
    };
  }

  /**
   * 购买机构会员
   */
  async buyOrgMembership(orgId: number, planId: number) {
    // 获取套餐信息
    const plans = await executeQuery(
      'SELECT * FROM org_membership_plans WHERE id = ? AND is_active = 1',
      [planId]
    );

    if (plans.length === 0) {
      throw new Error('套餐不存在');
    }

    const plan = plans[0] as any;

    // 检查教师数量是否超出新套餐限制
    const teacherCount = await this.getOrgTeacherCount(orgId);
    if (teacherCount > plan.teacher_quota) {
      throw new Error(`当前已有${teacherCount}名教师，超出此套餐名额限制，请选择更高版本套餐`);
    }

    // 创建支付记录
    const paymentNo = `ORG${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const result = await executeQuery(`
      INSERT INTO payments (user_id, amount, payment_no, type, status, created_at)
      VALUES (?, ?, ?, 'org_membership', 0, NOW())
    `, [orgId, plan.price, paymentNo]);

    const paymentId = (result as any).insertId;

    return {
      payment_id: paymentId,
      payment_no: paymentNo,
      amount: plan.price,
      plan_name: plan.name,
      plan_id: planId,
    };
  }

  /**
   * 支付成功 - 激活机构会员
   */
  async activateOrgMembership(orgId: number, planId: number, paymentId: number) {
    // 获取套餐信息
    const plans = await executeQuery(
      'SELECT * FROM org_membership_plans WHERE id = ?',
      [planId]
    );

    if (plans.length === 0) {
      throw new Error('套餐不存在');
    }

    const plan = plans[0] as any;

    // 计算到期时间
    const now = new Date();
    const expireAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    // 检查是否已有会员
    const existingMembership = await executeQuery(`
      SELECT id, expire_at FROM org_memberships 
      WHERE org_id = ? AND expire_at > NOW()
      ORDER BY expire_at DESC LIMIT 1
    `, [orgId]);

    if (existingMembership.length > 0) {
      // 续期 - 在现有到期时间基础上延长
      const currentExpire = new Date((existingMembership[0] as any).expire_at);
      const newExpireAt = new Date(currentExpire.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

      await executeQuery(`
        UPDATE org_memberships 
        SET membership_type = ?, expire_at = ?, teacher_quota = ?
        WHERE org_id = ?
      `, [plan.type, newExpireAt, plan.teacher_quota, orgId]);
    } else {
      // 新购
      await executeQuery(`
        INSERT INTO org_memberships (org_id, membership_type, start_at, expire_at, teacher_quota)
        VALUES (?, ?, NOW(), ?, ?)
      `, [orgId, plan.type, expireAt, plan.teacher_quota]);
    }

    // 更新机构表的会员状态
    await executeQuery(`
      UPDATE organizations 
      SET membership_type = ?, membership_expire_at = ?
      WHERE user_id = ?
    `, [plan.type, expireAt, orgId]);

    // 同步教师会员状态（会员共享）
    await this.syncTeacherMembership(orgId, expireAt);

    // 更新支付记录
    await executeQuery(`
      UPDATE payments SET status = 1, paid_at = NOW() WHERE id = ?
    `, [paymentId]);

    return { success: true, expire_at: expireAt };
  }

  /**
   * 获取机构教师数量
   */
  private async getOrgTeacherCount(orgId: number): Promise<number> {
    const result = await executeQuery(`
      SELECT COUNT(*) as count FROM user_orgs 
      WHERE org_id = ? AND status = 1
    `, [orgId]);
    return (result[0] as any)?.count || 0;
  }

  /**
   * 同步教师会员状态（会员共享核心逻辑）
   */
  async syncTeacherMembership(orgId: number, expireAt: Date) {
    // 获取机构下所有启用会员共享的教师
    const teachers = await executeQuery(`
      SELECT user_id FROM user_orgs 
      WHERE org_id = ? AND status = 1 AND inherit_membership = 1
    `, [orgId]);

    for (const teacher of teachers) {
      const teacherId = (teacher as any).user_id;

      // 更新教师会员状态
      await executeQuery(`
        UPDATE users 
        SET membership_type = 1, 
            membership_expire_at = ?,
            org_membership_source = ?
        WHERE id = ?
      `, [expireAt, orgId, teacherId]);

      // 更新关联表的会员到期时间
      await executeQuery(`
        UPDATE user_orgs 
        SET membership_expire_at = ?
        WHERE org_id = ? AND user_id = ?
      `, [expireAt, orgId, teacherId]);
    }

    return { synced_count: teachers.length };
  }

  /**
   * 教师加入机构时继承会员
   */
  async inheritMembershipOnJoin(orgId: number, teacherId: number) {
    // 检查机构是否有会员
    const membership = await this.getOrgMembership(orgId);

    if (!membership.is_member) {
      return { inherited: false, reason: '机构暂无会员' };
    }

    // 检查是否超出名额
    const usedQuota = await this.getOrgTeacherCount(orgId);
    if (usedQuota >= membership.teacher_quota) {
      return { inherited: false, reason: '教师名额已满' };
    }

    // 设置会员共享
    await executeQuery(`
      UPDATE user_orgs 
      SET inherit_membership = 1, membership_expire_at = ?
      WHERE org_id = ? AND user_id = ?
    `, [membership.expire_at, orgId, teacherId]);

    // 更新教师会员状态
    await executeQuery(`
      UPDATE users 
      SET membership_type = 1, 
          membership_expire_at = ?,
          org_membership_source = ?
      WHERE id = ?
    `, [membership.expire_at, orgId, teacherId]);

    // 更新机构已用名额
    await executeQuery(`
      UPDATE org_memberships 
      SET used_quota = used_quota + 1
      WHERE org_id = ?
    `, [orgId]);

    return { 
      inherited: true, 
      expire_at: membership.expire_at 
    };
  }

  /**
   * 教师退出机构时取消会员共享
   */
  async revokeMembershipOnLeave(orgId: number, teacherId: number) {
    // 检查教师的会员是否来自机构
    const users = await executeQuery(`
      SELECT org_membership_source FROM users WHERE id = ?
    `, [teacherId]);

    if (users.length === 0) return;

    const user = users[0] as any;

    // 如果会员来自此机构，则取消
    if (user.org_membership_source === orgId) {
      await executeQuery(`
        UPDATE users 
        SET membership_type = 0, 
            membership_expire_at = NULL,
            org_membership_source = NULL
        WHERE id = ?
      `, [teacherId]);
    }

    // 更新机构已用名额
    await executeQuery(`
      UPDATE org_memberships 
      SET used_quota = GREATEST(0, used_quota - 1)
      WHERE org_id = ?
    `, [orgId]);
  }

  /**
   * 设置教师是否继承机构会员
   */
  async setTeacherMembershipInherit(orgId: number, teacherId: number, inherit: boolean) {
    const membership = await this.getOrgMembership(orgId);

    if (!membership.is_member) {
      throw new Error('机构暂无会员资格');
    }

    if (inherit) {
      // 开启继承
      await executeQuery(`
        UPDATE user_orgs 
        SET inherit_membership = 1, membership_expire_at = ?
        WHERE org_id = ? AND user_id = ?
      `, [membership.expire_at, orgId, teacherId]);

      await executeQuery(`
        UPDATE users 
        SET membership_type = 1, 
            membership_expire_at = ?,
            org_membership_source = ?
        WHERE id = ?
      `, [membership.expire_at, orgId, teacherId]);
    } else {
      // 关闭继承
      await executeQuery(`
        UPDATE user_orgs 
        SET inherit_membership = 0, membership_expire_at = NULL
        WHERE org_id = ? AND user_id = ?
      `, [orgId, teacherId]);

      // 检查教师是否自购会员
      const selfMembership = await executeQuery(`
        SELECT membership_expire_at FROM users WHERE id = ? AND org_membership_source = ?
      `, [teacherId, orgId]);

      if (selfMembership.length > 0) {
        await executeQuery(`
          UPDATE users 
          SET membership_type = 0, 
              membership_expire_at = NULL,
              org_membership_source = NULL
          WHERE id = ? AND org_membership_source = ?
        `, [teacherId, orgId]);
      }
    }

    return { success: true };
  }

  /**
   * 检查机构会员权益
   */
  async checkOrgFeature(orgId: number, feature: string): Promise<boolean> {
    const membership = await this.getOrgMembership(orgId);

    if (!membership.is_member) {
      return false;
    }

    const features = membership.features || [];
    return features.includes(feature);
  }

  /**
   * 获取机构会员统计
   */
  async getOrgMembershipStats(orgId: number) {
    const membership = await this.getOrgMembership(orgId);

    // 获取继承会员的教师列表
    const teachers = await executeQuery(`
      SELECT u.id, u.nickname, u.avatar, uo.membership_expire_at, uo.inherit_membership
      FROM user_orgs uo
      LEFT JOIN users u ON uo.user_id = u.id
      WHERE uo.org_id = ? AND uo.status = 1
      ORDER BY uo.inherit_membership DESC, uo.join_time DESC
    `, [orgId]);

    const inheritedCount = teachers.filter((t: any) => t.inherit_membership === 1).length;

    return {
      membership,
      teachers,
      inherited_count: inheritedCount,
      remaining_quota: membership.teacher_quota - inheritedCount,
    };
  }
}
