import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';

@Injectable()
export class InvitationService {
  /**
   * 发送邀约
   */
  async sendInvitation(params: {
    fromUserId: number;
    toUserId: number;
    orderId?: number;
    invitationType: string;
    message?: string;
    trialTime?: string;
    trialAddress?: string;
  }) {
    const { fromUserId, toUserId, orderId, invitationType, message, trialTime, trialAddress } = params;

    // 检查是否已存在未处理的邀约
    const [existing] = await db.query(
      `SELECT id FROM invitations 
       WHERE from_user_id = ? AND to_user_id = ? AND invitation_type = ? AND status = 0`,
      [fromUserId, toUserId, invitationType]
    );

    if (existing && (existing as any[]).length > 0) {
      throw new Error('已存在待处理的邀约');
    }

    // 创建邀约
    const insertId = await db.update(
      `INSERT INTO invitations (from_user_id, to_user_id, order_id, invitation_type, message, trial_time, trial_address, expired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [fromUserId, toUserId, orderId || null, invitationType, message || null, trialTime || null, trialAddress || null]
    );

    // 获取创建的邀约详情
    const [invitation] = await db.query(
      `SELECT i.*, 
              u1.nickname as from_nickname, u1.avatar as from_avatar, u1.mobile as from_mobile, u1.wechat_id as from_wechat_id,
              u2.nickname as to_nickname, u2.avatar as to_avatar, u2.mobile as to_mobile, u2.wechat_id as to_wechat_id
       FROM invitations i
       LEFT JOIN users u1 ON i.from_user_id = u1.id
       LEFT JOIN users u2 ON i.to_user_id = u2.id
       WHERE i.id = ?`,
      [insertId]
    );

    return (invitation as any[])[0];
  }

  /**
   * 获取邀约列表
   */
  async getInvitations(userId: number, type: 'sent' | 'received', page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const whereClause = type === 'sent' ? 'i.from_user_id = ?' : 'i.to_user_id = ?';
    const countWhereClause = type === 'sent' ? 'from_user_id = ?' : 'to_user_id = ?';

    const [invitations] = await db.query(
      `SELECT i.*, 
              u1.nickname as from_nickname, u1.avatar as from_avatar, u1.role as from_role,
              u2.nickname as to_nickname, u2.avatar as to_avatar, u2.role as to_role,
              o.subject as order_subject, o.student_grade as order_grade
       FROM invitations i
       LEFT JOIN users u1 ON i.from_user_id = u1.id
       LEFT JOIN users u2 ON i.to_user_id = u2.id
       LEFT JOIN orders o ON i.order_id = o.id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM invitations WHERE ${countWhereClause}`,
      [userId]
    );

    return {
      list: invitations,
      total: (countResult as any[])[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取邀约详情
   */
  async getInvitationDetail(invitationId: number, userId: number) {
    const [invitations] = await db.query(
      `SELECT i.*, 
              u1.nickname as from_nickname, u1.avatar as from_avatar, u1.mobile as from_mobile, 
              u1.wechat_id as from_wechat_id, u1.role as from_role,
              u2.nickname as to_nickname, u2.avatar as to_avatar, u2.mobile as to_mobile, 
              u2.wechat_id as to_wechat_id, u2.role as to_role,
              o.subject as order_subject, o.student_grade as order_grade
       FROM invitations i
       LEFT JOIN users u1 ON i.from_user_id = u1.id
       LEFT JOIN users u2 ON i.to_user_id = u2.id
       LEFT JOIN orders o ON i.order_id = o.id
       WHERE i.id = ? AND (i.from_user_id = ? OR i.to_user_id = ?)`,
      [invitationId, userId, userId]
    );

    if ((invitations as any[]).length === 0) {
      throw new Error('邀约不存在');
    }

    const invitation = (invitations as any[])[0];

    // 如果已同意，返回联系方式
    if (invitation.status === 1) {
      invitation.contact_info = {
        mobile: invitation.to_mobile,
        wechat_id: invitation.to_wechat_id,
      };
    }

    return invitation;
  }

  /**
   * 同意邀约
   */
  async acceptInvitation(invitationId: number, userId: number, responseMessage?: string) {
    // 检查邀约是否存在且是发给自己的
    const [invitations] = await db.query(
      `SELECT * FROM invitations WHERE id = ? AND to_user_id = ? AND status = 0`,
      [invitationId, userId]
    );

    if ((invitations as any[]).length === 0) {
      throw new Error('邀约不存在或已处理');
    }

    // 更新状态
    await db.update(
      `UPDATE invitations SET status = 1, response_message = ?, updated_at = NOW() WHERE id = ?`,
      [responseMessage || null, invitationId]
    );

    return this.getInvitationDetail(invitationId, userId);
  }

  /**
   * 拒绝邀约
   */
  async rejectInvitation(invitationId: number, userId: number, responseMessage?: string) {
    // 检查邀约是否存在且是发给自己的
    const [invitations] = await db.query(
      `SELECT * FROM invitations WHERE id = ? AND to_user_id = ? AND status = 0`,
      [invitationId, userId]
    );

    if ((invitations as any[]).length === 0) {
      throw new Error('邀约不存在或已处理');
    }

    // 更新状态
    await db.update(
      `UPDATE invitations SET status = 2, response_message = ?, updated_at = NOW() WHERE id = ?`,
      [responseMessage || null, invitationId]
    );

    return { success: true, message: '已拒绝邀约' };
  }

  /**
   * 获取未处理邀约数量
   */
  async getUnreadCount(userId: number) {
    const [result] = await db.query(
      `SELECT COUNT(*) as count FROM invitations WHERE to_user_id = ? AND status = 0`,
      [userId]
    );
    return (result as any[])[0]?.count || 0;
  }

  /**
   * 获取邀约统计
   */
  async getInvitationStats(userId: number) {
    const [sentResult] = await db.query(
      `SELECT status, COUNT(*) as count FROM invitations WHERE from_user_id = ? GROUP BY status`,
      [userId]
    );

    const [receivedResult] = await db.query(
      `SELECT status, COUNT(*) as count FROM invitations WHERE to_user_id = ? GROUP BY status`,
      [userId]
    );

    const sentStats = { total: 0, pending: 0, accepted: 0, rejected: 0 };
    const receivedStats = { total: 0, pending: 0, accepted: 0, rejected: 0 };

    (sentResult as any[]).forEach((item: any) => {
      sentStats.total += item.count;
      if (item.status === 0) sentStats.pending = item.count;
      if (item.status === 1) sentStats.accepted = item.count;
      if (item.status === 2) sentStats.rejected = item.count;
    });

    (receivedResult as any[]).forEach((item: any) => {
      receivedStats.total += item.count;
      if (item.status === 0) receivedStats.pending = item.count;
      if (item.status === 1) receivedStats.accepted = item.count;
      if (item.status === 2) receivedStats.rejected = item.count;
    });

    return { sent: sentStats, received: receivedStats };
  }
}
