"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_module_1 = require("./modules/user/user.module");
const order_module_1 = require("./modules/order/order.module");
const payment_module_1 = require("./modules/payment/payment.module");
const member_module_1 = require("./modules/member/member.module");
const distribution_module_1 = require("./modules/distribution/distribution.module");
const agent_module_1 = require("./modules/agent/agent.module");
const message_module_1 = require("./modules/message/message.module");
const robot_module_1 = require("./modules/robot/robot.module");
const teacher_profile_module_1 = require("./modules/teacher-profile/teacher-profile.module");
const order_close_module_1 = require("./modules/order-close/order-close.module");
const city_module_1 = require("./modules/city/city.module");
const org_module_1 = require("./modules/org/org.module");
const activity_module_1 = require("./modules/activity/activity.module");
const share_module_1 = require("./modules/share/share.module");
const elite_class_module_1 = require("./modules/elite-class/elite-class.module");
const referral_lock_module_1 = require("./modules/referral-lock/referral-lock.module");
const config_module_1 = require("./modules/config/config.module");
const auth_module_1 = require("./modules/auth/auth.module");
const admin_module_1 = require("./modules/admin/admin.module");
const sms_module_1 = require("./modules/sms/sms.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            user_module_1.UserModule,
            order_module_1.OrderModule,
            payment_module_1.PaymentModule,
            member_module_1.MemberModule,
            distribution_module_1.DistributionModule,
            agent_module_1.AgentModule,
            message_module_1.MessageModule,
            robot_module_1.RobotModule,
            teacher_profile_module_1.TeacherProfileModule,
            order_close_module_1.OrderCloseModule,
            city_module_1.CityModule,
            org_module_1.OrgModule,
            activity_module_1.ActivityModule,
            share_module_1.ShareModule,
            elite_class_module_1.EliteClassModule,
            referral_lock_module_1.ReferralLockModule,
            config_module_1.ConfigModule,
            sms_module_1.SmsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map