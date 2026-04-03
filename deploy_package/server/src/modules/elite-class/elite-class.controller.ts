import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { EliteClassService } from './elite-class.service';

@Controller('elite-class')
export class EliteClassController {
  constructor(private readonly eliteClassService: EliteClassService) {}

  /**
   * 检查超级会员资格
   */
  @Get('check-super-member')
  async checkSuperMember(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.checkSuperMember(userId);
  }

  /**
   * 创建牛师班
   */
  @Post('create')
  async createClass(@Request() req: any, @Body() body: any) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.createClass(userId, body);
  }

  /**
   * 获取牛师班列表（家长端）
   */
  @Get('list')
  async getClassList(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('subject') subject?: string,
    @Query('keyword') keyword?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.eliteClassService.getClassList({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      subject,
      keyword,
      city,
      page: parseInt(page || '1'),
      pageSize: parseInt(pageSize || '10'),
    });
  }

  /**
   * 获取牛师班详情
   */
  @Get('detail/:id')
  async getClassDetail(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.getClassDetail(parseInt(id), userId);
  }

  /**
   * 报名牛师班
   */
  @Post('enroll')
  async enrollClass(@Request() req: any, @Body() body: { classId: number; referrerId?: number }) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.enrollClass(userId, body.classId, body.referrerId);
  }

  /**
   * 确认报名（教师端）
   */
  @Post('confirm-enrollment')
  async confirmEnrollment(@Request() req: any, @Body() body: { enrollmentId: number }) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.confirmEnrollment(userId, body.enrollmentId);
  }

  /**
   * 更新课时进度
   */
  @Post('update-progress')
  async updateProgress(@Request() req: any, @Body() body: { classId: number; lessonNo: number }) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.updateLessonProgress(userId, body.classId, body.lessonNo);
  }

  /**
   * 获取教师的牛师班列表
   */
  @Get('teacher-classes')
  async getTeacherClasses(@Request() req: any, @Query('status') status?: string) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.getTeacherClasses(
      userId,
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 获取报名学生列表
   */
  @Get('students/:classId')
  async getStudents(@Request() req: any, @Param('classId') classId: string) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.getEnrolledStudents(userId, parseInt(classId));
  }

  /**
   * 结束/取消牛师班
   */
  @Post('close')
  async closeClass(@Request() req: any, @Body() body: { classId: number; reason?: string }) {
    const userId = req.user?.id || 1;
    return this.eliteClassService.closeClass(userId, body.classId, body.reason);
  }
}
