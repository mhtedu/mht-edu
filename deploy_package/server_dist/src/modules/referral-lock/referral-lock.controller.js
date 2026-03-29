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
exports.ReferralLockController = void 0;
const common_1 = require("@nestjs/common");
const referral_lock_service_1 = require("./referral-lock.service");
let ReferralLockController = class ReferralLockController {
    constructor(referralLockService) {
        this.referralLockService = referralLockService;
    }
    async lockByShareCode(req, body) {
        const userId = req.user?.id || 0;
        if (!userId) {
            return { code: 401, msg: '请先登录', data: null };
        }
        const result = await this.referralLockService.lockByShareCode(userId, body.shareCode);
        return { code: 200, msg: result.reason, data: { locked: result.locked } };
    }
    async lockByInviteCode(req, body) {
        const userId = req.user?.id || 0;
        if (!userId) {
            return { code: 401, msg: '请先登录', data: null };
        }
        const result = await this.referralLockService.lockByInviteCode(userId, body.inviteCode);
        return { code: 200, msg: result.reason, data: { locked: result.locked } };
    }
    async lockRelation(req, body) {
        const userId = req.user?.id || 0;
        if (!userId) {
            return { code: 401, msg: '请先登录', data: null };
        }
        const result = await this.referralLockService.lockRelation(userId, body.lockerId, body.lockType, body.sourceId);
        return { code: 200, msg: result.reason, data: { locked: result.locked } };
    }
    async isLocked(req) {
        const userId = req.user?.id || 0;
        if (!userId) {
            return { code: 200, data: { is_locked: false } };
        }
        const isLocked = await this.referralLockService.isLocked(userId);
        return { code: 200, data: { is_locked: isLocked } };
    }
    async getMyLocker(req) {
        const userId = req.user?.id || 0;
        if (!userId) {
            return { code: 401, msg: '请先登录', data: null };
        }
        const locker = await this.referralLockService.getLocker(userId);
        return { code: 200, data: locker };
    }
    async getInviteStats(req) {
        const userId = req.user?.id || 1;
        const stats = await this.referralLockService.getInviteStats(userId);
        const inviteCode = this.referralLockService.generateInviteCode(userId);
        return {
            code: 200,
            data: {
                ...stats,
                invite_code: inviteCode,
            }
        };
    }
    async getMyInviteCode(req) {
        const userId = req.user?.id || 1;
        const inviteCode = this.referralLockService.generateInviteCode(userId);
        return {
            code: 200,
            data: {
                invite_code: inviteCode,
                invite_link: `https://your-domain.com/invite?code=${inviteCode}`,
            }
        };
    }
};
exports.ReferralLockController = ReferralLockController;
__decorate([
    (0, common_1.Post)('lock-by-share-code'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "lockByShareCode", null);
__decorate([
    (0, common_1.Post)('lock-by-invite-code'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "lockByInviteCode", null);
__decorate([
    (0, common_1.Post)('lock'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "lockRelation", null);
__decorate([
    (0, common_1.Get)('is-locked'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "isLocked", null);
__decorate([
    (0, common_1.Get)('my-locker'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "getMyLocker", null);
__decorate([
    (0, common_1.Get)('invite-stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "getInviteStats", null);
__decorate([
    (0, common_1.Get)('my-invite-code'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralLockController.prototype, "getMyInviteCode", null);
exports.ReferralLockController = ReferralLockController = __decorate([
    (0, common_1.Controller)('referral'),
    __metadata("design:paramtypes", [referral_lock_service_1.ReferralLockService])
], ReferralLockController);
//# sourceMappingURL=referral-lock.controller.js.map