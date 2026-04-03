import { Controller, Get, Post, Put, Body, Query, Param, Request } from '@nestjs/common';
import { TeachingService } from './teaching.service';

@Controller('teaching')
export class TeachingController {
  constructor(private readonly teachingService: TeachingService) {}

  // ==================== 试课反馈 ====================

  /**
   * 教师提交试课反馈
   */
  @Post('trial/teacher-feedback')
  async submitTeacherFeedback(
    @Body() body: {
      orderId: number;
      studentLevel: string;
      teachingSuggestion: string;
      expectedGoals: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teachingService.submitTeacherFeedback({
      ...body,
      teacherId: userId,
    });
  }

  /**
   * 家长提交试课反馈
   */
  @Post('trial/parent-feedback')
  async submitParentFeedback(
    @Body() body: {
      orderId: number;
      teacherId: number;
      satisfaction: number;
      teacherAttitude: number;
      teachingQuality: number;
      willingness: number;
      comment?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teachingService.submitParentFeedback({
      ...body,
      parentId: userId,
    });
  }

  /**
   * 获取试课反馈
   */
  @Get('trial/:orderId')
  async getTrialFeedback(@Param('orderId') orderId: string) {
    return this.teachingService.getTrialFeedback(parseInt(orderId));
  }

  // ==================== 教学计划 ====================

  /**
   * 创建教学计划
   */
  @Post('plan')
  async createTeachingPlan(
    @Body() body: {
      orderId: number;
      subject: string;
      totalLessons?: number;
      startDate?: string;
      endDate?: string;
      teachingGoals?: string;
      teachingMethods?: string;
      materials?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teachingService.createTeachingPlan({
      ...body,
      teacherId: userId,
    });
  }

  /**
   * 获取教学计划
   */
  @Get('plan/:orderId')
  async getTeachingPlan(@Param('orderId') orderId: string) {
    return this.teachingService.getTeachingPlan(parseInt(orderId));
  }

  /**
   * 更新教学计划
   */
  @Put('plan/:orderId')
  async updateTeachingPlan(
    @Param('orderId') orderId: string,
    @Body() body: Partial<{
      totalLessons: number;
      startDate: string;
      endDate: string;
      teachingGoals: string;
      teachingMethods: string;
      materials: string;
      notes: string;
      completedLessons: number;
    }>,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teachingService.updateTeachingPlan(parseInt(orderId), userId, body);
  }

  /**
   * 更新教学进度
   */
  @Put('plan/:orderId/progress')
  async updateProgress(
    @Param('orderId') orderId: string,
    @Body() body: { completedLessons: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teachingService.updateProgress(parseInt(orderId), userId, body.completedLessons);
  }

  /**
   * 获取教师的所有教学计划
   */
  @Get('plans')
  async getTeacherPlans(
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.teachingService.getTeacherPlans(userId, status);
  }
}
