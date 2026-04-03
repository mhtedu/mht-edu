import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { OrderCloseService } from './order-close.service';

@Controller('order-close')
export class OrderCloseController {
  constructor(private readonly orderCloseService: OrderCloseService) {}

  /**
   * 获取关闭原因选项
   */
  @Get('reasons')
  getCloseReasons() {
    return this.orderCloseService.getCloseReasons();
  }

  /**
   * 家长关闭订单（未达成合作）
   */
  @Post('close')
  async closeOrder(
    @Body() body: {
      orderId: number;
      closeType: number;
      reason: string;
      feedback?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderCloseService.closeOrderByParent({
      ...body,
      parentId: userId,
    });
  }

  /**
   * 订单完成后评价
   */
  @Post('complete-review')
  async completeAndReview(
    @Body() body: {
      orderId: number;
      rating: number;
      content: string;
      tags?: string[];
      isAnonymous?: boolean;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderCloseService.completeAndReview({
      ...body,
      parentId: userId,
    });
  }

  /**
   * 获取订单关闭历史
   */
  @Get('history/:orderId')
  async getCloseHistory(@Param('orderId') orderId: string) {
    return this.orderCloseService.getCloseHistory(parseInt(orderId));
  }

  /**
   * 检查会员权益状态
   */
  @Get('membership-check')
  async checkMembership(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.orderCloseService.checkMembershipValid(userId);
  }
}
