import { Module } from '@nestjs/common';
import { MiniprogramController } from './miniprogram.controller';

@Module({
  controllers: [MiniprogramController],
})
export class MiniprogramModule {}
