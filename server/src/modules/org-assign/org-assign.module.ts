import { Module } from '@nestjs/common';
import { OrgAssignController } from './org-assign.controller';
import { OrgAssignService } from './org-assign.service';

@Module({
  controllers: [OrgAssignController],
  providers: [OrgAssignService],
  exports: [OrgAssignService],
})
export class OrgAssignModule {}
