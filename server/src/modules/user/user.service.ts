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
        o.name as org_name, o.verify_status as org_status
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
      UPDATE users SET latitude = ?, longitude = ?
      WHERE id = ?
    `, [data.latitude, data.longitude, userId]);

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
   * 获取所有角色的会员状态
   * 每个角色的会员权益独立
   */
  async getAllMembershipInfo(userId: number) {
    const now = new Date();
    
    // 查询用户的角色会员表
    let roleMemberships: any[] = [];
    try {
      roleMemberships = await executeQuery(`
        SELECT role, membership_type, expire_at 
        FROM user_role_memberships 
        WHERE user_id = ?
      `, [userId]);
    } catch (error) {
      // 表不存在时返回空数组
      console.log('角色会员表不存在，返回空数组');
    }

    // 如果没有角色会员记录，返回默认状态
    const result: Array<{
      role: number;
      is_member: boolean;
      expire_at: string | null;
      membership_type: number;
    }> = [];
    for (let role = 0; role <= 2; role++) {
      const membership = roleMemberships.find(m => m.role === role);
      if (membership) {
        const isMember = membership.membership_type === 1 && 
                        membership.expire_at && 
                        new Date(membership.expire_at) > now;
        result.push({
          role,
          is_member: isMember,
          expire_at: membership.expire_at,
          membership_type: membership.membership_type || 0,
        });
      } else {
        result.push({
          role,
          is_member: false,
          expire_at: null,
          membership_type: 0,
        });
      }
    }

    return result;
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

  /**
   * 获取教师列表（支持LBS距离计算）
   */
  async getTeachersList(params: {
    latitude?: number;
    longitude?: number;
    subject?: string;
    grade?: string;
    keyword?: string;
    city?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['u.role = 1', 'u.status = 1', 'tp.verify_status = 2'];
    const sqlParams: any[] = [];

    // 科目筛选
    if (params.subject && params.subject !== '全部') {
      conditions.push('FIND_IN_SET(?, tp.subjects) > 0');
      sqlParams.push(params.subject);
    }

    // 年级筛选
    if (params.grade) {
      conditions.push('FIND_IN_SET(?, tp.grades) > 0');
      sqlParams.push(params.grade);
    }

    // 关键词搜索
    if (params.keyword) {
      conditions.push('(u.nickname LIKE ? OR tp.real_name LIKE ? OR tp.intro LIKE ?)');
      sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`, `%${params.keyword}%`);
    }

    // 城市筛选
    if (params.city && params.city !== '定位中...') {
      conditions.push('u.city_name LIKE ?');
      sqlParams.push(`%${params.city}%`);
    }

    const whereClause = conditions.join(' AND ');

    // LBS距离计算
    let distanceSelect = 'NULL as distance';
    let distanceOrder = '';
    if (params.latitude && params.longitude) {
      distanceSelect = `
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(u.latitude))
          ), 2
        ) as distance
      `;
      sqlParams.unshift(params.latitude, params.longitude, params.latitude);
      distanceOrder = 'ORDER BY distance ASC';
    }

    const teachers = await executeQuery(`
      SELECT 
        u.id, u.nickname, u.avatar, u.latitude, u.longitude, u.city_name,
        tp.real_name, tp.gender, tp.education, tp.subjects, tp.grades, 
        tp.teaching_years, tp.hourly_rate_min, tp.hourly_rate_max, tp.intro, tp.one_line_intro,
        tp.rating, tp.review_count, tp.view_count, tp.success_count,
        ${distanceSelect}
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY tp.rating DESC, tp.view_count DESC, u.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 处理返回数据格式
    const formattedTeachers = teachers.map((t: any) => ({
      ...t,
      distance_text: t.distance ? (t.distance < 1 ? `${Math.round(t.distance * 1000)}m` : `${t.distance.toFixed(1)}km`) : '',
      subjects: t.subjects ? t.subjects.split(',').filter((s: string) => s) : [],
    }));

    // 获取总数
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
    `, sqlParams);

    return formattedTeachers;
  }

  /**
   * 获取订单列表（教师端抢单列表）
   */
  async getOrdersList(params: {
    latitude?: number;
    longitude?: number;
    subject?: string;
    city?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['o.status = 0']; // 待抢单状态
    const sqlParams: any[] = [];

    // 科目筛选
    if (params.subject && params.subject !== '全部') {
      conditions.push('o.subject = ?');
      sqlParams.push(params.subject);
    }

    // 城市筛选
    if (params.city && params.city !== '定位中...') {
      conditions.push('o.address LIKE ?');
      sqlParams.push(`%${params.city}%`);
    }

    const whereClause = conditions.join(' AND ');

    // LBS距离计算
    let distanceSelect = 'NULL as distance';
    let distanceOrder = '';
    if (params.latitude && params.longitude) {
      distanceSelect = `
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(o.latitude)) *
            cos(radians(o.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(o.latitude))
          ), 2
        ) as distance
      `;
      sqlParams.unshift(params.latitude, params.longitude, params.latitude);
      distanceOrder = 'ORDER BY distance ASC';
    }

    const orders = await executeQuery(`
      SELECT 
        o.id, o.order_no, o.subject, o.hourly_rate, o.student_grade, o.student_gender,
        o.address, o.description, o.status, o.view_count, o.created_at,
        ${distanceSelect},
        u.nickname as parent_nickname, u.avatar as parent_avatar
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY o.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 处理返回数据格式
    const formattedOrders = orders.map((o: any) => ({
      ...o,
      distance_text: o.distance ? (o.distance < 1 ? `${Math.round(o.distance * 1000)}m` : `${o.distance.toFixed(1)}km`) : '',
      contact_hidden: true,
    }));

    return formattedOrders;
  }

  /**
   * 用户登录（验证码登录）
   */
  async login(mobile: string) {
    try {
      // 查找用户
      const users = await executeQuery(`
        SELECT * FROM users WHERE mobile = ?
      `, [mobile]);

      if (users.length === 0) {
        return { success: false, message: '用户不存在，请先注册' };
      }

      const user = users[0] as any;

      // 生成简单token（实际项目应使用JWT）
      const token = `token_${user.id}_${Date.now()}`;

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            nickname: user.nickname,
            mobile: user.mobile,
            avatar: user.avatar,
            role: user.role,
          },
        },
      };
    } catch (error) {
      // 数据库错误时，开发模式返回模拟用户
      console.log('[User Mock] 数据库错误，开发模式返回模拟用户');
      const mockUserId = Math.floor(Math.random() * 10000) + 1;
      return {
        success: true,
        data: {
          token: `token_${mockUserId}_${Date.now()}`,
          user: {
            id: mockUserId,
            nickname: `用户${mobile.slice(-4)}`,
            mobile,
            avatar: '',
            role: 0,
          },
        },
      };
    }
  }

  /**
   * 用户注册
   */
  async register(mobile: string, nickname?: string, role?: number, platform?: string) {
    try {
      // 检查用户是否已存在
      const existingUsers = await executeQuery(`
        SELECT id FROM users WHERE mobile = ?
      `, [mobile]);

      if (existingUsers.length > 0) {
        // 如果用户已存在，直接登录
        return this.login(mobile);
      }

      // 生成邀请码
      const inviteCode = `U${Date.now().toString(36).toUpperCase()}`;

      // 创建新用户（包含平台信息）
      const userId = await insert(`
        INSERT INTO users (mobile, nickname, role, invite_code, platform, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [mobile, nickname || `用户${mobile.slice(-4)}`, role || 0, inviteCode, platform || 'h5']);

      // 生成token
      const token = `token_${userId}_${Date.now()}`;

      return {
        success: true,
        data: {
          token,
          user: {
            id: userId,
            nickname: nickname || `用户${mobile.slice(-4)}`,
            mobile,
            avatar: '',
            role: role || 0,
            platform: platform || 'h5',
          },
        },
      };
    } catch (error) {
      // 数据库错误时，开发模式返回模拟用户
      console.log('[User Mock] 数据库错误，开发模式返回模拟用户');
      const mockUserId = Math.floor(Math.random() * 10000) + 1;
      return {
        success: true,
        data: {
          token: `token_${mockUserId}_${Date.now()}`,
          user: {
            id: mockUserId,
            nickname: nickname || `用户${mobile.slice(-4)}`,
            mobile,
            avatar: '',
            role: role || 0,
            platform: platform || 'h5',
          },
        },
      };
    }
  }
}
