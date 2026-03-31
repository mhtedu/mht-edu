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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const teacher_service_1 = require("./teacher.service");
let TeacherController = class TeacherController {
    constructor(teacherService) {
        this.teacherService = teacherService;
    }
    async getTeachers(latitude, longitude, subject, grade, keyword, page = '1', pageSize = '20') {
        return this.teacherService.getTeachers({
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            subject,
            grade,
            keyword,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async getTeacherDetail(id, req) {
        const userId = req.user?.id || 0;
        return this.teacherService.getTeacherDetail(parseInt(id), userId);
    }
    async getTeacherReviews(id, page = '1', pageSize = '10') {
        return this.teacherService.getTeacherReviews(parseInt(id), parseInt(page), parseInt(pageSize));
    }
    async sendMessage(id, body, req) {
        const userId = req.user?.id || 1;
        return this.teacherService.sendMessage(parseInt(id), userId, body.content);
    }
    async getAvailableOrders(req, latitude, longitude, subject, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.teacherService.getAvailableOrders({
            userId,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            subject,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async grabOrder(orderId, req) {
        const userId = req.user?.id || 1;
        return this.teacherService.grabOrder(parseInt(orderId), userId);
    }
    async getMatchedOrders(req, status, page = '1', pageSize = '20') {
        const userId = req.user?.id || 1;
        return this.teacherService.getMatchedOrders(userId, parseInt(page), parseInt(pageSize), status ? parseInt(status) : undefined);
    }
    async updateOrderStatus(orderId, body, req) {
        const userId = req.user?.id || 1;
        return this.teacherService.updateOrderStatus(parseInt(orderId), userId, body.status);
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('grade')),
    __param(4, (0, common_1.Query)('keyword')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeacherDetail", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeacherReviews", null);
__decorate([
    (0, common_1.Post)(':id/message'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('orders/available'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('latitude')),
    __param(2, (0, common_1.Query)('longitude')),
    __param(3, (0, common_1.Query)('subject')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getAvailableOrders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/grab'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "grabOrder", null);
__decorate([
    (0, common_1.Get)('orders/matched'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getMatchedOrders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/status'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "updateOrderStatus", null);
exports.TeacherController = TeacherController = __decorate([
    (0, common_1.Controller)('teacher'),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map