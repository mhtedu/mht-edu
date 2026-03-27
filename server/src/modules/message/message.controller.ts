import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { MessageService } from './message.service';
import { MembershipGuard } from '@/common/guards/membership.guard';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * 获取会话列表
   */
  @Get('conversations')
  async getConversations(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.messageService.getConversations(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取会话消息
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.messageService.getMessages(
      parseInt(conversationId),
      userId,
      parseInt(page),
      parseInt(pageSize),
    );
  }

  /**
   * 发送消息
   */
  @Post('send')
  async sendMessage(
    @Request() req: any,
    @Body() body: { conversationId: number; content: string; msgType?: number },
  ) {
    const userId = req.user?.id || 1;
    return this.messageService.sendMessage(
      body.conversationId,
      userId,
      body.content,
      body.msgType || 0,
    );
  }

  /**
   * 创建或获取订单会话
   */
  @Post('conversation/order')
  async getOrCreateOrderConversation(
    @Request() req: any,
    @Body() body: { orderId: number; targetUserId: number },
  ) {
    const userId = req.user?.id || 1;
    return this.messageService.getOrCreateOrderConversation(
      body.orderId,
      userId,
      body.targetUserId,
    );
  }

  /**
   * 标记会话已读
   */
  @Post('conversations/:id/read')
  async markAsRead(@Request() req: any, @Param('id') conversationId: string) {
    const userId = req.user?.id || 1;
    return this.messageService.markAsRead(parseInt(conversationId), userId);
  }

  /**
   * 获取未读消息数
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.messageService.getUnreadCount(userId);
  }

  /**
   * 获取消息提醒列表
   */
  @Get('reminders')
  async getReminders(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.messageService.getReminders(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 标记提醒已读
   */
  @Post('reminders/read')
  async markRemindersRead(@Request() req: any, @Body() body: { ids?: number[] }) {
    const userId = req.user?.id || 1;
    return this.messageService.markRemindersRead(userId, body.ids);
  }
}
