import { Module } from '@nestjs/common';
import { OrgMembershipController } from './org-membership.controller';
import { OrgMembershipService } from './org-membership.service';

@Module({
  controllers: [OrgMembershipController],
  providers: [OrgMembershipService],
  exports: [OrgMembershipService],
})
export class OrgMembershipModule {}
