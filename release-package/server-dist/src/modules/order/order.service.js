"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
const message_service_1 = require("../message/message.service");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let OrderService = class OrderService {
    constructor(messageService) {
        this.messageService = messageService;
    }
    async createOrder(userId, data) {
        const orderNo = this.generateOrderNo();
        const result = await executeQuery(`
      INSERT INTO orders (
        order_no, parent_id, subject, grade, student_info, schedule,
        address, latitude, longitude, budget, requirement, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [
            orderNo,
            userId,
            data.subject,
            data.grade,
            data.student_info,
            data.schedule,
            data.address,
            data.latitude,
            data.longitude,
            data.budget,
            data.requirement || '',
        ]);
        return {
            success: true,
            order_id: result.insertId,
            order_no: orderNo,
        };
    }
    async getOrdersByParent(parentId, page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = ['o.parent_id = ?'];
        const params = [parentId];
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
        for (const order of orders) {
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
    async getOrderDetail(orderId, userId) {
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
        const order = orders[0];
        const isParent = order.parent_id === userId;
        const isTeacher = order.matched_teacher_id === userId;
        if (!isParent && !isTeacher) {
            order.contact_hidden = true;
            delete order.contact_phone;
            delete order.parent_mobile;
        }
        if (!isParent) {
            delete order.parent_mobile;
        }
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
    async getOrderMatches(orderId, userId) {
        const orders = await executeQuery(`
      SELECT parent_id FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        if (orders[0].parent_id !== userId) {
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
    async selectTeacher(orderId, userId, teacherId) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.parent_id !== userId) {
            throw new Error('无权限操作');
        }
        if (order.status !== 0) {
            throw new Error('订单状态不允许选择教师');
        }
        const matches = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [orderId, teacherId]);
        if (matches.length === 0) {
            throw new Error('该教师未抢单');
        }
        await executeQuery(`
      UPDATE order_matches SET status = 1 WHERE order_id = ? AND teacher_id = ?
    `, [orderId, teacherId]);
        await executeQuery(`
      UPDATE order_matches SET status = 2 WHERE order_id = ? AND teacher_id != ?
    `, [orderId, teacherId]);
        await executeQuery(`
      UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
      WHERE id = ?
    `, [teacherId, orderId]);
        await this.messageService.sendSystemMessage(teacherId, `恭喜！您已成功匹配订单 #${order.order_no}，家长将在24小时内联系您。`);
        return { success: true };
    }
    async updateOrderStatus(orderId, userId, status) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.parent_id !== userId && order.matched_teacher_id !== userId) {
            throw new Error('无权限操作');
        }
        const validTransitions = {
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
    async cancelOrder(orderId, userId, reason) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.parent_id !== userId) {
            throw new Error('无权限操作');
        }
        if (order.status > 1) {
            throw new Error('订单已进入试课阶段，无法取消');
        }
        await executeQuery(`
      UPDATE orders SET status = 5, cancel_reason = ? WHERE id = ?
    `, [reason || '', orderId]);
        const matches = await executeQuery(`
      SELECT teacher_id FROM order_matches WHERE order_id = ?
    `, [orderId]);
        for (const match of matches) {
            await this.messageService.sendSystemMessage(match.teacher_id, `订单 #${order.order_no} 已被家长取消。`);
        }
        return { success: true };
    }
    async createReview(orderId, userId, rating, content) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.parent_id !== userId) {
            throw new Error('无权限评价');
        }
        if (order.status !== 4) {
            throw new Error('订单未完成，无法评价');
        }
        const existing = await executeQuery(`
      SELECT id FROM reviews WHERE order_id = ?
    `, [orderId]);
        if (existing.length > 0) {
            throw new Error('已评价过');
        }
        await executeQuery(`
      INSERT INTO reviews (order_id, parent_id, teacher_id, rating, content)
      VALUES (?, ?, ?, ?, ?)
    `, [orderId, userId, order.matched_teacher_id, rating, content]);
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
    async getNearbyOrders(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['o.status = 0'];
        const sqlParams = [];
        if (params.subject) {
            conditions.push('o.subject = ?');
            sqlParams.push(params.subject);
        }
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
        orders.forEach((order) => {
            order.contact_hidden = true;
            delete order.contact_phone;
        });
        return {
            list: orders,
            page: params.page,
            pageSize: params.pageSize,
        };
    }
    async getRecommendedTeachers(orderId, userId) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.parent_id !== userId) {
            throw new Error('无权限查看');
        }
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
    generateOrderNo() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `ORD${year}${month}${day}${random}`;
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], OrderService);
//# sourceMappingURL=order.service.js.map