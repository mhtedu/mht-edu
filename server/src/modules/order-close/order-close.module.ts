import { Module } from '@nestjs/common';
import { OrderCloseController } from './order-close.controller';
import { OrderCloseService } from './order-close.service';

@Module({
  controllers: [OrderCloseController],
  providers: [OrderCloseService],
  exports: [OrderCloseService],
})
export class OrderCloseModule {}
