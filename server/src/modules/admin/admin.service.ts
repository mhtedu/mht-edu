import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class AdminService {
  private supabase = getSupabaseClient();

  /**
   * 获取统计数据
   */
  async getStats() {
    // 获取用户统计
    const { count: totalUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalTeachers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 1);

    const { count: totalParents } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 0);

    const { count: totalOrgs } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 2);

    const { count: totalAgents } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 3);

    // 获取订单统计
    const { count: totalOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { count: pendingOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 0);

    const { count: completedOrders } = await this.supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 4);

    // 获取营收统计
    const { data: revenueData } = await this.supabase
      .from('transactions')
      .select('amount')
      .eq('status', 1);

    const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalParents: totalParents || 0,
      totalOrgs: totalOrgs || 0,
      totalAgents: totalAgents || 0,
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      totalRevenue,
      monthRevenue: Math.floor(totalRevenue * 0.3), // 模拟本月营收
    };
  }

  /**
   * 获取订单列表
   */
  async getOrders(page: number, pageSize: number, status?: number) {
    let query = this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status !== undefined) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('获取订单失败:', error);
      return [];
    }
    return data || [];
  }

  /**
   * 获取用户列表
   */
  async getUsers(page: number, pageSize: number, role?: number) {
    let query = this.supabase
      .from('users')
      .select('id, nickname, avatar, role, mobile, membership_expire_at, created_at')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (role !== undefined) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) {
      console.error('获取用户失败:', error);
      return [];
    }

    return (data || []).map(user => ({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      phone: user.mobile ? `${user.mobile.slice(0, 3)}****${user.mobile.slice(-4)}` : '',
      isMember: user.membership_expire_at ? new Date(user.membership_expire_at) > new Date() : false,
      memberExpire: user.membership_expire_at || '',
      createdAt: user.created_at?.split('T')[0] || '',
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
    // TODO: 从数据库获取广告位
    return [
      { id: 1, title: '欢迎来到棉花糖教育', imageUrl: '', linkUrl: '', sort: 1, isActive: true },
      { id: 2, title: '开通会员享更多权益', imageUrl: '', linkUrl: '/pages/membership/index', sort: 2, isActive: true },
      { id: 3, title: '邀请好友赚佣金', imageUrl: '', linkUrl: '/pages/distribution/index', sort: 3, isActive: true },
    ];
  }
}
