export declare class AdminController {
    getStatsOverview(): Promise<{
        totalUsers: any;
        totalTeachers: any;
        totalOrgs: any;
        totalOrders: any;
        totalMembers: any;
        totalRevenue: any;
    }>;
    getAdmins(): Promise<import("mysql2").RowDataPacket[]>;
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
    deleteAdmin(id: string): Promise<{
        success: boolean;
    }>;
    resetAdminPassword(id: string): Promise<{
        success: boolean;
        password: string;
    }>;
    getRoles(): Promise<{
        permissionCount: any;
        userCount: any;
        constructor: {
            name: "RowDataPacket";
        };
    }[]>;
    getPermissions(): Promise<{}>;
    updateRolePermissions(id: string, body: {
        permissions: string[];
    }): Promise<{
        success: boolean;
    }>;
    getUsers(page?: string, pageSize?: string, search?: string, role?: string): Promise<{
        list: import("mysql2").RowDataPacket[];
        total: any;
        page: number;
        pageSize: number;
    }>;
    getTeachers(status?: string): Promise<import("mysql2").RowDataPacket[]>;
    getOrgs(status?: string): Promise<import("mysql2").RowDataPacket[]>;
    getOrders(status?: string): Promise<import("mysql2").RowDataPacket[]>;
    getConfig(): Promise<{}>;
    updateConfig(body: Record<string, string>): Promise<{
        success: boolean;
    }>;
}
