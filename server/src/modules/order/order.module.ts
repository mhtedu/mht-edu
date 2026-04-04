import { Module, forwardRef } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MessageModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => MessageModule),
    forwardRef(() => NotificationModule),
    AuthModule,  // 导入 AuthModule 以使用 JwtAuthGuard
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
