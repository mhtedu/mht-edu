export declare class DistributionService {
    getInviteInfo(userId: number): Promise<{
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
    private generateInviteCode;
    bindInviter(userId: number, inviteCode: string): Promise<{
        success: boolean;
        inviter_id: number;
    }>;
    private parseInviteCode;
    getCommissionList(userId: number, page?: number, pageSize?: number): Promise<{
        list: any[];
        total: number | null;
        page: number;
        page_size: number;
        total_pages: number;
    }>;
    applyWithdraw(userId: number, amount: number, accountInfo: {
        type: string;
        account: string;
        name: string;
    }): Promise<{
        success: boolean;
        amount: number;
        message: string;
    }>;
    getInviteList(userId: number, level?: 1 | 2, page?: number, pageSize?: number): Promise<{
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
