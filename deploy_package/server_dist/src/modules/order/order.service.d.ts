import { MessageService } from '../message/message.service';
export declare class OrderService {
    private readonly messageService;
    constructor(messageService: MessageService);
    createOrder(userId: number, data: any): Promise<{
        success: boolean;
        order_id: any;
        order_no: string;
    }>;
    getOrdersByParent(parentId: number, page: number, pageSize: number, status?: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getOrderDetail(orderId: number, userId: number): Promise<any>;
    getOrderMatches(orderId: number, userId: number): Promise<any[]>;
    selectTeacher(orderId: number, userId: number, teacherId: number): Promise<{
        success: boolean;
    }>;
    updateOrderStatus(orderId: number, userId: number, status: number): Promise<{
        success: boolean;
    }>;
    cancelOrder(orderId: number, userId: number, reason?: string): Promise<{
        success: boolean;
    }>;
    createReview(orderId: number, userId: number, rating: number, content: string): Promise<{
        success: boolean;
    }>;
    getNearbyOrders(params: {
        latitude: number;
        longitude: number;
        radius: number;
        subject?: string;
        page: number;
        pageSize: number;
    }): Promise<{
        list: any[];
        page: number;
        pageSize: number;
    }>;
    getRecommendedTeachers(orderId: number, userId: number): Promise<any[]>;
    private generateOrderNo;
}
