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
exports.OrderCloseController = void 0;
const common_1 = require("@nestjs/common");
const order_close_service_1 = require("./order-close.service");
let OrderCloseController = class OrderCloseController {
    constructor(orderCloseService) {
        this.orderCloseService = orderCloseService;
    }
    getCloseReasons() {
        return this.orderCloseService.getCloseReasons();
    }
    async closeOrder(body, req) {
        const userId = req.user?.id || 1;
        return this.orderCloseService.closeOrderByParent({
            ...body,
            parentId: userId,
        });
    }
    async completeAndReview(body, req) {
        const userId = req.user?.id || 1;
        return this.orderCloseService.completeAndReview({
            ...body,
            parentId: userId,
        });
    }
    async getCloseHistory(orderId) {
        return this.orderCloseService.getCloseHistory(parseInt(orderId));
    }
    async checkMembership(req) {
        const userId = req.user?.id || 1;
        return this.orderCloseService.checkMembershipValid(userId);
    }
};
exports.OrderCloseController = OrderCloseController;
__decorate([
    (0, common_1.Get)('reasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrderCloseController.prototype, "getCloseReasons", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderCloseController.prototype, "closeOrder", null);
__decorate([
    (0, common_1.Post)('complete-review'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderCloseController.prototype, "completeAndReview", null);
__decorate([
    (0, common_1.Get)('history/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderCloseController.prototype, "getCloseHistory", null);
__decorate([
    (0, common_1.Get)('membership-check'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderCloseController.prototype, "checkMembership", null);
exports.OrderCloseController = OrderCloseController = __decorate([
    (0, common_1.Controller)('order-close'),
    __metadata("design:paramtypes", [order_close_service_1.OrderCloseService])
], OrderCloseController);
//# sourceMappingURL=order-close.controller.js.map