import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 获取统计数据
   */
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  /**
   * 获取订单列表
   */
  @Get('orders')
  async getOrders(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrders(
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 获取用户列表
   */
  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('role') role?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page),
      parseInt(pageSize),
      role ? parseInt(role) : undefined,
    );
  }

  /**
   * 获取教师列表
   */
  @Get('teachers')
  async getTeachers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.adminService.getTeachers(parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取机构列表
   */
  @Get('orgs')
  async getOrgs(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.adminService.getOrgs(parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取代理商列表
   */
  @Get('agents')
  async getAgents(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.adminService.getAgents(parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取广告位列表
   */
  @Get('banners')
  async getBanners() {
    return this.adminService.getBanners();
  }
}
