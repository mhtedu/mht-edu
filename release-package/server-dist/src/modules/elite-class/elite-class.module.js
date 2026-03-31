"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EliteClassModule = void 0;
const common_1 = require("@nestjs/common");
const elite_class_controller_1 = require("./elite-class.controller");
const elite_class_service_1 = require("./elite-class.service");
let EliteClassModule = class EliteClassModule {
};
exports.EliteClassModule = EliteClassModule;
exports.EliteClassModule = EliteClassModule = __decorate([
    (0, common_1.Module)({
        controllers: [elite_class_controller_1.EliteClassController],
        providers: [elite_class_service_1.EliteClassService],
        exports: [elite_class_service_1.EliteClassService],
    })
], EliteClassModule);
//# sourceMappingURL=elite-class.module.js.map