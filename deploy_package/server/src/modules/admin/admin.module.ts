import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
