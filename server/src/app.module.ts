import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DocumentModule } from '@/modules/document/document.module';
import { UserModule } from '@/modules/user/user.module';
import { OrderModule } from '@/modules/order/order.module';
import { MembershipModule } from '@/modules/membership/membership.module';
import { DistributionModule } from '@/modules/distribution/distribution.module';

@Module({
  imports: [
    DocumentModule,
    UserModule,
    OrderModule,
    MembershipModule,
    DistributionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
