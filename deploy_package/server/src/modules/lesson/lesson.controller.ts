import { Controller, Get, Post, Put, Body, Query, Param, Request } from '@nestjs/common';
import { LessonService } from './lesson.service';

@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  // ==================== 课时记录 ====================

  /**
   * 创建课时记录（教师填写）
   */
  @Post('record')
  async createLessonRecord(
    @Body() body: {
      orderId: number;
      lessonDate: string;
      lessonStartTime: string;
      lessonEndTime: string;
      lessonHours: number;
      lessonContent?: string;
      homework?: string;
      studentPerformance?: string;
      nextLessonPlan?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    // 获取订单信息
    return this.lessonService.createLessonRecord({
      ...body,
      teacherId: userId,
      parentId: 0, // 从订单获取
    });
  }

  /**
   * 获取课时记录列表
   */
  @Get('records')
  async getLessonRecords(
    @Query('orderId') orderId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('parentId') parentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 0;
    return this.lessonService.getLessonRecords({
      orderId: orderId ? parseInt(orderId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      parentId: parentId ? parseInt(parentId) : undefined,
      startDate,
      endDate,
      status: status ? parseInt(status) : undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取课时记录详情
   */
  @Get('records/:id')
  async getLessonRecordDetail(@Param('id') id: string) {
    return this.lessonService.getLessonRecordDetail(parseInt(id));
  }

  /**
   * 更新课时记录
   */
  @Put('records/:id')
  async updateLessonRecord(
    @Param('id') id: string,
    @Body() body: Partial<{
      lessonContent: string;
      homework: string;
      studentPerformance: string;
      nextLessonPlan: string;
      parentComment: string;
    }>,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.lessonService.updateLessonRecord(parseInt(id), userId, body);
  }

  /**
   * 家长确认课时
   */
  @Post('records/:id/confirm')
  async confirmLesson(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.lessonService.confirmLesson(parseInt(id), userId, body.comment);
  }

  /**
   * 家长提出异议
   */
  @Post('records/:id/dispute')
  async disputeLesson(
    @Param('id') id: string,
    @Body() body: { comment: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.lessonService.disputeLesson(parseInt(id), userId, body.comment);
  }

  /**
   * 获取课时统计
   */
  @Get('stats')
  async getLessonStats(
    @Query('teacherId') teacherId?: string,
    @Query('month') month?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.lessonService.getLessonStats(
      teacherId ? parseInt(teacherId) : userId,
      month,
    );
  }

  // ==================== 教师排课日历 ====================

  /**
   * 获取教师排课设置
   */
  @Get('schedules')
  async getTeacherSchedules(
    @Query('teacherId') teacherId?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.lessonService.getTeacherSchedules(
      teacherId ? parseInt(teacherId) : userId,
    );
  }

  /**
   * 设置教师排课时间
   */
  @Post('schedules')
  async setTeacherSchedule(
    @Body() body: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      note?: string;
    }>,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.lessonService.setTeacherSchedule(userId, body);
  }

  /**
   * 检查教师是否有空
   */
  @Get('availability')
  async checkTeacherAvailability(
    @Query('teacherId') teacherId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.lessonService.checkTeacherAvailability(
      parseInt(teacherId),
      date,
      startTime,
      endTime,
    );
  }

  /**
   * 获取教师某月的课程日历
   */
  @Get('calendar')
  async getTeacherMonthlyLessons(
    @Query('teacherId') teacherId?: string,
    @Query('year') year: string = String(new Date().getFullYear()),
    @Query('month') month: string = String(new Date().getMonth() + 1),
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.lessonService.getTeacherMonthlyLessons(
      teacherId ? parseInt(teacherId) : userId,
      parseInt(year),
      parseInt(month),
    );
  }
}
