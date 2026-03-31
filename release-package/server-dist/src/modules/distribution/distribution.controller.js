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
exports.DistributionController = void 0;
const common_1 = require("@nestjs/common");
const distribution_service_1 = require("./distribution.service");
let DistributionController = class DistributionController {
    constructor(distributionService) {
        this.distributionService = distributionService;
    }
    async getInviteInfo(userId) {
        return await this.distributionService.getInviteInfo(parseInt(userId));
    }
    async bindInviter(body) {
        return await this.distributionService.bindInviter(body.user_id, body.invite_code);
    }
    async getCommissionList(userId, page, pageSize) {
        return await this.distributionService.getCommissionList(parseInt(userId), page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 20);
    }
    async applyWithdraw(body) {
        return await this.distributionService.applyWithdraw(body.user_id, body.amount, body.account_info);
    }
    async getInviteList(userId, level, page, pageSize) {
        return await this.distributionService.getInviteList(parseInt(userId), level === '2' ? 2 : 1, page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 20);
    }
};
exports.DistributionController = DistributionController;
__decorate([
    (0, common_1.Get)('invite-info/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DistributionController.prototype, "getInviteInfo", null);
__decorate([
    (0, common_1.Post)('bind-inviter'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DistributionController.prototype, "bindInviter", null);
__decorate([
    (0, common_1.Get)('commission-list/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DistributionController.prototype, "getCommissionList", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DistributionController.prototype, "applyWithdraw", null);
__decorate([
    (0, common_1.Get)('invite-list/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('level')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DistributionController.prototype, "getInviteList", null);
exports.DistributionController = DistributionController = __decorate([
    (0, common_1.Controller)('distribution'),
    __metadata("design:paramtypes", [distribution_service_1.DistributionService])
], DistributionController);
//# sourceMappingURL=distribution.controller.js.map