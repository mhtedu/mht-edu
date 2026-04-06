import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@/modules/config/config.module';
import { UserModule } from '@/modules/user/user.module';
import { TeacherModule } from '@/modules/teacher/teacher.module';
import { OrgModule } from '@/modules/org/org.module';
import { MessageModule } from '@/modules/message/message.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { VisionModule } from '@/modules/vision/vision.module';
import { MomentModule } from '@/modules/moment/moment.module';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
// 新增模块导入
import { ActivityModule } from '@/modules/activity/activity.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { OrderModule } from '@/modules/order/order.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { EliteClassModule } from '@/modules/elite-class/elite-class.module';
import { DistributionModule } from '@/modules/distribution/distribution.module';
import { ShareModule } from '@/modules/share/share.module';
import { ReferralLockModule } from '@/modules/referral-lock/referral-lock.module';
import { TeacherProfileModule } from '@/modules/teacher-profile/teacher-profile.module';
import { TeachersModule } from '@/modules/teachers/teachers.module';
import { CityModule } from '@/modules/city/city.module';
import { PoolModule } from '@/modules/pool/pool.module';
import { AgentModule } from '@/modules/agent/agent.module';
import { LessonModule } from '@/modules/lesson/lesson.module';
import { TeachingModule } from '@/modules/teaching/teaching.module';
import { MemberModule } from '@/modules/member/member.module';
import { OrgAssignModule } from '@/modules/org-assign/org-assign.module';
import { OrderCloseModule } from '@/modules/order-close/order-close.module';
import { SmsModule } from '@/modules/sms/sms.module';
import { RobotModule } from '@/modules/robot/robot.module';
import { DocumentModule } from '@/modules/document/document.module';
import { InvitationModule } from '@/modules/invitation/invitation.module';
import { SeedModule } from '@/modules/seed/seed.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { DemoModule } from '@/modules/demo/demo.module';
import { OrgMembershipModule } from '@/modules/org-membership/org-membership.module';
import { OrgValueModule } from '@/modules/org-value/org-value.module';
import { ResourceModule } from '@/modules/resource/resource.module';
import { ProductModule } from '@/modules/product/product.module';
import { ExportModule } from '@/modules/export/export.module';
import { ReportModule } from '@/modules/report/report.module';
import { ParentModule } from '@/modules/parent/parent.module';
import { TeacherAdminModule } from '@/modules/teacher-admin/teacher-admin.module';
import { OrgAdminModule } from '@/modules/org-admin/org-admin.module';
import { PayModule } from '@/modules/pay/pay.module';
import { MiniprogramModule } from '@/modules/miniprogram/miniprogram.module';
import { TrialLessonModule } from '@/modules/trial-lesson/trial-lesson.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ConfigModule,
    // 核心模块
    UserModule,
    AuthModule,
    TeacherModule,
    TeacherProfileModule,
    TeachersModule,
    OrgModule,
    MessageModule,
    // 业务模块
    OrderModule,
    PaymentModule,
    MembershipModule,
    MemberModule,
    ActivityModule,
    EliteClassModule,
    MomentModule,
    // 分销推广模块
    DistributionModule,
    ShareModule,
    ReferralLockModule,
    // 城市代理模块
    CityModule,
    AgentModule,
    PoolModule,
    // 教学模块
    LessonModule,
    TeachingModule,
    // 机构模块
    OrgAssignModule,
    OrgMembershipModule,
    OrgValueModule,
    // 订单关闭模块
    OrderCloseModule,
    // 工具模块
    SmsModule,
    RobotModule,
    DocumentModule,
    VisionModule,
    // 邀约模块
    InvitationModule,
    // 通知模块
    NotificationModule,
    // 演示数据模块
    DemoModule,
    // 测试数据初始化模块
    SeedModule,
    // 资源共享模块
    ResourceModule,
    // 商品模块
    ProductModule,
    // 数据导出模块
    ExportModule,
    // 运营报表模块
    ReportModule,
    // 家长模块
    ParentModule,
    // 教师管理模块
    TeacherAdminModule,
    // 机构管理模块
    OrgAdminModule,
    // 支付模块
    PayModule,
    // 小程序发布模块
    MiniprogramModule,
    // 试课邀约模块
    TrialLessonModule,
    // 管理后台
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
