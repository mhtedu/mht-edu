import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() body: {
    parent_id: number;
    subject: string;
    hourly_rate: string;
    student_gender?: number;
    student_grade?: string;
    address: string;
    latitude: string;
    longitude: string;
    description?: string;
  }) {
    return await this.orderService.createOrder(body);
  }

  @Get('parent')
  async getParentOrders(
    @Query('parentId') parentId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return await this.orderService.getParentOrders(
      parseInt(parentId),
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20
    );
  }

  @Get('teacher')
  async getTeacherOrders(@Query() query: {
    latitude: string;
    longitude: string;
    maxDistance?: string;
    subject?: string;
    page?: string;
    pageSize?: string;
  }) {
    return await this.orderService.getTeacherOrders({
      ...query,
      maxDistance: query.maxDistance ? parseInt(query.maxDistance) : undefined,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
    });
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return await this.orderService.getOrderById(parseInt(id));
  }

  @Post(':id/grab')
  async grabOrder(
    @Param('id') id: string,
    @Body() body: { teacher_id: number }
  ) {
    return await this.orderService.grabOrder(parseInt(id), body.teacher_id);
  }

  @Put(':id/unbind')
  async unbindOrder(@Param('id') id: string) {
    return await this.orderService.unbindOrder(parseInt(id));
  }

  @Get(':id/contact')
  async getContact(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    return await this.orderService.getContactInfo(parseInt(id), parseInt(userId));
  }
}
