import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 统计数据 ====================
  
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/trend')
  async getTrendStats(@Query('days') days: string = '7') {
    return this.adminService.getTrendStats(parseInt(days));
  }

  // ==================== 用户管理 ====================

  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('role') role?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(
      parseInt(page),
      parseInt(pageSize),
      role ? parseInt(role) : undefined,
      keyword,
      status ? parseInt(status) : undefined,
    );
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(parseInt(id));
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: number; reason?: string },
  ) {
    return this.adminService.updateUserStatus(parseInt(id), body.status, body.reason);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: number },
  ) {
    return this.adminService.updateUserRole(parseInt(id), body.role);
  }

  @Post('users/:id/membership')
  async grantMembership(
    @Param('id') id: string,
    @Body() body: { days: number },
  ) {
    return this.adminService.grantMembership(parseInt(id), body.days);
  }

  // ==================== 教师管理 ====================

  @Get('teachers')
  async getTeachers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('verifyStatus') verifyStatus?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getTeachers(
      parseInt(page),
      parseInt(pageSize),
      verifyStatus ? parseInt(verifyStatus) : undefined,
      keyword,
    );
  }

  @Put('teachers/:id/verify')
  async verifyTeacher(
    @Param('id') id: string,
    @Body() body: { status: number; reason?: string },
  ) {
    return this.adminService.verifyTeacher(parseInt(id), body.status, body.reason);
  }

  // ==================== 订单管理 ====================

  @Get('orders')
  async getOrders(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getOrders(
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
      keyword,
    );
  }

  @Get('orders/:id')
  async getOrderDetail(@Param('id') id: string) {
    return this.adminService.getOrderDetail(parseInt(id));
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
  ) {
    return this.adminService.updateOrderStatus(parseInt(id), body.status);
  }

  @Post('orders/:id/match')
  async matchOrder(
    @Param('id') id: string,
    @Body() body: { teacherId: number },
  ) {
    return this.adminService.matchOrder(parseInt(id), body.teacherId);
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(parseInt(id));
  }

  // ==================== 机构管理 ====================

  @Get('orgs')
  async getOrgs(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrgs(
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  @Put('orgs/:id/audit')
  async auditOrg(
    @Param('id') id: string,
    @Body() body: { status: number; reason?: string },
  ) {
    return this.adminService.auditOrg(parseInt(id), body.status, body.reason);
  }

  // ==================== 代理管理 ====================

  @Get('agents')
  async getAgents(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.adminService.getAgents(parseInt(page), parseInt(pageSize));
  }

  @Post('agents')
  async createAgent(
    @Body() body: { userId: number; cityCode: string; cityName: string; commissionRate?: number },
  ) {
    return this.adminService.createAgent(
      body.userId,
      body.cityCode,
      body.cityName,
      body.commissionRate || 5,
    );
  }

  @Put('agents/:id/rate')
  async updateAgentRate(
    @Param('id') id: string,
    @Body() body: { rate: number },
  ) {
    return this.adminService.updateAgentRate(parseInt(id), body.rate);
  }

  // ==================== 会员套餐管理 ====================

  @Get('membership-plans')
  async getMembershipPlans(@Query('role') role?: string) {
    return this.adminService.getMembershipPlans(role ? parseInt(role) : undefined);
  }

  @Post('membership-plans')
  async createMembershipPlan(
    @Body() body: {
      name: string;
      role: number;
      price: number;
      originalPrice: number;
      durationDays: number;
      features: string[];
    },
  ) {
    return this.adminService.createMembershipPlan(body);
  }

  @Put('membership-plans/:id')
  async updateMembershipPlan(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      price: number;
      originalPrice: number;
      durationDays: number;
      features: string[];
      isActive: number;
    }>,
  ) {
    return this.adminService.updateMembershipPlan(parseInt(id), body);
  }

  // ==================== 商品管理 ====================

  @Get('products')
  async getProducts(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getProducts(
      parseInt(page),
      parseInt(pageSize),
      isActive !== undefined ? parseInt(isActive) : undefined,
    );
  }

  @Post('products')
  async createProduct(
    @Body() body: {
      name: string;
      cover: string;
      images?: string[];
      description?: string;
      price: number;
      originalPrice?: number;
      stock: number;
      category?: string;
    },
  ) {
    return this.adminService.createProduct(body);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      cover: string;
      images: string[];
      description: string;
      price: number;
      originalPrice: number;
      stock: number;
      category: string;
      isActive: number;
    }>,
  ) {
    return this.adminService.updateProduct(parseInt(id), body);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(parseInt(id));
  }

  // ==================== 广告位管理 ====================

  @Get('banners')
  async getBanners(@Query('position') position?: string) {
    return this.adminService.getBanners(position);
  }

  @Post('banners')
  async createBanner(
    @Body() body: {
      position: string;
      title: string;
      imageUrl: string;
      linkUrl?: string;
      sortOrder?: number;
    },
  ) {
    return this.adminService.createBanner(body);
  }

  @Put('banners/:id')
  async updateBanner(
    @Param('id') id: string,
    @Body() body: Partial<{
      position: string;
      title: string;
      imageUrl: string;
      linkUrl: string;
      sortOrder: number;
      isActive: number;
    }>,
  ) {
    return this.adminService.updateBanner(parseInt(id), body);
  }

  @Delete('banners/:id')
  async deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(parseInt(id));
  }

  // ==================== 分佣管理 ====================

  @Get('commissions')
  async getCommissions(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getCommissions(
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  @Post('commissions/settle')
  async settleCommissions(@Body() body: { ids: number[] }) {
    return this.adminService.settleCommissions(body.ids);
  }

  // ==================== 提现管理 ====================

  @Get('withdrawals')
  async getWithdrawals(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getWithdrawals(
      parseInt(page),
      parseInt(pageSize),
      status ? parseInt(status) : undefined,
    );
  }

  @Put('withdrawals/:id/audit')
  async auditWithdrawal(
    @Param('id') id: string,
    @Body() body: { status: number; reason?: string },
  ) {
    return this.adminService.auditWithdrawal(parseInt(id), body.status, body.reason);
  }
}
