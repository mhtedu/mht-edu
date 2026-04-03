import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * 发送邀约
   */
  @Post('send')
  async sendInvitation(
    @Request() req: any,
    @Body() body: {
      toUserId: number;
      orderId?: number;
      invitationType: string;
      message?: string;
      trialTime?: string;
      trialAddress?: string;
      userId?: number; // 用于演示
    },
  ) {
    // 支持body中传递userId（用于演示）
    const userId = body.userId || req.user?.id || 1;
    return this.invitationService.sendInvitation({
      fromUserId: userId,
      toUserId: body.toUserId,
      orderId: body.orderId,
      invitationType: body.invitationType,
      message: body.message,
      trialTime: body.trialTime,
      trialAddress: body.trialAddress,
    });
  }

  /**
   * 获取发出的邀约列表
   */
  @Get('sent')
  async getSentInvitations(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('userId') queryUserId?: string,
  ) {
    // 支持URL参数传递userId（用于演示）
    const userId = queryUserId ? parseInt(queryUserId) : (req.user?.id || 1);
    return this.invitationService.getInvitations(userId, 'sent', parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取收到的邀约列表
   */
  @Get('received')
  async getReceivedInvitations(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('userId') queryUserId?: string,
  ) {
    // 支持URL参数传递userId（用于演示）
    const userId = queryUserId ? parseInt(queryUserId) : (req.user?.id || 1);
    return this.invitationService.getInvitations(userId, 'received', parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取邀约详情
   */
  @Get(':id')
  async getInvitationDetail(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const userId = req.user?.id || 1;
    return this.invitationService.getInvitationDetail(parseInt(id), userId);
  }

  /**
   * 同意邀约
   */
  @Post(':id/accept')
  async acceptInvitation(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { responseMessage?: string; userId?: number },
  ) {
    // 支持body中传递userId（用于演示）
    const userId = body.userId || req.user?.id || 1;
    return this.invitationService.acceptInvitation(parseInt(id), userId, body.responseMessage);
  }

  /**
   * 拒绝邀约
   */
  @Post(':id/reject')
  async rejectInvitation(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { responseMessage?: string; userId?: number },
  ) {
    // 支持body中传递userId（用于演示）
    const userId = body.userId || req.user?.id || 1;
    return this.invitationService.rejectInvitation(parseInt(id), userId, body.responseMessage);
  }

  /**
   * 获取未处理邀约数量
   */
  @Get('unread/count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.id || 1;
    return { count: await this.invitationService.getUnreadCount(userId) };
  }

  /**
   * 获取邀约统计
   */
  @Get('stats/overview')
  async getInvitationStats(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.invitationService.getInvitationStats(userId);
  }
}
