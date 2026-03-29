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
exports.CityController = void 0;
const common_1 = require("@nestjs/common");
const city_service_1 = require("./city.service");
let CityController = class CityController {
    constructor(cityService) {
        this.cityService = cityService;
    }
    async getAllCities() {
        return this.cityService.getAllCities();
    }
    async getHotCities() {
        return this.cityService.getHotCities();
    }
    async searchCities(keyword) {
        return this.cityService.searchCities(keyword);
    }
    async getNearestCity(latitude, longitude) {
        return this.cityService.getNearestCity(parseFloat(latitude), parseFloat(longitude));
    }
    async updateUserCity(body, req) {
        const userId = req.user?.id || 1;
        return this.cityService.updateUserCity(userId, body.cityId);
    }
    async getCityDetail(id) {
        return this.cityService.getCityDetail(parseInt(id));
    }
    async getCityTeachers(cityName, page = '1', pageSize = '20') {
        return this.cityService.getCityTeachers(cityName, parseInt(page), parseInt(pageSize));
    }
};
exports.CityController = CityController;
__decorate([
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CityController.prototype, "getAllCities", null);
__decorate([
    (0, common_1.Get)('hot'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CityController.prototype, "getHotCities", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "searchCities", null);
__decorate([
    (0, common_1.Get)('nearest'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "getNearestCity", null);
__decorate([
    (0, common_1.Post)('select'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "updateUserCity", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "getCityDetail", null);
__decorate([
    (0, common_1.Get)(':cityName/teachers'),
    __param(0, (0, common_1.Param)('cityName')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "getCityTeachers", null);
exports.CityController = CityController = __decorate([
    (0, common_1.Controller)('city'),
    __metadata("design:paramtypes", [city_service_1.CityService])
], CityController);
//# sourceMappingURL=city.controller.js.map