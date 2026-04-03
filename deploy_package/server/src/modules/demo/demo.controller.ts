import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DemoService } from './demo.service';

@Controller('admin/demo')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  // ==================== 配置管理 ====================

  /**
   * 获取演示数据配置
   */
  @Get('config')
  @RequirePermission('demo:view')
  getConfig() {
    return this.demoService.getConfig();
  }

  /**
   * 更新演示数据配置
   */
  @Put('config')
  @RequirePermission('demo:edit')
  updateConfig(@Body() config: any) {
    return this.demoService.updateConfig(config);
  }

  // ==================== 演示用户管理 ====================

  /**
   * 获取机器人用户列表
   */
  @Get('robots')
  @RequirePermission('demo:view')
  getRobotUsers() {
    return this.demoService.getRobotUsers();
  }

  /**
   * 创建单个演示用户
   */
  @Post('users')
  @RequirePermission('demo:create')
  createDemoUser(@Body() data: any) {
    return this.demoService.createDemoUser(data);
  }

  /**
   * 批量创建演示老师
   */
  @Post('teachers/batch')
  @RequirePermission('demo:create')
  createDemoTeachers(@Body() body: { count?: number }) {
    return this.demoService.createDemoTeachers(body.count || 20);
  }

  /**
   * 批量创建演示家长
   */
  @Post('parents/batch')
  @RequirePermission('demo:create')
  createDemoParents(@Body() body: { count?: number }) {
    return this.demoService.createDemoParents(body.count || 30);
  }

  // ==================== 演示订单管理 ====================

  /**
   * 创建演示订单
   */
  @Post('orders')
  @RequirePermission('demo:create')
  createDemoOrder(@Body() data: any) {
    return this.demoService.createDemoOrder(data);
  }

  /**
   * 批量创建演示订单
   */
  @Post('orders/batch')
  @RequirePermission('demo:create')
  createDemoOrders(@Body() body: { count?: number }) {
    return this.demoService.createDemoOrders(body.count || 15);
  }

  // ==================== 数据管理 ====================

  /**
   * 一键初始化演示数据
   */
  @Post('init')
  @RequirePermission('demo:create')
  initDemoData() {
    return this.demoService.initDemoData();
  }

  /**
   * 清除所有演示数据
   */
  @Delete('clear')
  @RequirePermission('demo:delete')
  clearDemoData() {
    return this.demoService.clearDemoData();
  }

  // ==================== 机器人行为控制 ====================

  /**
   * 手动触发抢单模拟
   */
  @Post('trigger/grab')
  @RequirePermission('demo:edit')
  triggerGrabOrders() {
    return this.demoService.simulateGrabOrders();
  }

  /**
   * 手动触发评论模拟
   */
  @Post('trigger/comment')
  @RequirePermission('demo:edit')
  triggerComments() {
    return this.demoService.simulateComments();
  }

  /**
   * 手动触发点赞模拟
   */
  @Post('trigger/like')
  @RequirePermission('demo:edit')
  triggerLikes() {
    return this.demoService.simulateLikes();
  }
}
