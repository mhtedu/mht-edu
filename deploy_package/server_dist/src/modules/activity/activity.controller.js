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
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("./activity.service");
let ActivityController = class ActivityController {
    constructor(activityService) {
        this.activityService = activityService;
    }
    async getActivityList(role, type, status, page = '1', pageSize = '10') {
        return this.activityService.getActivityList({
            role: role ? parseInt(role) : undefined,
            type,
            status,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async getActivityDetail(id) {
        return this.activityService.getActivityDetail(parseInt(id));
    }
    async signupActivity(id, body, req) {
        const userId = req.user?.id || 1;
        return this.activityService.signupActivity(parseInt(id), userId, body.signupType, body.participantName, body.participantPhone, body.participantCount || 1);
    }
    async getUserSignedActivities(req, status, page = '1', pageSize = '10') {
        const userId = req.user?.id || 1;
        return this.activityService.getUserSignedActivities(userId, parseInt(page), parseInt(pageSize), status);
    }
    async cancelSignup(id, req) {
        const userId = req.user?.id || 1;
        return this.activityService.cancelSignup(parseInt(id), userId);
    }
    async getActivityParticipants(id, page = '1', pageSize = '20') {
        return this.activityService.getActivityParticipants(parseInt(id), parseInt(page), parseInt(pageSize));
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getActivityList", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getActivityDetail", null);
__decorate([
    (0, common_1.Post)(':id/signup'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "signupActivity", null);
__decorate([
    (0, common_1.Get)('user/signed'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getUserSignedActivities", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "cancelSignup", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getActivityParticipants", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.Controller)('activities'),
    __metadata("design:paramtypes", [activity_service_1.ActivityService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map