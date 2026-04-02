import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { OrgValueService } from './org-value.service';

@Controller('org-value')
export class OrgValueController {
  constructor(private readonly orgValueService: OrgValueService) {}

  // ==================== 优惠券管理 ====================

  /**
   * 创建优惠券
   */
  @Post('coupons')
  async createCoupon(
    @Body() body: {
      name: string;
      type: number;
      discount_amount?: number;
      discount_rate?: number;
      min_amount?: number;
      total_count: number;
      per_user_limit?: number;
      start_at: string;
      expire_at: string;
      apply_scope?: number;
      teacher_ids?: number[];
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.createCoupon(orgId, body);
  }

  /**
   * 获取机构优惠券列表
   */
  @Get('coupons')
  async getCoupons(
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getCoupons(orgId, status ? parseInt(status) : undefined);
  }

  /**
   * 用户领取优惠券
   */
  @Post('coupons/:id/receive')
  async receiveCoupon(
    @Param('id') couponId: string,
    @Request() req: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgValueService.receiveCoupon(userId, parseInt(couponId));
  }

  /**
   * 获取用户可用优惠券
   */
  @Get('user-coupons')
  async getUserCoupons(
    @Query('orgId') orgId?: string,
    @Query('teacherId') teacherId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgValueService.getUserCoupons(
      userId,
      orgId ? parseInt(orgId) : undefined,
      teacherId ? parseInt(teacherId) : undefined,
    );
  }

  // ==================== 学员CRM管理 ====================

  /**
   * 创建学员
   */
  @Post('students')
  async createStudent(
    @Body() body: {
      student_name: string;
      parent_name?: string;
      parent_phone?: string;
      grade?: string;
      subjects?: string[];
      teacher_id?: number;
      source?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.createStudent(orgId, body);
  }

  /**
   * 获取学员列表
   */
  @Get('students')
  async getStudents(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getStudents(orgId, {
      keyword,
      status: status ? parseInt(status) : undefined,
      teacher_id: teacherId ? parseInt(teacherId) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
  }

  /**
   * 更新学员状态
   */
  @Post('students/:id/status')
  async updateStudentStatus(
    @Param('id') studentId: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.updateStudentStatus(orgId, parseInt(studentId), body.status);
  }

  /**
   * 添加跟进记录
   */
  @Post('students/:id/follow')
  async addFollowRecord(
    @Param('id') studentId: string,
    @Body() body: {
      follow_type: string;
      content: string;
      next_action?: string;
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    const userId = req?.user?.id || 1;
    return this.orgValueService.addFollowRecord(orgId, {
      student_id: parseInt(studentId),
      operator_id: userId,
      ...body,
    });
  }

  /**
   * 获取跟进记录
   */
  @Get('students/:id/follow-records')
  async getFollowRecords(@Param('id') studentId: string) {
    return this.orgValueService.getFollowRecords(parseInt(studentId));
  }

  /**
   * 获取待跟进学员
   */
  @Get('students/pending-follow')
  async getPendingFollowStudents(@Request() req: any) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getPendingFollowStudents(orgId);
  }

  // ==================== 财务结算 ====================

  /**
   * 获取财务概览
   */
  @Get('financial/overview')
  async getFinancialOverview(@Request() req: any) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getFinancialOverview(orgId);
  }

  /**
   * 获取结算记录
   */
  @Get('financial/settlements')
  async getSettlements(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getSettlements(orgId, {
      status: status ? parseInt(status) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    });
  }

  // ==================== 数据分析 ====================

  /**
   * 获取数据分析
   */
  @Get('analysis')
  async getDataAnalysis(
    @Query('period') period?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getDataAnalysis(orgId, period || 'month');
  }

  // ==================== 品牌展示管理 ====================

  /**
   * 获取品牌配置
   */
  @Get('brand')
  async getBrandConfig(@Request() req: any) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.getBrandConfig(orgId);
  }

  /**
   * 更新品牌配置
   */
  @Put('brand')
  async updateBrandConfig(
    @Body() body: {
      banner_images?: string[];
      intro_video?: string;
      featured_teachers?: number[];
      success_cases?: any[];
      honors?: string[];
      teaching_features?: string;
      service_promise?: string;
      faqs?: any[];
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || req?.user?.id || 1;
    return this.orgValueService.updateBrandConfig(orgId, body);
  }
}
