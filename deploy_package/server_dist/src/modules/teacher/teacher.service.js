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
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
const message_service_1 = require("../message/message.service");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let TeacherService = class TeacherService {
    constructor(messageService) {
        this.messageService = messageService;
    }
    async getTeachers(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['u.role = 1', 'u.status = 1', 'tp.verify_status = 1'];
        const sqlParams = [];
        if (params.subject) {
            conditions.push('FIND_IN_SET(?, tp.subjects) > 0');
            sqlParams.push(params.subject);
        }
        if (params.grade) {
            conditions.push('FIND_IN_SET(?, tp.grades) > 0');
            sqlParams.push(params.grade);
        }
        if (params.keyword) {
            conditions.push('(u.nickname LIKE ? OR tp.real_name LIKE ?)');
            sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
        }
        const whereClause = conditions.join(' AND ');
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
    async getTeacherDetail(teacherId, userId) {
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
        const teacher = teachers[0];
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
        if (!canViewContact) {
            delete teacher.mobile;
            teacher.mobile_hidden = true;
        }
        if (userId && userId !== teacherId) {
            await this.messageService.createReminder(teacherId, userId, 1, teacherId, '有人查看了您的资料');
        }
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
    async getTeacherReviews(teacherId, page, pageSize) {
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
    async sendMessage(teacherId, userId, content) {
        const teachers = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND role = 1
    `, [teacherId]);
        if (teachers.length === 0) {
            throw new Error('教师不存在');
        }
        const users = await executeQuery(`
      SELECT membership_type, membership_expire_at 
      FROM users WHERE id = ?
    `, [userId]);
        const user = users[0];
        const isMember = user?.membership_type === 1 &&
            new Date(user.membership_expire_at) > new Date();
        if (!isMember) {
            return {
                need_pay: true,
                message: '开通会员后可免费留言',
            };
        }
        const existingConv = await executeQuery(`
      SELECT id FROM conversations 
      WHERE ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    `, [userId, teacherId, teacherId, userId]);
        let conversationId;
        if (existingConv.length > 0) {
            conversationId = existingConv[0].id;
        }
        else {
            const result = await executeQuery(`
        INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)
      `, [userId, teacherId]);
            conversationId = result.insertId;
        }
        await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, content, msg_type)
      VALUES (?, ?, ?, ?, 1)
    `, [conversationId, userId, teacherId, content]);
        await this.messageService.createReminder(teacherId, userId, 2, conversationId, '您有新留言');
        return { success: true, conversation_id: conversationId };
    }
    async getAvailableOrders(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['o.status = 0'];
        const sqlParams = [];
        if (params.subject) {
            conditions.push('o.subject = ?');
            sqlParams.push(params.subject);
        }
        conditions.push(`
      NOT EXISTS (
        SELECT 1 FROM order_matches om 
        WHERE om.order_id = o.id AND om.teacher_id = ?
      )
    `);
        sqlParams.push(params.userId);
        const whereClause = conditions.join(' AND ');
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
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}
    `, sqlParams);
        orders.forEach((order) => {
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
    async grabOrder(orderId, userId) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ? FOR UPDATE
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        if (order.status !== 0) {
            throw new Error('订单已被抢或已关闭');
        }
        const existing = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [orderId, userId]);
        if (existing.length > 0) {
            throw new Error('您已抢单，请等待家长选择');
        }
        await executeQuery(`
      INSERT INTO order_matches (order_id, teacher_id, status)
      VALUES (?, ?, 0)
    `, [orderId, userId]);
        await this.messageService.createReminder(order.parent_id, userId, 3, orderId, '有教师抢单了您的订单');
        return { success: true, message: '抢单成功，请等待家长选择' };
    }
    async getMatchedOrders(teacherId, page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = ['om.teacher_id = ?', 'om.status = 1'];
        const params = [teacherId];
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
    async updateOrderStatus(orderId, teacherId, status) {
        const matches = await executeQuery(`
      SELECT om.*, o.status as order_status
      FROM order_matches om
      LEFT JOIN orders o ON om.order_id = o.id
      WHERE om.order_id = ? AND om.teacher_id = ? AND om.status = 1
    `, [orderId, teacherId]);
        if (matches.length === 0) {
            throw new Error('无权限操作此订单');
        }
        const match = matches[0];
        const validTransitions = {
            1: [2],
            2: [3, 5],
            3: [4, 5],
        };
        if (!validTransitions[match.order_status]?.includes(status)) {
            throw new Error('状态流转不合法');
        }
        await executeQuery(`
      UPDATE orders SET status = ? WHERE id = ?
    `, [status, orderId]);
        return { success: true };
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [message_service_1.MessageService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map