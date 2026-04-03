import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeacherProfileModule } from '../teacher-profile/teacher-profile.module';

@Module({
  imports: [TeacherProfileModule],
  controllers: [TeachersController],
})
export class TeachersModule {}
