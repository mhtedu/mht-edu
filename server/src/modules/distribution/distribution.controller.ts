import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DistributionService } from './distribution.service';

@Controller('distribution')
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Get('invite-info/:userId')
  async getInviteInfo(@Param('userId') userId: string) {
    return await this.distributionService.getInviteInfo(parseInt(userId));
  }

  @Post('bind-inviter')
  async bindInviter(@Body() body: { user_id: number; invite_code: string }) {
    return await this.distributionService.bindInviter(body.user_id, body.invite_code);
  }

  @Get('commission-list/:userId')
  async getCommissionList(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return await this.distributionService.getCommissionList(
      parseInt(userId),
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20
    );
  }

  @Post('withdraw')
  async applyWithdraw(
    @Body() body: {
      user_id: number;
      amount: number;
      account_info: { type: string; account: string; name: string };
    }
  ) {
    return await this.distributionService.applyWithdraw(
      body.user_id,
      body.amount,
      body.account_info
    );
  }

  @Get('invite-list/:userId')
  async getInviteList(
    @Param('userId') userId: string,
    @Query('level') level?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return await this.distributionService.getInviteList(
      parseInt(userId),
      level === '2' ? 2 : 1,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20
    );
  }
}
