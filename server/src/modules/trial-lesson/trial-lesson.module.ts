import { Module } from '@nestjs/common';
import { TrialLessonController } from './trial-lesson.controller';
import { TrialLessonService } from './trial-lesson.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [TrialLessonController],
  providers: [TrialLessonService],
  exports: [TrialLessonService],
})
export class TrialLessonModule {}
