import { Controller, Post, Body, Request } from '@nestjs/common';
import { RobotService } from './robot.service';

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) {}

  /**
   * 处理机器人消息
   */
  @Post('chat')
  async handleChat(
    @Body() body: { message: string; conversationId?: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.robotService.handleMessage(userId, body.message, body.conversationId);
  }

  /**
   * 获取机器人欢迎消息
   */
  @Post('welcome')
  async getWelcome(@Body() body: { targetRole: number }) {
    return this.robotService.getWelcomeMessage(body.targetRole);
  }
}
