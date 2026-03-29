"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let MessageService = class MessageService {
    async getConversations(userId, page, pageSize) {
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
    async getMessages(conversationId, userId, page, pageSize) {
        const offset = (page - 1) * pageSize;
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
    async sendMessage(conversationId, senderId, content, msgType) {
        const conv = await executeQuery(`
      SELECT * FROM conversations WHERE id = ?
    `, [conversationId]);
        if (conv.length === 0) {
            throw new Error('会话不存在');
        }
        const conversation = conv[0];
        if (conversation.user1_id !== senderId && conversation.user2_id !== senderId) {
            throw new Error('无权发送消息');
        }
        const result = await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type)
      VALUES (?, ?, ?, ?)
    `, [conversationId, senderId, content, msgType]);
        const isUser1 = conversation.user1_id === senderId;
        await executeQuery(`
      UPDATE conversations 
      SET last_message = ?, 
          last_message_at = NOW(),
          user1_unread = user1_unread + ?,
          user2_unread = user2_unread + ?
      WHERE id = ?
    `, [content.substring(0, 200), isUser1 ? 0 : 1, isUser1 ? 1 : 0, conversationId]);
        const targetUserId = isUser1 ? conversation.user2_id : conversation.user1_id;
        await this.createReminder(targetUserId, senderId, 3, conversation.order_id, '您有新消息');
        return {
            id: result.insertId,
            conversationId,
            senderId,
            content,
            msgType,
            createdAt: new Date(),
        };
    }
    async getOrCreateOrderConversation(orderId, userId, targetUserId) {
        const existing = await executeQuery(`
      SELECT * FROM conversations 
      WHERE order_id = ? AND 
            ((user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?))
    `, [orderId, userId, targetUserId, targetUserId, userId]);
        if (existing.length > 0) {
            return existing[0];
        }
        const result = await executeQuery(`
      INSERT INTO conversations (type, order_id, user1_id, user2_id, last_message_at)
      VALUES (0, ?, ?, ?, NOW())
    `, [orderId, Math.min(userId, targetUserId), Math.max(userId, targetUserId)]);
        return {
            id: result.insertId,
            orderId,
            user1Id: Math.min(userId, targetUserId),
            user2Id: Math.max(userId, targetUserId),
        };
    }
    async markAsRead(conversationId, userId) {
        const conv = await executeQuery(`
      SELECT * FROM conversations WHERE id = ?
    `, [conversationId]);
        if (conv.length === 0) {
            return { success: false };
        }
        const conversation = conv[0];
        if (conversation.user1_id === userId) {
            await executeQuery(`
        UPDATE conversations SET user1_unread = 0 WHERE id = ?
      `, [conversationId]);
        }
        else if (conversation.user2_id === userId) {
            await executeQuery(`
        UPDATE conversations SET user2_unread = 0 WHERE id = ?
      `, [conversationId]);
        }
        return { success: true };
    }
    async getUnreadCount(userId) {
        const result = await executeQuery(`
      SELECT 
        SUM(CASE WHEN user1_id = ? THEN user1_unread ELSE user2_unread END) as unread_count
      FROM conversations
      WHERE user1_id = ? OR user2_id = ?
    `, [userId, userId, userId]);
        const reminderResult = await executeQuery(`
      SELECT COUNT(*) as reminder_count FROM message_reminders 
      WHERE user_id = ? AND is_read = 0
    `, [userId]);
        return {
            messageUnread: parseInt(result[0]?.unread_count || '0'),
            reminderUnread: reminderResult[0]?.reminder_count || 0,
        };
    }
    async createReminder(userId, fromUserId, type, targetId, content) {
        await executeQuery(`
      INSERT INTO message_reminders (user_id, from_user_id, type, target_id, content)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, fromUserId, type, targetId, content]);
        return { success: true };
    }
    async getReminders(userId, page, pageSize) {
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
    async markRemindersRead(userId, ids) {
        if (ids && ids.length > 0) {
            await executeQuery(`
        UPDATE message_reminders SET is_read = 1 
        WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})
      `, [userId, ...ids]);
        }
        else {
            await executeQuery(`
        UPDATE message_reminders SET is_read = 1 WHERE user_id = ?
      `, [userId]);
        }
        return { success: true };
    }
    async sendSystemMessage(userId, content) {
        let conv = await executeQuery(`
      SELECT id FROM conversations 
      WHERE (user1_id = 1 AND user2_id = ?) OR (user1_id = ? AND user2_id = 1)
    `, [userId, userId]);
        let conversationId;
        if (conv.length > 0) {
            conversationId = conv[0].id;
        }
        else {
            const result = await executeQuery(`
        INSERT INTO conversations (type, user1_id, user2_id, last_message_at)
        VALUES (1, 1, ?, NOW())
      `, [userId]);
            conversationId = result.insertId;
        }
        await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
      VALUES (?, 1, ?, 2, 1)
    `, [conversationId, content]);
        await executeQuery(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = NOW(), user2_unread = user2_unread + 1
      WHERE id = ?
    `, [content.substring(0, 200), conversationId]);
        return { success: true };
    }
    async robotReply(conversationId, userId) {
        const users = await executeQuery(`
      SELECT membership_type, membership_expire_at FROM users WHERE id = ?
    `, [userId]);
        const user = users[0];
        const isMember = user?.membership_type === 1 &&
            new Date(user.membership_expire_at) > new Date();
        let replyContent;
        if (!isMember) {
            replyContent = '您好！我是棉花糖教育小助手。开通会员后即可查看联系方式、免费留言，还能享受更多特权哦！立即开通会员>>';
        }
        else {
            replyContent = '您好！我是棉花糖教育小助手。如有任何问题，请随时留言，我们会尽快处理。';
        }
        await executeQuery(`
      INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
      VALUES (?, 1, ?, 2, 1)
    `, [conversationId, replyContent]);
        return { success: true };
    }
};
exports.MessageService = MessageService;
exports.MessageService = MessageService = __decorate([
    (0, common_1.Injectable)()
], MessageService);
//# sourceMappingURL=message.service.js.map