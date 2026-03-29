import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    validateUser(username: string, password: string): Promise<any>;
    login(user: any): Promise<{
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
    getProfile(userId: number): Promise<import("mysql2").RowDataPacket>;
    updateProfile(userId: number, data: {
        realName?: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }): Promise<{
        success: boolean;
    }>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    logout(userId: number): Promise<{
        success: boolean;
    }>;
    getPermissions(userId: number): Promise<any>;
}
