export declare class MessageService {
    getConversations(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getMessages(conversationId: number, userId: number, page: number, pageSize: number): Promise<{
        list: never[];
        total: number;
        page?: undefined;
        pageSize?: undefined;
    } | {
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    sendMessage(conversationId: number, senderId: number, content: string, msgType: number): Promise<{
        id: any;
        conversationId: number;
        senderId: number;
        content: string;
        msgType: number;
        createdAt: Date;
    }>;
    getOrCreateOrderConversation(orderId: number, userId: number, targetUserId: number): Promise<any>;
    markAsRead(conversationId: number, userId: number): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: number): Promise<{
        messageUnread: number;
        reminderUnread: any;
    }>;
    createReminder(userId: number, fromUserId: number, type: number, targetId: number | null, content: string): Promise<{
        success: boolean;
    }>;
    getReminders(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    markRemindersRead(userId: number, ids?: number[]): Promise<{
        success: boolean;
    }>;
    sendSystemMessage(userId: number, content: string): Promise<{
        success: boolean;
    }>;
    robotReply(conversationId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
