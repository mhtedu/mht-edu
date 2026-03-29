import { OrderCloseService } from './order-close.service';
export declare class OrderCloseController {
    private readonly orderCloseService;
    constructor(orderCloseService: OrderCloseService);
    getCloseReasons(): {
        value: string;
        label: string;
    }[];
    closeOrder(body: {
        orderId: number;
        closeType: number;
        reason: string;
        feedback?: string;
    }, req: any): Promise<{
        success: boolean;
        membershipTerminated: boolean;
        message: string;
    }>;
    completeAndReview(body: {
        orderId: number;
        rating: number;
        content: string;
        tags?: string[];
        isAnonymous?: boolean;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getCloseHistory(orderId: string): Promise<any[]>;
    checkMembership(req: any): Promise<{
        valid: boolean;
        reason?: string;
        expireAt?: Date;
    }>;
}
