import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('plans')
  async getPlans() {
    return await this.membershipService.getMembershipPlans();
  }

  @Get('plans/:role')
  async getPlansByRole(@Param('role') role: string) {
    return await this.membershipService.getMembershipPlans(parseInt(role));
  }

  @Get('info/:userId')
  async getMembershipInfo(@Param('userId') userId: string) {
    return await this.membershipService.getUserMembership(parseInt(userId));
  }

  @Post('buy')
  async buyMembership(@Body() body: { user_id?: number; plan_id?: number; userId?: number; planId?: number }) {
    // 兼容两种参数命名风格
    const userId = body.user_id || body.userId;
    const planId = body.plan_id || body.planId;
    
    if (!userId || !planId) {
      throw new Error('缺少必要参数: userId 和 planId');
    }
    
    return await this.membershipService.buyMembership(userId, planId);
  }

  @Post('callback')
  async paymentCallback(@Body() body: { payment_no: string; transaction_id: string }) {
    return await this.membershipService.handlePaymentSuccess(
      body.payment_no,
      body.transaction_id
    );
  }
}
