import { OrderService } from './order.service';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    createOrder(body: {
        subject: string;
        grade: string;
        student_info: string;
        schedule: string;
        address: string;
        latitude: number;
        longitude: number;
        budget: number;
        requirement?: string;
    }, req: any): Promise<{
        success: boolean;
        order_id: any;
        order_no: string;
    }>;
    getOrders(req: any, status?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getOrderDetail(id: string, req: any): Promise<any>;
    getOrderMatches(id: string, req: any): Promise<any[]>;
    selectTeacher(id: string, body: {
        teacherId: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, body: {
        status: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    cancelOrder(id: string, body: {
        reason?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    createReview(id: string, body: {
        rating: number;
        content: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getNearbyOrders(latitude: string, longitude: string, radius?: string, subject?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        page: number;
        pageSize: number;
    }>;
    getRecommendedTeachers(id: string, req: any): Promise<any[]>;
}
