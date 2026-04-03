import { Controller, Get, Post, Put, Body, Query, Param, Request } from '@nestjs/common';
import { OrgAssignService } from './org-assign.service';

@Controller('org-assign')
export class OrgAssignController {
  constructor(private readonly orgAssignService: OrgAssignService) {}

  // ==================== 机构教师管理 ====================

  /**
   * 获取机构旗下教师列表
   */
  @Get('teachers')
  async getOrgTeachers(
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgAssignService.getOrgTeachers(
      userId,
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 邀请教师加入机构
   */
  @Post('teachers/invite')
  async inviteTeacher(
    @Body() body: { teacherId: number; commissionRate?: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.inviteTeacher(
      userId,
      body.teacherId,
      body.commissionRate,
    );
  }

  /**
   * 教师处理机构邀请
   */
  @Post('teachers/handle-invite')
  async handleInvite(
    @Body() body: { orgId: number; accept: boolean },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.handleInvite(userId, body.orgId, body.accept);
  }

  /**
   * 解绑教师
   */
  @Post('teachers/unbind')
  async unbindTeacher(
    @Body() body: { teacherId: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.unbindTeacher(userId, body.teacherId);
  }

  /**
   * 设置教师分佣比例
   */
  @Put('teachers/commission')
  async setTeacherCommission(
    @Body() body: { teacherId: number; rate: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.setTeacherCommission(userId, body.teacherId, body.rate);
  }

  // ==================== 机构派单 ====================

  /**
   * 机构派单给教师
   */
  @Post('assign')
  async assignOrder(
    @Body() body: {
      orderId: number;
      teacherId: number;
      assignType: number;
      note?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.assignOrder({
      ...body,
      orgId: userId,
    });
  }

  /**
   * 教师处理机构派单
   */
  @Post('assignments/:id/handle')
  async handleAssignment(
    @Param('id') id: string,
    @Body() body: { accept: boolean; note?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.orgAssignService.handleAssignment(userId, parseInt(id), body.accept, body.note);
  }

  /**
   * 获取机构的派单记录
   */
  @Get('assignments')
  async getOrgAssignments(
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgAssignService.getOrgAssignments(
      userId,
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 获取教师的派单通知
   */
  @Get('teacher-assignments')
  async getTeacherAssignments(
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgAssignService.getTeacherAssignments(
      userId,
      status ? parseInt(status) : undefined,
    );
  }

  /**
   * 机构推荐教师给订单
   */
  @Get('recommend/:orderId')
  async recommendTeachers(
    @Param('orderId') orderId: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id || 1;
    return this.orgAssignService.recommendTeachers(userId, parseInt(orderId));
  }
}
