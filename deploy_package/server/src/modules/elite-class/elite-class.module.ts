import { Module } from '@nestjs/common';
import { EliteClassController } from './elite-class.controller';
import { EliteClassService } from './elite-class.service';

@Module({
  controllers: [EliteClassController],
  providers: [EliteClassService],
  exports: [EliteClassService],
})
export class EliteClassModule {}
