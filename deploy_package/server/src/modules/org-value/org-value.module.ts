import { Module } from '@nestjs/common';
import { OrgValueController } from './org-value.controller';
import { OrgValueService } from './org-value.service';

@Module({
  controllers: [OrgValueController],
  providers: [OrgValueService],
  exports: [OrgValueService],
})
export class OrgValueModule {}
