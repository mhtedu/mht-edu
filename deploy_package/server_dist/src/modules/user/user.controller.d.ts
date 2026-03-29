import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUserInfo(req: any): Promise<any>;
    getTeachersList(latitude?: string, longitude?: string, subject?: string, grade?: string, keyword?: string, city?: string, page?: string, pageSize?: string): Promise<any[]>;
    getOrdersList(latitude?: string, longitude?: string, subject?: string, city?: string, page?: string, pageSize?: string): Promise<any[]>;
    updateUserInfo(body: {
        nickname?: string;
        avatar?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    updateLocation(body: {
        latitude: number;
        longitude: number;
        address?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    switchRole(body: {
        role: number;
    }, req: any): Promise<{
        success: boolean;
    }>;
    getMembershipInfo(req: any): Promise<{
        is_member: boolean;
        expire_at: any;
        remaining_days: number;
        today_usage: any;
    }>;
    getMembershipPlans(role: string): Promise<any[]>;
    getEarnings(req: any): Promise<any>;
    getEarningRecords(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    requestWithdrawal(body: {
        amount: number;
        bankInfo: any;
    }, req: any): Promise<{
        success: boolean;
        id: any;
    }>;
    getInviteInfo(req: any): Promise<any>;
    getInviteList(req: any, page?: string, pageSize?: string): Promise<{
        list: any[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getTeacherProfile(req: any): Promise<any>;
    updateTeacherProfile(body: {
        real_name?: string;
        gender?: number;
        education?: string;
        subjects?: string;
        grades?: string;
        teaching_years?: number;
        hourly_rate?: number;
        bio?: string;
        certificates?: string[];
    }, req: any): Promise<{
        success: boolean;
    }>;
    getOrgProfile(req: any): Promise<any>;
    updateOrgProfile(body: {
        org_name?: string;
        license_no?: string;
        contact_name?: string;
        contact_phone?: string;
        address?: string;
        intro?: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    bindInviter(body: {
        inviteCode: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    uploadAvatar(file: any, req: any): Promise<{
        url: string;
    }>;
    getSettings(req: any): Promise<any>;
    updateSettings(body: {
        key: string;
        value: any;
    }, req: any): Promise<{
        success: boolean;
    }>;
}
