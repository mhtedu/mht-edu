"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherProfileModule = void 0;
const common_1 = require("@nestjs/common");
const teacher_profile_controller_1 = require("./teacher-profile.controller");
const teacher_profile_service_1 = require("./teacher-profile.service");
let TeacherProfileModule = class TeacherProfileModule {
};
exports.TeacherProfileModule = TeacherProfileModule;
exports.TeacherProfileModule = TeacherProfileModule = __decorate([
    (0, common_1.Module)({
        controllers: [teacher_profile_controller_1.TeacherProfileController],
        providers: [teacher_profile_service_1.TeacherProfileService],
        exports: [teacher_profile_service_1.TeacherProfileService],
    })
], TeacherProfileModule);
//# sourceMappingURL=teacher-profile.module.js.map