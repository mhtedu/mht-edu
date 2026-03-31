"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let AdminService = class AdminService {
    async getStats() {
        const userStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 0 THEN 1 ELSE 0 END) as parent_count,
        SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as teacher_count,
        SUM(CASE WHEN role = 2 THEN 1 ELSE 0 END) as org_count,
        SUM(CASE WHEN membership_type = 1 AND membership_expire_at > NOW() THEN 1 ELSE 0 END) as member_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new
      FROM users
    `);
        const orderStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as matched_count,
        SUM(CASE WHEN status IN (2, 3) THEN 1 ELSE 0 END) as ongoing_count,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_new
      FROM orders
    `);
        const paymentStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) as today_amount,
        COALESCE(SUM(CASE WHEN YEARWEEK(paid_at) = YEARWEEK(NOW()) THEN amount ELSE 0 END), 0) as week_amount,
        COALESCE(SUM(CASE WHEN MONTH(paid_at) = MONTH(NOW()) AND YEAR(paid_at) = YEAR(NOW()) THEN amount ELSE 0 END), 0) as month_amount
      FROM payments
      WHERE status = 1
    `);
        const commissionStats = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as settled_amount,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn_amount
      FROM commissions
    `);
        return {
            users: userStats[0],
            orders: orderStats[0],
            payments: paymentStats[0],
            commissions: commissionStats[0],
        };
    }
    async getTrendStats(days) {
        const trend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as user_count
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);
        const orderTrend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);
        const paymentTrend = await executeQuery(`
      SELECT 
        DATE(paid_at) as date,
        COUNT(*) as payment_count,
        SUM(amount) as payment_amount
      FROM payments
      WHERE status = 1 AND paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(paid_at)
      ORDER BY date
    `, [days]);
        return {
            users: trend,
            orders: orderTrend,
            payments: paymentTrend,
        };
    }
    async getUsers(page, pageSize, role, keyword, status) {
        const offset = (page - 1) * pageSize;
        const conditions = [];
        const params = [];
        if (role !== undefined) {
            conditions.push('role = ?');
            params.push(role);
        }
        if (status !== undefined) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (keyword) {
            conditions.push('(nickname LIKE ? OR mobile LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const users = await executeQuery(`
      SELECT u.*, 
        tp.real_name, tp.education, tp.subjects, tp.verify_status,
        o.org_name
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN organizations o ON u.id = o.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);
        return {
            list: users,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async getUserDetail(id) {
        const users = await executeQuery(`
      SELECT u.*, 
        tp.*,
        o.*,
        ca.city_name, ca.commission_rate as agent_rate, ca.balance as agent_balance
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN organizations o ON u.id = o.user_id
      LEFT JOIN city_agents ca ON u.id = ca.user_id
      WHERE u.id = ?
    `, [id]);
        if (users.length === 0) {
            throw new Error('用户不存在');
        }
        return users[0];
    }
    async updateUserStatus(id, status, reason) {
        await executeQuery(`
      UPDATE users SET status = ? WHERE id = ?
    `, [status, id]);
        return { success: true };
    }
    async updateUserRole(id, role) {
        await executeQuery(`
      UPDATE users SET role = ? WHERE id = ?
    `, [role, id]);
        return { success: true };
    }
    async grantMembership(id, days) {
        const users = await executeQuery(`
      SELECT membership_expire_at FROM users WHERE id = ?
    `, [id]);
        let expireAt = new Date();
        const current = users[0]?.membership_expire_at;
        if (current && new Date(current) > expireAt) {
            expireAt = new Date(current);
        }
        expireAt.setDate(expireAt.getDate() + days);
        await executeQuery(`
      UPDATE users SET membership_type = 1, membership_expire_at = ? WHERE id = ?
    `, [expireAt, id]);
        return { success: true, expireAt };
    }
    async getTeachers(page, pageSize, verifyStatus, keyword) {
        const offset = (page - 1) * pageSize;
        const conditions = ['u.role = 1'];
        const params = [];
        if (verifyStatus !== undefined) {
            conditions.push('tp.verify_status = ?');
            params.push(verifyStatus);
        }
        if (keyword) {
            conditions.push('(u.nickname LIKE ? OR tp.real_name LIKE ? OR u.mobile LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }
        const teachers = await executeQuery(`
      SELECT u.*, tp.*
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${conditions.join(' AND ')}
    `, params);
        return {
            list: teachers,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async verifyTeacher(id, status, reason) {
        await executeQuery(`
      UPDATE teacher_profiles 
      SET verify_status = ?, verify_reject_reason = ?
      WHERE user_id = ?
    `, [status, reason || null, id]);
        return { success: true };
    }
    async getOrders(page, pageSize, status, keyword) {
        const offset = (page - 1) * pageSize;
        const conditions = [];
        const params = [];
        if (status !== undefined) {
            conditions.push('o.status = ?');
            params.push(status);
        }
        if (keyword) {
            conditions.push('(o.order_no LIKE ? OR o.subject LIKE ? OR o.address LIKE ?)');
            params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const orders = await executeQuery(`
      SELECT o.*, 
        u.nickname as parent_nickname, u.mobile as parent_mobile, u.avatar as parent_avatar,
        t.nickname as teacher_nickname, t.mobile as teacher_mobile,
        om.id as match_id, om.status as match_status
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      LEFT JOIN users t ON o.matched_teacher_id = t.id
      LEFT JOIN order_matches om ON o.id = om.order_id AND om.status = 1
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `, params);
        return {
            list: orders,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async getOrderDetail(id) {
        const orders = await executeQuery(`
      SELECT o.*, 
        u.nickname as parent_nickname, u.mobile as parent_mobile, u.avatar as parent_avatar,
        u.latitude as parent_lat, u.longitude as parent_lng
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE o.id = ?
    `, [id]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        const matches = await executeQuery(`
      SELECT om.*, u.nickname, u.avatar, tp.real_name, tp.subjects
      FROM order_matches om
      LEFT JOIN users u ON om.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON om.teacher_id = tp.user_id
      WHERE om.order_id = ?
    `, [id]);
        return {
            ...order,
            matches,
        };
    }
    async updateOrderStatus(id, status) {
        await executeQuery(`
      UPDATE orders SET status = ? WHERE id = ?
    `, [status, id]);
        return { success: true };
    }
    async matchOrder(id, teacherId) {
        await executeQuery(`
      INSERT INTO order_matches (order_id, teacher_id, status)
      VALUES (?, ?, 1)
    `, [id, teacherId]);
        await executeQuery(`
      UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
      WHERE id = ?
    `, [teacherId, id]);
        return { success: true };
    }
    async deleteOrder(id) {
        await executeQuery(`DELETE FROM orders WHERE id = ?`, [id]);
        return { success: true };
    }
    async getOrgs(page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = [];
        const params = [];
        if (status !== undefined) {
            conditions.push('o.status = ?');
            params.push(status);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const orgs = await executeQuery(`
      SELECT o.*, u.nickname, u.mobile, u.avatar
      FROM organizations o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM organizations ${whereClause}
    `, params);
        return {
            list: orgs,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async auditOrg(id, status, reason) {
        await executeQuery(`
      UPDATE organizations SET status = ?, reject_reason = ? WHERE user_id = ?
    `, [status, reason || null, id]);
        return { success: true };
    }
    async getAgents(page, pageSize) {
        const offset = (page - 1) * pageSize;
        const agents = await executeQuery(`
      SELECT ca.*, u.nickname, u.mobile, u.avatar
      FROM city_agents ca
      LEFT JOIN users u ON ca.user_id = u.id
      ORDER BY ca.created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM city_agents
    `);
        return {
            list: agents,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async createAgent(userId, cityCode, cityName, commissionRate) {
        await executeQuery(`
      INSERT INTO city_agents (user_id, city_code, city_name, commission_rate)
      VALUES (?, ?, ?, ?)
    `, [userId, cityCode, cityName, commissionRate]);
        return { success: true };
    }
    async updateAgentRate(id, rate) {
        await executeQuery(`
      UPDATE city_agents SET commission_rate = ? WHERE user_id = ?
    `, [rate, id]);
        return { success: true };
    }
    async getMembershipPlans(role) {
        const conditions = role !== undefined ? `WHERE role = ${role}` : '';
        const plans = await executeQuery(`
      SELECT * FROM membership_plans ${conditions} ORDER BY role, sort_order
    `);
        return plans;
    }
    async createMembershipPlan(data) {
        const result = await executeQuery(`
      INSERT INTO membership_plans (name, role, price, original_price, duration_days, features)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.name, data.role, data.price, data.originalPrice, data.durationDays, JSON.stringify(data.features)]);
        return { id: result.insertId, ...data };
    }
    async updateMembershipPlan(id, data) {
        const updates = [];
        const values = [];
        if (data.name) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.price !== undefined) {
            updates.push('price = ?');
            values.push(data.price);
        }
        if (data.originalPrice !== undefined) {
            updates.push('original_price = ?');
            values.push(data.originalPrice);
        }
        if (data.durationDays) {
            updates.push('duration_days = ?');
            values.push(data.durationDays);
        }
        if (data.features) {
            updates.push('features = ?');
            values.push(JSON.stringify(data.features));
        }
        if (data.isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(data.isActive);
        }
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE membership_plans SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
        }
        return { success: true };
    }
    async getProducts(page, pageSize, isActive) {
        const offset = (page - 1) * pageSize;
        const conditions = isActive !== undefined ? `WHERE is_active = ${isActive}` : '';
        const products = await executeQuery(`
      SELECT * FROM products ${conditions}
      ORDER BY sort_order, created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM products ${conditions}
    `);
        return {
            list: products,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async createProduct(data) {
        const result = await executeQuery(`
      INSERT INTO products (name, cover, images, description, price, original_price, stock, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.name, data.cover, JSON.stringify(data.images || []), data.description, data.price, data.originalPrice, data.stock, data.category]);
        return { id: result.insertId, ...data };
    }
    async updateProduct(id, data) {
        const updates = [];
        const values = [];
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'images' && Array.isArray(value)) {
                    updates.push('images = ?');
                    values.push(JSON.stringify(value));
                }
                else {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }
        });
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE products SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
        }
        return { success: true };
    }
    async deleteProduct(id) {
        await executeQuery(`DELETE FROM products WHERE id = ?`, [id]);
        return { success: true };
    }
    async getBanners(position) {
        const conditions = position ? `WHERE position = '${position}'` : '';
        const banners = await executeQuery(`
      SELECT * FROM banners ${conditions} ORDER BY sort_order
    `);
        return banners;
    }
    async createBanner(data) {
        const result = await executeQuery(`
      INSERT INTO banners (position, title, image_url, link_url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `, [data.position, data.title, data.imageUrl, data.linkUrl, data.sortOrder || 0]);
        return { id: result.insertId, ...data };
    }
    async updateBanner(id, data) {
        const updates = [];
        const values = [];
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                updates.push(`${key === 'imageUrl' ? 'image_url' : key === 'linkUrl' ? 'link_url' : key === 'sortOrder' ? 'sort_order' : key} = ?`);
                values.push(value);
            }
        });
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE banners SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
        }
        return { success: true };
    }
    async deleteBanner(id) {
        await executeQuery(`DELETE FROM banners WHERE id = ?`, [id]);
        return { success: true };
    }
    async getCommissions(page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = status !== undefined ? `WHERE c.status = ${status}` : '';
        const commissions = await executeQuery(`
      SELECT c.*, 
        u.nickname, u.avatar,
        fu.nickname as from_nickname,
        p.payment_no, p.amount as payment_amount
      FROM commissions c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN payments p ON c.payment_id = p.id
      ${conditions}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM commissions c ${conditions}
    `);
        return {
            list: commissions,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async settleCommissions(ids) {
        await executeQuery(`
      UPDATE commissions SET status = 1, settled_at = NOW()
      WHERE id IN (${ids.map(() => '?').join(',')})
    `, ids);
        return { success: true };
    }
    async getWithdrawals(page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = status !== undefined ? `WHERE w.status = ${status}` : '';
        const withdrawals = await executeQuery(`
      SELECT w.*, u.nickname, u.avatar, u.mobile
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${conditions}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM withdrawals w ${conditions}
    `);
        return {
            list: withdrawals,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async auditWithdrawal(id, status, reason) {
        await executeQuery(`
      UPDATE withdrawals SET status = ?, reject_reason = ?
      WHERE id = ?
    `, [status, reason || null, id]);
        return { success: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map