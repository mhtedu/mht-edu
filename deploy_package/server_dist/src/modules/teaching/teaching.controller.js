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
exports.TeachingController = void 0;
const common_1 = require("@nestjs/common");
const teaching_service_1 = require("./teaching.service");
let TeachingController = class TeachingController {
    constructor(teachingService) {
        this.teachingService = teachingService;
    }
    async submitTeacherFeedback(body, req) {
        const userId = req.user?.id || 1;
        return this.teachingService.submitTeacherFeedback({
            ...body,
            teacherId: userId,
        });
    }
    async submitParentFeedback(body, req) {
        const userId = req.user?.id || 1;
        return this.teachingService.submitParentFeedback({
            ...body,
            parentId: userId,
        });
    }
    async getTrialFeedback(orderId) {
        return this.teachingService.getTrialFeedback(parseInt(orderId));
    }
    async createTeachingPlan(body, req) {
        const userId = req.user?.id || 1;
        return this.teachingService.createTeachingPlan({
            ...body,
            teacherId: userId,
        });
    }
    async getTeachingPlan(orderId) {
        return this.teachingService.getTeachingPlan(parseInt(orderId));
    }
    async updateTeachingPlan(orderId, body, req) {
        const userId = req.user?.id || 1;
        return this.teachingService.updateTeachingPlan(parseInt(orderId), userId, body);
    }
    async updateProgress(orderId, body, req) {
        const userId = req.user?.id || 1;
        return this.teachingService.updateProgress(parseInt(orderId), userId, body.completedLessons);
    }
    async getTeacherPlans(status, req) {
        const userId = req?.user?.id || 1;
        return this.teachingService.getTeacherPlans(userId, status);
    }
};
exports.TeachingController = TeachingController;
__decorate([
    (0, common_1.Post)('trial/teacher-feedback'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "submitTeacherFeedback", null);
__decorate([
    (0, common_1.Post)('trial/parent-feedback'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "submitParentFeedback", null);
__decorate([
    (0, common_1.Get)('trial/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "getTrialFeedback", null);
__decorate([
    (0, common_1.Post)('plan'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "createTeachingPlan", null);
__decorate([
    (0, common_1.Get)('plan/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "getTeachingPlan", null);
__decorate([
    (0, common_1.Put)('plan/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "updateTeachingPlan", null);
__decorate([
    (0, common_1.Put)('plan/:orderId/progress'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeachingController.prototype, "getTeacherPlans", null);
exports.TeachingController = TeachingController = __decorate([
    (0, common_1.Controller)('teaching'),
    __metadata("design:paramtypes", [teaching_service_1.TeachingService])
], TeachingController);
//# sourceMappingURL=teaching.controller.js.map