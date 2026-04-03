import { Module } from '@nestjs/common';
import { PayController } from './pay.controller';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PaymentModule],
  controllers: [PayController],
})
export class PayModule {}
