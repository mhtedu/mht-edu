import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
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
    // 订单关闭模块
    OrderCloseModule,
    // 工具模块
    SmsModule,
    RobotModule,
    DocumentModule,
    VisionModule,
    // 邀约模块
    InvitationModule,
    // 管理后台
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
