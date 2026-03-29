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
exports.OrgAssignController = void 0;
const common_1 = require("@nestjs/common");
const org_assign_service_1 = require("./org-assign.service");
let OrgAssignController = class OrgAssignController {
    constructor(orgAssignService) {
        this.orgAssignService = orgAssignService;
    }
    async getOrgTeachers(status, req) {
        const userId = req?.user?.id || 1;
        return this.orgAssignService.getOrgTeachers(userId, status ? parseInt(status) : undefined);
    }
    async inviteTeacher(body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.inviteTeacher(userId, body.teacherId, body.commissionRate);
    }
    async handleInvite(body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.handleInvite(userId, body.orgId, body.accept);
    }
    async unbindTeacher(body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.unbindTeacher(userId, body.teacherId);
    }
    async setTeacherCommission(body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.setTeacherCommission(userId, body.teacherId, body.rate);
    }
    async assignOrder(body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.assignOrder({
            ...body,
            orgId: userId,
        });
    }
    async handleAssignment(id, body, req) {
        const userId = req.user?.id || 1;
        return this.orgAssignService.handleAssignment(userId, parseInt(id), body.accept, body.note);
    }
    async getOrgAssignments(status, req) {
        const userId = req?.user?.id || 1;
        return this.orgAssignService.getOrgAssignments(userId, status ? parseInt(status) : undefined);
    }
    async getTeacherAssignments(status, req) {
        const userId = req?.user?.id || 1;
        return this.orgAssignService.getTeacherAssignments(userId, status ? parseInt(status) : undefined);
    }
    async recommendTeachers(orderId, req) {
        const userId = req?.user?.id || 1;
        return this.orgAssignService.recommendTeachers(userId, parseInt(orderId));
    }
};
exports.OrgAssignController = OrgAssignController;
__decorate([
    (0, common_1.Get)('teachers'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "getOrgTeachers", null);
__decorate([
    (0, common_1.Post)('teachers/invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "inviteTeacher", null);
__decorate([
    (0, common_1.Post)('teachers/handle-invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "handleInvite", null);
__decorate([
    (0, common_1.Post)('teachers/unbind'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "unbindTeacher", null);
__decorate([
    (0, common_1.Put)('teachers/commission'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "setTeacherCommission", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "assignOrder", null);
__decorate([
    (0, common_1.Post)('assignments/:id/handle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "handleAssignment", null);
__decorate([
    (0, common_1.Get)('assignments'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "getOrgAssignments", null);
__decorate([
    (0, common_1.Get)('teacher-assignments'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "getTeacherAssignments", null);
__decorate([
    (0, common_1.Get)('recommend/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgAssignController.prototype, "recommendTeachers", null);
exports.OrgAssignController = OrgAssignController = __decorate([
    (0, common_1.Controller)('org-assign'),
    __metadata("design:paramtypes", [org_assign_service_1.OrgAssignService])
], OrgAssignController);
//# sourceMappingURL=org-assign.controller.js.map