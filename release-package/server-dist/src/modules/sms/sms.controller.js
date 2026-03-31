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
exports.SmsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permission_guard_1 = require("../auth/guards/permission.guard");
const permission_decorator_1 = require("../auth/decorators/permission.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const sms_service_1 = require("./sms.service");
let SmsController = class SmsController {
    constructor(smsService) {
        this.smsService = smsService;
    }
    async getConfig() {
        const config = await this.smsService.getConfig();
        if (config) {
            return {
                access_key_id: config.access_key_id ? `${config.access_key_id.slice(0, 4)}****` : '',
                access_key_secret: config.access_key_secret ? '******' : '',
                sign_name: config.sign_name,
                template_code: config.template_code,
                enabled: config.enabled,
            };
        }
        return {
            access_key_id: '',
            access_key_secret: '',
            sign_name: '',
            template_code: '',
            enabled: 0,
        };
    }
    async updateConfig(body) {
        const config = {
            ...body,
            access_key_id: body.access_key_id?.includes('****') ? undefined : body.access_key_id,
            access_key_secret: body.access_key_secret === '******' ? undefined : body.access_key_secret,
        };
        await this.smsService.updateConfig(config);
        return { success: true };
    }
    async sendCode(body) {
        if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
            return { success: false, message: '请输入正确的手机号' };
        }
        const result = await this.smsService.sendVerificationCode(body.mobile);
        return result;
    }
    async verifyCode(body) {
        const isValid = await this.smsService.verifyCode(body.mobile, body.code);
        return { success: isValid };
    }
    async testSms(body) {
        if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
            return { success: false, message: '请输入正确的手机号' };
        }
        const result = await this.smsService.sendVerificationCode(body.mobile);
        return result;
    }
};
exports.SmsController = SmsController;
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_decorator_1.RequirePermission)('config:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_decorator_1.RequirePermission)('config:edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('send-code'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "sendCode", null);
__decorate([
    (0, common_1.Post)('verify-code'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "verifyCode", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_decorator_1.RequirePermission)('config:edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsController.prototype, "testSms", null);
exports.SmsController = SmsController = __decorate([
    (0, common_1.Controller)('sms'),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsController);
//# sourceMappingURL=sms.controller.js.map