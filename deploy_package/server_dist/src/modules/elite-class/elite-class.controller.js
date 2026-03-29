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
exports.EliteClassController = void 0;
const common_1 = require("@nestjs/common");
const elite_class_service_1 = require("./elite-class.service");
let EliteClassController = class EliteClassController {
    constructor(eliteClassService) {
        this.eliteClassService = eliteClassService;
    }
    async checkSuperMember(req) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.checkSuperMember(userId);
    }
    async createClass(req, body) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.createClass(userId, body);
    }
    async getClassList(latitude, longitude, subject, keyword, city, page, pageSize) {
        return this.eliteClassService.getClassList({
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            subject,
            keyword,
            city,
            page: parseInt(page || '1'),
            pageSize: parseInt(pageSize || '10'),
        });
    }
    async getClassDetail(id, req) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.getClassDetail(parseInt(id), userId);
    }
    async enrollClass(req, body) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.enrollClass(userId, body.classId, body.referrerId);
    }
    async confirmEnrollment(req, body) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.confirmEnrollment(userId, body.enrollmentId);
    }
    async updateProgress(req, body) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.updateLessonProgress(userId, body.classId, body.lessonNo);
    }
    async getTeacherClasses(req, status) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.getTeacherClasses(userId, status ? parseInt(status) : undefined);
    }
    async getStudents(req, classId) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.getEnrolledStudents(userId, parseInt(classId));
    }
    async closeClass(req, body) {
        const userId = req.user?.id || 1;
        return this.eliteClassService.closeClass(userId, body.classId, body.reason);
    }
};
exports.EliteClassController = EliteClassController;
__decorate([
    (0, common_1.Get)('check-super-member'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "checkSuperMember", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "createClass", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('keyword')),
    __param(4, (0, common_1.Query)('city')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "getClassList", null);
__decorate([
    (0, common_1.Get)('detail/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "getClassDetail", null);
__decorate([
    (0, common_1.Post)('enroll'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "enrollClass", null);
__decorate([
    (0, common_1.Post)('confirm-enrollment'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "confirmEnrollment", null);
__decorate([
    (0, common_1.Post)('update-progress'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Get)('teacher-classes'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "getTeacherClasses", null);
__decorate([
    (0, common_1.Get)('students/:classId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EliteClassController.prototype, "closeClass", null);
exports.EliteClassController = EliteClassController = __decorate([
    (0, common_1.Controller)('elite-class'),
    __metadata("design:paramtypes", [elite_class_service_1.EliteClassService])
], EliteClassController);
//# sourceMappingURL=elite-class.controller.js.map