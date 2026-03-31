import { MessageService } from '../message/message.service';
export declare class TeacherService {
    private readonly messageService;
    constructor(messageService: MessageService);
    getTeachers(params: {
        latitude?: number;
        longitude?: number;
        subject?: string;
        grade?: string;
        keyword?: string;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getTeacherDetail(teacherId: number, userId: number): Promise<any>;
    getTeacherReviews(teacherId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    sendMessage(teacherId: number, userId: number, content: string): Promise<{
        need_pay: boolean;
        message: string;
        success?: undefined;
        conversation_id?: undefined;
    } | {
        success: boolean;
        conversation_id: any;
        need_pay?: undefined;
        message?: undefined;
    }>;
    getAvailableOrders(params: {
        userId: number;
        latitude?: number;
        longitude?: number;
        subject?: string;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    grabOrder(orderId: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getMatchedOrders(teacherId: number, page: number, pageSize: number, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    updateOrderStatus(orderId: number, teacherId: number, status: number): Promise<{
        success: boolean;
    }>;
}
