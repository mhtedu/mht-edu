import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * 获取活动列表
   */
  @Get('list')
  async getActivityList(
    @Query('role') role?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.activityService.getActivityList({
      role: role ? parseInt(role) : undefined,
      type,
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取活动详情
   */
  @Get(':id')
  async getActivityDetail(@Param('id') id: string) {
    return this.activityService.getActivityDetail(parseInt(id));
  }

  /**
   * 报名活动
   */
  @Post(':id/signup')
  async signupActivity(
    @Param('id') id: string,
    @Body() body: { signupType: number; participantName: string; participantPhone: string; participantCount: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.activityService.signupActivity(
      parseInt(id),
      userId,
      body.signupType,
      body.participantName,
      body.participantPhone,
      body.participantCount || 1,
    );
  }

  /**
   * 获取用户报名的活动
   */
  @Get('user/signed')
  async getUserSignedActivities(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const userId = req.user?.id || 1;
    return this.activityService.getUserSignedActivities(
      userId,
      parseInt(page),
      parseInt(pageSize),
      status,
    );
  }

  /**
   * 取消报名
   */
  @Post(':id/cancel')
  async cancelSignup(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.activityService.cancelSignup(parseInt(id), userId);
  }

  /**
   * 获取活动参与者列表
   */
  @Get(':id/participants')
  async getActivityParticipants(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.activityService.getActivityParticipants(
      parseInt(id),
      parseInt(page),
      parseInt(pageSize),
    );
  }
}
