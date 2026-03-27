import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DocumentModule } from '@/modules/document/document.module';
import { UserModule } from '@/modules/user/user.module';
import { OrderModule } from '@/modules/order/order.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { DistributionModule } from '@/modules/distribution/distribution.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { MessageModule } from '@/modules/message/message.module';
import { PaymentModule } from '@/modules/payment/payment.module';
import { TeacherModule } from '@/modules/teacher/teacher.module';
import { DatabaseInitService } from '@/common/database-init.service';

@Module({
  imports: [
    DocumentModule,
    UserModule,
    OrderModule,
    MembershipModule,
    DistributionModule,
    AdminModule,
    MessageModule,
    PaymentModule,
    TeacherModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseInitService],
})
export class AppModule {}
