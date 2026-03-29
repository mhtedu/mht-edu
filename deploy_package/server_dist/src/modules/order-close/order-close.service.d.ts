export declare class OrderCloseService {
    closeOrderByParent(data: {
        orderId: number;
        parentId: number;
        closeType: number;
        reason: string;
        feedback?: string;
    }): Promise<{
        success: boolean;
        membershipTerminated: boolean;
        message: string;
    }>;
    completeAndReview(data: {
        orderId: number;
        parentId: number;
        rating: number;
        content: string;
        tags?: string[];
        isAnonymous?: boolean;
    }): Promise<{
        success: boolean;
    }>;
    getCloseReasons(): {
        value: string;
        label: string;
    }[];
    getCloseHistory(orderId: number): Promise<any[]>;
    checkMembershipValid(userId: number): Promise<{
        valid: boolean;
        reason?: string;
        expireAt?: Date;
    }>;
}
