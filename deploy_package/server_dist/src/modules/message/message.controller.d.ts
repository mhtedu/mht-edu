import { MessageService } from './message.service';
export declare class MessageController {
    private readonly messageService;
    constructor(messageService: MessageService);
    getConversations(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getMessages(req: any, conversationId: string, page?: string, pageSize?: string): Promise<{
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
    sendMessage(req: any, body: {
        conversationId: number;
        content: string;
        msgType?: number;
    }): Promise<{
        id: any;
        conversationId: number;
        senderId: number;
        content: string;
        msgType: number;
        createdAt: Date;
    }>;
    getOrCreateOrderConversation(req: any, body: {
        orderId: number;
        targetUserId: number;
    }): Promise<any>;
    markAsRead(req: any, conversationId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(req: any): Promise<{
        messageUnread: number;
        reminderUnread: any;
    }>;
    getReminders(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    markRemindersRead(req: any, body: {
        ids?: number[];
    }): Promise<{
        success: boolean;
    }>;
}
