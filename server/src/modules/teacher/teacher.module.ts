import { Module, forwardRef } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { MessageModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => MessageModule), forwardRef(() => NotificationModule)],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
