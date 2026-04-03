import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出用户数据
   */
  @Get('users')
  @Public()
  async exportUsers(
    @Query('role') role?: string,
    @Query('membership_type') membershipType?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.exportService.exportUsers({
      role,
      membership_type: membershipType,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 导出订单数据
   */
  @Get('orders')
  @Public()
  async exportOrders(
    @Query('status') status?: string,
    @Query('subject') subject?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.exportService.exportOrders({
      status,
      subject,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 导出支付记录
   */
  @Get('payments')
  @Public()
  async exportPayments(
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.exportService.exportPayments({
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 导出佣金记录
   */
  @Get('commissions')
  @Public()
  async exportCommissions(
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.exportService.exportCommissions({
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 导出提现记录
   */
  @Get('withdrawals')
  @Public()
  async exportWithdrawals(
    @Query('status') status?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return await this.exportService.exportWithdrawals({
      status,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * 下载导出文件
   */
  @Get('download')
  @Public()
  async downloadFile(
    @Query('type') type: string,
    @Res() res: Response,
    @Query('role') role?: string,
    @Query('membership_type') membershipType?: string,
    @Query('status') status?: string,
    @Query('subject') subject?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    let result: any;

    switch (type) {
      case 'users':
        result = await this.exportService.exportUsers({
          role,
          membership_type: membershipType,
          start_date: startDate,
          end_date: endDate,
        });
        break;
      case 'orders':
        result = await this.exportService.exportOrders({
          status,
          subject,
          start_date: startDate,
          end_date: endDate,
        });
        break;
      case 'payments':
        result = await this.exportService.exportPayments({
          status,
          start_date: startDate,
          end_date: endDate,
        });
        break;
      case 'commissions':
        result = await this.exportService.exportCommissions({
          status,
          start_date: startDate,
          end_date: endDate,
        });
        break;
      case 'withdrawals':
        result = await this.exportService.exportWithdrawals({
          status,
          start_date: startDate,
          end_date: endDate,
        });
        break;
      default:
        res.status(400).json({ error: 'Invalid export type' });
        return;
    }

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }
}
