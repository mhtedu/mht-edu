"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralLockModule = void 0;
const common_1 = require("@nestjs/common");
const referral_lock_controller_1 = require("./referral-lock.controller");
const referral_lock_service_1 = require("./referral-lock.service");
let ReferralLockModule = class ReferralLockModule {
};
exports.ReferralLockModule = ReferralLockModule;
exports.ReferralLockModule = ReferralLockModule = __decorate([
    (0, common_1.Module)({
        controllers: [referral_lock_controller_1.ReferralLockController],
        providers: [referral_lock_service_1.ReferralLockService],
        exports: [referral_lock_service_1.ReferralLockService],
    })
], ReferralLockModule);
//# sourceMappingURL=referral-lock.module.js.map