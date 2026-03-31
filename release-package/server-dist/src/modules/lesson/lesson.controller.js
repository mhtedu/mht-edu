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
exports.LessonController = void 0;
const common_1 = require("@nestjs/common");
const lesson_service_1 = require("./lesson.service");
let LessonController = class LessonController {
    constructor(lessonService) {
        this.lessonService = lessonService;
    }
    async createLessonRecord(body, req) {
        const userId = req.user?.id || 1;
        return this.lessonService.createLessonRecord({
            ...body,
            teacherId: userId,
            parentId: 0,
        });
    }
    async getLessonRecords(orderId, teacherId, parentId, startDate, endDate, status, page = '1', pageSize = '20', req) {
        const userId = req?.user?.id || 0;
        return this.lessonService.getLessonRecords({
            orderId: orderId ? parseInt(orderId) : undefined,
            teacherId: teacherId ? parseInt(teacherId) : undefined,
            parentId: parentId ? parseInt(parentId) : undefined,
            startDate,
            endDate,
            status: status ? parseInt(status) : undefined,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async getLessonRecordDetail(id) {
        return this.lessonService.getLessonRecordDetail(parseInt(id));
    }
    async updateLessonRecord(id, body, req) {
        const userId = req.user?.id || 1;
        return this.lessonService.updateLessonRecord(parseInt(id), userId, body);
    }
    async confirmLesson(id, body, req) {
        const userId = req.user?.id || 1;
        return this.lessonService.confirmLesson(parseInt(id), userId, body.comment);
    }
    async disputeLesson(id, body, req) {
        const userId = req.user?.id || 1;
        return this.lessonService.disputeLesson(parseInt(id), userId, body.comment);
    }
    async getLessonStats(teacherId, month, req) {
        const userId = req?.user?.id || 1;
        return this.lessonService.getLessonStats(teacherId ? parseInt(teacherId) : userId, month);
    }
    async getTeacherSchedules(teacherId, req) {
        const userId = req?.user?.id || 1;
        return this.lessonService.getTeacherSchedules(teacherId ? parseInt(teacherId) : userId);
    }
    async setTeacherSchedule(body, req) {
        const userId = req.user?.id || 1;
        return this.lessonService.setTeacherSchedule(userId, body);
    }
    async checkTeacherAvailability(teacherId, date, startTime, endTime) {
        return this.lessonService.checkTeacherAvailability(parseInt(teacherId), date, startTime, endTime);
    }
    async getTeacherMonthlyLessons(teacherId, year = String(new Date().getFullYear()), month = String(new Date().getMonth() + 1), req) {
        const userId = req?.user?.id || 1;
        return this.lessonService.getTeacherMonthlyLessons(teacherId ? parseInt(teacherId) : userId, parseInt(year), parseInt(month));
    }
};
exports.LessonController = LessonController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "createLessonRecord", null);
__decorate([
    (0, common_1.Get)('records'),
    __param(0, (0, common_1.Query)('orderId')),
    __param(1, (0, common_1.Query)('teacherId')),
    __param(2, (0, common_1.Query)('parentId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('pageSize')),
    __param(8, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "getLessonRecords", null);
__decorate([
    (0, common_1.Get)('records/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "getLessonRecordDetail", null);
__decorate([
    (0, common_1.Put)('records/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "updateLessonRecord", null);
__decorate([
    (0, common_1.Post)('records/:id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "confirmLesson", null);
__decorate([
    (0, common_1.Post)('records/:id/dispute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "disputeLesson", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('teacherId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "getLessonStats", null);
__decorate([
    (0, common_1.Get)('schedules'),
    __param(0, (0, common_1.Query)('teacherId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "getTeacherSchedules", null);
__decorate([
    (0, common_1.Post)('schedules'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "setTeacherSchedule", null);
__decorate([
    (0, common_1.Get)('availability'),
    __param(0, (0, common_1.Query)('teacherId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('startTime')),
    __param(3, (0, common_1.Query)('endTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "checkTeacherAvailability", null);
__decorate([
    (0, common_1.Get)('calendar'),
    __param(0, (0, common_1.Query)('teacherId')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LessonController.prototype, "getTeacherMonthlyLessons", null);
exports.LessonController = LessonController = __decorate([
    (0, common_1.Controller)('lesson'),
    __metadata("design:paramtypes", [lesson_service_1.LessonService])
], LessonController);
//# sourceMappingURL=lesson.controller.js.map