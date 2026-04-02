import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';
import { MessageService } from '../message/message.service';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class OrderService {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 创建订单
   */
  async createOrder(userId: number, data: any) {
    // 生成订单号
    const orderNo = this.generateOrderNo();

    const result = await executeQuery(`
      INSERT INTO orders (
        order_no, parent_id, subject, hourly_rate, student_grade, student_gender,
        address, latitude, longitude, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      orderNo,
      userId,
      data.subject,
      data.budget || data.hourly_rate || 0,
      data.grade || data.student_grade || '',
      data.student_gender || 0,
      data.address,
      data.latitude,
      data.longitude,
      data.requirement || data.description || '',
    ]);

    return {
      success: true,
      order_id: (result as any).insertId,
      order_no: orderNo,
    };
  }

  /**
   * 获取家长的订单列表
   */
  async getOrdersByParent(
    parentId: number,
    page: number,
    pageSize: number,
    status?: number,
  ) {
    const offset = (page - 1) * pageSize;
    const conditions = ['o.parent_id = ?'];
    const params: any[] = [parentId];

    if (status !== undefined) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    const orders = await executeQuery(`
      SELECT 
        o.*,
        u.nickname as teacher_nickname, u.avatar as teacher_avatar,
        tp.real_name as teacher_name, tp.subjects as teacher_subjects
      FROM orders o
      LEFT JOIN users u ON o.matched_teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON o.matched_teacher_id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM orders o WHERE ${conditions.join(' AND ')}
    `, params);

    // 获取每个订单的抢单数量
    for (const order of orders as any[]) {
      const matchCount = await executeQuery(`
        SELECT COUNT(*) as count FROM order_matches WHERE order_id = ?
      `, [order.id]);
      order.match_count = matchCount[0]?.count || 0;
    }

    return {
      list: orders,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: number, userId: number) {
    const orders = await executeQuery(`
      SELECT o.*, 
        u.nickname as parent_nickname, u.avatar as parent_avatar, u.mobile as parent_mobile,
        t.nickname as teacher_nickname, t.avatar as teacher_avatar, 
        tp.real_name as teacher_name, tp.subjects, tp.education, tp.teaching_years
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      LEFT JOIN users t ON o.matched_teacher_id = t.id
      LEFT JOIN teacher_profiles tp ON o.matched_teacher_id = tp.user_id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    // 检查权限
    const isParent = order.parent_id === userId;
    const isTeacher = order.matched_teacher_id === userId;

    // 联系方式权限控制
    if (!isParent && !isTeacher) {
      order.contact_hidden = true;
      delete order.contact_phone;
      delete order.parent_mobile;
    }

    // 非家长隐藏家长联系方式
    if (!isParent) {
      delete order.parent_mobile;
    }

    // 获取抢单列表
    const matches = await executeQuery(`
      SELECT om.*, 
        u.nickname, u.avatar,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years
      FROM order_matches om
      LEFT JOIN users u ON om.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON om.teacher_id = tp.user_id
      WHERE om.order_id = ?
      ORDER BY om.created_at DESC
    `, [orderId]);

    order.matches = matches;

    return order;
  }

  /**
   * 获取订单抢单列表
   */
  async getOrderMatches(orderId: number, userId: number) {
    // 验证权限
    const orders = await executeQuery(`
      SELECT parent_id FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    if ((orders[0] as any).parent_id !== userId) {
      throw new Error('无权限查看');
    }

    const matches = await executeQuery(`
      SELECT om.*, 
        u.nickname, u.avatar,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years, tp.hourly_rate
      FROM order_matches om
      LEFT JOIN users u ON om.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON om.teacher_id = tp.user_id
      WHERE om.order_id = ?
      ORDER BY om.created_at DESC
    `, [orderId]);

    return matches;
  }

  /**
   * 选择教师（匹配）
   */
  async selectTeacher(orderId: number, userId: number, teacherId: number) {
    // 验证权限
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;
    if (order.parent_id !== userId) {
      throw new Error('无权限操作');
    }

    if (order.status !== 0) {
      throw new Error('订单状态不允许选择教师');
    }

    // 检查教师是否抢单
    const matches = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [orderId, teacherId]);

    if (matches.length === 0) {
      throw new Error('该教师未抢单');
    }

    // 更新抢单记录状态
    await executeQuery(`
      UPDATE order_matches SET status = 1 WHERE order_id = ? AND teacher_id = ?
    `, [orderId, teacherId]);

    // 拒绝其他教师
    await executeQuery(`
      UPDATE order_matches SET status = 2 WHERE order_id = ? AND teacher_id != ?
    `, [orderId, teacherId]);

    // 更新订单状态
    await executeQuery(`
      UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
      WHERE id = ?
    `, [teacherId, orderId]);

    // 发送消息提醒
    await this.messageService.sendSystemMessage(
      teacherId,
      `恭喜！您已成功匹配订单 #${order.order_no}，家长将在24小时内联系您。`,
    );

    return { success: true };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId: number, userId: number, status: number) {
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    // 验证权限
    if (order.parent_id !== userId && order.matched_teacher_id !== userId) {
      throw new Error('无权限操作');
    }

    // 状态流转检查
    const validTransitions: Record<number, number[]> = {
      0: [1],
      1: [2, 5],
      2: [3, 5],
      3: [4, 5],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new Error('状态流转不合法');
    }

    await executeQuery(`
      UPDATE orders SET status = ? WHERE id = ?
    `, [status, orderId]);

    return { success: true };
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    if (order.parent_id !== userId) {
      throw new Error('无权限操作');
    }

    if (order.status > 1) {
      throw new Error('订单已进入试课阶段，无法取消');
    }

    await executeQuery(`
      UPDATE orders SET status = 5, cancel_reason = ? WHERE id = ?
    `, [reason || '', orderId]);

    // 通知已抢单教师
    const matches = await executeQuery(`
      SELECT teacher_id FROM order_matches WHERE order_id = ?
    `, [orderId]);

    for (const match of matches as any[]) {
      await this.messageService.sendSystemMessage(
        match.teacher_id,
        `订单 #${order.order_no} 已被家长取消。`,
      );
    }

    return { success: true };
  }

  /**
   * 评价订单
   */
  async createReview(orderId: number, userId: number, rating: number, content: string) {
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    if (order.parent_id !== userId) {
      throw new Error('无权限评价');
    }

    if (order.status !== 4) {
      throw new Error('订单未完成，无法评价');
    }

    // 检查是否已评价
    const existing = await executeQuery(`
      SELECT id FROM reviews WHERE order_id = ?
    `, [orderId]);

    if (existing.length > 0) {
      throw new Error('已评价过');
    }

    // 创建评价
    await executeQuery(`
      INSERT INTO reviews (order_id, parent_id, teacher_id, rating, content)
      VALUES (?, ?, ?, ?, ?)
    `, [orderId, userId, order.matched_teacher_id, rating, content]);

    // 更新教师评分
    const avgRating = await executeQuery(`
      SELECT AVG(rating) as avg FROM reviews WHERE teacher_id = ?
    `, [order.matched_teacher_id]);

    await executeQuery(`
      UPDATE teacher_profiles 
      SET rating = ?, review_count = review_count + 1
      WHERE user_id = ?
    `, [avgRating[0]?.avg || 5, order.matched_teacher_id]);

    return { success: true };
  }

  /**
   * 获取附近的订单
   */
  async getNearbyOrders(params: {
    latitude: number;
    longitude: number;
    radius: number;
    subject?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ['o.status = 0'];
    const sqlParams: any[] = [];

    if (params.subject) {
      conditions.push('o.subject = ?');
      sqlParams.push(params.subject);
    }

    // 计算距离并筛选
    const orders = await executeQuery(`
      SELECT 
        o.*,
        u.nickname as parent_nickname, u.avatar as parent_avatar,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(o.latitude)) *
            cos(radians(o.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(o.latitude))
          ), 2
        ) as distance
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${conditions.join(' AND ')}
      HAVING distance <= ?
      ORDER BY distance ASC
      LIMIT ? OFFSET ?
    `, [
      params.latitude,
      params.longitude,
      params.latitude,
      ...sqlParams,
      params.radius,
      params.pageSize,
      offset,
    ]);

    // 隐藏联系方式
    orders.forEach((order: any) => {
      order.contact_hidden = true;
      delete order.contact_phone;
    });

    return {
      list: orders,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取订单推荐教师
   */
  async getRecommendedTeachers(orderId: number, userId: number) {
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;

    if (order.parent_id !== userId) {
      throw new Error('无权限查看');
    }

    // 根据科目和距离推荐教师
    const teachers = await executeQuery(`
      SELECT 
        u.id, u.nickname, u.avatar, u.latitude, u.longitude,
        tp.real_name, tp.subjects, tp.education, tp.teaching_years, tp.rating, tp.hourly_rate,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(u.latitude))
          ), 2
        ) as distance
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.role = 1 AND u.status = 1 AND tp.verify_status = 1
        AND FIND_IN_SET(?, tp.subjects) > 0
      HAVING distance <= 20
      ORDER BY tp.rating DESC, distance ASC
      LIMIT 10
    `, [order.latitude, order.longitude, order.latitude, order.subject]);

    return teachers;
  }

  /**
   * 生成订单号
   */
  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD${year}${month}${day}${random}`;
  }
}
