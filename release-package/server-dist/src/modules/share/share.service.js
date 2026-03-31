"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let ShareService = class ShareService {
    async generateShareLink(userId, targetType, targetId) {
        const shareCode = this.generateCode(userId, targetType, targetId);
        const existing = await executeQuery(`
      SELECT * FROM share_links 
      WHERE user_id = ? AND target_type = ? AND target_id = ?
    `, [userId, targetType, targetId]);
        if (existing.length > 0) {
            return {
                share_code: existing[0].share_code,
                share_url: `pages/order-detail/index?id=${targetId}&share_code=${existing[0].share_code}`,
                qr_code: '',
            };
        }
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
    async recordShare(userId, shareCode, channel) {
        const shares = await executeQuery(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);
        if (shares.length === 0) {
            throw new Error('分享链接不存在');
        }
        const share = shares[0];
        await executeQuery(`
      UPDATE share_links SET share_count = share_count + 1 WHERE share_code = ?
    `, [shareCode]);
        await executeQuery(`
      INSERT INTO share_logs (share_code, user_id, channel, created_at)
      VALUES (?, ?, ?, NOW())
    `, [shareCode, userId || share.user_id, channel]);
        return { success: true };
    }
    async recordView(userId, shareCode) {
        const shares = await executeQuery(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);
        if (shares.length === 0) {
            return { success: false };
        }
        const share = shares[0];
        await executeQuery(`
      UPDATE share_links SET view_count = view_count + 1 WHERE share_code = ?
    `, [shareCode]);
        await executeQuery(`
      INSERT INTO share_view_logs (share_code, viewer_id, created_at)
      VALUES (?, ?, NOW())
    `, [shareCode, userId || 0]);
        if (!userId) {
            await executeQuery(`
        INSERT INTO potential_users (share_code, inviter_id, status, created_at)
        VALUES (?, ?, 'pending', NOW())
      `, [shareCode, share.user_id]);
        }
        return { success: true };
    }
    async getShareInfo(code) {
        const shares = await executeQuery(`
      SELECT s.*, u.nickname, u.avatar
      FROM share_links s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.share_code = ?
    `, [code]);
        if (shares.length === 0) {
            throw new Error('分享链接不存在');
        }
        const share = shares[0];
        let targetInfo = null;
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
    async getMyShares(userId, page, pageSize) {
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
    async getShareEarnings(userId) {
        const shareCount = await executeQuery(`
      SELECT COALESCE(SUM(share_count), 0) as total FROM share_links WHERE user_id = ?
    `, [userId]);
        const viewCount = await executeQuery(`
      SELECT COALESCE(SUM(view_count), 0) as total FROM share_links WHERE user_id = ?
    `, [userId]);
        const conversions = await executeQuery(`
      SELECT COUNT(*) as total FROM potential_users 
      WHERE inviter_id = ? AND status = 'converted'
    `, [userId]);
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
    generateCode(userId, type, targetId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `${type.charAt(0).toUpperCase()}${userId.toString(36)}${targetId.toString(36)}${timestamp}${random}`.toUpperCase();
    }
};
exports.ShareService = ShareService;
exports.ShareService = ShareService = __decorate([
    (0, common_1.Injectable)()
], ShareService);
//# sourceMappingURL=share.service.js.map