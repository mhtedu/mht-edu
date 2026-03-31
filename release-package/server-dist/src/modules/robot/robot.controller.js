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
exports.RobotController = void 0;
const common_1 = require("@nestjs/common");
const robot_service_1 = require("./robot.service");
let RobotController = class RobotController {
    constructor(robotService) {
        this.robotService = robotService;
    }
    async handleChat(body, req) {
        const userId = req.user?.id || 1;
        return this.robotService.handleMessage(userId, body.message, body.conversationId);
    }
    async getWelcome(body) {
        return this.robotService.getWelcomeMessage(body.targetRole);
    }
};
exports.RobotController = RobotController;
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RobotController.prototype, "handleChat", null);
__decorate([
    (0, common_1.Post)('welcome'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RobotController.prototype, "getWelcome", null);
exports.RobotController = RobotController = __decorate([
    (0, common_1.Controller)('robot'),
    __metadata("design:paramtypes", [robot_service_1.RobotService])
], RobotController);
//# sourceMappingURL=robot.controller.js.map