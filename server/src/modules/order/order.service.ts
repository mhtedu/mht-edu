import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class OrderService {
  /**
   * 计算两点之间的距离（米）
   * 使用 Haversine 公式
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async createOrder(orderData: {
    parent_id: number;
    subject: string;
    hourly_rate: string;
    student_gender?: number;
    student_grade?: string;
    address: string;
    latitude: string;
    longitude: string;
    description?: string;
  }) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .insert({
        ...orderData,
        status: 0, // 待抢单
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`创建订单失败: ${error.message}`);
    return data;
  }

  async getParentOrders(parentId: number, page: number = 1, pageSize: number = 20) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        users!orders_parent_id_fkey (id, nickname, avatar)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw new Error(`查询订单列表失败: ${error.message}`);
    return data;
  }

  async getTeacherOrders(params: {
    latitude: string;
    longitude: string;
    maxDistance?: number;
    subject?: string;
    page?: number;
    pageSize?: number;
  }) {
    const client = getSupabaseClient();
    const { page = 1, pageSize = 20, maxDistance = 50000 } = params;
    const teacherLat = parseFloat(params.latitude);
    const teacherLng = parseFloat(params.longitude);

    // 获取所有待抢单的订单
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('status', 0) // 待抢单
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询可抢订单失败: ${error.message}`);

    // 计算距离并过滤
    const ordersWithDistance = (data || [])
      .map(order => {
        const orderLat = parseFloat(order.latitude);
        const orderLng = parseFloat(order.longitude);
        const distance = this.calculateDistance(teacherLat, teacherLng, orderLat, orderLng);
        return {
          ...order,
          distance,
          distance_text: this.formatDistance(distance),
        };
      })
      .filter(order => order.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice((page - 1) * pageSize, page * pageSize);

    return ordersWithDistance;
  }

  /**
   * 格式化距离显示
   */
  private formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
  }

  async getOrderById(id: number) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        users!orders_parent_id_fkey (id, nickname, avatar, mobile)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`查询订单详情失败: ${error.message}`);
    return data;
  }

  async grabOrder(orderId: number, teacherId: number) {
    const client = getSupabaseClient();

    // 检查订单状态
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== 0) {
      throw new Error('订单已被抢或已关闭');
    }

    // 创建匹配记录
    const { error: matchError } = await client
      .from('order_matches')
      .insert({
        order_id: orderId,
        teacher_id: teacherId,
        status: 0, // 匹配中
        created_at: new Date().toISOString(),
      });

    if (matchError) throw new Error(`创建匹配记录失败: ${matchError.message}`);

    // 更新订单状态
    const { data, error } = await client
      .from('orders')
      .update({
        status: 1, // 已匹配沟通中
        matched_teacher_id: teacherId,
        matched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(`抢单失败: ${error.message}`);
    return data;
  }

  async unbindOrder(orderId: number) {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('orders')
      .update({
        status: 5, // 已解除
        matched_teacher_id: null,
        matched_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(`解除订单失败: ${error.message}`);
    return data;
  }

  async getContactInfo(orderId: number, userId: number) {
    const client = getSupabaseClient();
    
    // 获取订单信息
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查是否已解锁
    const { data: matchData, error: matchError } = await client
      .from('order_matches')
      .select('*')
      .eq('order_id', orderId)
      .eq('contact_unlocked', 1)
      .maybeSingle();

    if (matchError) throw new Error(`查询解锁记录失败: ${matchError.message}`);

    if (!matchData) {
      // 解锁联系方式
      await client
        .from('order_matches')
        .update({
          contact_unlocked: 1,
          unlocked_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      // 记录查看日志
      await client
        .from('contact_view_logs')
        .insert({
          order_id: orderId,
          user_id: userId,
          target_user_id: order.parent_id,
          created_at: new Date().toISOString(),
        });
    }

    // 返回家长联系方式
    const { data: parentData, error: parentError } = await client
      .from('users')
      .select('id, nickname, avatar, mobile')
      .eq('id', order.parent_id)
      .maybeSingle();

    if (parentError) throw new Error(`查询联系方式失败: ${parentError.message}`);
    return parentData;
  }
}
