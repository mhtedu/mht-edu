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
exports.PoolController = void 0;
const common_1 = require("@nestjs/common");
const pool_service_1 = require("./pool.service");
let PoolController = class PoolController {
    constructor(poolService) {
        this.poolService = poolService;
    }
    async getPoolOrders(subject, cityCode, latitude, longitude, radius, page = '1', pageSize = '20') {
        return this.poolService.getPoolOrders({
            subject,
            cityCode,
            latitude: latitude ? parseFloat(latitude) : undefined,
            longitude: longitude ? parseFloat(longitude) : undefined,
            radius: radius ? parseFloat(radius) : undefined,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        });
    }
    async grabFromPool(poolId, req) {
        const userId = req.user?.id || 1;
        return this.poolService.grabFromPool(parseInt(poolId), userId);
    }
    async getPoolStats() {
        return this.poolService.getPoolStats();
    }
    async releaseToPool(body) {
        return this.poolService.releaseToPool(body);
    }
    async cleanExpiredOrders() {
        return this.poolService.cleanExpiredOrders();
    }
    async assignFromPool(poolId, body) {
        return this.poolService.assignFromPool(parseInt(poolId), body.teacherId);
    }
};
exports.PoolController = PoolController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)('subject')),
    __param(1, (0, common_1.Query)('cityCode')),
    __param(2, (0, common_1.Query)('latitude')),
    __param(3, (0, common_1.Query)('longitude')),
    __param(4, (0, common_1.Query)('radius')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "getPoolOrders", null);
__decorate([
    (0, common_1.Post)('grab/:poolId'),
    __param(0, (0, common_1.Param)('poolId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "grabFromPool", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "getPoolStats", null);
__decorate([
    (0, common_1.Post)('release'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "releaseToPool", null);
__decorate([
    (0, common_1.Post)('clean-expired'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "cleanExpiredOrders", null);
__decorate([
    (0, common_1.Post)('assign/:poolId'),
    __param(0, (0, common_1.Param)('poolId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PoolController.prototype, "assignFromPool", null);
exports.PoolController = PoolController = __decorate([
    (0, common_1.Controller)('pool'),
    __metadata("design:paramtypes", [pool_service_1.PoolService])
], PoolController);
//# sourceMappingURL=pool.controller.js.map