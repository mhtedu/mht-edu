import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    SmsModule,
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mht-edu-jwt-secret-2026',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
