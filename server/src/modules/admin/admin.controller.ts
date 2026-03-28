import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';
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
    // 获取各类统计数据
    const [users] = await db.query('SELECT COUNT(*) as count FROM user WHERE status = 1');
    const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher WHERE verify_status = 1');
    const [orgs] = await db.query('SELECT COUNT(*) as count FROM organization WHERE verify_status = 1');
    const [orders] = await db.query('SELECT COUNT(*) as count FROM `order` WHERE status = 1');
    const [members] = await db.query('SELECT COUNT(*) as count FROM user WHERE member_expire_time > NOW()');
    const [revenue] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM `order` WHERE status = 1');

    return {
      totalUsers: users[0]?.count || 0,
      totalTeachers: teachers[0]?.count || 0,
      totalOrgs: orgs[0]?.count || 0,
      totalOrders: orders[0]?.count || 0,
      totalMembers: members[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
    };
  }

  /**
   * 获取管理员列表
   */
  @Get('admins')
  @RequirePermission('admin:view')
  async getAdmins() {
    const [admins] = await db.query(`
      SELECT 
        au.id, au.username, au.real_name, au.email, au.phone, 
        au.role_id, au.status, au.last_login_time, au.login_count, au.created_at,
        ar.role_name
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.status != -1
      ORDER BY au.id ASC
    `);

    return admins;
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
       SET real_name = ?, email = ?, phone = ?, role_id = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [body.realName, body.email, body.phone, body.roleId, body.status, parseInt(id)]
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
  async resetAdminPassword(@Param('id') id: string) {
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await db.update(
      'UPDATE admin_user SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, parseInt(id)]
    );

    return { success: true, password: defaultPassword };
  }

  /**
   * 获取角色列表
   */
  @Get('roles')
  @RequirePermission('role:view')
  async getRoles() {
    const [roles] = await db.query(`
      SELECT 
        ar.id, ar.role_name, ar.role_code, ar.description, ar.created_at,
        (SELECT COUNT(*) FROM admin_user WHERE role_id = ar.id AND status = 1) as user_count,
        JSON_LENGTH(ar.permissions) as permission_count
      FROM admin_role ar
      WHERE ar.status = 1
      ORDER BY ar.id ASC
    `);

    return roles.map(role => ({
      ...role,
      permissionCount: role.permission_count || 0,
      userCount: role.user_count || 0
    }));
  }

  /**
   * 获取权限列表
   */
  @Get('permissions')
  @RequirePermission('role:view')
  async getPermissions() {
    const [permissions] = await db.query(`
      SELECT id, permission_name, permission_code, module, description
      FROM admin_permission
      WHERE status = 1
      ORDER BY module ASC, id ASC
    `);

    // 按模块分组
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    });

    return grouped;
  }

  /**
   * 更新角色权限
   */
  @Put('roles/:id/permissions')
  @RequirePermission('role:edit')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: { permissions: string[] }
  ) {
    await db.update(
      'UPDATE admin_role SET permissions = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(body.permissions), parseInt(id)]
    );

    return { success: true };
  }

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
      whereClause += ' AND (nickname LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const [list] = await db.query(
      `SELECT id, openid, nickname, phone, avatar, role, member_expire_time, created_at, status
       FROM user ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSizeNum, offset]
    );
    
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM user ${whereClause}`, params);

    return {
      list,
      total: countResult[0]?.total || 0,
      page: pageNum,
      pageSize: pageSizeNum
    };
  }

  /**
   * 获取教师列表
   */
  @Get('teachers')
  @RequirePermission('teacher:view')
  async getTeachers(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND verify_status = ?';
      params.push(status);
    }

    const [teachers] = await db.query(`
      SELECT 
        t.id, t.user_id, t.name, t.phone, t.subjects, t.introduction,
        t.verify_status, t.rating, t.created_at,
        u.nickname, u.avatar
      FROM teacher t
      LEFT JOIN user u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.id DESC
    `, params);

    return teachers;
  }

  /**
   * 获取机构列表
   */
  @Get('orgs')
  @RequirePermission('org:view')
  async getOrgs(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND verify_status = ?';
      params.push(status);
    }

    const [orgs] = await db.query(`
      SELECT 
        o.id, o.user_id, o.name, o.contact_person, o.contact_phone,
        o.address, o.verify_status, o.created_at,
        u.nickname, u.avatar
      FROM organization o
      LEFT JOIN user u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.id DESC
    `, params);

    return orgs;
  }

  /**
   * 获取订单列表
   */
  @Get('orders')
  @RequirePermission('order:view')
  async getOrders(@Query('status') status = '') {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [orders] = await db.query(`
      SELECT 
        o.id, o.order_no, o.user_id, o.order_type, o.amount,
        o.status, o.created_at,
        u.nickname as user_name
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.id DESC
    `, params);

    return orders;
  }

  /**
   * 获取系统配置
   */
  @Get('config')
  @RequirePermission('config:view')
  async getConfig() {
    const [configs] = await db.query(
      'SELECT config_key, config_value FROM site_config WHERE status = 1'
    );

    const configMap = {};
    configs.forEach(c => {
      configMap[c.config_key] = c.config_value;
    });

    return configMap;
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
}
