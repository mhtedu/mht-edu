"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolModule = void 0;
const common_1 = require("@nestjs/common");
const pool_controller_1 = require("./pool.controller");
const pool_service_1 = require("./pool.service");
let PoolModule = class PoolModule {
};
exports.PoolModule = PoolModule;
exports.PoolModule = PoolModule = __decorate([
    (0, common_1.Module)({
        controllers: [pool_controller_1.PoolController],
        providers: [pool_service_1.PoolService],
        exports: [pool_service_1.PoolService],
    })
], PoolModule);
//# sourceMappingURL=pool.module.js.map