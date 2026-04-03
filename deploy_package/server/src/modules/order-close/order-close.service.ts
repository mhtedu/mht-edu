import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class OrderCloseService {
  /**
   * 家长关闭订单（未达成合作）
   * 注意：关闭订单会导致会员权益终止，订单进入公海池
   */
  async closeOrderByParent(data: {
    orderId: number;
    parentId: number;
    closeType: number; // 1未达成合作 2家长取消
    reason: string;
    feedback?: string;
  }) {
    // 获取订单信息
    const [orders] = await db.query(`
      SELECT * FROM orders WHERE id = ? AND parent_id = ?
    `, [data.orderId, data.parentId]);

    if (orders.length === 0) {
      throw new Error('订单不存在或无权限');
    }

    const order = orders[0] as any;

    // 检查订单状态 - 只有待抢单和已匹配状态可以关闭
    if (![0, 1].includes(order.status)) {
      throw new Error('订单当前状态不允许关闭');
    }

    // 检查是否有关闭记录
    const [existingClose] = await db.query(`
      SELECT id FROM order_close_reasons WHERE order_id = ?
    `, [data.orderId]);

    if (existingClose.length > 0) {
      throw new Error('订单已有关闭记录');
    }

    // 开始事务处理
    // 1. 创建关闭原因记录
    await db.query(`
      INSERT INTO order_close_reasons (
        order_id, user_id, close_type, reason, feedback, to_pool, membership_terminated
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.orderId,
      data.parentId,
      data.closeType,
      data.reason,
      data.feedback || '',
      1, // 进入公海池
      1, // 终止会员权益
    ]);

    // 2. 更新订单状态为已解除
    await db.query(`
      UPDATE orders SET status = 5 WHERE id = ?
    `, [data.orderId]);

    // 3. 如果有匹配教师，通知教师
    if (order.matched_teacher_id) {
      // 拒绝其他抢单记录
      await db.query(`
        UPDATE order_matches SET status = 3 WHERE order_id = ?
      `, [data.orderId]);
    }

    // 4. 订单进入公海池（未达成合作的情况）
    if (data.closeType === 1) {
      await db.query(`
        INSERT INTO order_pool (
          order_id, original_parent_id, original_teacher_id,
          release_reason, release_type, expire_at
        ) VALUES (?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `, [data.orderId, data.parentId, order.matched_teacher_id || null, data.reason]);
    }

    // 5. 终止家长会员权益
    await db.query(`
      UPDATE users SET membership_terminated = 1 WHERE id = ?
    `, [data.parentId]);

    return {
      success: true,
      membershipTerminated: true,
      message: '订单已关闭，会员权益已终止。订单已进入公海池供其他教师抢单。',
    };
  }

  /**
   * 订单完成后评价
   */
  async completeAndReview(data: {
    orderId: number;
    parentId: number;
    rating: number;
    content: string;
    tags?: string[];
    isAnonymous?: boolean;
  }) {
    // 获取订单信息
    const [orders] = await db.query(`
      SELECT * FROM orders WHERE id = ? AND parent_id = ?
    `, [data.orderId, data.parentId]);

    if (orders.length === 0) {
      throw new Error('订单不存在或无权限');
    }

    const order = orders[0] as any;

    if (order.status !== 3) {
      throw new Error('只有已签约订单才能完成评价');
    }

    // 更新订单状态为已完成
    await db.query(`
      UPDATE orders SET status = 4 WHERE id = ?
    `, [data.orderId]);

    // 创建评价
    await db.query(`
      INSERT INTO reviews (order_id, parent_id, teacher_id, rating, content, tags, is_anonymous)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.orderId,
      data.parentId,
      order.matched_teacher_id,
      data.rating,
      data.content,
      JSON.stringify(data.tags || []),
      data.isAnonymous ? 1 : 0,
    ]);

    // 更新教师评分
    await db.query(`
      UPDATE teacher_profiles 
      SET rating = (
        SELECT AVG(rating) FROM reviews WHERE teacher_id = ?
      ),
      review_count = review_count + 1,
      success_count = success_count + 1
      WHERE user_id = ?
    `, [order.matched_teacher_id, order.matched_teacher_id]);

    return { success: true };
  }

  /**
   * 获取关闭原因选项
   */
  getCloseReasons() {
    return [
      { value: 'teacher_not_suitable', label: '教师不合适' },
      { value: 'price_not_match', label: '价格未谈妥' },
      { value: 'time_not_match', label: '时间不合适' },
      { value: 'found_other', label: '已找到其他教师' },
      { value: 'requirement_changed', label: '需求变更' },
      { value: 'other', label: '其他原因' },
    ];
  }

  /**
   * 获取订单关闭历史
   */
  async getCloseHistory(orderId: number) {
    const [history] = await db.query(`
      SELECT ocr.*, u.nickname, u.avatar
      FROM order_close_reasons ocr
      LEFT JOIN users u ON ocr.user_id = u.id
      WHERE ocr.order_id = ?
      ORDER BY ocr.created_at DESC
    `, [orderId]);

    return history;
  }

  /**
   * 检查用户会员权益是否有效
   */
  async checkMembershipValid(userId: number): Promise<{
    valid: boolean;
    reason?: string;
    expireAt?: Date;
  }> {
    const [users] = await db.query(`
      SELECT membership_type, membership_expire_at, membership_terminated
      FROM users WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return { valid: false, reason: '用户不存在' };
    }

    const user = users[0] as any;

    // 检查是否被终止
    if (user.membership_terminated === 1) {
      return { valid: false, reason: '会员权益已因关闭订单而终止' };
    }

    // 检查是否过期
    if (user.membership_type !== 1) {
      return { valid: false, reason: '未开通会员' };
    }

    if (new Date(user.membership_expire_at) < new Date()) {
      return { valid: false, reason: '会员已过期' };
    }

    return { valid: true, expireAt: user.membership_expire_at };
  }
}
