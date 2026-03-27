import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class PoolService {
  // ==================== 公海池管理 ====================

  /**
   * 订单释放到公海池
   */
  async releaseToPool(data: {
    orderId: number;
    originalParentId: number;
    originalTeacherId?: number;
    releaseReason: string;
    releaseType: number; // 1家长取消 2教师解约 3系统回收
  }) {
    // 检查是否已在公海池
    const existing = await executeQuery(`
      SELECT id FROM order_pool WHERE order_id = ? AND pool_status = 0
    `, [data.orderId]);

    if (existing.length > 0) {
      return { success: false, message: '订单已在公海池中' };
    }

    // 获取订单过期时间
    const configs = await executeQuery(`
      SELECT config_value FROM system_configs WHERE config_key = 'order_expire_days'
    `);
    const expireDays = configs.length > 0 ? parseInt((configs[0] as any).config_value) : 7;
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expireDays);

    await executeQuery(`
      INSERT INTO order_pool (
        order_id, original_parent_id, original_teacher_id,
        release_reason, release_type, expire_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [data.orderId, data.originalParentId, data.originalTeacherId || null, data.releaseReason, data.releaseType, expireAt]);

    // 更新订单状态为已解除
    await executeQuery(`
      UPDATE orders SET status = 5 WHERE id = ?
    `, [data.orderId]);

    // 通知原教师（如果有）
    if (data.originalTeacherId) {
      // 可以调用消息服务发送通知
    }

    return { success: true };
  }

  /**
   * 获取公海池订单列表
   */
  async getPoolOrders(params: {
    status?: number;
    subject?: string;
    cityCode?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions = ['op.pool_status = 0', 'op.expire_at > NOW()'];
    const sqlParams: any[] = [];

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

    // 隐藏联系方式
    orders = orders.map((order: any) => {
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

  /**
   * 从公海池抢单
   */
  async grabFromPool(poolId: number, teacherId: number) {
    // 检查公海池订单状态
    const poolOrders = await executeQuery(`
      SELECT * FROM order_pool WHERE id = ? AND pool_status = 0 AND expire_at > NOW()
    `, [poolId]);

    if (poolOrders.length === 0) {
      throw new Error('订单不存在或已被抢');
    }

    const poolOrder = poolOrders[0] as any;

    // 检查教师是否已有该订单的抢单记录
    const existingMatch = await executeQuery(`
      SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?
    `, [poolOrder.order_id, teacherId]);

    if (existingMatch.length === 0) {
      // 创建抢单记录
      await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 0)
      `, [poolOrder.order_id, teacherId]);
    }

    // 更新订单状态为待抢单
    await executeQuery(`
      UPDATE orders SET status = 0, matched_teacher_id = NULL, matched_at = NULL
      WHERE id = ?
    `, [poolOrder.order_id]);

    // 更新公海池状态
    await executeQuery(`
      UPDATE order_pool SET pool_status = 1, assigned_teacher_id = ?, assigned_at = NOW()
      WHERE id = ?
    `, [teacherId, poolId]);

    return { success: true };
  }

  /**
   * 获取公海池统计
   */
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

  /**
   * 清理过期公海池订单
   */
  async cleanExpiredOrders() {
    // 获取过期订单
    const expired = await executeQuery(`
      SELECT id, order_id FROM order_pool 
      WHERE pool_status = 0 AND expire_at < NOW()
    `);

    for (const order of expired as any[]) {
      // 更新公海池状态
      await executeQuery(`
        UPDATE order_pool SET pool_status = 2 WHERE id = ?
      `, [order.id]);

      // 彻底关闭订单
      await executeQuery(`
        UPDATE orders SET status = 5 WHERE id = ?
      `, [order.order_id]);
    }

    return { success: true, cleaned: expired.length };
  }

  /**
   * 管理员重新分配公海池订单
   */
  async assignFromPool(poolId: number, teacherId: number) {
    const poolOrders = await executeQuery(`
      SELECT * FROM order_pool WHERE id = ?
    `, [poolId]);

    if (poolOrders.length === 0) {
      throw new Error('公海池订单不存在');
    }

    const poolOrder = poolOrders[0] as any;

    // 直接匹配
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
}
