export declare class ShareService {
    generateShareLink(userId: number, targetType: string, targetId: number): Promise<{
        share_code: any;
        share_url: string;
        qr_code: string;
    }>;
    recordShare(userId: number, shareCode: string, channel: string): Promise<{
        success: boolean;
    }>;
    recordView(userId: number, shareCode: string): Promise<{
        success: boolean;
    }>;
    getShareInfo(code: string): Promise<{
        share_info: any;
        target_info: any;
    }>;
    getMyShares(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getShareEarnings(userId: number): Promise<{
        share_count: any;
        view_count: any;
        conversions: any;
        total_earnings: any;
    }>;
    private generateCode;
}
