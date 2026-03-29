"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let PoolService = class PoolService {
    async releaseToPool(data) {
        const existing = await executeQuery(`
      SELECT id FROM order_pool WHERE order_id = ? AND pool_status = 0
    `, [data.orderId]);
        if (existing.length > 0) {
            return { success: false, message: '订单已在公海池中' };
        }
        const configs = await executeQuery(`
      SELECT config_value FROM system_configs WHERE config_key = 'order_expire_days'
    `);
        const expireDays = configs.length > 0 ? parseInt(configs[0].config_value) : 7;
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + expireDays);
        await executeQuery(`
      INSERT INTO order_pool (
        order_id, original_parent_id, original_teacher_id,
        release_reason, release_type, expire_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [data.orderId, data.originalParentId, data.originalTeacherId || null, data.releaseReason, data.releaseType, expireAt]);
        await executeQuery(`
      UPDATE orders SET status = 5 WHERE id = ?
    `, [data.orderId]);
        if (data.originalTeacherId) {
        }
        return { success: true };
    }
    async getPoolOrders(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['op.pool_status = 0', 'op.expire_at > NOW()'];
        const sqlParams = [];
        if (params.subject) {
            conditions.push('o.subject = ?');
            sqlParams.push(params.subject);
        }
        if (params.cityCode) {
            conditions.push('u.city_code = ?');
            sqlParams.push(params.cityCode);
        }
        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        let orders = await executeQuery(`
      SELECT op.*, o.*,
        u.nickname as parent_nickname, u.avatar as parent_avatar, u.city_code,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(o.latitude)) *
            cos(radians(o.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(o.latitude))
          ), 2
        ) as distance
      FROM order_pool op
      LEFT JOIN orders o ON op.order_id = o.id
      LEFT JOIN users u ON op.original_parent_id = u.id
      ${whereClause}
      HAVING ${params.radius ? `distance <= ${params.radius}` : '1=1'}
      ORDER BY op.created_at DESC
      LIMIT ? OFFSET ?
    `, [
            params.latitude || 0,
            params.longitude || 0,
            params.latitude || 0,
            ...sqlParams,
            params.pageSize,
            offset,
        ]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM order_pool op
      LEFT JOIN orders o ON op.order_id = o.id
      LEFT JOIN users u ON op.original_parent_id = u.id
      ${whereClause}
    `, sqlParams);
        orders = orders.map((order) => {
            delete order.parent_mobile;
            return { ...order, contact_hidden: true };
        });
        return {
            list: orders,
            total: countResult[0]?.total || 0,
            page: params.page,
            pageSize: params.pageSize,
        };
    }
    async grabFromPool(poolId, teacherId) {
        const poolOrders = await executeQuery(`
      SELECT * FROM order_pool WHERE id = ? AND pool_status = 0 AND expire_at > NOW()
    `, [poolId]);
        if (poolOrders.length === 0) {
            throw new Error('订单不存在或已被抢');
        }
        const poolOrder = poolOrders[0];
        const existingMatch = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [poolOrder.order_id, teacherId]);
        if (existingMatch.length === 0) {
            await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 0)
      `, [poolOrder.order_id, teacherId]);
        }
        await executeQuery(`
      UPDATE orders SET status = 0, matched_teacher_id = NULL, matched_at = NULL
      WHERE id = ?
    `, [poolOrder.order_id]);
        await executeQuery(`
      UPDATE order_pool SET pool_status = 1, assigned_teacher_id = ?, assigned_at = NOW()
      WHERE id = ?
    `, [teacherId, poolId]);
        return { success: true };
    }
    async getPoolStats() {
        const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN pool_status = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN pool_status = 1 THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN pool_status = 2 THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN release_type = 1 THEN 1 ELSE 0 END) as parent_cancel,
        SUM(CASE WHEN release_type = 2 THEN 1 ELSE 0 END) as teacher_cancel,
        SUM(CASE WHEN release_type = 3 THEN 1 ELSE 0 END) as system_recover
      FROM order_pool
    `);
        return stats[0];
    }
    async cleanExpiredOrders() {
        const expired = await executeQuery(`
      SELECT id, order_id FROM order_pool 
      WHERE pool_status = 0 AND expire_at < NOW()
    `);
        for (const order of expired) {
            await executeQuery(`
        UPDATE order_pool SET pool_status = 2 WHERE id = ?
      `, [order.id]);
            await executeQuery(`
        UPDATE orders SET status = 5 WHERE id = ?
      `, [order.order_id]);
        }
        return { success: true, cleaned: expired.length };
    }
    async assignFromPool(poolId, teacherId) {
        const poolOrders = await executeQuery(`
      SELECT * FROM order_pool WHERE id = ?
    `, [poolId]);
        if (poolOrders.length === 0) {
            throw new Error('公海池订单不存在');
        }
        const poolOrder = poolOrders[0];
        await executeQuery(`
      INSERT INTO order_matches (order_id, teacher_id, status)
      VALUES (?, ?, 1)
    `, [poolOrder.order_id, teacherId]);
        await executeQuery(`
      UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
      WHERE id = ?
    `, [teacherId, poolOrder.order_id]);
        await executeQuery(`
      UPDATE order_pool SET pool_status = 1, assigned_teacher_id = ?, assigned_at = NOW()
      WHERE id = ?
    `, [teacherId, poolId]);
        return { success: true };
    }
};
exports.PoolService = PoolService;
exports.PoolService = PoolService = __decorate([
    (0, common_1.Injectable)()
], PoolService);
//# sourceMappingURL=pool.service.js.map