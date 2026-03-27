import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { 
  query, 
  queryOne, 
  insert, 
  update, 
  closePool 
} from '@/storage/database/mysql-client';
import { RowDataPacket } from 'mysql2/promise';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    console.log('AdminService initialized with MySQL connection');
  }

  async onModuleDestroy() {
    await closePool();
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    // 获取用户统计
    const [totalUsersRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    );
    
    const [totalTeachersRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE role = 1 AND deleted_at IS NULL'
    );
    
    const [totalParentsRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE role = 0 AND deleted_at IS NULL'
    );
    
    const [totalOrgsRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE role = 2 AND deleted_at IS NULL'
    );
    
    const [totalAgentsRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE role = 3 AND deleted_at IS NULL'
    );

    // 获取订单统计
    const [totalOrdersRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE deleted_at IS NULL'
    );
    
    const [pendingOrdersRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = 0 AND deleted_at IS NULL'
    );
    
    const [completedOrdersRows] = await query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE status = 4 AND deleted_at IS NULL'
    );

    // 获取营收统计
    const [revenueRows] = await query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 1'
    );

    const [monthRevenueRows] = await query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE status = 1 AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
    );

    return {
      totalUsers: totalUsersRows?.[0]?.count || 0,
      totalTeachers: totalTeachersRows?.[0]?.count || 0,
      totalParents: totalParentsRows?.[0]?.count || 0,
      totalOrgs: totalOrgsRows?.[0]?.count || 0,
      totalAgents: totalAgentsRows?.[0]?.count || 0,
      totalOrders: totalOrdersRows?.[0]?.count || 0,
      pendingOrders: pendingOrdersRows?.[0]?.count || 0,
      completedOrders: completedOrdersRows?.[0]?.count || 0,
      totalRevenue: Number(revenueRows?.[0]?.total || 0),
      monthRevenue: Number(monthRevenueRows?.[0]?.total || 0),
    };
  }

  /**
   * 获取订单列表
   */
  async getOrders(page: number, pageSize: number, status?: number) {
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT * FROM orders WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (status !== undefined) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [rows] = await query<RowDataPacket[]>(sql, params);
    return rows;
  }

  /**
   * 获取用户列表
   */
  async getUsers(page: number, pageSize: number, role?: number) {
    const offset = (page - 1) * pageSize;
    let sql = `SELECT id, nickname, avatar, role, mobile, membership_expire_at, created_at 
               FROM users WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (role !== undefined) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [rows] = await query<RowDataPacket[]>(sql, params);

    return rows.map((user: any) => ({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      phone: user.mobile ? `${user.mobile.slice(0, 3)}****${user.mobile.slice(-4)}` : '',
      isMember: user.membership_expire_at ? new Date(user.membership_expire_at) > new Date() : false,
      memberExpire: user.membership_expire_at || '',
      createdAt: user.created_at?.toISOString?.()?.split('T')[0] || '',
    }));
  }

  /**
   * 获取教师列表
   */
  async getTeachers(page: number, pageSize: number) {
    return this.getUsers(page, pageSize, 1);
  }

  /**
   * 获取机构列表
   */
  async getOrgs(page: number, pageSize: number) {
    return this.getUsers(page, pageSize, 2);
  }

  /**
   * 获取代理商列表
   */
  async getAgents(page: number, pageSize: number) {
    return this.getUsers(page, pageSize, 3);
  }

  /**
   * 获取广告位列表
   */
  async getBanners() {
    const [rows] = await query<RowDataPacket[]>(
      'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort ASC'
    );
    
    return rows.map((banner: any) => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.image_url,
      linkUrl: banner.link_url,
      sort: banner.sort,
      isActive: banner.is_active,
    }));
  }
}
