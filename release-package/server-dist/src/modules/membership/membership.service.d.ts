export declare class MembershipService {
    getMembershipPlans(role?: number): Promise<any[]>;
    buyMembership(userId: number, planId: number): Promise<{
        payment_id: any;
        payment_no: string;
        amount: any;
        plan_name: any;
    }>;
    handlePaymentSuccess(paymentNo: string, transactionId: string): Promise<{
        success: boolean;
        expire_at: Date;
    }>;
    private triggerCommission;
    getUserMembership(userId: number): Promise<{
        is_member: any;
        membership_type: any;
        expire_at: any;
        days_remaining: number;
    }>;
}
