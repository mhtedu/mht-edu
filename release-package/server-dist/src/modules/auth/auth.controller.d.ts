import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            realName: any;
            email: any;
            phone: any;
            avatar: any;
            role: {
                id: any;
                name: any;
                code: any;
            };
        };
    }>;
    getProfile(req: any): Promise<import("mysql2").RowDataPacket>;
    updateProfile(req: any, body: {
        realName?: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }): Promise<{
        success: boolean;
    }>;
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
    }>;
    logout(req: any): Promise<{
        success: boolean;
    }>;
    getPermissions(req: any): Promise<any>;
}
