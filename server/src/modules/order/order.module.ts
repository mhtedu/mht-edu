import { Module, forwardRef } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MessageModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => MessageModule), forwardRef(() => NotificationModule)],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
