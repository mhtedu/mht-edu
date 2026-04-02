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

  // ==================== 用户管理 ====================

  /**
   * 获取用户列表
   */
  @Get('users')
  @RequirePermission('user:view')
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
  @RequirePermission('teacher:view')
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
  @RequirePermission('org:view')
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
          o.id, o.user_id, o.name, o.contact_person, o.contact_phone,
          o.address, o.description, o.verify_status, o.created_at,
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
  @RequirePermission('order:view')
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
   * 获取系统配置
   */
  @Get('config')
  @RequirePermission('config:view')
  async getConfig() {
    try {
      const [configs] = await db.query(
        'SELECT config_key, config_value FROM site_config WHERE status = 1'
      );

      const configMap = {};
      configs.forEach(c => {
        configMap[c.config_key] = c.config_value;
      });

      return configMap;
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {};
    }
  }

  /**
   * 更新系统配置
   */
  @Post('config')
  @RequirePermission('config:edit')
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
   * 清理重复的广告数据
   */
  @Public()
  @Post('clean-ads')
  async cleanAds() {
    try {
      // 删除所有广告
      await db.update(`DELETE FROM ad_positions`);
      
      // 重新插入4条广告
      await db.update(`
        INSERT INTO ad_positions (position_key, title, image_url, link_url, sort_order, is_active) VALUES
        ('home_top', '新人专享福利', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', '/pages/member/index', 1, 1),
        ('home_top', '会员日特惠', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', '/pages/membership/index', 2, 1),
        ('home_top', '名师一对一定制课程', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=400&fit=crop', '/pages/teacher/list', 3, 1),
        ('home_top', '暑期集训营火热报名', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=400&fit=crop', '/pages/activities/index', 4, 1)
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
   */
  @Public()
  @Post('init-messages')
  async initMessages() {
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

      // 插入消息提醒数据
      await db.update(`
        INSERT INTO message_reminders (user_id, from_user_id, type, target_id, content, is_read, created_at) VALUES
        (401, 100, 1, 6, '张老师接受了您的订单，请查看详情', 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
        (401, 100, 3, 1, '张老师回复了您的消息', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
        (501, 100, 1, 9, '张老师接受了您的订单', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
        (402, 101, 3, 3, '王老师回复了您的消息', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
        (100, 401, 1, 6, '您收到新的订单抢单请求', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (100, 501, 1, 9, '您收到新的订单抢单请求', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (401, 0, 4, NULL, '系统将于今晚进行维护，请提前保存重要信息', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
        (403, 103, 2, 8, '请对李老师的试课进行评价', 1, DATE_SUB(NOW(), INTERVAL 4 DAY))
      `);

      return { success: true, message: '消息演示数据初始化成功' };
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
}
