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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const user_service_1 = require("./user.service");
const sms_service_1 = require("../sms/sms.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let UserController = class UserController {
    constructor(userService, smsService) {
        this.userService = userService;
        this.smsService = smsService;
    }
    async login(body) {
        if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
            return { success: false, message: '请输入正确的手机号' };
        }
        if (!body.code || body.code.length !== 6) {
            return { success: false, message: '请输入6位验证码' };
        }
        const isValid = await this.smsService.verifyCode(body.mobile, body.code);
        if (!isValid) {
            return { success: false, message: '验证码错误或已过期' };
        }
        return this.userService.login(body.mobile);
    }
    async register(body) {
        if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
            return { success: false, message: '请输入正确的手机号' };
        }
        if (!body.code || body.code.length !== 6) {
            return { success: false, message: '请输入6位验证码' };
        }
        const isValid = await this.smsService.verifyCode(body.mobile, body.code);
        if (!isValid) {
            return { success: false, message: '验证码错误或已过期' };
        }
        return this.userService.register(body.mobile, body.nickname, body.role);
    }
    async sendCode(body) {
        if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
            return { success: false, message: '请输入正确的手机号' };
        }
        const result = await this.smsService.sendVerificationCode(body.mobile);
        return result;
    }
    async getUserInfo(req) {
        const userId = req.user?.id || 1;
        return this.userService.getUserInfo(userId);
    }
    async getTeachersList(latitude, longitude, subject, grade, keyword, city, page = '1', pageSize = '20') {
        return this.userService.getTeachersList({
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            subject,
            grade,
            keyword,
            city,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async getOrdersList(latitude, longitude, subject, city, page = '1', pageSize = '20') {
        return this.userService.getOrdersList({
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            subject,
            city,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async updateUserInfo(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.updateUserInfo(userId, body);
    }
    async updateLocation(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.updateLocation(userId, body);
    }
    async switchRole(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.switchRole(userId, body.role);
    }
    async getMembershipInfo(req) {
        const userId = req.user?.id || 1;
        return this.userService.getMembershipInfo(userId);
    }
    async getMembershipPlans(role) {
        return this.userService.getMembershipPlans(parseInt(role) || 0);
    }
    async getEarnings(req) {
        const userId = req.user?.id || 1;
        return this.userService.getEarnings(userId);
    }
    async getEarningRecords(req, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.userService.getEarningRecords(userId, parseInt(page), parseInt(pageSize));
    }
    async requestWithdrawal(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.requestWithdrawal(userId, body.amount, body.bankInfo);
    }
    async getInviteInfo(req) {
        const userId = req.user?.id || 1;
        return this.userService.getInviteInfo(userId);
    }
    async getInviteList(req, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.userService.getInviteList(userId, parseInt(page), parseInt(pageSize));
    }
    async getTeacherProfile(req) {
        const userId = req.user?.id || 1;
        return this.userService.getTeacherProfile(userId);
    }
    async updateTeacherProfile(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.updateTeacherProfile(userId, body);
    }
    async getOrgProfile(req) {
        const userId = req.user?.id || 1;
        return this.userService.getOrgProfile(userId);
    }
    async updateOrgProfile(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.updateOrgProfile(userId, body);
    }
    async bindInviter(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.bindInviter(userId, body.inviteCode);
    }
    async uploadAvatar(file, req) {
        const userId = req.user?.id || 1;
        return this.userService.uploadAvatar(userId, file);
    }
    async getSettings(req) {
        const userId = req.user?.id || 1;
        return this.userService.getSettings(userId);
    }
    async updateSettings(body, req) {
        const userId = req.user?.id || 1;
        return this.userService.updateSettings(userId, body.key, body.value);
    }
};
exports.UserController = UserController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('send-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "sendCode", null);
__decorate([
    (0, common_1.Get)('info'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserInfo", null);
__decorate([
    (0, common_1.Get)('teachers/list'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('grade')),
    __param(4, (0, common_1.Query)('keyword')),
    __param(5, (0, common_1.Query)('city')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getTeachersList", null);
__decorate([
    (0, common_1.Get)('orders/list'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('city')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getOrdersList", null);
__decorate([
    (0, common_1.Put)('info'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUserInfo", null);
__decorate([
    (0, common_1.Post)('location'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)('switch-role'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "switchRole", null);
__decorate([
    (0, common_1.Get)('membership'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMembershipInfo", null);
__decorate([
    (0, common_1.Get)('membership/plans'),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMembershipPlans", null);
__decorate([
    (0, common_1.Get)('earnings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)('earnings/records'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getEarningRecords", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "requestWithdrawal", null);
__decorate([
    (0, common_1.Get)('invite'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getInviteInfo", null);
__decorate([
    (0, common_1.Get)('invite/list'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getInviteList", null);
__decorate([
    (0, common_1.Get)('teacher-profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getTeacherProfile", null);
__decorate([
    (0, common_1.Post)('teacher-profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateTeacherProfile", null);
__decorate([
    (0, common_1.Get)('org-profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getOrgProfile", null);
__decorate([
    (0, common_1.Post)('org-profile'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateOrgProfile", null);
__decorate([
    (0, common_1.Post)('bind-inviter'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "bindInviter", null);
__decorate([
    (0, common_1.Post)('upload-avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateSettings", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        sms_service_1.SmsService])
], UserController);
//# sourceMappingURL=user.controller.js.map