import { Controller, Get, Post, Put, Delete, Body, Query, Param, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * 获取推荐活动列表（首页展示）
   * 标记为公开接口，允许小程序体验版未登录用户访问
   */
  @Public()
  @Get('recommended')
  async getRecommendedActivities(
    @Query('limit') limit: string = '4',
  ) {
    return this.activityService.getRecommendedActivities(parseInt(limit));
  }

  /**
   * 获取活动列表
   * 标记为公开接口，允许小程序体验版未登录用户访问
   */
  @Public()
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
   * 获取活动列表（管理后台用）
   */
  @Get()
  async getActivityListForAdmin(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
  ) {
    return this.activityService.getActivityListForAdmin({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
    });
  }

  /**
   * 创建活动
   */
  @Post()
  async createActivity(@Body() body: any) {
    return this.activityService.createActivity(body);
  }

  /**
   * 更新活动
   */
  @Put(':id')
  async updateActivity(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.activityService.updateActivity(parseInt(id), body);
  }

  /**
   * 删除活动
   */
  @Delete(':id')
  async deleteActivity(@Param('id') id: string) {
    return this.activityService.deleteActivity(parseInt(id));
  }

  /**
   * 获取活动详情
   * 标记为公开接口，允许小程序体验版未登录用户访问
   */
  @Public()
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
