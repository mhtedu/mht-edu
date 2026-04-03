import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


/**
 * 分销关系锁定服务
 * 核心规则：第一次点击即锁定，永久有效，不可覆盖
 */
@Injectable()
export class ReferralLockService {
  /**
   * 锁定分销关系（核心方法）
   * @param userId 被锁定的用户ID（访问者）
   * @param lockerId 锁定者ID（分享者）
   * @param lockType 锁定类型：teacher_profile/order/activity/elite_class/invite_link/qrcode
   * @param sourceId 来源ID（可选）
   * @returns 是否成功锁定（首次锁定返回true，已存在返回false）
   */
  async lockRelation(
    userId: number,
    lockerId: number,
    lockType: string,
    sourceId?: number
  ): Promise<{ locked: boolean; reason: string }> {
    // 不能锁定自己
    if (userId === lockerId) {
      return { locked: false, reason: '不能锁定自己' };
    }

    // 检查是否已有锁定关系
    const [existing] = await db.query(`
      SELECT * FROM referral_locks WHERE user_id = ?
    `, [userId]);

    if (existing.length > 0) {
      const lock = existing[0] as any;
      return { 
        locked: false, 
        reason: `已被用户${lock.locker_id}于${lock.created_at}锁定` 
      };
    }

    // 创建锁定关系
    await db.query(`
      INSERT INTO referral_locks (user_id, locker_id, lock_type, lock_source_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, lockerId, lockType, sourceId || null]);

    // 同时更新用户表的邀请关系
    await this.updateUserInviter(userId, lockerId);

    // 记录锁定日志
    await this.logLockAction(userId, lockerId, lockType, sourceId);

    return { locked: true, reason: '锁定成功' };
  }

  /**
   * 通过分享码锁定分销关系
   */
  async lockByShareCode(
    userId: number,
    shareCode: string
  ): Promise<{ locked: boolean; reason: string }> {
    // 获取分享码信息
    const [shares] = await db.query(`
      SELECT * FROM share_links WHERE share_code = ?
    `, [shareCode]);

    if (shares.length === 0) {
      return { locked: false, reason: '分享码无效' };
    }

    const share = shares[0] as any;
    return this.lockRelation(userId, share.user_id, share.target_type, share.target_id);
  }

  /**
   * 通过邀请码锁定分销关系
   */
  async lockByInviteCode(
    userId: number,
    inviteCode: string
  ): Promise<{ locked: boolean; reason: string }> {
    // 解析邀请码获取邀请人ID
    const inviterId = this.parseInviteCode(inviteCode);
    if (!inviterId) {
      return { locked: false, reason: '邀请码无效' };
    }

    return this.lockRelation(userId, inviterId, 'invite_link');
  }

  /**
   * 更新用户表的邀请关系
   */
  private async updateUserInviter(userId: number, inviterId: number) {
    // 获取邀请人的一级邀请人（作为二级邀请人）
    const [inviterInfo] = await db.query(`
      SELECT inviter_id FROM users WHERE id = ?
    `, [inviterId]);

    const inviter2ndId = inviterInfo.length > 0 ? (inviterInfo[0] as any).inviter_id : null;

    // 更新用户的邀请关系
    await db.query(`
      UPDATE users 
      SET inviter_id = ?, inviter_2nd_id = ?, updated_at = NOW()
      WHERE id = ? AND inviter_id IS NULL
    `, [inviterId, inviter2ndId, userId]);
  }

  /**
   * 记录锁定日志
   */
  private async logLockAction(
    userId: number,
    lockerId: number,
    lockType: string,
    sourceId?: number
  ) {
    await db.query(`
      INSERT INTO referral_lock_logs (user_id, locker_id, lock_type, lock_source_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, lockerId, lockType, sourceId || null]);
  }

  /**
   * 获取用户的锁定者（推荐人）
   */
  async getLocker(userId: number): Promise<any> {
    const [locks] = await db.query(`
      SELECT r.*, u.nickname, u.avatar, u.mobile
      FROM referral_locks r
      LEFT JOIN users u ON r.locker_id = u.id
      WHERE r.user_id = ?
    `, [userId]);

    return locks.length > 0 ? locks[0] : null;
  }

  /**
   * 检查用户是否已被锁定
   */
  async isLocked(userId: number): Promise<boolean> {
    const [locks] = await db.query(`
      SELECT id FROM referral_locks WHERE user_id = ?
    `, [userId]);

    return locks.length > 0;
  }

  /**
   * 获取邀请人的邀请统计
   */
  async getInviteStats(userId: number) {
    // 一级邀请人数
    const [level1] = await db.query(`
      SELECT COUNT(*) as count FROM referral_locks WHERE locker_id = ?
    `, [userId]);

    // 按类型统计
    const [byType] = await db.query(`
      SELECT lock_type, COUNT(*) as count 
      FROM referral_locks 
      WHERE locker_id = ?
      GROUP BY lock_type
    `, [userId]);

    // 邀请的教师数
    const [teachers] = await db.query(`
      SELECT COUNT(*) as count 
      FROM referral_locks r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.locker_id = ? AND u.role = 1
    `, [userId]);

    // 邀请的家长数
    const [parents] = await db.query(`
      SELECT COUNT(*) as count 
      FROM referral_locks r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.locker_id = ? AND u.role = 0
    `, [userId]);

    return {
      total: (level1[0] as any)?.count || 0,
      teachers: (teachers[0] as any)?.count || 0,
      parents: (parents[0] as any)?.count || 0,
      by_type: byType,
    };
  }

  /**
   * 解析邀请码
   */
  private parseInviteCode(code: string): number | null {
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let num = 0;
      
      for (let i = 0; i < code.length; i++) {
        const index = chars.indexOf(code[i].toUpperCase());
        if (index === -1) continue;
        num = num * chars.length + index;
      }
      
      return num > 0 ? num : null;
    } catch {
      return null;
    }
  }

  /**
   * 生成邀请码（基于用户ID）
   */
  generateInviteCode(userId: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    let num = userId;
    
    while (num > 0 || code.length < 4) {
      code = chars[num % chars.length] + code;
      num = Math.floor(num / chars.length);
    }
    
    return code.padStart(6, 'X');
  }
}
