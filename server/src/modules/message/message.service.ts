import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class MessageService {
  /**
   * 获取会话列表
   */
  async getConversations(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const conversations = await executeQuery(`
      SELECT 
        c.*,
        CASE 
          WHEN c.user1_id = ? THEN u2.nickname
          ELSE u1.nickname
        END as target_nickname,
        CASE 
          WHEN c.user1_id = ? THEN u2.avatar
          ELSE u1.avatar
        END as target_avatar,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END as target_user_id,
        CASE 
          WHEN c.user1_id = ? THEN c.user1_unread
          ELSE c.user2_unread
        END as unread_count,
        o.subject as order_subject,
        o.status as order_status
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, userId, userId, userId, userId, pageSize, offset]);

    // 获取总数
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM conversations 
      WHERE user1_id = ? OR user2_id = ?
    `, [userId, userId]);

    return {
      list: conversations,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 获取会话消息
   */
  async getMessages(conversationId: number, userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    // 验证用户是否属于该会话
    const convCheck = await executeQuery(`
      SELECT id FROM conversations 
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `, [conversationId, userId, userId]);

    if (convCheck.length === 0) {
      return { list: [], total: 0 };
    }

    const messages = await executeQuery(`
      SELECT m.*, u.nickname as sender_nickname, u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [conversationId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?
    `, [conversationId]);

    return {
      list: messages.reverse(),
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 发送消息
   */
  async sendMessage(conversationId: number, senderId: number, content: string, msgType: number) {
    // 验证会话
    const conv = await executeQuery(`
      SELECT * FROM conversations WHERE id = ?
    `, [conversationId]);

    if (conv.length === 0) {
      throw new Error('会话不存在');
    }

    const conversation = conv[0] as any;

    // 检查发送者是否是会话参与者
    if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
      throw new Error('无权发送消息');
    }

    // 插入消息
    const result = await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type)
      VALUES (?, ?, ?, ?)
    `, [conversationId, senderId, content, msgType]);

    // 更新会话
    const isUser1 = conversation.user1_id === senderId;
    await executeQuery(`
      UPDATE conversations 
      SET last_message = ?, 
          last_message_at = NOW(),
          user1_unread = user1_unread + ?,
          user2_unread = user2_unread + ?
      WHERE id = ?
    `, [content.substring(0, 200), isUser1 ? 0 : 1, isUser1 ? 1 : 0, conversationId]);

    // 创建提醒
    const targetUserId = isUser1 ? conversation.user2_id : conversation.user1_id;
    await this.createReminder(targetUserId, senderId, 3, conversation.order_id, '您有新消息');

    return {
      id: (result as any).insertId,
      conversationId,
      senderId,
      content,
      msgType,
      createdAt: new Date(),
    };
  }

  /**
   * 创建或获取订单会话
   */
  async getOrCreateOrderConversation(orderId: number, userId: number, targetUserId: number) {
    // 查找现有会话
    const existing = await executeQuery(`
      SELECT * FROM conversations 
      WHERE order_id = ? AND 
            ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    `, [orderId, userId, targetUserId, targetUserId, userId]);

    if (existing.length > 0) {
      return existing[0];
    }

    // 创建新会话
    const result = await executeQuery(`
      INSERT INTO conversations (type, order_id, user1_id, user2_id, last_message_at)
      VALUES (0, ?, ?, ?, NOW())
    `, [orderId, Math.min(userId, targetUserId), Math.max(userId, targetUserId)]);

    return {
      id: (result as any).insertId,
      orderId,
      user1Id: Math.min(userId, targetUserId),
      user2Id: Math.max(userId, targetUserId),
    };
  }

  /**
   * 标记会话已读
   */
  async markAsRead(conversationId: number, userId: number) {
    const conv = await executeQuery(`
      SELECT * FROM conversations WHERE id = ?
    `, [conversationId]);

    if (conv.length === 0) {
      return { success: false };
    }

    const conversation = conv[0] as any;

    if (conversation.user1_id === userId) {
      await executeQuery(`
        UPDATE conversations SET user1_unread = 0 WHERE id = ?
      `, [conversationId]);
    } else if (conversation.user2_id === userId) {
      await executeQuery(`
        UPDATE conversations SET user2_unread = 0 WHERE id = ?
      `, [conversationId]);
    }

    return { success: true };
  }

  /**
   * 获取未读消息数
   */
  async getUnreadCount(userId: number) {
    const result = await executeQuery(`
      SELECT 
        SUM(CASE WHEN user1_id = ? THEN user1_unread ELSE user2_unread END) as unread_count
      FROM conversations
      WHERE user1_id = ? OR user2_id = ?
    `, [userId, userId, userId]);

    // 获取提醒未读数
    const reminderResult = await executeQuery(`
      SELECT COUNT(*) as reminder_count FROM message_reminders 
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    return {
      messageUnread: parseInt(result[0]?.unread_count || '0'),
      reminderUnread: reminderResult[0]?.reminder_count || 0,
    };
  }

  /**
   * 创建消息提醒
   */
  async createReminder(
    userId: number,
    fromUserId: number,
    type: number,
    targetId: number | null,
    content: string,
  ) {
    await executeQuery(`
      INSERT INTO message_reminders (user_id, from_user_id, type, target_id, content)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, fromUserId, type, targetId, content]);

    return { success: true };
  }

  /**
   * 获取提醒列表
   */
  async getReminders(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const reminders = await executeQuery(`
      SELECT r.*, u.nickname as from_nickname, u.avatar as from_avatar
      FROM message_reminders r
      LEFT JOIN users u ON r.from_user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM message_reminders WHERE user_id = ?
    `, [userId]);

    return {
      list: reminders,
      total: countResult[0]?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 标记提醒已读
   */
  async markRemindersRead(userId: number, ids?: number[]) {
    if (ids && ids.length > 0) {
      await executeQuery(`
        UPDATE message_reminders SET is_read = 1 
        WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})
      `, [userId, ...ids]);
    } else {
      await executeQuery(`
        UPDATE message_reminders SET is_read = 1 WHERE user_id = ?
      `, [userId]);
    }

    return { success: true };
  }

  /**
   * 发送系统消息（机器人）
   */
  async sendSystemMessage(userId: number, content: string) {
    // 获取或创建与系统的会话
    let conv = await executeQuery(`
      SELECT id FROM conversations 
      WHERE (user1_id = 1 AND user2_id = ?) OR (user1_id = ? AND user2_id = 1)
    `, [userId, userId]);

    let conversationId;
    if (conv.length > 0) {
      conversationId = (conv[0] as any).id;
    } else {
      const result = await executeQuery(`
        INSERT INTO conversations (type, user1_id, user2_id, last_message_at)
        VALUES (1, 1, ?, NOW())
      `, [userId]);
      conversationId = (result as any).insertId;
    }

    // 插入系统消息
    await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
      VALUES (?, 1, ?, 2, 1)
    `, [conversationId, content]);

    // 更新会话
    await executeQuery(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = NOW(), user2_unread = user2_unread + 1
      WHERE id = ?
    `, [content.substring(0, 200), conversationId]);

    return { success: true };
  }

  /**
   * 机器人自动回复
   */
  async robotReply(conversationId: number, userId: number) {
    // 检查用户是否是会员
    const users = await executeQuery(`
      SELECT membership_type, membership_expire_at FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    const isMember = user?.membership_type === 1 && 
                     new Date(user.membership_expire_at) > new Date();

    let replyContent: string;
    if (!isMember) {
      // 非会员引导开通
      replyContent = '您好！我是棉花糖教育小助手。开通会员后即可查看联系方式、免费留言，还能享受更多特权哦！立即开通会员>>';
    } else {
      // 会员提示
      replyContent = '您好！我是棉花糖教育小助手。如有任何问题，请随时留言，我们会尽快处理。';
    }

    // 发送机器人消息
    await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
      VALUES (?, 1, ?, 2, 1)
    `, [conversationId, replyContent]);

    return { success: true };
  }
}
