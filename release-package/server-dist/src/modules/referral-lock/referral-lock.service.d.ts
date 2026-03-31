export declare class ReferralLockService {
    lockRelation(userId: number, lockerId: number, lockType: string, sourceId?: number): Promise<{
        locked: boolean;
        reason: string;
    }>;
    lockByShareCode(userId: number, shareCode: string): Promise<{
        locked: boolean;
        reason: string;
    }>;
    lockByInviteCode(userId: number, inviteCode: string): Promise<{
        locked: boolean;
        reason: string;
    }>;
    private updateUserInviter;
    private logLockAction;
    getLocker(userId: number): Promise<any>;
    isLocked(userId: number): Promise<boolean>;
    getInviteStats(userId: number): Promise<{
        total: any;
        teachers: any;
        parents: any;
        by_type: any[];
    }>;
    private parseInviteCode;
    generateInviteCode(userId: number): string;
}
