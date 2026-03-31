export declare class AdminController {
    getStatsOverview(): Promise<{
        totalUsers: any;
        totalTeachers: any;
        totalOrgs: any;
        totalOrders: any;
        totalMembers: any;
        totalRevenue: any;
    }>;
    getUsers(page?: string, pageSize?: string, search?: string, role?: string): Promise<{
        list: {
            role: any;
            isMember: boolean;
            constructor: {
                name: "RowDataPacket";
            };
        }[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getUser(id: string): Promise<import("mysql2").RowDataPacket>;
    updateUser(id: string, body: {
        nickname?: string;
        mobile?: string;
        role?: string;
        membership_type?: number;
        membership_expire_at?: string;
        status?: number;
    }): Promise<{
        success: boolean;
    }>;
    updateUserStatus(id: string, body: {
        status: number;
    }): Promise<{
        success: boolean;
    }>;
    getTeachers(status?: string): Promise<{
        subject: any;
        constructor: {
            name: "RowDataPacket";
        };
    }[]>;
    getTeacher(id: string): Promise<import("mysql2").RowDataPacket>;
    approveTeacher(id: string): Promise<{
        success: boolean;
    }>;
    rejectTeacher(id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
    }>;
    getOrgs(status?: string): Promise<import("mysql2").RowDataPacket[]>;
    approveOrg(id: string): Promise<{
        success: boolean;
    }>;
    rejectOrg(id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
    }>;
    getOrders(status?: string): Promise<import("mysql2").RowDataPacket[]>;
    getAdmins(): Promise<import("mysql2").RowDataPacket[]>;
    getAdmin(id: string): Promise<import("mysql2").RowDataPacket>;
    createAdmin(body: {
        username: string;
        password: string;
        realName: string;
        email?: string;
        phone?: string;
        roleId: number;
    }): Promise<{
        success: boolean;
        message: string;
        id?: undefined;
    } | {
        success: boolean;
        id: number;
        message?: undefined;
    }>;
    updateAdmin(id: string, body: {
        realName?: string;
        email?: string;
        phone?: string;
        roleId?: number;
        status?: number;
    }): Promise<{
        success: boolean;
    }>;
    updateAdminStatus(id: string, body: {
        status: number;
    }): Promise<{
        success: boolean;
    }>;
    deleteAdmin(id: string): Promise<{
        success: boolean;
    }>;
    resetAdminPassword(id: string, body: {
        newPassword?: string;
    }): Promise<{
        success: boolean;
        newPassword: string;
    }>;
    getRoles(): Promise<{
        permissionCount: any;
        userCount: any;
        constructor: {
            name: "RowDataPacket";
        };
    }[]>;
    getRole(id: string): Promise<{
        permissions: any;
        constructor: {
            name: "RowDataPacket";
        };
    }>;
    updateRole(id: string, body: {
        roleName?: string;
        permissions?: string[];
    }): Promise<{
        success: boolean;
    }>;
    deleteRole(id: string): Promise<{
        success: boolean;
    }>;
    getConfig(): Promise<{}>;
    updateConfig(body: Record<string, string>): Promise<{
        success: boolean;
    }>;
}
