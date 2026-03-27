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
  async buyMembership(@Body() body: { user_id: number; plan_id: number }) {
    return await this.membershipService.buyMembership(body.user_id, body.plan_id);
  }

  @Post('callback')
  async paymentCallback(@Body() body: { payment_no: string; transaction_id: string }) {
    return await this.membershipService.handlePaymentSuccess(
      body.payment_no,
      body.transaction_id
    );
  }
}
