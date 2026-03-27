import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 家长发布订单
   */
  @Post('create')
  async createOrder(
    @Body() body: {
      subject: string;
      grade: string;
      student_info: string;
      schedule: string;
      address: string;
      latitude: number;
      longitude: number;
      budget: number;
      requirement?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.createOrder(userId, body);
  }

  /**
   * 获取订单列表（家长视角）
   */
  @Get('list')
  async getOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.getOrdersByParent(
      userId,
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 获取订单详情
   */
  @Get(':id')
  async getOrderDetail(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.getOrderDetail(parseInt(id), userId);
  }

  /**
   * 获取订单抢单列表
   */
  @Get(':id/matches')
  async getOrderMatches(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.getOrderMatches(parseInt(id), userId);
  }

  /**
   * 选择教师（匹配）
   */
  @Post(':id/select-teacher')
  async selectTeacher(
    @Param('id') id: string,
    @Body() body: { teacherId: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.selectTeacher(parseInt(id), userId, body.teacherId);
  }

  /**
   * 更新订单状态
   */
  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.updateOrderStatus(parseInt(id), userId, body.status);
  }

  /**
   * 取消订单
   */
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.cancelOrder(parseInt(id), userId, body.reason);
  }

  /**
   * 评价订单
   */
  @Post(':id/review')
  async createReview(
    @Param('id') id: string,
    @Body() body: { rating: number; content: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.createReview(parseInt(id), userId, body.rating, body.content);
  }

  /**
   * 获取附近的订单（教师视角）
   */
  @Get('nearby')
  async getNearbyOrders(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius: string = '10',
    @Query('subject') subject?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.orderService.getNearbyOrders({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
      subject,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取订单推荐教师
   */
  @Get(':id/recommended-teachers')
  async getRecommendedTeachers(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orderService.getRecommendedTeachers(parseInt(id), userId);
  }
}
