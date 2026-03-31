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
exports.TeacherProfileController = void 0;
const common_1 = require("@nestjs/common");
const teacher_profile_service_1 = require("./teacher-profile.service");
let TeacherProfileController = class TeacherProfileController {
    constructor(teacherProfileService) {
        this.teacherProfileService = teacherProfileService;
    }
    async getTeacherProfile(id, req) {
        const viewerId = req.user?.id || 0;
        return this.teacherProfileService.getTeacherProfile(parseInt(id), viewerId);
    }
    async updateTeacherProfile(body, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.updateTeacherProfile(userId, body);
    }
    async getTeacherStats(id) {
        return this.teacherProfileService.getTeacherStats(parseInt(id));
    }
    async publishMoment(body, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.publishMoment(userId, body);
    }
    async getMoments(id, page = '1', pageSize = '10') {
        return this.teacherProfileService.getMoments(parseInt(id), parseInt(page), parseInt(pageSize));
    }
    async deleteMoment(momentId, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.deleteMoment(userId, parseInt(momentId));
    }
    async likeMoment(momentId, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.likeMoment(parseInt(momentId), userId);
    }
    async getTeacherReviews(id, page = '1', pageSize = '10') {
        return this.teacherProfileService.getTeacherReviews(parseInt(id), parseInt(page), parseInt(pageSize));
    }
    async replyReview(reviewId, body, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.replyReview(userId, parseInt(reviewId), body.reply);
    }
    async unlockContact(body, req) {
        const userId = req.user?.id || 1;
        const isMember = true;
        return this.teacherProfileService.unlockContact({
            userId,
            targetUserId: body.targetUserId,
            orderId: body.orderId,
            unlockType: body.unlockType,
            isMember,
        });
    }
    async updateWechat(body, req) {
        const userId = req.user?.id || 1;
        return this.teacherProfileService.updateWechat(userId, body.wechatId, body.qrcode);
    }
};
exports.TeacherProfileController = TeacherProfileController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "getTeacherProfile", null);
__decorate([
    (0, common_1.Put)('update'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "updateTeacherProfile", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "getTeacherStats", null);
__decorate([
    (0, common_1.Post)('moments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "publishMoment", null);
__decorate([
    (0, common_1.Get)(':id/moments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "getMoments", null);
__decorate([
    (0, common_1.Delete)('moments/:momentId'),
    __param(0, (0, common_1.Param)('momentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "deleteMoment", null);
__decorate([
    (0, common_1.Post)('moments/:momentId/like'),
    __param(0, (0, common_1.Param)('momentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "likeMoment", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "getTeacherReviews", null);
__decorate([
    (0, common_1.Post)('reviews/:reviewId/reply'),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "replyReview", null);
__decorate([
    (0, common_1.Post)('unlock-contact'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "unlockContact", null);
__decorate([
    (0, common_1.Put)('wechat'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeacherProfileController.prototype, "updateWechat", null);
exports.TeacherProfileController = TeacherProfileController = __decorate([
    (0, common_1.Controller)('teacher-profile'),
    __metadata("design:paramtypes", [teacher_profile_service_1.TeacherProfileService])
], TeacherProfileController);
//# sourceMappingURL=teacher-profile.controller.js.map