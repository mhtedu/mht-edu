import { DistributionService } from './distribution.service';
export declare class DistributionController {
    private readonly distributionService;
    constructor(distributionService: DistributionService);
    getInviteInfo(userId: string): Promise<{
        user: {
            id: any;
            nickname: any;
            avatar: any;
        };
        inviter_id: any;
        invite_code: string;
        invite_link: string;
        statistics: {
            level1_count: number;
            level2_count: number;
            total_commission: string;
            settled_commission: string;
            withdrawn_commission: string;
            available_commission: string;
        };
    }>;
    bindInviter(body: {
        user_id: number;
        invite_code: string;
    }): Promise<{
        success: boolean;
        inviter_id: number;
    }>;
    getCommissionList(userId: string, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: number | null;
        page: number;
        page_size: number;
        total_pages: number;
    }>;
    applyWithdraw(body: {
        user_id: number;
        amount: number;
        account_info: {
            type: string;
            account: string;
            name: string;
        };
    }): Promise<{
        success: boolean;
        amount: number;
        message: string;
    }>;
    getInviteList(userId: string, level?: string, page?: string, pageSize?: string): Promise<{
        list: {
            id: any;
            nickname: any;
            avatar: any;
            created_at: any;
        }[];
        total: number | null;
        page: number;
        page_size: number;
        level: 1 | 2;
    }>;
}
