"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralLockService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let ReferralLockService = class ReferralLockService {
    async lockRelation(userId, lockerId, lockType, sourceId) {
        if (userId === lockerId) {
            return { locked: false, reason: '不能锁定自己' };
        }
        const existing = await executeQuery(`
      SELECT * FROM referral_locks WHERE user_id = ?
    `, [userId]);
        if (existing.length > 0) {
            const lock = existing[0];
            return {
                locked: false,
                reason: `已被用户${lock.locker_id}于${lock.created_at}锁定`
            };
        }
        await executeQuery(`
      INSERT INTO referral_locks (user_id, locker_id, lock_type, lock_source_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, lockerId, lockType, sourceId || null]);
        await this.updateUserInviter(userId, lockerId);
        await this.logLockAction(userId, lockerId, lockType, sourceId);
        return { locked: true, reason: '锁定成功' };
    }
    async lockByShareCode(userId, shareCode) {
        const shares = await executeQuery(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);
        if (shares.length === 0) {
            return { locked: false, reason: '分享码无效' };
        }
        const share = shares[0];
        return this.lockRelation(userId, share.user_id, share.target_type, share.target_id);
    }
    async lockByInviteCode(userId, inviteCode) {
        const inviterId = this.parseInviteCode(inviteCode);
        if (!inviterId) {
            return { locked: false, reason: '邀请码无效' };
        }
        return this.lockRelation(userId, inviterId, 'invite_link');
    }
    async updateUserInviter(userId, inviterId) {
        const inviterInfo = await executeQuery(`
      SELECT inviter_id FROM users WHERE id = ?
    `, [inviterId]);
        const inviter2ndId = inviterInfo.length > 0 ? inviterInfo[0].inviter_id : null;
        await executeQuery(`
      UPDATE users 
      SET inviter_id = ?, inviter_2nd_id = ?, updated_at = NOW()
      WHERE id = ? AND inviter_id IS NULL
    `, [inviterId, inviter2ndId, userId]);
    }
    async logLockAction(userId, lockerId, lockType, sourceId) {
        await executeQuery(`
      INSERT INTO referral_lock_logs (user_id, locker_id, lock_type, lock_source_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, lockerId, lockType, sourceId || null]);
    }
    async getLocker(userId) {
        const locks = await executeQuery(`
      SELECT r.*, u.nickname, u.avatar, u.mobile
      FROM referral_locks r
      LEFT JOIN users u ON r.locker_id = u.id
      WHERE r.user_id = ?
    `, [userId]);
        return locks.length > 0 ? locks[0] : null;
    }
    async isLocked(userId) {
        const locks = await executeQuery(`
      SELECT id FROM referral_locks WHERE user_id = ?
    `, [userId]);
        return locks.length > 0;
    }
    async getInviteStats(userId) {
        const level1 = await executeQuery(`
      SELECT COUNT(*) as count FROM referral_locks WHERE locker_id = ?
    `, [userId]);
        const byType = await executeQuery(`
      SELECT lock_type, COUNT(*) as count 
      FROM referral_locks 
      WHERE locker_id = ?
      GROUP BY lock_type
    `, [userId]);
        const teachers = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM referral_locks r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.locker_id = ? AND u.role = 1
    `, [userId]);
        const parents = await executeQuery(`
      SELECT COUNT(*) as count 
      FROM referral_locks r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.locker_id = ? AND u.role = 0
    `, [userId]);
        return {
            total: level1[0]?.count || 0,
            teachers: teachers[0]?.count || 0,
            parents: parents[0]?.count || 0,
            by_type: byType,
        };
    }
    parseInviteCode(code) {
        try {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let num = 0;
            for (let i = 0; i < code.length; i++) {
                const index = chars.indexOf(code[i].toUpperCase());
                if (index === -1)
                    continue;
                num = num * chars.length + index;
            }
            return num > 0 ? num : null;
        }
        catch {
            return null;
        }
    }
    generateInviteCode(userId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        let num = userId;
        while (num > 0 || code.length < 4) {
            code = chars[num % chars.length] + code;
            num = Math.floor(num / chars.length);
        }
        return code.padStart(6, 'X');
    }
};
exports.ReferralLockService = ReferralLockService;
exports.ReferralLockService = ReferralLockService = __decorate([
    (0, common_1.Injectable)()
], ReferralLockService);
//# sourceMappingURL=referral-lock.service.js.map