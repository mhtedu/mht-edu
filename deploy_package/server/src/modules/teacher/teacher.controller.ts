import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { TeacherService } from './teacher.service';

@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  /**
   * 获取教师列表（支持LBS）
   */
  @Get('list')
  async getTeachers(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('subject') subject?: string,
    @Query('grade') grade?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.teacherService.getTeachers({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      subject,
      grade,
      keyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取教师详情
   */
  @Get(':id')
  async getTeacherDetail(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 0;
    return this.teacherService.getTeacherDetail(parseInt(id), userId);
  }

  /**
   * 获取教师的评价列表
   */
  @Get(':id/reviews')
  async getTeacherReviews(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.teacherService.getTeacherReviews(
      parseInt(id),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  /**
   * 留言给教师（婚恋网模式：非会员需付费）
   */
  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherService.sendMessage(parseInt(id), userId, body.content);
  }

  /**
   * 获取教师订单列表（抢单模式）
   */
  @Get('orders/available')
  async getAvailableOrders(
    @Request() req: any,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('subject') subject?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.teacherService.getAvailableOrders({
      userId,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      subject,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 抢单
   */
  @Post('orders/:orderId/grab')
  async grabOrder(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherService.grabOrder(parseInt(orderId), userId);
  }

  /**
   * 获取教师已匹配订单
   */
  @Get('orders/matched')
  async getMatchedOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.teacherService.getMatchedOrders(
      userId,
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 更新订单状态（试课中/已签约/已完成）
   */
  @Post('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherService.updateOrderStatus(
      parseInt(orderId),
      userId,
      body.status,
    );
  }
}
