import { Controller, Get, Post, Put, Body, Query, Param, Request } from '@nestjs/common';
import { OrgService } from './org.service';

@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  // ==================== 教师管理 ====================

  /**
   * 获取机构教师列表
   */
  @Get('teachers')
  async getTeachers(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getTeachers(orgId, {
      keyword,
      status: status ? parseInt(status) : undefined,
    });
  }

  /**
   * 审核通过教师
   */
  @Post('teachers/:id/approve')
  async approveTeacher(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.approveTeacher(orgId, parseInt(id));
  }

  /**
   * 拒绝教师
   */
  @Post('teachers/:id/reject')
  async rejectTeacher(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.rejectTeacher(orgId, parseInt(id));
  }

  /**
   * 更新教师状态
   */
  @Post('teachers/:id/status')
  async updateTeacherStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateTeacherStatus(orgId, parseInt(id), body.status);
  }

  // ==================== 课程管理 ====================

  /**
   * 获取机构课程列表
   */
  @Get('courses')
  async getCourses(
    @Query('keyword') keyword?: string,
    @Request() req?: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getCourses(orgId, { keyword });
  }

  /**
   * 创建/更新课程
   */
  @Post('courses')
  async saveCourse(
    @Body() body: {
      id?: number;
      title: string;
      subject: string;
      teacher_id: number;
      total_hours: number;
      price_per_hour: number;
      schedule: string;
      address: string;
      description: string;
    },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.saveCourse(orgId, body);
  }

  /**
   * 更新课程状态
   */
  @Post('courses/:id/status')
  async updateCourseStatus(
    @Param('id') id: string,
    @Body() body: { status: number },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateCourseStatus(orgId, parseInt(id), body.status);
  }

  // ==================== 机构设置 ====================

  /**
   * 获取机构信息
   */
  @Get('info')
  async getOrgInfo(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getOrgInfo(orgId);
  }

  /**
   * 更新机构信息
   */
  @Put('info')
  async updateOrgInfo(
    @Body() body: Partial<{
      name: string;
      logo: string;
      description: string;
      address: string;
      contact_phone: string;
      contact_email: string;
      business_hours: string;
      subjects: string[];
      city: string;
    }>,
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.updateOrgInfo(orgId, body);
  }

  // ==================== 邀请功能 ====================

  /**
   * 获取邀请信息
   */
  @Get('invite/info')
  async getInviteInfo(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getInviteInfo(orgId);
  }

  /**
   * 发送邀请短信
   */
  @Post('invite/sms')
  async sendInviteSms(
    @Body() body: { phone: string },
    @Request() req: any,
  ) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.sendInviteSms(orgId, body.phone);
  }

  /**
   * 获取邀请记录
   */
  @Get('invite/history')
  async getInviteHistory(@Request() req: any) {
    const orgId = req?.user?.orgId || 1;
    return this.orgService.getInviteHistory(orgId);
  }
}
