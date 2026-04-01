import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@/modules/config/config.module';
import { UserModule } from '@/modules/user/user.module';
import { TeacherModule } from '@/modules/teacher/teacher.module';
import { OrgModule } from '@/modules/org/org.module';
import { MessageModule } from '@/modules/message/message.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { VisionModule } from '@/modules/vision/vision.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    ConfigModule,
    UserModule,
    TeacherModule,
    OrgModule,
    MessageModule,
    AdminModule,
    AuthModule,
    VisionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
