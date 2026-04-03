import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { OrgMembershipService } from './org-membership.service';

@Controller('org-membership')
export class OrgMembershipController {
  constructor(private readonly orgMembershipService: OrgMembershipService) {}

  // ==================== 机构会员套餐 ====================

  /**
   * 获取机构会员套餐列表
   */
  @Get('plans')
  async getOrgMembershipPlans() {
    return this.orgMembershipService.getOrgMembershipPlans();
  }

  /**
   * 获取机构会员信息
   */
  @Get('info')
  async getOrgMembershipInfo(@Request() req: any) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgMembershipService.getOrgMembership(orgId);
  }

  /**
   * 获取机构会员统计（含教师会员共享列表）
   */
  @Get('stats')
  async getOrgMembershipStats(@Request() req: any) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgMembershipService.getOrgMembershipStats(orgId);
  }

  /**
   * 购买机构会员
   */
  @Post('buy')
  async buyOrgMembership(
    @Body() body: { planId: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgMembershipService.buyOrgMembership(orgId, body.planId);
  }

  /**
   * 支付成功回调（内部调用）
   */
  @Post('activate')
  async activateMembership(
    @Body() body: { orgId: number; planId: number; paymentId: number },
  ) {
    return this.orgMembershipService.activateOrgMembership(
      body.orgId,
      body.planId,
      body.paymentId,
    );
  }

  /**
   * 设置教师是否继承机构会员
   */
  @Post('teacher/:teacherId/inherit')
  async setTeacherMembershipInherit(
    @Param('teacherId') teacherId: string,
    @Body() body: { inherit: boolean },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgMembershipService.setTeacherMembershipInherit(
      orgId,
      parseInt(teacherId),
      body.inherit,
    );
  }

  /**
   * 检查机构是否有某项权益
   */
  @Get('check-feature')
  async checkOrgFeature(
    @Query('feature') feature: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    const hasFeature = await this.orgMembershipService.checkOrgFeature(orgId, feature);
    return { has_feature: hasFeature };
  }
}
