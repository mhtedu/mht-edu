import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { MemberModule } from './modules/member/member.module';
import { DistributionModule } from './modules/distribution/distribution.module';
import { AgentModule } from './modules/agent/agent.module';
import { MessageModule } from './modules/message/message.module';
import { RobotModule } from './modules/robot/robot.module';
import { TeacherProfileModule } from './modules/teacher-profile/teacher-profile.module';
import { OrderCloseModule } from './modules/order-close/order-close.module';
import { CityModule } from './modules/city/city.module';
import { OrgModule } from './modules/org/org.module';
import { ActivityModule } from './modules/activity/activity.module';

@Module({
  imports: [
    UserModule,
    OrderModule,
    PaymentModule,
    MemberModule,
    DistributionModule,
    AgentModule,
    MessageModule,
    RobotModule,
    TeacherProfileModule,
    OrderCloseModule,
    CityModule,
    OrgModule,
    ActivityModule,
  ],
})
export class AppModule {}
