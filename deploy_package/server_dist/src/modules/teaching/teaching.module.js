"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachingModule = void 0;
const common_1 = require("@nestjs/common");
const teaching_controller_1 = require("./teaching.controller");
const teaching_service_1 = require("./teaching.service");
let TeachingModule = class TeachingModule {
};
exports.TeachingModule = TeachingModule;
exports.TeachingModule = TeachingModule = __decorate([
    (0, common_1.Module)({
        controllers: [teaching_controller_1.TeachingController],
        providers: [teaching_service_1.TeachingService],
        exports: [teaching_service_1.TeachingService],
    })
], TeachingModule);
//# sourceMappingURL=teaching.module.js.map