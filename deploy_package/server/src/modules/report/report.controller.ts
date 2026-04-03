import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * 获取运营概览
   */
  @Get('overview')
  @Public()
  async getOverview() {
    return await this.reportService.getOverview();
  }

  /**
   * 获取趋势数据
   */
  @Get('trend')
  @Public()
  async getTrend(@Query('days') days?: string) {
    return await this.reportService.getTrend(days ? parseInt(days) : 30);
  }

  /**
   * 获取用户分布
   */
  @Get('user-distribution')
  @Public()
  async getUserDistribution() {
    return await this.reportService.getUserDistribution();
  }

  /**
   * 获取订单分布
   */
  @Get('order-distribution')
  @Public()
  async getOrderDistribution() {
    return await this.reportService.getOrderDistribution();
  }

  /**
   * 获取收入分析
   */
  @Get('revenue')
  @Public()
  async getRevenueAnalysis() {
    return await this.reportService.getRevenueAnalysis();
  }

  /**
   * 获取分销统计
   */
  @Get('distribution')
  @Public()
  async getDistributionStats() {
    return await this.reportService.getDistributionStats();
  }
}
