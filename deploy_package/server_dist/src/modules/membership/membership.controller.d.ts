import { MembershipService } from './membership.service';
export declare class MembershipController {
    private readonly membershipService;
    constructor(membershipService: MembershipService);
    getPlans(): Promise<any[]>;
    getPlansByRole(role: string): Promise<any[]>;
    getMembershipInfo(userId: string): Promise<{
        is_member: any;
        membership_type: any;
        expire_at: any;
        days_remaining: number;
    }>;
    buyMembership(body: {
        user_id: number;
        plan_id: number;
    }): Promise<{
        payment_id: any;
        payment_no: string;
        amount: any;
        plan_name: any;
    }>;
    paymentCallback(body: {
        payment_no: string;
        transaction_id: string;
    }): Promise<{
        success: boolean;
        expire_at: Date;
    }>;
}
