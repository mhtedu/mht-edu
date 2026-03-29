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
exports.ShareController = void 0;
const common_1 = require("@nestjs/common");
const share_service_1 = require("./share.service");
let ShareController = class ShareController {
    constructor(shareService) {
        this.shareService = shareService;
    }
    async generateShareLink(body, req) {
        const userId = req.user?.id || 1;
        return this.shareService.generateShareLink(userId, body.target_type, body.target_id);
    }
    async recordShare(body, req) {
        const userId = req.user?.id || 0;
        return this.shareService.recordShare(userId, body.share_code, body.channel);
    }
    async recordView(body, req) {
        const userId = req.user?.id || 0;
        return this.shareService.recordView(userId, body.share_code);
    }
    async getShareInfo(code) {
        return this.shareService.getShareInfo(code);
    }
    async getMyShares(req, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.shareService.getMyShares(userId, parseInt(page), parseInt(pageSize));
    }
    async getShareEarnings(req) {
        const userId = req.user?.id || 1;
        return this.shareService.getShareEarnings(userId);
    }
};
exports.ShareController = ShareController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "generateShareLink", null);
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "recordShare", null);
__decorate([
    (0, common_1.Post)('view'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "recordView", null);
__decorate([
    (0, common_1.Get)('info/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "getShareInfo", null);
__decorate([
    (0, common_1.Get)('my-shares'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "getMyShares", null);
__decorate([
    (0, common_1.Get)('earnings'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "getShareEarnings", null);
exports.ShareController = ShareController = __decorate([
    (0, common_1.Controller)('share'),
    __metadata("design:paramtypes", [share_service_1.ShareService])
], ShareController);
//# sourceMappingURL=share.controller.js.map