import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';
import { MessageService } from '../message/message.service';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class TeacherService {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 获取教师列表（支持LBS距离计算）
   */
  async getTeachers(params: {
    latitude?: number;
    longitude?: number;
    subject?: string;
    grade?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['u.role = 1', 'u.status = 1', 'tp.verify_status = 1'];
    const sqlParams: any[] = [];

    // 科目筛选
    if (params.subject) {
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
      conditions.push('(u.nickname LIKE ? OR tp.real_name LIKE ?)');
      sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
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
        u.id, u.nickname, u.avatar, u.latitude, u.longitude,
        tp.real_name, tp.education, tp.subjects, tp.grades, 
        tp.teaching_years, tp.hourly_rate, tp.rating, tp.review_count,
        ${distanceSelect}
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY tp.rating DESC, u.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 获取总数
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
    `, sqlParams);

    return {
      list: teachers,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取教师详情
   */
  async getTeacherDetail(teacherId: number, userId: number) {
    // 获取教师基本信息
    const teachers = await executeQuery(`
      SELECT 
        u.id, u.nickname, u.avatar, u.mobile, u.latitude, u.longitude,
        tp.*
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE u.id = ? AND u.role = 1
    `, [teacherId]);

    if (teachers.length === 0) {
      throw new Error('教师不存在');
    }

    const teacher = teachers[0] as any;

    // 检查是否匹配（是否可查看联系方式）
    let canViewContact = false;
    if (userId) {
      const matches = await executeQuery(`
        SELECT id FROM order_matches 
        WHERE teacher_id = ? AND order_id IN (
          SELECT id FROM orders WHERE parent_id = ?
        )
        AND status = 1
      `, [teacherId, userId]);

      canViewContact = matches.length > 0;
    }

    // 隐藏联系方式（除非已匹配）
    if (!canViewContact) {
      delete teacher.mobile;
      teacher.mobile_hidden = true;
    }

    // 记录查看行为（触发提醒）
    if (userId && userId !== teacherId) {
      await this.messageService.createReminder(
        teacherId,
        userId,
        1, // type: 1=view, 2=message, 3=grab
        teacherId,
        '有人查看了您的资料',
      );
    }

    // 获取评价统计
    const reviewStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
      FROM reviews
      WHERE teacher_id = ?
    `, [teacherId]);

    return {
      ...teacher,
      review_stats: reviewStats[0],
      can_view_contact: canViewContact,
    };
  }

  /**
   * 获取教师评价列表
   */
  async getTeacherReviews(teacherId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const reviews = await executeQuery(`
      SELECT r.*, u.nickname, u.avatar
      FROM reviews r
      LEFT JOIN users u ON r.parent_id = u.id
      WHERE r.teacher_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [teacherId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM reviews WHERE teacher_id = ?
    `, [teacherId]);

    return {
      list: reviews,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 留言给教师
   */
  async sendMessage(teacherId: number, userId: number, content: string) {
    // 检查教师是否存在
    const teachers = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND role = 1
    `, [teacherId]);

    if (teachers.length === 0) {
      throw new Error('教师不存在');
    }

    // 检查用户会员状态
    const users = await executeQuery(`
      SELECT membership_type, membership_expire_at 
      FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    const isMember = user?.membership_type === 1 && 
                     new Date(user.membership_expire_at) > new Date();

    if (!isMember) {
      // 非会员需要付费才能留言
      return {
        need_pay: true,
        message: '开通会员后可免费留言',
      };
    }

    // 创建会话（如果不存在）
    const existingConv = await executeQuery(`
      SELECT id FROM conversations 
      WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    `, [userId, teacherId, teacherId, userId]);

    let conversationId;
    if (existingConv.length > 0) {
      conversationId = (existingConv[0] as any).id;
    } else {
      const result = await executeQuery(`
        INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)
      `, [userId, teacherId]);
      conversationId = (result as any).insertId;
    }

    // 发送消息
    await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, msg_type)
      VALUES (?, ?, ?, ?, 1)
    `, [conversationId, userId, teacherId, content]);

    // 触发留言提醒
    await this.messageService.createReminder(teacherId, userId, 2, conversationId, '您有新留言');

    return { success: true, conversation_id: conversationId };
  }

  /**
   * 获取可抢单列表
   */
  async getAvailableOrders(params: {
    userId: number;
    latitude?: number;
    longitude?: number;
    subject?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['o.status = 0']; // 待抢单状态
    const sqlParams: any[] = [];

    // 科目筛选
    if (params.subject) {
      conditions.push('o.subject = ?');
      sqlParams.push(params.subject);
    }

    // 排除已抢过的订单
    conditions.push(`
      NOT EXISTS (
        SELECT 1 FROM order_matches om 
        WHERE om.order_id = o.id AND om.teacher_id = ?
      )
    `);
    sqlParams.push(params.userId);

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
        o.*,
        ${distanceSelect},
        u.nickname as parent_nickname, u.avatar as parent_avatar
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY o.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 获取总数
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}
    `, sqlParams);

    // 隐藏联系方式
    orders.forEach((order: any) => {
      order.contact_hidden = true;
      delete order.contact_phone;
    });

    return {
      list: orders,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 抢单
   */
  async grabOrder(orderId: number, userId: number) {
    // 检查订单状态
    const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ? FOR UPDATE
    `, [orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    const order = orders[0] as any;
    if (order.status !== 0) {
      throw new Error('订单已被抢或已关闭');
    }

    // 检查是否已抢过
    const existing = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [orderId, userId]);

    if (existing.length > 0) {
      throw new Error('您已抢单，请等待家长选择');
    }

    // 创建抢单记录
    await executeQuery(`
      INSERT INTO order_matches (order_id, teacher_id, status)
      VALUES (?, ?, 0)
    `, [orderId, userId]);

    // 触发抢单提醒
    await this.messageService.createReminder((order as any).parent_id, userId, 3, orderId, '有教师抢单了您的订单');

    return { success: true, message: '抢单成功，请等待家长选择' };
  }

  /**
   * 获取教师已匹配订单
   */
  async getMatchedOrders(
    teacherId: number,
    page: number,
    pageSize: number,
    status?: number,
  ) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['om.teacher_id = ?', 'om.status = 1'];
    const params: any[] = [teacherId];

    if (status !== undefined) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    const orders = await executeQuery(`
      SELECT 
        o.*,
        u.nickname as parent_nickname, u.avatar as parent_avatar, u.mobile as parent_mobile
      FROM order_matches om
      LEFT JOIN orders o ON om.order_id = o.id
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.matched_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM order_matches om
      LEFT JOIN orders o ON om.order_id = o.id
      WHERE ${conditions.join(' AND ')}
    `, params);

    return {
      list: orders,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId: number, teacherId: number, status: number) {
    // 验证教师是否有权限操作此订单
    const matches = await executeQuery(`
      SELECT om.*, o.status as order_status
      FROM order_matches om
      LEFT JOIN orders o ON om.order_id = o.id
      WHERE om.order_id = ? AND om.teacher_id = ? AND om.status = 1
    `, [orderId, teacherId]);

    if (matches.length === 0) {
      throw new Error('无权限操作此订单');
    }

    const match = matches[0] as any;

    // 状态流转检查
    const validTransitions: Record<number, number[]> = {
      1: [2], // 已匹配 -> 试课中
      2: [3, 5], // 试课中 -> 已签约 或 已解除
      3: [4, 5], // 已签约 -> 已完成 或 已解除
    };

    if (!validTransitions[match.order_status]?.includes(status)) {
      throw new Error('状态流转不合法');
    }

    // 更新订单状态
    await executeQuery(`
      UPDATE orders SET status = ? WHERE id = ?
    `, [status, orderId]);

    return { success: true };
  }
}
