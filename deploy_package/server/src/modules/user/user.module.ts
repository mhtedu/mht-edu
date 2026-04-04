import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SmsModule } from '../sms/sms.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SmsModule,
    AuthModule,  // 使用 AuthModule 导出的 JwtModule（统一secret配置）
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
