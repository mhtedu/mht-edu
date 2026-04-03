import { Module } from '@nestjs/common';
import { TeacherAdminController } from './teacher-admin.controller';

@Module({
  controllers: [TeacherAdminController],
})
export class TeacherAdminModule {}
