export declare class UserService {
    getUserInfo(userId: number): Promise<any>;
    updateUserInfo(userId: number, data: {
        nickname?: string;
        avatar?: string;
    }): Promise<{
        success: boolean;
    }>;
    updateLocation(userId: number, data: {
        latitude: number;
        longitude: number;
        address?: string;
    }): Promise<{
        success: boolean;
    }>;
    switchRole(userId: number, role: number): Promise<{
        success: boolean;
    }>;
    getMembershipInfo(userId: number): Promise<{
        is_member: boolean;
        expire_at: any;
        remaining_days: number;
        today_usage: any;
    }>;
    getMembershipPlans(role: number): Promise<any[]>;
    getEarnings(userId: number): Promise<any>;
    getEarningRecords(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    requestWithdrawal(userId: number, amount: number, bankInfo: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getInviteInfo(userId: number): Promise<any>;
    getInviteList(userId: number, page: number, pageSize: number): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getTeacherProfile(userId: number): Promise<any>;
    updateTeacherProfile(userId: number, data: any): Promise<{
        success: boolean;
    }>;
    getOrgProfile(userId: number): Promise<any>;
    updateOrgProfile(userId: number, data: any): Promise<{
        success: boolean;
    }>;
    bindInviter(userId: number, inviteCode: string): Promise<{
        success: boolean;
    }>;
    uploadAvatar(userId: number, file: any): Promise<{
        url: string;
    }>;
    getSettings(userId: number): Promise<any>;
    updateSettings(userId: number, key: string, value: any): Promise<{
        success: boolean;
    }>;
    getTeachersList(params: {
        latitude?: number;
        longitude?: number;
        subject?: string;
        grade?: string;
        keyword?: string;
        city?: string;
        page: number;
        pageSize: number;
    }): Promise<any[]>;
    getOrdersList(params: {
        latitude?: number;
        longitude?: number;
        subject?: string;
        city?: string;
        page: number;
        pageSize: number;
    }): Promise<any[]>;
    login(mobile: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            token: string;
            user: {
                id: any;
                nickname: any;
                mobile: any;
                avatar: any;
                role: any;
            };
        };
        message?: undefined;
    }>;
    register(mobile: string, nickname?: string, role?: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            token: string;
            user: {
                id: any;
                nickname: any;
                mobile: any;
                avatar: any;
                role: any;
            };
        };
        message?: undefined;
    }>;
}
