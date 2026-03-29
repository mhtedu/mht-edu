"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const db = require("../../storage/database/mysql-client");
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async validateUser(username, password) {
        const [users] = await db.query(`SELECT 
        au.id, au.username, au.password, au.real_name, au.email, au.phone, 
        au.avatar, au.role_id, au.status,
        ar.role_name, ar.role_code, ar.permissions
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.username = ? AND au.status = 1`, [username]);
        if (users.length === 0) {
            return null;
        }
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        await db.update(`UPDATE admin_user 
       SET last_login_time = NOW(), login_count = login_count + 1
       WHERE id = ?`, [user.id]);
        delete user.password;
        return user;
    }
    async login(user) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role_code,
            permissions: JSON.parse(user.permissions || '[]'),
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                realName: user.real_name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: {
                    id: user.role_id,
                    name: user.role_name,
                    code: user.role_code,
                },
            },
        };
    }
    async getProfile(userId) {
        const [users] = await db.query(`SELECT 
        au.id, au.username, au.real_name, au.email, au.phone, 
        au.avatar, au.role_id, au.last_login_time, au.login_count,
        ar.role_name, ar.role_code
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.id = ?`, [userId]);
        if (users.length === 0) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        return users[0];
    }
    async updateProfile(userId, data) {
        await db.update(`UPDATE admin_user 
       SET real_name = ?, email = ?, phone = ?, avatar = ?
       WHERE id = ?`, [data.realName, data.email, data.phone, data.avatar, userId]);
        return { success: true };
    }
    async changePassword(userId, oldPassword, newPassword) {
        const [users] = await db.query('SELECT password FROM admin_user WHERE id = ?', [userId]);
        if (users.length === 0) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, users[0].password);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('原密码错误');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update('UPDATE admin_user SET password = ? WHERE id = ?', [hashedPassword, userId]);
        return { success: true };
    }
    async logout(userId) {
        return { success: true };
    }
    async getPermissions(userId) {
        const [users] = await db.query(`SELECT ar.permissions 
       FROM admin_user au
       LEFT JOIN admin_role ar ON au.role_id = ar.id
       WHERE au.id = ?`, [userId]);
        if (users.length === 0) {
            return [];
        }
        return JSON.parse(users[0].permissions || '[]');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map