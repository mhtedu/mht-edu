import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { PoolService } from './pool.service';

@Controller('pool')
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  /**
   * 获取公海池订单列表
   */
  @Get('orders')
  async getPoolOrders(
    @Query('subject') subject?: string,
    @Query('cityCode') cityCode?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.poolService.getPoolOrders({
      subject,
      cityCode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 从公海池抢单
   */
  @Post('grab/:poolId')
  async grabFromPool(
    @Param('poolId') poolId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.poolService.grabFromPool(parseInt(poolId), userId);
  }

  /**
   * 获取公海池统计
   */
  @Get('stats')
  async getPoolStats() {
    return this.poolService.getPoolStats();
  }

  /**
   * 订单释放到公海池（内部接口）
   */
  @Post('release')
  async releaseToPool(
    @Body() body: {
      orderId: number;
      originalParentId: number;
      originalTeacherId?: number;
      releaseReason: string;
      releaseType: number;
    },
  ) {
    return this.poolService.releaseToPool(body);
  }

  /**
   * 清理过期订单（定时任务）
   */
  @Post('clean-expired')
  async cleanExpiredOrders() {
    return this.poolService.cleanExpiredOrders();
  }

  /**
   * 管理员分配公海池订单
   */
  @Post('assign/:poolId')
  async assignFromPool(
    @Param('poolId') poolId: string,
    @Body() body: { teacherId: number },
  ) {
    return this.poolService.assignFromPool(parseInt(poolId), body.teacherId);
  }
}
