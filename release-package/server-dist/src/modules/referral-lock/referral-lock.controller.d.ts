import { ReferralLockService } from './referral-lock.service';
export declare class ReferralLockController {
    private readonly referralLockService;
    constructor(referralLockService: ReferralLockService);
    lockByShareCode(req: any, body: {
        shareCode: string;
    }): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: {
            locked: boolean;
        };
    }>;
    lockByInviteCode(req: any, body: {
        inviteCode: string;
    }): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: {
            locked: boolean;
        };
    }>;
    lockRelation(req: any, body: {
        lockerId: number;
        lockType: string;
        sourceId?: number;
    }): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: {
            locked: boolean;
        };
    }>;
    isLocked(req: any): Promise<{
        code: number;
        data: {
            is_locked: boolean;
        };
    }>;
    getMyLocker(req: any): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        data: any;
        msg?: undefined;
    }>;
    getInviteStats(req: any): Promise<{
        code: number;
        data: {
            invite_code: string;
            total: any;
            teachers: any;
            parents: any;
            by_type: any[];
        };
    }>;
    getMyInviteCode(req: any): Promise<{
        code: number;
        data: {
            invite_code: string;
            invite_link: string;
        };
    }>;
}
