import { ShareService } from './share.service';
export declare class ShareController {
    private readonly shareService;
    constructor(shareService: ShareService);
    generateShareLink(body: {
        target_type: string;
        target_id: number;
    }, req: any): Promise<{
        share_code: any;
        share_url: string;
        qr_code: string;
    }>;
    recordShare(body: {
        share_code: string;
        channel: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    recordView(body: {
        share_code: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getShareInfo(code: string): Promise<{
        share_info: any;
        target_info: any;
    }>;
    getMyShares(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getShareEarnings(req: any): Promise<{
        share_count: any;
        view_count: any;
        conversions: any;
        total_earnings: any;
    }>;
}
