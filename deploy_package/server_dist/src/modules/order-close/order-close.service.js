"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCloseService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let OrderCloseService = class OrderCloseService {
    async closeOrderByParent(data) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ? AND parent_id = ?
    `, [data.orderId, data.parentId]);
        if (orders.length === 0) {
            throw new Error('订单不存在或无权限');
        }
        const order = orders[0];
        if (![0, 1].includes(order.status)) {
            throw new Error('订单当前状态不允许关闭');
        }
        const existingClose = await executeQuery(`
      SELECT id FROM order_close_reasons WHERE order_id = ?
    `, [data.orderId]);
        if (existingClose.length > 0) {
            throw new Error('订单已有关闭记录');
        }
        await executeQuery(`
      INSERT INTO order_close_reasons (
        order_id, user_id, close_type, reason, feedback, to_pool, membership_terminated
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            data.orderId,
            data.parentId,
            data.closeType,
            data.reason,
            data.feedback || '',
            1,
            1,
        ]);
        await executeQuery(`
      UPDATE orders SET status = 5 WHERE id = ?
    `, [data.orderId]);
        if (order.matched_teacher_id) {
            await executeQuery(`
        UPDATE order_matches SET status = 3 WHERE order_id = ?
      `, [data.orderId]);
        }
        if (data.closeType === 1) {
            await executeQuery(`
        INSERT INTO order_pool (
          order_id, original_parent_id, original_teacher_id,
          release_reason, release_type, expire_at
        ) VALUES (?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `, [data.orderId, data.parentId, order.matched_teacher_id || null, data.reason]);
        }
        await executeQuery(`
      UPDATE users SET membership_terminated = 1 WHERE id = ?
    `, [data.parentId]);
        return {
            success: true,
            membershipTerminated: true,
            message: '订单已关闭，会员权益已终止。订单已进入公海池供其他教师抢单。',
        };
    }
    async completeAndReview(data) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ? AND parent_id = ?
    `, [data.orderId, data.parentId]);
        if (orders.length === 0) {
            throw new Error('订单不存在或无权限');
        }
        const order = orders[0];
        if (order.status !== 3) {
            throw new Error('只有已签约订单才能完成评价');
        }
        await executeQuery(`
      UPDATE orders SET status = 4 WHERE id = ?
    `, [data.orderId]);
        await executeQuery(`
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
        await executeQuery(`
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
    async getCloseHistory(orderId) {
        const history = await executeQuery(`
      SELECT ocr.*, u.nickname, u.avatar
      FROM order_close_reasons ocr
      LEFT JOIN users u ON ocr.user_id = u.id
      WHERE ocr.order_id = ?
      ORDER BY ocr.created_at DESC
    `, [orderId]);
        return history;
    }
    async checkMembershipValid(userId) {
        const users = await executeQuery(`
      SELECT membership_type, membership_expire_at, membership_terminated
      FROM users WHERE id = ?
    `, [userId]);
        if (users.length === 0) {
            return { valid: false, reason: '用户不存在' };
        }
        const user = users[0];
        if (user.membership_terminated === 1) {
            return { valid: false, reason: '会员权益已因关闭订单而终止' };
        }
        if (user.membership_type !== 1) {
            return { valid: false, reason: '未开通会员' };
        }
        if (new Date(user.membership_expire_at) < new Date()) {
            return { valid: false, reason: '会员已过期' };
        }
        return { valid: true, expireAt: user.membership_expire_at };
    }
};
exports.OrderCloseService = OrderCloseService;
exports.OrderCloseService = OrderCloseService = __decorate([
    (0, common_1.Injectable)()
], OrderCloseService);
//# sourceMappingURL=order-close.service.js.map