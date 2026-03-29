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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
let PaymentController = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async createMembershipPayment(req, body) {
        const userId = req.user?.id || 1;
        return this.paymentService.createMembershipPayment(userId, body.planId);
    }
    async createProductPayment(req, body) {
        const userId = req.user?.id || 1;
        return this.paymentService.createProductPayment(userId, body.productId, body.quantity || 1);
    }
    async wechatNotify(req, res) {
        try {
            const xml = req.body;
            const result = await this.paymentService.handleWechatNotify(xml);
            res.type('application/xml');
            res.send(`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`);
        }
        catch (error) {
            res.type('application/xml');
            res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${error.message}]]></return_msg></xml>`);
        }
    }
    async getPaymentStatus(req, paymentNo) {
        const userId = req.user?.id || 1;
        return this.paymentService.getPaymentStatus(userId, paymentNo);
    }
    async getPaymentRecords(req, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.paymentService.getPaymentRecords(userId, parseInt(page), parseInt(pageSize));
    }
    async mockPay(req, body) {
        const userId = req.user?.id || 1;
        return this.paymentService.mockPay(userId, body.paymentNo);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('membership'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createMembershipPayment", null);
__decorate([
    (0, common_1.Post)('product'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createProductPayment", null);
__decorate([
    (0, common_1.Post)('notify/wechat'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "wechatNotify", null);
__decorate([
    (0, common_1.Get)('status/:paymentNo'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('paymentNo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentStatus", null);
__decorate([
    (0, common_1.Get)('records'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentRecords", null);
__decorate([
    (0, common_1.Post)('mock-pay'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "mockPay", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map