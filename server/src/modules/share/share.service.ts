import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class ShareService {
  /**
   * 生成分享链接
   */
  async generateShareLink(userId: number, targetType: string, targetId: number) {
    // 生成唯一分享码
    const shareCode = this.generateCode(userId, targetType, targetId);
    
    // 检查是否已有分享记录
    const existing = await executeQuery(`
      SELECT * FROM share_links 
      WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);

    if (existing.length > 0) {
      return {
        share_code: (existing[0] as any).share_code,
        share_url: `pages/order-detail/index?id=${targetId}&share_code=${(existing[0] as any).share_code}`,
        qr_code: '',
      };
    }

    // 创建分享记录
    await executeQuery(`
      INSERT INTO share_links (share_code, user_id, target_type, target_id, view_count, share_count, created_at)
      VALUES (?, ?, ?, ?, 0, 0, NOW())
    `, [shareCode, userId, targetType, targetId]);

    return {
      share_code: shareCode,
      share_url: `pages/order-detail/index?id=${targetId}&share_code=${shareCode}`,
      qr_code: '',
    };
  }

  /**
   * 记录分享行为
   */
  async recordShare(userId: number, shareCode: string, channel: string) {
    // 获取分享链接信息
    const shares = await executeQuery(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);

    if (shares.length === 0) {
      throw new Error('分享链接不存在');
    }

    const share = shares[0] as any;

    // 更新分享次数
    await executeQuery(`
      UPDATE share_links SET share_count = share_count + 1 WHERE share_code = ?
    `, [shareCode]);

    // 记录分享日志
    await executeQuery(`
      INSERT INTO share_logs (share_code, user_id, channel, created_at)
      VALUES (?, ?, ?, NOW())
    `, [shareCode, userId || share.user_id, channel]);

    return { success: true };
  }

  /**
   * 记录分享浏览
   */
  async recordView(userId: number, shareCode: string) {
    // 获取分享链接信息
    const shares = await executeQuery(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);

    if (shares.length === 0) {
      return { success: false };
    }

    const share = shares[0] as any;

    // 更新浏览次数
    await executeQuery(`
      UPDATE share_links SET view_count = view_count + 1 WHERE share_code = ?
    `, [shareCode]);

    // 记录浏览日志
    await executeQuery(`
      INSERT INTO share_view_logs (share_code, viewer_id, created_at)
      VALUES (?, ?, NOW())
    `, [shareCode, userId || 0]);

    // 如果是新用户且未注册，记录为潜在用户
    if (!userId) {
      await executeQuery(`
        INSERT INTO potential_users (share_code, inviter_id, status, created_at)
        VALUES (?, ?, 'pending', NOW())
      `, [shareCode, share.user_id]);
    }

    return { success: true };
  }

  /**
   * 获取分享详情
   */
  async getShareInfo(code: string) {
    const shares = await executeQuery(`
      SELECT s.*, u.nickname, u.avatar
      FROM share_links s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.share_code = ?
    `, [code]);

    if (shares.length === 0) {
      throw new Error('分享链接不存在');
    }

    const share = shares[0] as any;

    // 根据类型获取目标详情
    let targetInfo: any = null;
    if (share.target_type === 'order') {
      const orders = await executeQuery(`
        SELECT id, subject, hourly_rate, student_grade, address, description
        FROM orders WHERE id = ?
      `, [share.target_id]);
      targetInfo = orders[0];
    }

    return {
      share_info: share,
      target_info: targetInfo,
    };
  }

  /**
   * 获取我的分享记录
   */
  async getMyShares(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const shares = await executeQuery(`
      SELECT s.*, 
        CASE s.target_type 
          WHEN 'order' THEN o.subject 
          WHEN 'teacher' THEN tp.real_name 
          ELSE '' 
        END as target_name
      FROM share_links s
      LEFT JOIN orders o ON s.target_type = 'order' AND s.target_id = o.id
      LEFT JOIN teacher_profiles tp ON s.target_type = 'teacher' AND s.target_id = tp.user_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM share_links WHERE user_id = ?
    `, [userId]);

    return {
      list: shares,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取分享收益统计
   */
  async getShareEarnings(userId: number) {
    // 总分享次数
    const shareCount = await executeQuery(`
      SELECT COALESCE(SUM(share_count), 0) as total FROM share_links WHERE user_id = ?
    `, [userId]);

    // 总浏览次数
    const viewCount = await executeQuery(`
      SELECT COALESCE(SUM(view_count), 0) as total FROM share_links WHERE user_id = ?
    `, [userId]);

    // 通过分享转化的人数
    const conversions = await executeQuery(`
      SELECT COUNT(*) as total FROM potential_users 
      WHERE inviter_id = ? AND status = 'converted'
    `, [userId]);

    // 分享产生的佣金
    const commissions = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total FROM commissions
      WHERE user_id = ? AND level_type = 5
    `, [userId]);

    return {
      share_count: shareCount[0]?.total || 0,
      view_count: viewCount[0]?.total || 0,
      conversions: conversions[0]?.total || 0,
      total_earnings: commissions[0]?.total || 0,
    };
  }

  /**
   * 生成分享码
   */
  private generateCode(userId: number, type: string, targetId: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${type.charAt(0).toUpperCase()}${userId.toString(36)}${targetId.toString(36)}${timestamp}${random}`.toUpperCase();
  }
}
