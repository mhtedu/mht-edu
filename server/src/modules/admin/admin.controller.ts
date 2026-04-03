import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import * as bcrypt from 'bcrypt';
import * as db from '@/storage/database/mysql-client';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {

  /**
   * 获取统计数据概览
   */
  @Get('stats/overview')
  @RequirePermission('dashboard:view')
  async getStatsOverview() {
    try {
      // 获取各类统计数据 - 使用实际表名
      const [users] = await db.query('SELECT COUNT(*) as count FROM users WHERE status = 1');
      const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles WHERE verify_status = 1');
      const [orgs] = await db.query('SELECT COUNT(*) as count FROM organizations WHERE verify_status = 1');
      const [orders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = 1');
      const [members] = await db.query('SELECT COUNT(*) as count FROM users WHERE membership_expire_at > NOW()');
      const [revenue] = await db.query('SELECT COALESCE(SUM(50), 0) as total FROM orders WHERE status = 1');

      return {
        totalUsers: users[0]?.count || 0,
        totalTeachers: teachers[0]?.count || 0,
        totalOrgs: orgs[0]?.count || 0,
        totalOrders: orders[0]?.count || 0,
        totalMembers: members[0]?.count || 0,
        totalRevenue: revenue[0]?.total || 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回默认数据
      return {
        totalUsers: 0,
        totalTeachers: 0,
        totalOrgs: 0,
        totalOrders: 0,
        totalMembers: 0,
        totalRevenue: 0,
      };
    }
  }

  /**
   * 获取详细统计数据（管理后台首页）
   */
  @Get('stats')
  @Public()
  async getStats() {
    try {
      // 用户统计
      const [users] = await db.query('SELECT role, COUNT(*) as count FROM users WHERE status = 1 GROUP BY role');
      const [members] = await db.query('SELECT COUNT(*) as count FROM users WHERE membership_type = 1 AND membership_expire_at > NOW()');
      const [todayUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()');

      // 教师统计
      const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles');
      const [verifiedTeachers] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles WHERE verify_status = 1');

      // 机构统计
      const [orgs] = await db.query('SELECT COUNT(*) as count FROM organizations WHERE verify_status = 1');

      // 订单统计
      const [orders] = await db.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
      const [todayOrders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()');

      // 活动统计
      const [activities] = await db.query('SELECT COUNT(*) as count FROM activities WHERE status = 1');

      // 邀约统计
      const [invitations] = await db.query('SELECT status, COUNT(*) as count FROM invitations GROUP BY status');

      // 处理用户数据
      let parents = 0, teacherUsers = 0, orgUsers = 0;
      (users as any[]).forEach((u: any) => {
        if (u.role === 1) parents = u.count;
        else if (u.role === 2) teacherUsers = u.count;
        else if (u.role === 3) orgUsers = u.count;
      });

      // 处理订单数据
      let pending = 0, matched = 0, ongoing = 0, completed = 0, cancelled = 0;
      (orders as any[]).forEach((o: any) => {
        if (o.status === 0) pending = o.count;
        else if (o.status === 1) matched = o.count;
        else if (o.status === 2) ongoing = o.count;
        else if (o.status === 3) completed = o.count;
        else if (o.status === 4) cancelled = o.count;
      });

      // 处理邀约数据
      let invPending = 0, invAccepted = 0, invRejected = 0;
      (invitations as any[]).forEach((i: any) => {
        if (i.status === 0) invPending = i.count;
        else if (i.status === 1) invAccepted = i.count;
        else if (i.status === 2) invRejected = i.count;
      });

      return {
        data: {
          users: {
            total: parents + teacherUsers + orgUsers,
            parents,
            teachers: teacherUsers,
            orgs: orgUsers,
            members: (members as any[])[0]?.count || 0,
            todayNew: (todayUsers as any[])[0]?.count || 0
          },
          teachers: {
            total: (teachers as any[])[0]?.count || 0,
            verified: (verifiedTeachers as any[])[0]?.count || 0
          },
          orgs: {
            total: (orgs as any[])[0]?.count || 0
          },
          orders: {
            total: pending + matched + ongoing + completed + cancelled,
            pending,
            matched,
            ongoing,
            completed,
            cancelled,
            todayNew: (todayOrders as any[])[0]?.count || 0
          },
          activities: {
            total: (activities as any[])[0]?.count || 0
          },
          invitations: {
            total: invPending + invAccepted + invRejected,
            pending: invPending,
            accepted: invAccepted,
            rejected: invRejected
          },
          payments: {
            totalAmount: completed * 200, // 模拟数据
            todayAmount: 0,
            weekAmount: 0,
            monthAmount: 0
          },
          commissions: {
            pending: 0,
            settled: 0,
            withdrawn: 0
          }
        }
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        data: {
          users: { total: 0, parents: 0, teachers: 0, orgs: 0, members: 0, todayNew: 0 },
          teachers: { total: 0, verified: 0 },
          orgs: { total: 0 },
          orders: { total: 0, pending: 0, matched: 0, ongoing: 0, completed: 0, cancelled: 0, todayNew: 0 },
          activities: { total: 0 },
          invitations: { total: 0, pending: 0, accepted: 0, rejected: 0 },
          payments: { totalAmount: 0, todayAmount: 0, weekAmount: 0, monthAmount: 0 },
          commissions: { pending: 0, settled: 0, withdrawn: 0 }
        }
      };
    }
  }

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  @Get('users')
  @Public()
  async getUsers(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('search') search = '',
    @Query('role') role = ''
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (nickname LIKE ? OR mobile LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    try {
      const [list] = await db.query(
        `SELECT id, openid, nickname, mobile as phone, avatar, role, 
                membership_type, membership_expire_at as member_expire_time, 
                created_at, status, city_name
         FROM users ${whereClause}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSizeNum, offset]
      );
      
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);

      // 转换角色显示
      const roleMap = { 0: 'parent', 1: 'teacher', 2: 'org' };
      const listWithRole = list.map(u => ({
        ...u,
        role: roleMap[u.role] || 'parent',
        isMember: u.membership_type === 1
      }));

      return {
        list: listWithRole,
        total: countResult[0]?.total || 0,
        page: pageNum,
        pageSize: pageSizeNum
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 获取单个用户
   */
  @Get('users/:id')
  @RequirePermission('user:view')
  async getUser(@Param('id') id: string) {
    const [users] = await db.query(
      `SELECT id, openid, unionid, nickname, mobile, avatar, role, gender,
              membership_type, membership_expire_at, wechat_id,
              latitude, longitude, city_code, city_name,
              inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id,
              last_login_at, created_at, status
       FROM users WHERE id = ?`,
      [parseInt(id)]
    );

    if (!users || users.length === 0) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return users[0];
  }

  /**
   * 更新用户
   */
  @Put('users/:id')
  @RequirePermission('user:edit')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      nickname?: string;
      mobile?: string;
      role?: string;
      membership_type?: number;
      membership_expire_at?: string;
      status?: number;
    }
  ) {
    const roleMap = { 'parent': 0, 'teacher': 1, 'org': 2 };
    const roleValue = body.role ? roleMap[body.role] : undefined;

    await db.update(
      `UPDATE users 
       SET nickname = COALESCE(?, nickname),
           mobile = COALESCE(?, mobile),
           role = COALESCE(?, role),
           membership_type = COALESCE(?, membership_type),
           membership_expire_at = COALESCE(?, membership_expire_at),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ?`,
      [body.nickname, body.mobile, roleValue, body.membership_type, body.membership_expire_at, body.status, parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 更新用户状态
   */
  @Put('users/:id/status')
  @RequirePermission('user:edit')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: number }
  ) {
    await db.update(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [body.status, parseInt(id)]
    );

    return { success: true };
  }

  // ==================== 教师管理 ====================

  /**
   * 获取教师列表
   */
  @Get('teachers')
  @Public()
  async getTeachers(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status === 'pending') {
      whereClause += ' AND tp.verify_status = 0';
    } else if (status === 'approved') {
      whereClause += ' AND tp.verify_status = 1';
    } else if (status === 'rejected') {
      whereClause += ' AND tp.verify_status = 2';
    }

    try {
      const [teachers] = await db.query(`
        SELECT 
          tp.user_id as id, tp.user_id, tp.real_name as name, tp.education,
          tp.school, tp.major, tp.subjects, tp.intro as introduction,
          tp.teaching_years, tp.hourly_rate_min, tp.hourly_rate_max,
          tp.rating, tp.verify_status, tp.created_at,
          u.nickname, u.avatar, u.mobile as phone
        FROM teacher_profiles tp
        LEFT JOIN users u ON tp.user_id = u.id
        ${whereClause}
        ORDER BY tp.created_at DESC
      `, params);

      return teachers.map(t => ({
        ...t,
        subject: Array.isArray(t.subjects) ? t.subjects.join('、') : t.subjects
      }));
    } catch (error) {
      console.error('获取教师列表失败:', error);
      return [];
    }
  }

  /**
   * 获取单个教师
   */
  @Get('teachers/:id')
  @RequirePermission('teacher:view')
  async getTeacher(@Param('id') id: string) {
    const [teachers] = await db.query(`
      SELECT 
        tp.*, u.nickname, u.avatar, u.mobile
      FROM teacher_profiles tp
      LEFT JOIN users u ON tp.user_id = u.id
      WHERE tp.user_id = ?
    `, [parseInt(id)]);

    if (!teachers || teachers.length === 0) {
      throw new HttpException('教师不存在', HttpStatus.NOT_FOUND);
    }

    return teachers[0];
  }

  /**
   * 通过教师认证
   */
  @Post('teachers/:id/approve')
  @Public()
  @RequirePermission('teacher:audit')
  async approveTeacher(@Param('id') id: string) {
    await db.update(
      'UPDATE teacher_profiles SET verify_status = 1, verify_time = NOW(), updated_at = NOW() WHERE user_id = ?',
      [parseInt(id)]
    );

    // 同时更新用户角色为教师
    await db.update(
      'UPDATE users SET role = 1, updated_at = NOW() WHERE id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 拒绝教师认证
   */
  @Post('teachers/:id/reject')
  @Public()
  @RequirePermission('teacher:audit')
  async rejectTeacher(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    await db.update(
      'UPDATE teacher_profiles SET verify_status = 2, updated_at = NOW() WHERE user_id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  // ==================== 机构管理 ====================

  /**
   * 获取机构列表
   */
  @Get('orgs')
  @Public()
  async getOrgs(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status === 'pending') {
      whereClause += ' AND o.verify_status = 0';
    } else if (status === 'approved') {
      whereClause += ' AND o.verify_status = 1';
    }

    try {
      const [orgs] = await db.query(`
        SELECT 
          o.id, o.user_id, o.name, o.contact_name, o.contact_phone,
          o.address, o.description, o.verify_status, o.created_at,
          o.teacher_count, o.student_count,
          u.nickname, u.avatar
        FROM organizations o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
      `, params);

      return orgs;
    } catch (error) {
      console.error('获取机构列表失败:', error);
      return [];
    }
  }

  /**
   * 通过机构认证
   */
  @Post('orgs/:id/approve')
  @RequirePermission('org:audit')
  async approveOrg(@Param('id') id: string) {
    await db.update(
      'UPDATE organizations SET verify_status = 1, updated_at = NOW() WHERE id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 拒绝机构认证
   */
  @Post('orgs/:id/reject')
  @RequirePermission('org:audit')
  async rejectOrg(@Param('id') id: string, @Body() body: { reason?: string }) {
    await db.update(
      'UPDATE organizations SET verify_status = 2, updated_at = NOW() WHERE id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  // ==================== 订单管理 ====================

  /**
   * 获取订单列表
   */
  @Get('orders')
  @Public()
  async getOrders(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(parseInt(status));
    }

    try {
      const [orders] = await db.query(`
        SELECT 
          o.id, o.order_no, o.user_id, o.subject, o.student_grade,
          o.teaching_mode, o.address, o.hourly_rate, o.status,
          o.view_count, o.apply_count, o.created_at,
          u.nickname as user_name, u.mobile as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
      `, params);

      return orders;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      return [];
    }
  }

  // ==================== 会员销售记录 ====================

  /**
   * 获取会员销售记录
   */
  @Get('membership-sales')
  @Public()
  async getMembershipSales(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status = '',
    @Query('startDate') startDate = '',
    @Query('endDate') endDate = '',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status !== '') {
      whereClause += ' AND p.status = ?';
      params.push(parseInt(status));
    }

    if (startDate) {
      whereClause += ' AND DATE(p.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(p.created_at) <= ?';
      params.push(endDate);
    }

    try {
      const [payments] = await db.query(`
        SELECT 
          p.id, p.payment_no, p.user_id, p.amount, p.status,
          p.payment_method, p.transaction_id, p.paid_at, p.created_at,
          u.nickname as user_name, u.mobile as user_phone, u.role as user_role,
          m.name as membership_name, m.role as membership_role
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN memberships m ON p.membership_id = m.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM payments p ${whereClause}`,
        params
      );

      // 统计汇总数据
      const [summary] = await db.query(`
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as total_amount,
          COALESCE(SUM(CASE WHEN status = 1 AND DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) as today_amount,
          COALESCE(SUM(CASE WHEN status = 1 AND YEARWEEK(paid_at) = YEARWEEK(CURDATE()) THEN amount ELSE 0 END), 0) as week_amount,
          COALESCE(SUM(CASE WHEN status = 1 AND MONTH(paid_at) = MONTH(CURDATE()) THEN amount ELSE 0 END), 0) as month_amount
        FROM payments p
        ${whereClause}
      `, params);

      const roleMap = { 0: '家长', 1: '牛师', 2: '机构' };
      const statusMap = { 0: '待支付', 1: '已支付', 2: '已退款', 3: '已取消' };

      const list = payments.map((p: any) => ({
        ...p,
        user_role_name: roleMap[p.user_role] || '家长',
        status_name: statusMap[p.status] || '待支付',
      }));

      return {
        list,
        total: countResult[0]?.total || 0,
        page: pageNum,
        pageSize: pageSizeNum,
        summary: {
          totalCount: summary[0]?.total_count || 0,
          totalAmount: summary[0]?.total_amount || 0,
          todayAmount: summary[0]?.today_amount || 0,
          weekAmount: summary[0]?.week_amount || 0,
          monthAmount: summary[0]?.month_amount || 0,
        }
      };
    } catch (error) {
      console.error('获取会员销售记录失败:', error);
      return {
        list: [],
        total: 0,
        page: pageNum,
        pageSize: pageSizeNum,
        summary: { totalCount: 0, totalAmount: 0, todayAmount: 0, weekAmount: 0, monthAmount: 0 }
      };
    }
  }

  /**
   * 获取会员套餐列表（管理用）
   */
  @Get('memberships')
  @Public()
  async getMemberships() {
    try {
      const [memberships] = await db.query(`
        SELECT * FROM memberships ORDER BY sort_order ASC, id ASC
      `);
      return memberships;
    } catch (error) {
      console.error('获取会员套餐列表失败:', error);
      return [];
    }
  }

  // ==================== 管理员管理 ====================

  /**
   * 获取管理员列表
   */
  @Get('admins')
  @RequirePermission('admin:view')
  async getAdmins() {
    try {
      const [admins] = await db.query(`
        SELECT 
          au.id, au.username, au.real_name, au.email, au.phone, 
          au.role_id, au.status, au.last_login_at as last_login_time, au.login_count, au.created_at,
          ar.role_name
        FROM admin_user au
        LEFT JOIN admin_role ar ON au.role_id = ar.id
        WHERE au.status != -1
        ORDER BY au.id ASC
      `);

      return admins;
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return [];
    }
  }

  /**
   * 获取单个管理员
   */
  @Get('admins/:id')
  @RequirePermission('admin:view')
  async getAdmin(@Param('id') id: string) {
    const [admins] = await db.query(`
      SELECT au.*, ar.role_name
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.id = ?
    `, [parseInt(id)]);

    if (!admins || admins.length === 0) {
      throw new HttpException('管理员不存在', HttpStatus.NOT_FOUND);
    }

    return admins[0];
  }

  /**
   * 添加管理员
   */
  @Post('admins')
  @RequirePermission('admin:create')
  async createAdmin(@Body() body: {
    username: string;
    password: string;
    realName: string;
    email?: string;
    phone?: string;
    roleId: number;
  }) {
    // 检查用户名是否已存在
    const [existing] = await db.query(
      'SELECT id FROM admin_user WHERE username = ?',
      [body.username]
    );

    if (existing.length > 0) {
      return { success: false, message: '用户名已存在' };
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // 创建管理员
    const insertId = await db.insert(
      `INSERT INTO admin_user (username, password, real_name, email, phone, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [body.username, hashedPassword, body.realName, body.email, body.phone, body.roleId]
    );

    return { success: true, id: insertId };
  }

  /**
   * 更新管理员
   */
  @Put('admins/:id')
  @RequirePermission('admin:edit')
  async updateAdmin(
    @Param('id') id: string,
    @Body() body: {
      realName?: string;
      email?: string;
      phone?: string;
      roleId?: number;
      status?: number;
    }
  ) {
    await db.update(
      `UPDATE admin_user 
       SET real_name = COALESCE(?, real_name), 
           email = COALESCE(?, email), 
           phone = COALESCE(?, phone), 
           role_id = COALESCE(?, role_id), 
           status = COALESCE(?, status), 
           updated_at = NOW()
       WHERE id = ?`,
      [body.realName, body.email, body.phone, body.roleId, body.status, parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 更新管理员状态
   */
  @Put('admins/:id/status')
  @RequirePermission('admin:edit')
  async updateAdminStatus(
    @Param('id') id: string,
    @Body() body: { status: number }
  ) {
    await db.update(
      'UPDATE admin_user SET status = ?, updated_at = NOW() WHERE id = ?',
      [body.status, parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 删除管理员
   */
  @Delete('admins/:id')
  @RequirePermission('admin:delete')
  async deleteAdmin(@Param('id') id: string) {
    // 软删除
    await db.update(
      'UPDATE admin_user SET status = -1, updated_at = NOW() WHERE id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  /**
   * 重置管理员密码
   */
  @Post('admins/:id/reset-password')
  @RequirePermission('admin:edit')
  async resetAdminPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    const newPassword = body.newPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(
      'UPDATE admin_user SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, parseInt(id)]
    );

    return { success: true, newPassword };
  }

  // ==================== 角色管理 ====================

  /**
   * 获取角色列表
   */
  @Get('roles')
  @RequirePermission('role:view')
  async getRoles() {
    try {
      const [roles] = await db.query(`
        SELECT 
          ar.id, ar.role_name, ar.role_code, ar.description, ar.created_at,
          (SELECT COUNT(*) FROM admin_user WHERE role_id = ar.id AND status = 1) as user_count
        FROM admin_role ar
        WHERE ar.status = 1
        ORDER BY ar.id ASC
      `);

      return roles.map(role => ({
        ...role,
        permissionCount: role.permissions ? JSON.parse(role.permissions).length : 0,
        userCount: role.user_count || 0
      }));
    } catch (error) {
      console.error('获取角色列表失败:', error);
      return [];
    }
  }

  /**
   * 获取单个角色
   */
  @Get('roles/:id')
  @RequirePermission('role:view')
  async getRole(@Param('id') id: string) {
    const [roles] = await db.query(
      'SELECT * FROM admin_role WHERE id = ?',
      [parseInt(id)]
    );

    if (!roles || roles.length === 0) {
      throw new HttpException('角色不存在', HttpStatus.NOT_FOUND);
    }

    const role = roles[0];
    return {
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    };
  }

  /**
   * 更新角色
   */
  @Put('roles/:id')
  @RequirePermission('role:edit')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { roleName?: string; permissions?: string[] }
  ) {
    const updates: string[] = [];
    const params: any[] = [];

    if (body.roleName) {
      updates.push('role_name = ?');
      params.push(body.roleName);
    }

    if (body.permissions) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(body.permissions));
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push('updated_at = NOW()');
    params.push(parseInt(id));

    await db.update(
      `UPDATE admin_role SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return { success: true };
  }

  /**
   * 删除角色
   */
  @Delete('roles/:id')
  @RequirePermission('role:delete')
  async deleteRole(@Param('id') id: string) {
    // 检查是否有用户使用该角色
    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM admin_user WHERE role_id = ? AND status = 1',
      [parseInt(id)]
    );

    if (users[0]?.count > 0) {
      throw new HttpException('该角色正在被使用，无法删除', HttpStatus.BAD_REQUEST);
    }

    await db.update(
      'UPDATE admin_role SET status = 0, updated_at = NOW() WHERE id = ?',
      [parseInt(id)]
    );

    return { success: true };
  }

  // ==================== 系统配置 ====================

  /**
   * 获取系统配置（按分组返回完整配置列表）
   */
  @Get('config')
  @Public()
  async getConfig() {
    try {
      const [configs] = await db.query(
        'SELECT id, config_key, config_value, config_type, config_group, description, sort_order FROM site_config WHERE status = 1 ORDER BY config_group, sort_order'
      );

      // 按 config_group 分组返回
      const groupedConfigs: Record<string, any[]> = {};
      (configs as any[]).forEach((c: any) => {
        if (!groupedConfigs[c.config_group]) {
          groupedConfigs[c.config_group] = [];
        }
        groupedConfigs[c.config_group].push({
          ...c,
          label: c.description || c.config_key,
        });
      });

      return groupedConfigs;
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {};
    }
  }

  /**
   * 更新系统配置
   */
  @Post('config')
  @Public()
  async updateConfig(@Body() body: Record<string, string>) {
    for (const [key, value] of Object.entries(body)) {
      await db.update(
        `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
         VALUES (?, ?, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
        [key, value, value]
      );
    }

    return { success: true };
  }

  /**
   * 批量更新系统配置
   */
  @Post('config/batch-update')
  @Public()
  async batchUpdateConfig(@Body() body: { configs: { key: string; value: string }[] }) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      for (const config of body.configs) {
        await conn.execute(
          `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
           VALUES (?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
          [config.key, config.value, config.value]
        );
      }
      await conn.commit();
      return { success: true, message: '配置批量更新成功' };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 查询数据库表结构和数据
   */
  @Public()
  @Get('table-structure')
  async getTableStructure(@Query('table') table: string = 'orders') {
    try {
      const [structure] = await db.query(`DESCRIBE ${table}`);
      const [data] = await db.query(`SELECT * FROM ${table} LIMIT 5`);
      return { success: true, structure, sampleData: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 查询牛师数据
   */
  @Public()
  @Get('teachers-check')
  async checkTeachers() {
    try {
      const [teachers] = await db.query(`
        SELECT u.id, u.nickname, u.role, u.latitude, u.longitude, tp.real_name, tp.subjects
        FROM users u
        LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
        WHERE u.role = 1
        LIMIT 20
      `);
      return { success: true, teachers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 查询广告数据
   */
  @Public()
  @Get('ads-check')
  async checkAds() {
    try {
      const [ads] = await db.query(`SELECT * FROM ad_positions LIMIT 10`);
      return { success: true, ads };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 初始化缺失的配置分组
   */
  @Public()
  @Post('init-config-groups')
  async initConfigGroups() {
    try {
      // 添加微信小程序配置
      await db.update(`
        INSERT INTO site_config (config_key, config_value, config_type, config_group, description, sort_order, status, created_at, updated_at) VALUES
        ('wechat_appid', '', 'text', 'wechat', '微信小程序AppID', 1, 1, NOW(), NOW()),
        ('wechat_secret', '', 'text', 'wechat', '微信小程序Secret', 2, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE config_group = 'wechat', description = VALUES(description)
      `);

      // 添加微信支付配置
      await db.update(`
        INSERT INTO site_config (config_key, config_value, config_type, config_group, description, sort_order, status, created_at, updated_at) VALUES
        ('wechat_mch_id', '', 'text', 'payment', '微信支付商户号', 1, 1, NOW(), NOW()),
        ('wechat_pay_key', '', 'text', 'payment', '微信支付API密钥', 2, 1, NOW(), NOW()),
        ('wechat_pay_cert', '', 'textarea', 'payment', '微信支付证书内容', 3, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE config_group = 'payment', description = VALUES(description)
      `);

      // 添加地图配置
      await db.update(`
        INSERT INTO site_config (config_key, config_value, config_type, config_group, description, sort_order, status, created_at, updated_at) VALUES
        ('map_provider', 'tencent', 'text', 'map', '地图服务商(tencent/amap)', 1, 1, NOW(), NOW()),
        ('map_key', '', 'text', 'map', '地图API密钥', 2, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE config_group = 'map', description = VALUES(description)
      `);

      // 更新短信配置分组
      await db.update(`
        UPDATE site_config SET config_group = 'sms' 
        WHERE config_key IN ('sms_access_key_id', 'sms_access_key_secret', 'sms_sign_name', 'sms_template_code', 'sms_enabled')
      `);

      return { success: true, message: '配置分组初始化成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 清理重复的广告数据
   */
  @Public()
  @Post('clean-ads')
  async cleanAds() {
    try {
      // 删除所有广告
      await db.update(`DELETE FROM ad_positions`);
      
      // 重新插入广告数据
      await db.update(`
        INSERT INTO ad_positions (position_key, title, image_url, link_url, sort_order, is_active) VALUES
        ('home_top', '新人专享福利', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', '/pages/member/index', 1, 1),
        ('home_top', '会员日特惠', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', '/pages/membership/index', 2, 1),
        ('home_top', '名师一对一定制课程', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=400&fit=crop', '/pages/teacher/list', 3, 1),
        ('home_top', '暑期集训营火热报名', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop', '/pages/activities/index', 4, 1),
        ('home_banner', '牛师班招生中', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=200&fit=crop', '/pages/elite-class/index', 1, 1),
        ('home_banner', '优质机构推荐', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=200&fit=crop', '/pages/org/list', 2, 1)
      `);
      
      return { success: true, message: '广告数据已清理' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建缺失的数据库表
   */
  @Public()
  @Post('create-tables')
  async createTables() {
    try {
      // 创建评价表
      await db.update(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          teacher_id INT NOT NULL COMMENT '教师ID',
          parent_id INT NOT NULL COMMENT '家长ID',
          order_id INT COMMENT '订单ID',
          rating TINYINT NOT NULL COMMENT '评分1-5',
          content TEXT COMMENT '评价内容',
          tags JSON COMMENT '评价标签',
          is_anonymous TINYINT DEFAULT 0 COMMENT '是否匿名',
          status TINYINT DEFAULT 1 COMMENT '状态: 0=隐藏, 1=显示',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_teacher_id (teacher_id),
          INDEX idx_parent_id (parent_id),
          INDEX idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师评价表'
      `);
      
      // 创建邀约表
      await db.update(`
        CREATE TABLE IF NOT EXISTS invitations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          from_user_id INT NOT NULL COMMENT '发送方ID',
          to_user_id INT NOT NULL COMMENT '接收方ID',
          order_id INT COMMENT '关联订单ID',
          invitation_type VARCHAR(20) NOT NULL COMMENT '邀约类型: exchange_contact=交换联系方式, exchange_wechat=交换微信, invite_trial=邀约试课, invite_course=邀约正式课程',
          status TINYINT DEFAULT 0 COMMENT '状态: 0=待处理, 1=已同意, 2=已拒绝, 3=已过期',
          message TEXT COMMENT '邀约留言',
          trial_time DATETIME COMMENT '试课时间',
          trial_address VARCHAR(255) COMMENT '试课地点',
          response_message TEXT COMMENT '回复留言',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          expired_at TIMESTAMP COMMENT '过期时间',
          INDEX idx_from_user (from_user_id),
          INDEX idx_to_user (to_user_id),
          INDEX idx_status (status),
          INDEX idx_type (invitation_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀约表'
      `);
      
      return { success: true, message: '数据库表创建成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 插入邀约演示数据
   */
  @Public()
  @Post('init-invitations')
  async initInvitations() {
    try {
      // 清空现有数据
      await db.update(`DELETE FROM invitations`);
      
      // 插入演示邀约数据
      // 家长发给老师的邀约
      await db.update(`
        INSERT INTO invitations (from_user_id, to_user_id, order_id, invitation_type, status, message, trial_time, trial_address, created_at) VALUES
        (401, 100, 6, 'exchange_contact', 0, '您好，我对您的教学很感兴趣，希望能获取您的联系方式进一步沟通。', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (402, 101, 7, 'exchange_wechat', 0, '方便加个微信详细聊聊孩子的学习情况吗？', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (403, 103, 8, 'invite_trial', 0, '想约一节物理试听课，看下孩子是否适应您的教学风格。', DATE_ADD(NOW(), INTERVAL 3 DAY), '海淀区中关村图书大厦', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
        (501, 100, 9, 'invite_course', 1, '孩子高三数学急需提高，希望能正式上课。', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (502, 104, 10, 'exchange_contact', 2, '希望获取您的联系方式。', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (601, 102, 12, 'exchange_wechat', 1, '方便加微信沟通孩子英语学习吗？', NULL, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (602, 105, 13, 'invite_trial', 0, '希望安排一次数学试听课。', DATE_ADD(NOW(), INTERVAL 5 DAY), '线上授课', DATE_SUB(NOW(), INTERVAL 10 MINUTE))
      `);
      
      return { success: true, message: '邀约演示数据初始化成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 查看邀约列表（测试用）
   */
  @Public()
  @Get('invitations')
  async getInvitations(@Query('userId') userId: string = '100') {
    try {
      const [invitations] = await db.query(`
        SELECT i.*, 
               u1.nickname as from_nickname, u1.avatar as from_avatar, u1.role as from_role,
               u2.nickname as to_nickname, u2.avatar as to_avatar, u2.role as to_role,
               o.subject as order_subject, o.student_grade as order_grade
        FROM invitations i
        LEFT JOIN users u1 ON i.from_user_id = u1.id
        LEFT JOIN users u2 ON i.to_user_id = u2.id
        LEFT JOIN orders o ON i.order_id = o.id
        WHERE i.to_user_id = ? OR i.from_user_id = ?
        ORDER BY i.created_at DESC
        LIMIT 20
      `, [parseInt(userId), parseInt(userId)]);
      
      return { success: true, list: invitations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 调试：查看消息提醒表数据
   */
  @Public()
  @Get('debug/reminders')
  async debugReminders() {
    try {
      const [reminders] = await db.query(`SELECT * FROM message_reminders LIMIT 10`);
      const [conversations] = await db.query(`SELECT * FROM conversations LIMIT 10`);
      const [messages] = await db.query(`SELECT * FROM messages LIMIT 10`);
      return { reminders, conversations, messages };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 调试：查看表结构
   */
  @Public()
  @Get('debug/tables')
  async debugTables() {
    try {
      const [orders] = await db.query(`DESCRIBE orders`);
      const [orderMatches] = await db.query(`DESCRIBE order_matches`);
      return { orders, orderMatches };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 初始化消息演示数据
   * 支持传入 userId 为指定用户创建演示数据
   */
  @Public()
  @Post('init-messages')
  async initMessages(@Body() body: { userId?: number } = {}) {
    const targetUserId = body.userId || 401;
    
    try {
      // 先删除再重建表（确保结构正确）
      await db.update(`DROP TABLE IF EXISTS message_reminders`);
      await db.update(`DROP TABLE IF EXISTS messages`);
      await db.update(`DROP TABLE IF EXISTS conversations`);

      // 创建会话表
      await db.update(`
        CREATE TABLE conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT COMMENT '关联订单ID',
          user1_id INT NOT NULL COMMENT '用户1ID（较小ID）',
          user2_id INT NOT NULL COMMENT '用户2ID（较大ID）',
          last_message VARCHAR(500),
          last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user1_unread INT DEFAULT 0,
          user2_unread INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users (user1_id, user2_id),
          INDEX idx_order (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表'
      `);

      // 创建消息表
      await db.update(`
        CREATE TABLE messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          conversation_id INT NOT NULL,
          sender_id INT NOT NULL,
          content TEXT NOT NULL,
          msg_type TINYINT DEFAULT 0 COMMENT '0-文本 1-图片 2-系统',
          is_robot TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_conversation (conversation_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表'
      `);

      // 创建消息提醒表
      await db.update(`
        CREATE TABLE message_reminders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          from_user_id INT COMMENT '来源用户ID',
          type TINYINT NOT NULL COMMENT '1-订单 2-评价 3-消息 4-系统',
          target_id INT COMMENT '关联ID',
          content VARCHAR(500),
          is_read TINYINT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id, is_read)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息提醒表'
      `);

      // 插入会话数据
      await db.update(`
        INSERT INTO conversations (id, order_id, user1_id, user2_id, last_message, last_message_at, user1_unread, user2_unread) VALUES
        (1, 6, 100, 401, '好的，明天下午3点可以试课', DATE_SUB(NOW(), INTERVAL 1 HOUR), 0, 1),
        (2, 9, 100, 501, '请问您的教学方式是怎样的？', DATE_SUB(NOW(), INTERVAL 3 HOUR), 1, 0),
        (3, 7, 101, 402, '孩子英语基础怎么样？', DATE_SUB(NOW(), INTERVAL 5 HOUR), 0, 2),
        (4, NULL, 1, 401, '欢迎使用牛师很忙平台！', DATE_SUB(NOW(), INTERVAL 1 DAY), 0, 0)
      `);

      // 插入消息数据
      await db.update(`
        INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot, created_at) VALUES
        (1, 401, '张老师您好，我想了解一下您的授课方式', 0, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (1, 100, '您好！我主要采用启发式教学，注重培养学生的思维能力', 0, 0, DATE_SUB(NOW(), INTERVAL 1.5 HOUR)),
        (1, 401, '那可以安排一次试课吗？', 0, 0, DATE_SUB(NOW(), INTERVAL 1.2 HOUR)),
        (1, 100, '好的，明天下午3点可以试课', 0, 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (2, 501, '张老师，您能帮孩子冲刺高考数学吗？', 0, 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
        (2, 100, '可以的，我有丰富的高考辅导经验', 0, 0, DATE_SUB(NOW(), INTERVAL 3.5 HOUR)),
        (2, 501, '请问您的教学方式是怎样的？', 0, 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
        (3, 402, '王老师，孩子的英语口语比较弱', 0, 0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
        (3, 101, '别担心，我会有针对性地进行口语训练', 0, 0, DATE_SUB(NOW(), INTERVAL 5.5 HOUR)),
        (3, 402, '孩子英语基础怎么样？', 0, 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
        (4, 1, '欢迎使用牛师很忙平台！祝您找到满意的老师。', 0, 1, DATE_SUB(NOW(), INTERVAL 1 DAY))
      `);

      // 插入消息提醒数据 - 为目标用户创建演示数据
      await db.update(`
        INSERT INTO message_reminders (user_id, from_user_id, type, target_id, content, is_read, created_at) VALUES
        (${targetUserId}, 100, 1, 6, '张老师接受了您的订单，请查看详情', 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
        (${targetUserId}, 100, 3, 1, '张老师回复了您的消息', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (${targetUserId}, 0, 4, NULL, '系统将于今晚进行维护，请提前保存重要信息', 1, DATE_SUB(NOW(), INTERVAL 3 DAY))
      `);

      return { success: true, message: `消息演示数据初始化成功，userId: ${targetUserId}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 初始化订单演示数据（含各种状态）
   */
  @Public()
  @Post('init-order-demo')
  async initOrderDemo() {
    try {
      // 删除并重建 order_matches 表
      await db.update(`DROP TABLE IF EXISTS order_matches`);
      await db.update(`
        CREATE TABLE order_matches (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          teacher_id INT NOT NULL,
          user_id INT DEFAULT 0,
          status TINYINT DEFAULT 0 COMMENT '0-待选择 1-已选中 2-已拒绝 3-已失效',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_order (order_id),
          INDEX idx_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单匹配表'
      `);

      // 清空现有订单数据
      await db.update(`DELETE FROM orders WHERE id >= 100`);

      // 插入不同状态的订单
      await db.update(`
        INSERT INTO orders (id, order_no, user_id, parent_id, subject, student_grade, hourly_rate, description, address, latitude, longitude, status, matched_teacher_id, created_at) VALUES
        (100, 'ORD20260401001', 401, 401, '数学', '高二', 180, '孩子数学基础薄弱，需要系统补习', '朝阳区望京', 39.9142, 116.4174, 0, NULL, NOW()),
        (101, 'ORD20260401002', 402, 402, '英语', '初三', 150, '中考英语冲刺，需要提高阅读理解', '海淀区中关村', 39.9342, 116.4374, 0, NULL, NOW()),
        (102, 'ORD20260401003', 403, 403, '物理', '高一', 200, '物理力学部分需要加强', '西城区金融街', 39.9542, 116.4574, 0, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (103, 'ORD20260401004', 501, 501, '数学', '高三', 250, '高考数学冲刺，目标130分以上', '浦东新区陆家嘴', 31.2404, 121.4837, 1, 100, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (104, 'ORD20260401005', 502, 502, '化学', '高二', 180, '化学实验原理理解困难', '徐汇区徐家汇', 31.2604, 121.5037, 2, 101, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (105, 'ORD20260401006', 601, 601, '英语', '高一', 160, '英语语法系统学习', '天河区珠江新城', 23.1391, 113.2744, 3, 102, DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (106, 'ORD20260401007', 602, 602, '物理', '高二', 180, '物理电磁学专项训练', '越秀区东山口', 23.1591, 113.2944, 4, 103, DATE_SUB(NOW(), INTERVAL 7 DAY)),
        (107, 'ORD20260401008', 401, 401, '数学', '高一', 150, '这个订单匹配失败，已退回', '朝阳区三里屯', 39.9242, 116.4474, 0, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY))
      `);

      // 插入抢单记录
      await db.update(`
        INSERT INTO order_matches (order_id, teacher_id, user_id, status, created_at) VALUES
        (102, 100, 100, 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
        (102, 101, 101, 0, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
        (103, 100, 100, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (103, 104, 104, 2, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (104, 101, 101, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (105, 102, 102, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (106, 103, 103, 1, DATE_SUB(NOW(), INTERVAL 7 DAY))
      `);

      return { success: true, message: '订单演示数据初始化成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 初始化演示数据（牛师坐标、广告位、家长需求等）
   */
  @Public()
  @Post('init-demo-data')
  async initDemoData() {
    try {
      // 创建家长用户（如果不存在）
      const parentIds = [
        { id: 401, nickname: '北京家长A', city: '北京' },
        { id: 402, nickname: '北京家长B', city: '北京' },
        { id: 403, nickname: '北京家长C', city: '北京' },
        { id: 501, nickname: '上海家长A', city: '上海' },
        { id: 502, nickname: '上海家长B', city: '上海' },
        { id: 503, nickname: '上海家长C', city: '上海' },
        { id: 601, nickname: '广州家长A', city: '广州' },
        { id: 602, nickname: '广州家长B', city: '广州' },
        { id: 603, nickname: '广州家长C', city: '广州' },
      ];
      
      for (const parent of parentIds) {
        await db.update(`
          INSERT INTO users (id, openid, nickname, avatar, role, status, city_name, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, 1, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), city_name = VALUES(city_name)
        `, [parent.id, `parent_${parent.id}`, parent.nickname, `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent.nickname}`, parent.city]);
      }
      
      // 更新北京牛师坐标
      await db.update(`UPDATE users SET latitude = 39.9042, longitude = 116.4074 WHERE id = 100`);
      await db.update(`UPDATE users SET latitude = 39.9042, longitude = 116.4074 WHERE id = 101`);
      await db.update(`UPDATE users SET latitude = 39.9142, longitude = 116.4174 WHERE id = 102`);
      await db.update(`UPDATE users SET latitude = 39.9242, longitude = 116.4274 WHERE id = 103`);
      await db.update(`UPDATE users SET latitude = 39.9342, longitude = 116.4374 WHERE id = 104`);
      await db.update(`UPDATE users SET latitude = 39.9442, longitude = 116.4474 WHERE id = 105`);
      
      // 更新上海牛师坐标
      await db.update(`UPDATE users SET latitude = 31.2304, longitude = 121.4737 WHERE id = 201`);
      await db.update(`UPDATE users SET latitude = 31.2404, longitude = 121.4837 WHERE id = 202`);
      await db.update(`UPDATE users SET latitude = 31.2504, longitude = 121.4937 WHERE id = 203`);
      await db.update(`UPDATE users SET latitude = 31.2604, longitude = 121.5037 WHERE id = 204`);
      await db.update(`UPDATE users SET latitude = 31.2704, longitude = 121.5137 WHERE id = 205`);
      
      // 更新广州牛师坐标
      await db.update(`UPDATE users SET latitude = 23.1291, longitude = 113.2644 WHERE id = 301`);
      await db.update(`UPDATE users SET latitude = 23.1391, longitude = 113.2744 WHERE id = 302`);
      await db.update(`UPDATE users SET latitude = 23.1491, longitude = 113.2844 WHERE id = 303`);
      await db.update(`UPDATE users SET latitude = 23.1591, longitude = 113.2944 WHERE id = 304`);
      await db.update(`UPDATE users SET latitude = 23.1691, longitude = 113.3044 WHERE id = 305`);

      // 创建广告位表（如果不存在）
      await db.update(`
        CREATE TABLE IF NOT EXISTS ad_positions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          position_key VARCHAR(50) NOT NULL COMMENT '广告位标识',
          title VARCHAR(100) COMMENT '广告标题',
          image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
          link_url VARCHAR(255) COMMENT '跳转链接',
          sort_order INT DEFAULT 0 COMMENT '排序',
          is_active TINYINT DEFAULT 1 COMMENT '是否启用',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_position_key (position_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告位表'
      `);

      // 插入广告数据
      await db.update(`
        INSERT INTO ad_positions (position_key, title, image_url, link_url, sort_order, is_active) VALUES
        ('home_top', '新人专享福利', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', '/pages/member/index', 1, 1),
        ('home_top', '会员日特惠', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', '/pages/membership/index', 2, 1),
        ('home_top', '名师一对一定制课程', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=400&fit=crop', '/pages/teacher/list', 3, 1),
        ('home_top', '暑期集训营火热报名', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop', '/pages/activities/index', 4, 1)
        ON DUPLICATE KEY UPDATE title = VALUES(title)
      `);

      // 更新站点名称
      await db.update(`
        INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
        VALUES ('site_name', '牛师很忙', 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE config_value = '牛师很忙', updated_at = NOW()
      `);

      // 插入家长需求订单数据
      // 先检查是否已存在这些订单
      const [existingOrders] = await db.query(`SELECT id FROM orders WHERE id IN (6,7,8,9,10,11,12,13,14)`);
      
      if (!existingOrders || (existingOrders as any[]).length === 0) {
        // 插入北京家长需求 (user_id使用家长ID)
        await db.update(`
          INSERT INTO orders (id, user_id, subject, student_grade, hourly_rate, description, address, latitude, longitude, status, parent_id, created_at) VALUES
          (6, 401, '数学', '高二', 180, '孩子数学成绩一直在及格线徘徊，希望找到有经验的老师帮助提高成绩', '朝阳区望京', 39.9142, 116.4174, 0, 401, NOW()),
          (7, 402, '英语', '初三', 150, '希望提高英语口语和写作能力，为中考做准备', '海淀区中关村', 39.9342, 116.4374, 0, 402, NOW()),
          (8, 403, '物理', '高一', 200, '孩子对物理概念理解困难，需要老师耐心讲解', '西城区金融街', 39.9542, 116.4574, 0, 403, NOW())
        `);
        
        // 插入上海家长需求
        await db.update(`
          INSERT INTO orders (id, user_id, subject, student_grade, hourly_rate, description, address, latitude, longitude, status, parent_id, created_at) VALUES
          (9, 501, '数学', '高三', 250, '高考冲刺阶段，需要强化数学解题技巧', '浦东新区陆家嘴', 31.2404, 121.4837, 0, 501, NOW()),
          (10, 502, '化学', '高二', 180, '化学实验部分薄弱，希望加强实验原理理解', '徐汇区徐家汇', 31.2604, 121.5037, 0, 502, NOW()),
          (11, 503, '语文', '初三', 150, '作文写不好，希望老师指导写作技巧', '静安区南京西路', 31.2804, 121.5237, 0, 503, NOW())
        `);
        
        // 插入广州家长需求
        await db.update(`
          INSERT INTO orders (id, user_id, subject, student_grade, hourly_rate, description, address, latitude, longitude, status, parent_id, created_at) VALUES
          (12, 601, '英语', '高一', 160, '英语语法基础差，希望系统补习', '天河区珠江新城', 23.1391, 113.2744, 0, 601, NOW()),
          (13, 602, '物理', '高二', 180, '物理力学部分理解困难，需要老师详细讲解', '越秀区东山口', 23.1591, 113.2944, 0, 602, NOW()),
          (14, 603, '数学', '高三', 220, '高考冲刺，数学需要提高到130分以上', '海珠区江南西', 23.1791, 113.3144, 0, 603, NOW())
        `);
      } else {
        // 更新订单坐标
        await db.update(`UPDATE orders SET latitude = 39.9142, longitude = 116.4174 WHERE id = 6`);
        await db.update(`UPDATE orders SET latitude = 39.9342, longitude = 116.4374 WHERE id = 7`);
        await db.update(`UPDATE orders SET latitude = 39.9542, longitude = 116.4574 WHERE id = 8`);
        await db.update(`UPDATE orders SET latitude = 31.2404, longitude = 121.4837 WHERE id = 9`);
        await db.update(`UPDATE orders SET latitude = 31.2604, longitude = 121.5037 WHERE id = 10`);
        await db.update(`UPDATE orders SET latitude = 31.2804, longitude = 121.5237 WHERE id = 11`);
        await db.update(`UPDATE orders SET latitude = 23.1391, longitude = 113.2744 WHERE id = 12`);
        await db.update(`UPDATE orders SET latitude = 23.1591, longitude = 113.2944 WHERE id = 13`);
        await db.update(`UPDATE orders SET latitude = 23.1791, longitude = 113.3144 WHERE id = 14`);
      }

      return { success: true, message: '演示数据初始化成功' };
    } catch (error) {
      console.error('初始化演示数据失败:', error);
      return { success: false, message: '初始化失败', error: error.message };
    }
  }

  // ==================== 会员套餐管理 ====================

  @Get('membership-plans')
  @Public()
  async getMembershipPlans() {
    try {
      const [plans] = await db.query(`SELECT * FROM membership_plans ORDER BY role, sort_order, id`);
      return plans.map(p => ({...p, features: p.features ? JSON.parse(p.features) : []}));
    } catch (error) {
      return [
        { id: 1, name: '家长年卡', role: 0, price: 199, original_price: 708, duration_days: 365, features: ['查看联系方式', '无限发布需求'], is_active: 1 },
        { id: 2, name: '牛师年卡', role: 1, price: 199, original_price: 708, duration_days: 365, features: ['无限抢单', '优先展示'], is_active: 1 },
        { id: 3, name: '机构年卡', role: 2, price: 999, original_price: 2388, duration_days: 365, features: ['无限发布牛师', '优先展示'], is_active: 1 },
      ];
    }
  }

  @Put('membership-plans/:id')
  @RequirePermission('config:edit')
  async updateMembershipPlan(@Param('id') id: string, @Body() body: any) {
    const updates: string[] = [];
    const params: any[] = [];
    if (body.name) { updates.push('name = ?'); params.push(body.name); }
    if (body.price !== undefined) { updates.push('price = ?'); params.push(body.price); }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); params.push(body.is_active); }
    if (updates.length === 0) return { success: true };
    updates.push('updated_at = NOW()');
    params.push(parseInt(id));
    await db.update(`UPDATE membership_plans SET ${updates.join(', ')} WHERE id = ?`, params);
    return { success: true };
  }

  // ==================== 活动管理 ====================

  @Get('activities')
  @Public()
  async getActivities(@Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('status') status = '') {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    if (status) { whereClause += ' AND status = ?'; params.push(status); }
    try {
      const [list] = await db.query(`SELECT * FROM activities ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, pageSizeNum, offset]);
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM activities ${whereClause}`, params);
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('[Admin] Get activities error:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  @Post('activities/:id/audit')
  @RequirePermission('activity:audit')
  async auditActivity(@Param('id') id: string, @Body() body: { status: number; reason?: string }) {
    await db.update('UPDATE activities SET status = ?, updated_at = NOW() WHERE id = ?', [body.status, parseInt(id)]);
    return { success: true };
  }

  // ==================== 广告位管理 ====================

  @Get('banners')
  @Public()
  async getBanners() {
    try {
      const [banners] = await db.query(`SELECT * FROM ad_positions ORDER BY position_key, sort_order, id`);
      return banners;
    } catch (error) {
      return [];
    }
  }

  @Post('banners')
  @RequirePermission('config:edit')
  async createBanner(@Body() body: { position_key: string; title: string; image_url: string; link_url?: string; sort_order?: number }) {
    const insertId = await db.insert(`INSERT INTO ad_positions (position_key, title, image_url, link_url, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())`, [body.position_key, body.title, body.image_url, body.link_url || '', body.sort_order || 0]);
    return { success: true, id: insertId };
  }

  @Put('banners/:id')
  @RequirePermission('config:edit')
  async updateBanner(@Param('id') id: string, @Body() body: any) {
    const updates: string[] = [];
    const params: any[] = [];
    if (body.title) { updates.push('title = ?'); params.push(body.title); }
    if (body.image_url) { updates.push('image_url = ?'); params.push(body.image_url); }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); params.push(body.is_active); }
    if (updates.length === 0) return { success: true };
    updates.push('updated_at = NOW()');
    params.push(parseInt(id));
    await db.update(`UPDATE ad_positions SET ${updates.join(', ')} WHERE id = ?`, params);
    return { success: true };
  }

  @Delete('banners/:id')
  @RequirePermission('config:edit')
  async deleteBanner(@Param('id') id: string) {
    await db.update('DELETE FROM ad_positions WHERE id = ?', [parseInt(id)]);
    return { success: true };
  }

  // ==================== 支付表管理 ====================

  /**
   * 创建支付表（如果不存在）
   */
  @Public()
  @Post('create-payments-table')
  async createPaymentsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          target_type TINYINT NOT NULL COMMENT '目标类型: 1=会员, 2=商品',
          target_id INT NOT NULL COMMENT '目标ID',
          amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
          payment_no VARCHAR(64) NOT NULL COMMENT '支付单号',
          transaction_id VARCHAR(64) COMMENT '第三方交易号',
          status TINYINT DEFAULT 0 COMMENT '状态: 0=待支付, 1=已支付, 2=已取消, 3=已退款',
          paid_at TIMESTAMP NULL COMMENT '支付时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_payment_no (payment_no),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单表'
      `);
      return { success: true, message: 'payments表创建成功' };
    } catch (error) {
      console.error('创建payments表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查payments表结构
   */
  @Public()
  @Get('check-payments-table')
  async checkPaymentsTable() {
    try {
      const [structure] = await db.query(`DESCRIBE payments`);
      const [data] = await db.query(`SELECT * FROM payments LIMIT 5`);
      return { success: true, structure, sampleData: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建order_pool表（公海池）
   */
  @Public()
  @Post('create-order-pool-table')
  async createOrderPoolTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS order_pool (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL COMMENT '订单ID',
          original_parent_id INT NOT NULL COMMENT '原家长ID',
          original_teacher_id INT COMMENT '原教师ID',
          release_reason VARCHAR(500) COMMENT '释放原因',
          release_type TINYINT NOT NULL COMMENT '释放类型: 1=家长取消, 2=教师解约, 3=系统回收',
          pool_status TINYINT DEFAULT 0 COMMENT '公海池状态: 0=待分配, 1=已分配, 2=已过期',
          assigned_teacher_id INT COMMENT '分配给的教师ID',
          assigned_at TIMESTAMP NULL COMMENT '分配时间',
          expire_at TIMESTAMP NOT NULL COMMENT '过期时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_order (order_id),
          INDEX idx_pool_status (pool_status),
          INDEX idx_expire (expire_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单公海池表'
      `);
      return { success: true, message: 'order_pool表创建成功' };
    } catch (error) {
      console.error('创建order_pool表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建commissions表（佣金）
   */
  @Public()
  @Post('create-commissions-table')
  async createCommissionsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS commissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID（佣金受益人）',
          from_user_id INT NOT NULL COMMENT '来源用户ID',
          payment_id INT COMMENT '关联支付ID',
          level_type TINYINT NOT NULL COMMENT '分佣级别: 1=一级, 2=二级, 3=城市代理, 4=机构',
          amount DECIMAL(10,2) NOT NULL COMMENT '佣金金额',
          rate DECIMAL(5,2) COMMENT '分佣比例',
          status TINYINT DEFAULT 0 COMMENT '状态: 0=待结算, 1=已结算, 2=已提现',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          settled_at TIMESTAMP NULL COMMENT '结算时间',
          INDEX idx_user (user_id),
          INDEX idx_from_user (from_user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='佣金表'
      `);

      // 创建提现记录表
      await db.update(`
        CREATE TABLE IF NOT EXISTS withdraw_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          amount DECIMAL(10,2) NOT NULL COMMENT '提现金额',
          account_type VARCHAR(20) COMMENT '账户类型',
          account_no VARCHAR(100) COMMENT '账号',
          account_name VARCHAR(50) COMMENT '账户名',
          status TINYINT DEFAULT 0 COMMENT '状态: 0=待处理, 1=已通过, 2=已拒绝, 3=已打款',
          reason VARCHAR(255) COMMENT '拒绝原因',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL COMMENT '处理时间',
          INDEX idx_user (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表'
      `);

      return { success: true, message: 'commissions和withdraw_records表创建成功' };
    } catch (error) {
      console.error('创建表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建分销配置表
   */
  @Post('create-distribution-configs-table')
  @Public()
  async createDistributionConfigsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS distribution_configs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          config_key VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键',
          config_value VARCHAR(20) NOT NULL COMMENT '配置值',
          description VARCHAR(255) COMMENT '描述',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销配置表'
      `);
      
      // 插入默认配置
      await db.update(`
        INSERT INTO distribution_configs (config_key, config_value, description) VALUES
        ('level1_member_rate', '0.20', '一级分销会员佣金比例'),
        ('level2_member_rate', '0.10', '二级分销会员佣金比例'),
        ('level1_order_rate', '0.05', '一级分销订单佣金比例'),
        ('level2_order_rate', '0.03', '二级分销订单佣金比例'),
        ('level1_activity_rate', '0.05', '一级分销活动佣金比例'),
        ('level2_activity_rate', '0.03', '二级分销活动佣金比例'),
        ('level1_resource_rate', '0.10', '一级分销资源佣金比例'),
        ('level2_resource_rate', '0.05', '二级分销资源佣金比例')
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `);
      
      return { success: true, message: '分销配置表创建成功' };
    } catch (error) {
      console.error('创建分销配置表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建活动报名表
   */
  @Post('create-activity-registrations-table')
  @Public()
  async createActivityRegistrationsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS activity_registrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          activity_id INT NOT NULL COMMENT '活动ID',
          user_id INT NOT NULL COMMENT '用户ID',
          signup_type INT DEFAULT 0 COMMENT '报名方式: 0个人 1机构',
          participant_name VARCHAR(50) COMMENT '参与者姓名',
          participant_phone VARCHAR(20) COMMENT '参与者电话',
          participant_count INT DEFAULT 1 COMMENT '参与人数',
          status INT DEFAULT 0 COMMENT '状态: 0待确认 1已确认 2已取消',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_activity_id (activity_id),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名表'
      `);

      return { success: true, message: 'activity_registrations表创建成功' };
    } catch (error) {
      console.error('创建表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建活动报名表（activity_signups）
   */
  @Post('create-activity-signups-table')
  @Public()
  async createActivitySignupsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS activity_signups (
          id INT AUTO_INCREMENT PRIMARY KEY,
          activity_id INT NOT NULL COMMENT '活动ID',
          user_id INT NOT NULL COMMENT '用户ID',
          signup_type INT DEFAULT 0 COMMENT '报名方式: 0线上 1线下',
          participant_name VARCHAR(50) COMMENT '参与者姓名',
          participant_phone VARCHAR(20) COMMENT '参与者电话',
          participant_count INT DEFAULT 1 COMMENT '参与人数',
          total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总金额',
          status INT DEFAULT 1 COMMENT '状态: 0待确认 1已确认 2已取消',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_activity_id (activity_id),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名表'
      `);

      return { success: true, message: 'activity_signups表创建成功' };
    } catch (error) {
      console.error('创建表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 修复activity_signups表结构
   */
  @Post('fix-activity-signups-table')
  @Public()
  async fixActivitySignupsTable() {
    try {
      // 添加缺失的字段
      await db.update(`
        ALTER TABLE activity_signups
        ADD COLUMN IF NOT EXISTS signup_type INT DEFAULT 0 COMMENT '报名方式: 0线上 1线下' AFTER user_id,
        ADD COLUMN IF NOT EXISTS participant_name VARCHAR(50) COMMENT '参与者姓名' AFTER signup_type,
        ADD COLUMN IF NOT EXISTS participant_phone VARCHAR(20) COMMENT '参与者电话' AFTER participant_name,
        ADD COLUMN IF NOT EXISTS participant_count INT DEFAULT 1 COMMENT '参与人数' AFTER participant_phone,
        ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总金额' AFTER participant_count,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);

      return { success: true, message: 'activity_signups表修复成功' };
    } catch (error) {
      console.error('修复表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 添加数据库索引优化查询性能
   */
  @Post('add-indexes')
  @Public()
  async addIndexes() {
    const results: string[] = [];
    const errors: string[] = [];
    
    const indexSqls = [
      { table: 'orders', name: 'idx_status_created', sql: 'ALTER TABLE orders ADD INDEX idx_status_created (status, created_at)' },
      { table: 'orders', name: 'idx_parent_status', sql: 'ALTER TABLE orders ADD INDEX idx_parent_status (parent_id, status)' },
      { table: 'orders', name: 'idx_subject', sql: 'ALTER TABLE orders ADD INDEX idx_subject (subject)' },
      { table: 'users', name: 'idx_role_status', sql: 'ALTER TABLE users ADD INDEX idx_role_status (role, status)' },
      { table: 'users', name: 'idx_membership', sql: 'ALTER TABLE users ADD INDEX idx_membership (membership_type, membership_expire_at)' },
      { table: 'messages', name: 'idx_conversation_created', sql: 'ALTER TABLE messages ADD INDEX idx_conversation_created (conversation_id, created_at)' },
      { table: 'teacher_profiles', name: 'idx_verify', sql: 'ALTER TABLE teacher_profiles ADD INDEX idx_verify (verify_status)' },
    ];
    
    for (const item of indexSqls) {
      try {
        await db.update(item.sql);
        results.push(`${item.table}.${item.name}`);
      } catch (e: any) {
        if (e.message && e.message.includes('Duplicate key name')) {
          // 索引已存在，忽略
        } else {
          errors.push(`${item.table}.${item.name}: ${e.message}`);
        }
      }
    }

    return { 
      success: true, 
      message: `已添加 ${results.length} 个索引`,
      added: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // ==================== 数据导出功能 ====================

  /**
   * 导出用户数据为Excel
   */
  @Get('export/users')
  @Public()
  async exportUsers(@Query('role') role: string = '') {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      
      if (role) {
        whereClause += ' AND u.role = ?';
        params.push(role === 'parent' ? 0 : role === 'teacher' ? 1 : 2);
      }

      const [users] = await db.query(`
        SELECT 
          u.id, u.nickname, u.mobile, 
          CASE u.role WHEN 0 THEN '家长' WHEN 1 THEN '牛师' WHEN 2 THEN '机构' END as role_name,
          CASE u.membership_type WHEN 1 THEN '会员' ELSE '普通' END as membership_status,
          u.membership_expire_at, u.city_name,
          CASE u.status WHEN 1 THEN '正常' ELSE '禁用' END as status_name,
          u.created_at
        FROM users u
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT 10000
      `, params);

      // 生成Excel数据
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(users as any[]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '用户数据');
      
      // 转为base64
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `users_${role || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出用户数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出牛师数据为Excel
   */
  @Get('export/teachers')
  @Public()
  async exportTeachers() {
    try {
      const [teachers] = await db.query(`
        SELECT 
          tp.user_id as id, u.nickname, tp.real_name, u.mobile, u.city_name,
          tp.education, tp.school, tp.major, 
          CASE tp.verify_status WHEN 0 THEN '待审核' WHEN 1 THEN '已认证' WHEN 2 THEN '已拒绝' END as verify_status_name,
          tp.teaching_years, tp.subjects, tp.intro,
          tp.rating, tp.hourly_rate_min, tp.hourly_rate_max,
          CASE u.membership_type WHEN 1 THEN '会员' ELSE '普通' END as membership_status,
          u.membership_expire_at, u.created_at
        FROM teacher_profiles tp
        LEFT JOIN users u ON tp.user_id = u.id
        ORDER BY tp.user_id DESC
        LIMIT 10000
      `);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(teachers as any[]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '牛师数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `teachers_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出牛师数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出家长数据为Excel
   */
  @Get('export/parents')
  @Public()
  async exportParents() {
    try {
      const [parents] = await db.query(`
        SELECT 
          u.id, u.nickname, u.mobile, u.city_name,
          CASE u.membership_type WHEN 1 THEN '会员' ELSE '普通' END as membership_status,
          u.membership_expire_at,
          (SELECT COUNT(*) FROM orders o WHERE o.parent_id = u.id) as order_count,
          (SELECT COUNT(*) FROM orders o WHERE o.parent_id = u.id AND o.status = 4) as completed_count,
          u.created_at
        FROM users u
        WHERE u.role = 0
        ORDER BY u.id DESC
        LIMIT 10000
      `);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(parents as any[]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '家长数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `parents_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出家长数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出机构数据为Excel
   */
  @Get('export/orgs')
  @Public()
  async exportOrgs() {
    try {
      const [orgs] = await db.query(`
        SELECT 
          o.id, o.org_name as name, o.contact_person, o.contact_phone, o.address, o.intro as description,
          CASE o.status WHEN 0 THEN '待审核' WHEN 1 THEN '已认证' WHEN 2 THEN '已拒绝' END as verify_status_name,
          (SELECT COUNT(*) FROM users WHERE affiliated_org_id = o.user_id) as teacher_count,
          u.membership_type, u.membership_expire_at, o.created_at
        FROM organizations o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC
        LIMIT 10000
      `);

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(orgs as any[]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '机构数据');
      
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return { 
        success: true, 
        data: excelBuffer,
        filename: `orgs_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('导出机构数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 会员管理功能 ====================

  /**
   * 人工开通会员
   */
  @Post('users/:id/grant-membership')
  @Public()
  async grantMembership(
    @Param('id') id: string,
    @Body() body: { days: number; reason?: string }
  ) {
    try {
      const userId = parseInt(id);
      const days = body.days || 365;
      
      // 获取用户当前会员状态
      const [users] = await db.query(
        'SELECT membership_expire_at FROM users WHERE id = ?',
        [userId]
      );
      
      if (!users || users.length === 0) {
        return { success: false, message: '用户不存在' };
      }
      
      // 计算新的过期时间
      let expireAt = new Date();
      const current = (users as any[])[0]?.membership_expire_at;
      if (current && new Date(current) > expireAt) {
        expireAt = new Date(current);
      }
      expireAt.setDate(expireAt.getDate() + days);
      
      // 更新会员状态
      await db.update(
        'UPDATE users SET membership_type = 1, membership_expire_at = ?, updated_at = NOW() WHERE id = ?',
        [expireAt, userId]
      );
      
      // 尝试记录操作日志（如果表存在）
      try {
        await db.update(
          `INSERT INTO membership_logs (user_id, action, days, reason, created_at) 
           VALUES (?, 'grant', ?, ?, NOW())`,
          [userId, days, body.reason || '后台开通']
        );
      } catch (logError) {
        console.log('记录会员日志失败，跳过:', logError.message);
      }
      
      return { 
        success: true, 
        message: `已为用户 ${userId} 开通 ${days} 天会员`,
        expireAt: expireAt.toISOString()
      };
    } catch (error) {
      console.error('开通会员失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消会员
   */
  @Post('users/:id/revoke-membership')
  @Public()
  async revokeMembership(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    try {
      const userId = parseInt(id);
      
      await db.update(
        'UPDATE users SET membership_type = 0, membership_expire_at = NULL, updated_at = NOW() WHERE id = ?',
        [userId]
      );
      
      // 尝试记录操作日志（如果表存在）
      try {
        await db.update(
          `INSERT INTO membership_logs (user_id, action, reason, created_at) 
           VALUES (?, 'revoke', ?, NOW())`,
          [userId, body.reason || '后台取消']
        );
      } catch (logError) {
        console.log('记录会员日志失败，跳过:', logError.message);
      }
      
      return { success: true, message: `已取消用户 ${userId} 的会员` };
    } catch (error) {
      console.error('取消会员失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 提现管理 ====================

  /**
   * 获取提现列表
   */
  @Get('withdrawals')
  @Public()
  async getWithdrawals(@Query('status') status = '', @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND w.status = ?';
      params.push(parseInt(status));
    }
    
    try {
      const [list] = await db.query(`
        SELECT w.id, w.user_id, w.amount, w.account_type, w.account_no, w.account_name,
          w.status, w.reject_reason, w.created_at, w.processed_at,
          u.nickname as user_nickname, u.mobile as user_phone, u.avatar as user_avatar
        FROM withdraw_records w
        LEFT JOIN users u ON w.user_id = u.id
        ${whereClause}
        ORDER BY w.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM withdraw_records w ${whereClause}
      `, params);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取提现列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 通过提现申请
   */
  @Post('withdrawals/:id/approve')
  @Public()
  async approveWithdrawal(@Param('id') id: string) {
    try {
      await db.update(
        'UPDATE withdraw_records SET status = 1, processed_at = NOW() WHERE id = ?',
        [parseInt(id)]
      );
      
      return { success: true };
    } catch (error) {
      console.error('通过提现失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 拒绝提现申请
   */
  @Post('withdrawals/:id/reject')
  @Public()
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    try {
      await db.update(
        'UPDATE withdraw_records SET status = 2, reject_reason = ?, processed_at = NOW() WHERE id = ?',
        [body.reason || null, parseInt(id)]
      );
      
      return { success: true };
    } catch (error) {
      console.error('拒绝提现失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 分佣管理 ====================

  /**
   * 获取分佣列表
   */
  @Get('commissions')
  @Public()
  async getCommissions(@Query('status') status = '', @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(parseInt(status));
    }
    
    try {
      const [list] = await db.query(`
        SELECT c.*, 
          u.nickname as user_nickname, u.avatar as user_avatar,
          fu.nickname as from_nickname
        FROM commissions c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users fu ON c.from_user_id = fu.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM commissions c ${whereClause}
      `, params);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取分佣列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 批量结算分佣
   */
  @Post('commissions/settle')
  @Public()
  async settleCommissions(@Body() body: { ids: number[] }) {
    try {
      if (!body.ids || body.ids.length === 0) {
        return { success: false, message: '请选择要结算的记录' };
      }
      
      await db.update(
        `UPDATE commissions SET status = 1, settled_at = NOW() WHERE id IN (${body.ids.map(() => '?').join(',')})`,
        body.ids
      );
      
      return { success: true, message: `已结算 ${body.ids.length} 条记录` };
    } catch (error) {
      console.error('结算分佣失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 代理商管理 ====================

  /**
   * 获取代理商列表
   */
  @Get('agents')
  @Public()
  async getAgents(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    try {
      const [list] = await db.query(`
        SELECT ca.*, u.nickname, u.mobile, u.avatar
        FROM city_agents ca
        LEFT JOIN users u ON ca.user_id = u.id
        ORDER BY ca.created_at DESC
        LIMIT ? OFFSET ?
      `, [pageSizeNum, offset]);
      
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM city_agents`);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取代理商列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 创建代理商
   */
  @Post('agents')
  @Public()
  async createAgent(@Body() body: { userId: number; cityCode: string; cityName: string; commissionRate: number }) {
    try {
      await db.update(
        `INSERT INTO city_agents (user_id, city_code, city_name, commission_rate, status, created_at) 
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [body.userId, body.cityCode, body.cityName, body.commissionRate || 10]
      );
      
      // 更新用户角色
      await db.update('UPDATE users SET city_agent_id = ? WHERE id = ?', [body.userId, body.userId]);
      
      return { success: true, message: '代理商创建成功' };
    } catch (error) {
      console.error('创建代理商失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 牛师班管理 ====================

  /**
   * 获取牛师班列表
   */
  @Get('elite-classes')
  @Public()
  async getEliteClasses(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    try {
      const [list] = await db.query(`
        SELECT ec.*, u.nickname as teacher_name, u.avatar as teacher_avatar
        FROM elite_classes ec
        LEFT JOIN users u ON ec.teacher_id = u.id
        ORDER BY ec.created_at DESC
        LIMIT ? OFFSET ?
      `, [pageSizeNum, offset]);
      
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM elite_classes`);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取牛师班列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  // ==================== 资源管理 ====================

  /**
   * 创建资源相关表
   */
  @Post('create-resource-tables')
  @Public()
  async createResourceTables() {
    try {
      // 创建资源分类表
      await db.update(`
        CREATE TABLE IF NOT EXISTS resource_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(50) NOT NULL COMMENT '分类名称',
          icon VARCHAR(255) COMMENT '分类图标',
          sort_order INT DEFAULT 0 COMMENT '排序',
          is_active TINYINT DEFAULT 1 COMMENT '是否启用',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源分类表'
      `);

      // 创建资源表
      await db.update(`
        CREATE TABLE IF NOT EXISTS resources (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL COMMENT '资源标题',
          description TEXT COMMENT '资源描述',
          category_id INT NOT NULL COMMENT '分类ID',
          type VARCHAR(20) DEFAULT 'document' COMMENT '类型: document/video/audio/other',
          author_id INT NOT NULL COMMENT '作者ID',
          file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
          file_name VARCHAR(200) COMMENT '原文件名',
          file_size INT COMMENT '文件大小(字节)',
          file_ext VARCHAR(20) COMMENT '文件扩展名',
          cover_image VARCHAR(500) COMMENT '封面图',
          price DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
          is_free TINYINT DEFAULT 1 COMMENT '是否免费',
          tags JSON COMMENT '标签',
          view_count INT DEFAULT 0 COMMENT '浏览量',
          download_count INT DEFAULT 0 COMMENT '下载量',
          commission_rate DECIMAL(5,4) DEFAULT 0.1000 COMMENT '佣金比例',
          status TINYINT DEFAULT 1 COMMENT '状态: 0待审核 1已发布 2已下架',
          is_active TINYINT DEFAULT 1 COMMENT '是否有效',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category_id),
          INDEX idx_author (author_id),
          INDEX idx_status (status, is_active),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学资源表'
      `);

      // 创建购买记录表
      await db.update(`
        CREATE TABLE IF NOT EXISTS resource_purchases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_no VARCHAR(50) COMMENT '订单号',
          resource_id INT NOT NULL COMMENT '资源ID',
          user_id INT NOT NULL COMMENT '购买者ID',
          price DECIMAL(10,2) DEFAULT 0 COMMENT '原价',
          actual_amount DECIMAL(10,2) DEFAULT 0 COMMENT '实付金额',
          author_income DECIMAL(10,2) DEFAULT 0 COMMENT '作者收益',
          platform_commission DECIMAL(10,2) DEFAULT 0 COMMENT '平台佣金',
          commission_rate DECIMAL(5,4) DEFAULT 0 COMMENT '佣金比例',
          status TINYINT DEFAULT 0 COMMENT '状态: 0待支付 1已支付 2已退款',
          paid_at DATETIME COMMENT '支付时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_resource (resource_id),
          INDEX idx_user (user_id),
          INDEX idx_order_no (order_no),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源购买记录表'
      `);

      // 创建收益记录表
      await db.update(`
        CREATE TABLE IF NOT EXISTS resource_earnings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          resource_id INT NOT NULL COMMENT '资源ID',
          purchase_id INT NOT NULL COMMENT '购买记录ID',
          amount DECIMAL(10,2) DEFAULT 0 COMMENT '收益金额',
          status TINYINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算',
          settled_at DATETIME COMMENT '结算时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源收益记录表'
      `);

      // 创建资源评价表
      await db.update(`
        CREATE TABLE IF NOT EXISTS resource_reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          resource_id INT NOT NULL COMMENT '资源ID',
          user_id INT NOT NULL COMMENT '用户ID',
          rating TINYINT NOT NULL COMMENT '评分1-5',
          content TEXT COMMENT '评价内容',
          status TINYINT DEFAULT 1 COMMENT '状态',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_resource (resource_id),
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源评价表'
      `);

      // 插入默认分类
      await db.update(`
        INSERT IGNORE INTO resource_categories (id, name, icon, sort_order) VALUES
        (1, '课件PPT', 'ppt', 1),
        (2, '教案设计', 'file-text', 2),
        (3, '习题试卷', 'file-question', 3),
        (4, '教学视频', 'video', 4),
        (5, '音频素材', 'audio', 5),
        (6, '图片素材', 'image', 6),
        (7, '教学工具', 'tool', 7),
        (8, '其他资源', 'folder', 8)
      `);

      return { success: true, message: '资源相关表创建成功' };
    } catch (error) {
      console.error('创建资源表失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取资源列表（管理后台）
   */
  @Get('resources')
  @Public()
  async getResources(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    try {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (status !== undefined && status !== '') {
        conditions.push('r.status = ?');
        params.push(parseInt(status));
      }
      if (category) {
        conditions.push('r.category_id = ?');
        params.push(parseInt(category));
      }
      if (keyword) {
        conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      const whereClause = conditions.join(' AND ');

      const [list] = await db.query(`
        SELECT r.*, c.name as category_name, u.nickname as author_name, u.avatar as author_avatar,
          (SELECT COUNT(*) FROM resource_purchases WHERE resource_id = r.id AND status = 1) as sales_count
        FROM resources r
        LEFT JOIN resource_categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.author_id = u.id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM resources r WHERE ${whereClause}
      `, params);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取资源列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 审核资源
   */
  @Post('resources/:id/audit')
  @Public()
  async auditResource(@Param('id') id: string, @Body() body: { status: number; reason?: string }) {
    try {
      await db.update(`
        UPDATE resources SET status = ?, updated_at = NOW() WHERE id = ?
      `, [body.status, parseInt(id)]);
      
      return { success: true, message: '审核成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 删除资源
   */
  @Post('resources/:id/delete')
  @Public()
  async deleteResource(@Param('id') id: string) {
    try {
      await db.update(`
        UPDATE resources SET is_active = 0, updated_at = NOW() WHERE id = ?
      `, [parseInt(id)]);
      
      return { success: true, message: '删除成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取资源分类列表
   */
  @Get('resource-categories')
  @Public()
  async getResourceCategories() {
    try {
      const [list] = await db.query(`
        SELECT * FROM resource_categories ORDER BY sort_order ASC
      `);
      return list;
    } catch (error) {
      return [];
    }
  }

  /**
   * 添加资源分类
   */
  @Post('resource-categories')
  @Public()
  async addResourceCategory(@Body() body: { name: string; icon?: string; sort_order?: number }) {
    try {
      const insertId = await db.insert(`
        INSERT INTO resource_categories (name, icon, sort_order) VALUES (?, ?, ?)
      `, [body.name, body.icon || '', body.sort_order || 0]);
      
      return { success: true, id: insertId };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取资源收益统计
   */
  @Get('resource-earnings')
  @Public()
  async getResourceEarnings(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    try {
      const [list] = await db.query(`
        SELECT re.*, r.title as resource_title, u.nickname as author_name
        FROM resource_earnings re
        LEFT JOIN resources r ON re.resource_id = r.id
        LEFT JOIN users u ON re.user_id = u.id
        ORDER BY re.created_at DESC
        LIMIT ? OFFSET ?
      `, [pageSizeNum, offset]);
      
      const [stats] = await db.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending_earnings,
          COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled_earnings,
          COUNT(*) as total_count
        FROM resource_earnings
      `);
      
      const [countResult] = await db.query(`SELECT COUNT(*) as total FROM resource_earnings`);
      
      return { 
        list, 
        total: countResult[0]?.total || 0, 
        page: pageNum, 
        pageSize: pageSizeNum,
        stats: stats[0] || { total_earnings: 0, pending_earnings: 0, settled_earnings: 0, total_count: 0 }
      };
    } catch (error) {
      console.error('获取资源收益失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum, stats: {} };
    }
  }

  /**
   * 结算收益
   */
  @Post('resource-earnings/:id/settle')
  @Public()
  async settleEarning(@Param('id') id: string) {
    try {
      await db.update(`
        UPDATE resource_earnings SET status = 1, settled_at = NOW() WHERE id = ? AND status = 0
      `, [parseInt(id)]);
      
      return { success: true, message: '结算成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 批量结算收益
   */
  @Post('resource-earnings/batch-settle')
  @Public()
  async batchSettleEarnings(@Body() body: { userId?: number }) {
    try {
      const conditions: string[] = ['status = 0'];
      const params: any[] = [];
      
      if (body.userId) {
        conditions.push('user_id = ?');
        params.push(body.userId);
      }
      
      const whereClause = conditions.join(' AND ');
      
      const affectedRows = await db.update(`
        UPDATE resource_earnings SET status = 1, settled_at = NOW() WHERE ${whereClause}
      `, params);
      
      return { success: true, message: `已结算 ${affectedRows} 条记录` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取/设置平台佣金比例
   */
  @Get('resource-commission-rate')
  @Public()
  async getCommissionRate() {
    try {
      const [configs] = await db.query(`
        SELECT config_value FROM system_configs WHERE config_key = 'resource_commission_rate'
      `);
      
      return { 
        rate: configs.length > 0 ? parseFloat(configs[0].config_value) : 0.1,
        defaultRate: 0.1
      };
    } catch (error) {
      return { rate: 0.1, defaultRate: 0.1 };
    }
  }

  /**
   * 设置平台佣金比例
   */
  @Post('resource-commission-rate')
  @Public()
  async setCommissionRate(@Body() body: { rate: number }) {
    try {
      const rate = Math.max(0, Math.min(1, body.rate)); // 限制在 0-1 之间
      
      // 检查是否存在
      const [existing] = await db.query(`
        SELECT id FROM system_configs WHERE config_key = 'resource_commission_rate'
      `);
      
      if (existing.length > 0) {
        await db.update(`
          UPDATE system_configs SET config_value = ?, updated_at = NOW() 
          WHERE config_key = 'resource_commission_rate'
        `, [rate.toString()]);
      } else {
        await db.update(`
          INSERT INTO system_configs (config_key, config_value, description, created_at)
          VALUES ('resource_commission_rate', ?, '资源销售平台佣金比例', NOW())
        `, [rate.toString()]);
      }
      
      return { success: true, message: '佣金比例设置成功', rate };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取分销比例配置
   */
  @Get('distribution-configs')
  @Public()
  async getDistributionConfigs() {
    try {
      const [configs] = await db.query(`
        SELECT config_key, config_value, description FROM distribution_configs
      `);
      
      const result: Record<string, any> = {
        level1_member_rate: 0.2,
        level2_member_rate: 0.1,
        level1_order_rate: 0.05,
        level2_order_rate: 0.03,
        level1_activity_rate: 0.05,
        level2_activity_rate: 0.03,
        level1_resource_rate: 0.1,
        level2_resource_rate: 0.05,
      };
      
      (configs as any[]).forEach((c: any) => {
        result[c.config_key] = parseFloat(c.config_value);
      });
      
      return result;
    } catch (error) {
      return {
        level1_member_rate: 0.2,
        level2_member_rate: 0.1,
        level1_order_rate: 0.05,
        level2_order_rate: 0.03,
        level1_activity_rate: 0.05,
        level2_activity_rate: 0.03,
        level1_resource_rate: 0.1,
        level2_resource_rate: 0.05,
      };
    }
  }

  /**
   * 设置分销比例配置
   */
  @Post('distribution-configs')
  @Public()
  async setDistributionConfigs(@Body() body: Record<string, number>) {
    try {
      const allowedKeys = [
        'level1_member_rate', 'level2_member_rate',
        'level1_order_rate', 'level2_order_rate',
        'level1_activity_rate', 'level2_activity_rate',
        'level1_resource_rate', 'level2_resource_rate',
      ];
      
      for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.includes(key)) {
          const rate = Math.max(0, Math.min(0.5, value)); // 限制在 0-50% 之间
          
          await db.update(`
            INSERT INTO distribution_configs (config_key, config_value, description, created_at, updated_at)
            VALUES (?, ?, '', NOW(), NOW())
            ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()
          `, [key, rate.toString(), rate.toString()]);
        }
      }
      
      return { success: true, message: '分销比例设置成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取分销统计
   */
  @Get('distribution-stats')
  @Public()
  async getDistributionStats() {
    try {
      // 统计邀请关系
      const [level1Count] = await db.query(`
        SELECT COUNT(*) as count FROM users WHERE inviter_id IS NOT NULL
      `);
      const [level2Count] = await db.query(`
        SELECT COUNT(*) as count FROM users WHERE inviter_2nd_id IS NOT NULL
      `);
      
      // 统计佣金
      const [commissionStats] = await db.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total,
          COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled,
          COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn
        FROM commissions
      `);
      
      // 统计提现
      const [withdrawStats] = await db.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total,
          COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as approved
        FROM withdraw_records
      `);
      
      return {
        invites: {
          level1: level1Count[0]?.count || 0,
          level2: level2Count[0]?.count || 0,
        },
        commissions: {
          total: parseFloat(commissionStats[0]?.total || 0),
          pending: parseFloat(commissionStats[0]?.pending || 0),
          settled: parseFloat(commissionStats[0]?.settled || 0),
          withdrawn: parseFloat(commissionStats[0]?.withdrawn || 0),
        },
        withdraws: {
          total: parseFloat(withdrawStats[0]?.total || 0),
          pending: parseFloat(withdrawStats[0]?.pending || 0),
          approved: parseFloat(withdrawStats[0]?.approved || 0),
        },
      };
    } catch (error) {
      return {
        invites: { level1: 0, level2: 0 },
        commissions: { total: 0, pending: 0, settled: 0, withdrawn: 0 },
        withdraws: { total: 0, pending: 0, approved: 0 },
      };
    }
  }

  // ==================== 财务流水管理 ====================

  /**
   * 创建财务流水表
   */
  @Public()
  @Post('create-finance-records-table')
  async createFinanceRecordsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS finance_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          type TINYINT NOT NULL COMMENT '类型: 1=收入 2=支出 3=退款 4=提现',
          amount DECIMAL(10,2) NOT NULL COMMENT '金额',
          balance_before DECIMAL(10,2) DEFAULT 0 COMMENT '变动前余额',
          balance_after DECIMAL(10,2) DEFAULT 0 COMMENT '变动后余额',
          source_type VARCHAR(50) COMMENT '来源类型: order/membership/withdraw/refund',
          source_id INT COMMENT '关联ID',
          description VARCHAR(255) COMMENT '描述',
          status TINYINT DEFAULT 1 COMMENT '状态: 0=失败 1=成功',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_type (type),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='财务流水表'
      `);
      
      return { success: true, message: 'finance_records表创建成功' };
    } catch (error) {
      console.error('创建财务流水表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取财务流水列表
   */
  @Get('finance-records')
  @Public()
  async getFinanceRecords(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('type') type = '',
    @Query('userId') userId = '',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (type) {
      conditions.push('fr.type = ?');
      params.push(parseInt(type));
    }
    if (userId) {
      conditions.push('fr.user_id = ?');
      params.push(parseInt(userId));
    }
    
    const whereClause = conditions.join(' AND ');
    
    try {
      const [list] = await db.query(`
        SELECT fr.*, u.nickname, u.mobile, u.avatar
        FROM finance_records fr
        LEFT JOIN users u ON fr.user_id = u.id
        WHERE ${whereClause}
        ORDER BY fr.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM finance_records fr WHERE ${whereClause}
      `, params);
      
      // 统计总收入支出
      const [stats] = await db.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as total_expense,
          COALESCE(SUM(CASE WHEN type = 3 THEN amount ELSE 0 END), 0) as total_refund,
          COALESCE(SUM(CASE WHEN type = 4 THEN amount ELSE 0 END), 0) as total_withdraw
        FROM finance_records
      `);
      
      return { 
        list, 
        total: countResult[0]?.total || 0, 
        page: pageNum, 
        pageSize: pageSizeNum,
        stats: stats[0] || { total_income: 0, total_expense: 0, total_refund: 0, total_withdraw: 0 }
      };
    } catch (error) {
      console.error('获取财务流水失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum, stats: {} };
    }
  }

  // ==================== 会员使用记录 ====================

  /**
   * 创建会员使用记录表
   */
  @Public()
  @Post('create-member-usage-table')
  async createMemberUsageTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS member_usage_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          type VARCHAR(50) NOT NULL COMMENT '使用类型: view_contact, send_message等',
          target_id INT DEFAULT NULL COMMENT '目标ID',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_created (user_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员使用记录表'
      `);
      
      return { success: true, message: 'member_usage_log表创建成功' };
    } catch (error) {
      console.error('创建member_usage_log表失败:', error);
      return { success: false, message: '创建失败' };
    }
  }

  // ==================== 退费管理 ====================

  /**
   * 创建退费记录表
   */
  @Public()
  @Post('create-refund-records-table')
  async createRefundRecordsTable() {
    try {
      await db.update(`
        CREATE TABLE IF NOT EXISTS refund_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL COMMENT '用户ID',
          order_id INT COMMENT '关联订单ID',
          payment_id INT COMMENT '关联支付ID',
          amount DECIMAL(10,2) NOT NULL COMMENT '退款金额',
          reason VARCHAR(500) COMMENT '退款原因',
          status TINYINT DEFAULT 0 COMMENT '状态: 0=待处理 1=已同意 2=已拒绝 3=已退款',
          reject_reason VARCHAR(255) COMMENT '拒绝原因',
          processed_by INT COMMENT '处理人ID',
          processed_at TIMESTAMP NULL COMMENT '处理时间',
          refunded_at TIMESTAMP NULL COMMENT '退款时间',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_order (order_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录表'
      `);
      
      return { success: true, message: 'refund_records表创建成功' };
    } catch (error) {
      console.error('创建退费记录表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取退费申请列表
   */
  @Get('refunds')
  @Public()
  async getRefunds(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status = '',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (status) {
      conditions.push('rr.status = ?');
      params.push(parseInt(status));
    }
    
    const whereClause = conditions.join(' AND ');
    
    try {
      const [list] = await db.query(`
        SELECT rr.*, u.nickname, u.mobile, u.avatar
        FROM refund_records rr
        LEFT JOIN users u ON rr.user_id = u.id
        WHERE ${whereClause}
        ORDER BY rr.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM refund_records rr WHERE ${whereClause}
      `, params);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取退费列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 审核退费申请
   */
  @Post('refunds/:id/audit')
  @Public()
  async auditRefund(
    @Param('id') id: string,
    @Body() body: { status: number; reject_reason?: string }
  ) {
    try {
      const refundId = parseInt(id);
      
      await db.update(
        `UPDATE refund_records SET status = ?, reject_reason = ?, processed_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [body.status, body.reject_reason || null, refundId]
      );
      
      // 如果同意退款，更新支付状态
      if (body.status === 1) {
        const [refunds] = await db.query('SELECT * FROM refund_records WHERE id = ?', [refundId]);
        const refund = (refunds as any[])[0];
        
        if (refund && refund.payment_id) {
          await db.update('UPDATE payments SET status = 3, refunded_at = NOW() WHERE id = ?', [refund.payment_id]);
        }
        
        // 记录财务流水
        if (refund) {
          await db.update(
            `INSERT INTO finance_records (user_id, type, amount, source_type, source_id, description, status, created_at)
             VALUES (?, 3, ?, 'refund', ?, '退款申请通过', 1, NOW())`,
            [refund.user_id, refund.amount, refundId]
          );
        }
      }
      
      return { success: true, message: '审核成功' };
    } catch (error) {
      console.error('审核退费失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== 商品管理 ====================

  /**
   * 获取商品列表
   */
  @Get('products')
  @Public()
  async getProducts(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('status') status = '',
  ) {
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (status) {
      conditions.push('p.status = ?');
      params.push(parseInt(status));
    }
    
    const whereClause = conditions.join(' AND ');
    
    try {
      const [list] = await db.query(`
        SELECT p.*, pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM products p WHERE ${whereClause}
      `, params);
      
      return { list, total: countResult[0]?.total || 0, page: pageNum, pageSize: pageSizeNum };
    } catch (error) {
      console.error('获取商品列表失败:', error);
      return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
    }
  }

  /**
   * 创建商品
   */
  @Post('products')
  @Public()
  async createProduct(@Body() body: {
    name: string;
    category_id?: number;
    description?: string;
    price: number;
    original_price?: number;
    image?: string;
    stock?: number;
    type?: number;
    delivery_type?: number;
  }) {
    try {
      const insertId = await db.insert(
        `INSERT INTO products (name, category_id, description, price, original_price, image, stock, type, delivery_type, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [body.name, body.category_id || null, body.description || '', body.price, body.original_price || body.price, body.image || '', body.stock || -1, body.type || 1, body.delivery_type || 1]
      );
      
      return { success: true, id: insertId };
    } catch (error) {
      console.error('创建商品失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新商品
   */
  @Put('products/:id')
  @Public()
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (body.name) { updates.push('name = ?'); params.push(body.name); }
      if (body.price !== undefined) { updates.push('price = ?'); params.push(body.price); }
      if (body.stock !== undefined) { updates.push('stock = ?'); params.push(body.stock); }
      if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
      
      if (updates.length === 0) return { success: true };
      
      updates.push('updated_at = NOW()');
      params.push(parseInt(id));
      
      await db.update(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除商品
   */
  @Delete('products/:id')
  @Public()
  async deleteProduct(@Param('id') id: string) {
    try {
      await db.update('UPDATE products SET status = 0, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
