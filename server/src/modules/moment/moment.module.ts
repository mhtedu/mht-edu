import { Module } from '@nestjs/common';
import { MomentController } from './moment.controller';
import { MomentService } from './moment.service';

@Module({
  controllers: [MomentController],
  providers: [MomentService],
  exports: [MomentService],
})
export class MomentModule {}
