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
exports.OrgController = void 0;
const common_1 = require("@nestjs/common");
const org_service_1 = require("./org.service");
let OrgController = class OrgController {
    constructor(orgService) {
        this.orgService = orgService;
    }
    async getTeachers(keyword, status, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.getTeachers(orgId, {
            keyword,
            status: status ? parseInt(status) : undefined,
        });
    }
    async approveTeacher(id, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.approveTeacher(orgId, parseInt(id));
    }
    async rejectTeacher(id, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.rejectTeacher(orgId, parseInt(id));
    }
    async updateTeacherStatus(id, body, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.updateTeacherStatus(orgId, parseInt(id), body.status);
    }
    async getCourses(keyword, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.getCourses(orgId, { keyword });
    }
    async saveCourse(body, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.saveCourse(orgId, body);
    }
    async updateCourseStatus(id, body, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.updateCourseStatus(orgId, parseInt(id), body.status);
    }
    async getOrgInfo(req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.getOrgInfo(orgId);
    }
    async updateOrgInfo(body, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.updateOrgInfo(orgId, body);
    }
    async getInviteInfo(req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.getInviteInfo(orgId);
    }
    async sendInviteSms(body, req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.sendInviteSms(orgId, body.phone);
    }
    async getInviteHistory(req) {
        const orgId = req?.user?.orgId || 1;
        return this.orgService.getInviteHistory(orgId);
    }
};
exports.OrgController = OrgController;
__decorate([
    (0, common_1.Get)('teachers'),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Post)('teachers/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "approveTeacher", null);
__decorate([
    (0, common_1.Post)('teachers/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "rejectTeacher", null);
__decorate([
    (0, common_1.Post)('teachers/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateTeacherStatus", null);
__decorate([
    (0, common_1.Get)('courses'),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getCourses", null);
__decorate([
    (0, common_1.Post)('courses'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "saveCourse", null);
__decorate([
    (0, common_1.Post)('courses/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateCourseStatus", null);
__decorate([
    (0, common_1.Get)('info'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getOrgInfo", null);
__decorate([
    (0, common_1.Put)('info'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateOrgInfo", null);
__decorate([
    (0, common_1.Get)('invite/info'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getInviteInfo", null);
__decorate([
    (0, common_1.Post)('invite/sms'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "sendInviteSms", null);
__decorate([
    (0, common_1.Get)('invite/history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getInviteHistory", null);
exports.OrgController = OrgController = __decorate([
    (0, common_1.Controller)('org'),
    __metadata("design:paramtypes", [org_service_1.OrgService])
], OrgController);
//# sourceMappingURL=org.controller.js.map