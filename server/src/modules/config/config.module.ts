import { Module } from '@nestjs/common';
import { ConfigController, AdminConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  controllers: [ConfigController, AdminConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
