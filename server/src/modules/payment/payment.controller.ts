import { Controller, Get, Post, Body, Query, Param, Request, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request as ExpressRequest, Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 创建支付订单（会员）
   */
  @Post('membership')
  async createMembershipPayment(
    @Request() req: any,
    @Body() body: { planId: number },
  ) {
    const userId = req.user?.id || 1;
    return this.paymentService.createMembershipPayment(userId, body.planId);
  }

  /**
   * 创建支付订单（商品）
   */
  @Post('product')
  async createProductPayment(
    @Request() req: any,
    @Body() body: { productId: number; quantity: number },
  ) {
    const userId = req.user?.id || 1;
    return this.paymentService.createProductPayment(
      userId,
      body.productId,
      body.quantity || 1,
    );
  }

  /**
   * 微信支付回调
   */
  @Post('notify/wechat')
  async wechatNotify(@Req() req: ExpressRequest, @Res() res: Response) {
    try {
      const xml = req.body;
      const result = await this.paymentService.handleWechatNotify(xml);
      
      // 返回微信需要的格式
      res.type('application/xml');
      res.send(`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`);
    } catch (error) {
      res.type('application/xml');
      res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${error.message}]]></return_msg></xml>`);
    }
  }

  /**
   * 查询支付状态
   */
  @Get('status/:paymentNo')
  async getPaymentStatus(
    @Request() req: any,
    @Param('paymentNo') paymentNo: string,
  ) {
    const userId = req.user?.id || 1;
    return this.paymentService.getPaymentStatus(userId, paymentNo);
  }

  /**
   * 获取支付记录列表
   */
  @Get('records')
  async getPaymentRecords(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.paymentService.getPaymentRecords(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 模拟支付（开发环境测试用）
   */
  @Post('mock-pay')
  async mockPay(
    @Request() req: any,
    @Body() body: { paymentNo: string },
  ) {
    const userId = req.user?.id || 1;
    return this.paymentService.mockPay(userId, body.paymentNo);
  }
}
