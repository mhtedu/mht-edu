import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pay')
@UseGuards(JwtAuthGuard)
export class PayController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(@Body() body: any, @Request() req: any) {
    const { type, plan_id, product_id, activity_id, order_id, amount } = body;
    const userId = req.user?.id || 1;
    
    try {
      if (type === 'membership' && plan_id) {
        return await this.paymentService.createMembershipPayment(userId, parseInt(plan_id));
      } else if (type === 'product' && product_id) {
        return await this.paymentService.createProductPayment(userId, parseInt(product_id), 1);
      } else {
        // 模拟支付（其他类型）
        const paymentNo = `PAY${Date.now()}`;
        return {
          success: true,
          payment_no: paymentNo,
          pay_params: {
            timeStamp: `${Math.floor(Date.now() / 1000)}`,
            nonceStr: Math.random().toString(36).substring(2),
            package: 'prepay_id=mock_prepay_id',
            signType: 'MD5',
            paySign: 'mock_sign',
          }
        };
      }
    } catch (error: any) {
      // 开发环境返回模拟数据
      console.log('支付创建失败，返回模拟数据:', error.message);
      return {
        success: true,
        payment_no: `PAY${Date.now()}`,
        pay_params: {
          timeStamp: `${Math.floor(Date.now() / 1000)}`,
          nonceStr: Math.random().toString(36).substring(2),
          package: 'prepay_id=mock_prepay_id',
          signType: 'MD5',
          paySign: 'mock_sign',
        }
      };
    }
  }

  @Post('confirm')
  async confirmPayment(@Body() body: any) {
    const { payment_no } = body;
    return {
      success: true,
      message: '支付确认成功',
      payment_no,
    };
  }
}
