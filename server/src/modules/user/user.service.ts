import { Injectable } from '@nestjs/common';
import { query, insert, update } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class UserService {
  /**
   * 获取用户信息
   */
  async getUserInfo(userId: number) {
    const users = await executeQuery(`
      SELECT u.*, 
        tp.real_name, tp.subjects, tp.rating as teacher_rating,
        o.org_name, o.status as org_status
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN organizations o ON u.id = o.user_id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      throw new Error('用户不存在');
    }

    const user = users[0] as any;
    delete user.openid; // 不返回openid

    return user;
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: number, data: { nickname?: string; avatar?: string }) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.nickname) {
      updates.push('nickname = ?');
      values.push(data.nickname);
    }
    if (data.avatar) {
      updates.push('avatar = ?');
      values.push(data.avatar);
    }

    if (updates.length > 0) {
      await executeQuery(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `, [...values, userId]);
    }

    return { success: true };
  }

  /**
   * 更新位置信息
   */
  async updateLocation(userId: number, data: { latitude: number; longitude: number; address?: string }) {
    await executeQuery(`
      UPDATE users SET latitude = ?, longitude = ?, address = ?
      WHERE id = ?
    `, [data.latitude, data.longitude, data.address || '', userId]);

    return { success: true };
  }

  /**
   * 切换角色
   */
  async switchRole(userId: number, role: number) {
    // 检查角色权限
    const users = await executeQuery(`
      SELECT role FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    const currentRole = user.role;

    // 如果切换到教师角色，检查是否有教师档案
    if (role === 1 && currentRole !== 1) {
      const profiles = await executeQuery(`
        SELECT verify_status FROM teacher_profiles WHERE user_id = ?
      `, [userId]);

      if (profiles.length === 0 || (profiles[0] as any).verify_status !== 1) {
        throw new Error('请先完成教师认证');
      }
    }

    // 如果切换到机构角色，检查是否有机构档案
    if (role === 2 && currentRole !== 2) {
      const orgs = await executeQuery(`
        SELECT status FROM organizations WHERE user_id = ?
      `, [userId]);

      if (orgs.length === 0 || (orgs[0] as any).status !== 1) {
        throw new Error('请先完成机构认证');
      }
    }

    await executeQuery(`
      UPDATE users SET role = ? WHERE id = ?
    `, [role, userId]);

    return { success: true };
  }

  /**
   * 获取会员信息
   */
  async getMembershipInfo(userId: number) {
    const users = await executeQuery(`
      SELECT membership_type, membership_expire_at FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    const now = new Date();

    const isMember = user?.membership_type === 1 && 
                     new Date(user.membership_expire_at) > now;

    // 获取会员权益使用情况
    const usage = await executeQuery(`
      SELECT 
        SUM(CASE WHEN type = 'view_contact' THEN 1 ELSE 0 END) as view_count,
        SUM(CASE WHEN type = 'send_message' THEN 1 ELSE 0 END) as message_count
      FROM member_usage_log
      WHERE user_id = ? AND DATE(created_at) = CURDATE()
    `, [userId]);

    return {
      is_member: isMember,
      expire_at: user?.membership_expire_at,
      remaining_days: isMember ? 
        Math.ceil((new Date(user.membership_expire_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      today_usage: usage[0] || { view_count: 0, message_count: 0 },
    };
  }

  /**
   * 获取会员套餐列表
   */
  async getMembershipPlans(role: number) {
    const conditions = role ? `WHERE role = ${role}` : '';

    const plans = await executeQuery(`
      SELECT * FROM membership_plans ${conditions} AND is_active = 1
      ORDER BY role, sort_order
    `);

    return plans;
  }

  /**
   * 获取收益信息
   */
  async getEarnings(userId: number) {
    const commissions = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as available,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE user_id = ?
    `, [userId]);

    // 获取本月收益
    const monthEarnings = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as month_total
      FROM commissions
      WHERE user_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
    `, [userId]);

    return {
      ...commissions[0],
      month_earnings: monthEarnings[0]?.month_total || 0,
    };
  }

  /**
   * 获取收益明细
   */
  async getEarningRecords(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const records = await executeQuery(`
      SELECT c.*, 
        fu.nickname as from_nickname, fu.avatar as from_avatar,
        p.payment_no
      FROM commissions c
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM commissions WHERE user_id = ?
    `, [userId]);

    return {
      list: records,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 申请提现
   */
  async requestWithdrawal(userId: number, amount: number, bankInfo: any) {
    // 检查可提现余额
    const commissions = await executeQuery(`
      SELECT COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as available
      FROM commissions
      WHERE user_id = ?
    `, [userId]);

    const available = (commissions[0] as any).available;
    if (amount > available) {
      throw new Error('可提现余额不足');
    }

    // 创建提现记录
    const result = await executeQuery(`
      INSERT INTO withdrawals (user_id, amount, bank_info)
      VALUES (?, ?, ?)
    `, [userId, amount, JSON.stringify(bankInfo)]);

    return { success: true, id: (result as any).insertId };
  }

  /**
   * 获取邀请信息
   */
  async getInviteInfo(userId: number) {
    // 获取邀请码
    const users = await executeQuery(`
      SELECT invite_code FROM users WHERE id = ?
    `, [userId]);

    const inviteCode = (users[0] as any)?.invite_code;

    // 获取邀请统计
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_invites,
        SUM(CASE WHEN membership_type = 1 THEN 1 ELSE 0 END) as member_invites,
        COALESCE(SUM(invite_reward), 0) as total_reward
      FROM users
      WHERE inviter_id = ?
    `, [userId]);

    return {
      invite_code: inviteCode,
      ...stats[0],
    };
  }

  /**
   * 获取邀请列表
   */
  async getInviteList(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const list = await executeQuery(`
      SELECT id, nickname, avatar, role, membership_type, created_at
      FROM users
      WHERE inviter_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM users WHERE inviter_id = ?
    `, [userId]);

    return {
      list,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取教师档案
   */
  async getTeacherProfile(userId: number) {
    const profiles = await executeQuery(`
      SELECT * FROM teacher_profiles WHERE user_id = ?
    `, [userId]);

    if (profiles.length === 0) {
      return null;
    }

    return profiles[0];
  }

  /**
   * 更新教师档案
   */
  async updateTeacherProfile(userId: number, data: any) {
    const existing = await executeQuery(`
      SELECT id FROM teacher_profiles WHERE user_id = ?
    `, [userId]);

    if (existing.length > 0) {
      // 更新
      const updates = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => {
          if (key === 'certificates') {
            return `${key} = ?`;
          }
          return `${key} = ?`;
        });

      const values = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (key === 'certificates') {
            return JSON.stringify(value);
          }
          return value;
        });

      if (updates.length > 0) {
        await executeQuery(`
          UPDATE teacher_profiles SET ${updates.join(', ')}, verify_status = 0
          WHERE user_id = ?
        `, [...values, userId]);
      }
    } else {
      // 创建
      await executeQuery(`
        INSERT INTO teacher_profiles (user_id, real_name, gender, education, subjects, grades, 
          teaching_years, hourly_rate, bio, certificates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        data.real_name || '',
        data.gender || 0,
        data.education || '',
        data.subjects || '',
        data.grades || '',
        data.teaching_years || 0,
        data.hourly_rate || 0,
        data.bio || '',
        JSON.stringify(data.certificates || []),
      ]);
    }

    return { success: true };
  }

  /**
   * 获取机构档案
   */
  async getOrgProfile(userId: number) {
    const orgs = await executeQuery(`
      SELECT * FROM organizations WHERE user_id = ?
    `, [userId]);

    if (orgs.length === 0) {
      return null;
    }

    return orgs[0];
  }

  /**
   * 更新机构档案
   */
  async updateOrgProfile(userId: number, data: any) {
    const existing = await executeQuery(`
      SELECT id FROM organizations WHERE user_id = ?
    `, [userId]);

    if (existing.length > 0) {
      const updates = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, _]) => `${key} = ?`);

      const values = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value);

      if (updates.length > 0) {
        await executeQuery(`
          UPDATE organizations SET ${updates.join(', ')}, status = 0
          WHERE user_id = ?
        `, [...values, userId]);
      }
    } else {
      await executeQuery(`
        INSERT INTO organizations (user_id, org_name, license_no, contact_name, contact_phone, address, intro)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        data.org_name || '',
        data.license_no || '',
        data.contact_name || '',
        data.contact_phone || '',
        data.address || '',
        data.intro || '',
      ]);
    }

    return { success: true };
  }

  /**
   * 绑定邀请码
   */
  async bindInviter(userId: number, inviteCode: string) {
    // 检查是否已绑定
    const users = await executeQuery(`
      SELECT inviter_id FROM users WHERE id = ?
    `, [userId]);

    if ((users[0] as any).inviter_id) {
      throw new Error('已绑定邀请人');
    }

    // 查找邀请人
    const inviters = await executeQuery(`
      SELECT id, inviter_id FROM users WHERE invite_code = ?
    `, [inviteCode]);

    if (inviters.length === 0) {
      throw new Error('邀请码无效');
    }

    const inviter = inviters[0] as any;
    if (inviter.id === userId) {
      throw new Error('不能绑定自己');
    }

    // 更新邀请关系
    await executeQuery(`
      UPDATE users SET inviter_id = ?, inviter_2nd_id = ?
      WHERE id = ?
    `, [inviter.id, inviter.inviter_id, userId]);

    return { success: true };
  }

  /**
   * 上传头像
   */
  async uploadAvatar(userId: number, file: any) {
    // 实际项目中应上传到对象存储
    const avatarUrl = `/uploads/avatar_${userId}_${Date.now()}.jpg`;

    await executeQuery(`
      UPDATE users SET avatar = ? WHERE id = ?
    `, [avatarUrl, userId]);

    return { url: avatarUrl };
  }

  /**
   * 获取用户设置
   */
  async getSettings(userId: number) {
    const users = await executeQuery(`
      SELECT settings FROM users WHERE id = ?
    `, [userId]);

    const settings = (users[0] as any)?.settings;
    return settings ? JSON.parse(settings) : {};
  }

  /**
   * 更新用户设置
   */
  async updateSettings(userId: number, key: string, value: any) {
    const users = await executeQuery(`
      SELECT settings FROM users WHERE id = ?
    `, [userId]);

    const settings = (users[0] as any)?.settings ? 
      JSON.parse((users[0] as any).settings) : {};

    settings[key] = value;

    await executeQuery(`
      UPDATE users SET settings = ? WHERE id = ?
    `, [JSON.stringify(settings), userId]);

    return { success: true };
  }
}
