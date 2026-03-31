import { TeacherService } from './teacher.service';
export declare class TeacherController {
    private readonly teacherService;
    constructor(teacherService: TeacherService);
    getTeachers(latitude?: string, longitude?: string, subject?: string, grade?: string, keyword?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getTeacherDetail(id: string, req: any): Promise<any>;
    getTeacherReviews(id: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    sendMessage(id: string, body: {
        content: string;
    }, req: any): Promise<{
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
    getAvailableOrders(req: any, latitude?: string, longitude?: string, subject?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    grabOrder(orderId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getMatchedOrders(req: any, status?: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    updateOrderStatus(orderId: string, body: {
        status: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
}
