import { Controller, Get, Post, Put, Delete, Body, Query, Param, Request } from '@nestjs/common';
import { TeacherProfileService } from './teacher-profile.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('teacher-profile')
export class TeacherProfileController {
  constructor(private readonly teacherProfileService: TeacherProfileService) {}

  // ==================== 教师列表 ====================

  /**
   * 获取附近教师列表
   * 注意：此路由必须放在 :id 路由之前，否则 'nearby' 会被当成 id 参数
   */
  @Public()
  @Get('nearby')
  async getNearbyTeachers(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('subject') subject?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.teacherProfileService.getNearbyTeachers({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : 50,
      subject,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  // ==================== 教师主页 ====================

  /**
   * 获取教师主页信息
   */
  @Get(':id')
  async getTeacherProfile(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const viewerId = req.user?.id || 0;
    return this.teacherProfileService.getTeacherProfile(parseInt(id), viewerId);
  }

  /**
   * 更新教师主页信息
   */
  @Put('update')
  async updateTeacherProfile(
    @Body() body: Partial<{
      realName: string;
      gender: number;
      birthYear: number;
      education: string;
      subjects: string[];
      hourlyRateMin: number;
      hourlyRateMax: number;
      intro: string;
      oneLineIntro: string;
      photos: string[];
      videos: string[];
      coverPhoto: string;
      teachingYears: number;
    }>,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.updateTeacherProfile(userId, body);
  }

  /**
   * 获取教师统计数据
   */
  @Get(':id/stats')
  async getTeacherStats(@Param('id') id: string) {
    return this.teacherProfileService.getTeacherStats(parseInt(id));
  }

  // ==================== 教师动态 ====================

  /**
   * 发布动态
   */
  @Post('moments')
  async publishMoment(
    @Body() body: {
      content: string;
      images?: string[];
      videoUrl?: string;
      videoCover?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.publishMoment(userId, body);
  }

  /**
   * 获取教师动态列表
   */
  @Get(':id/moments')
  async getMoments(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.teacherProfileService.getMoments(
      parseInt(id),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  /**
   * 删除动态
   */
  @Delete('moments/:momentId')
  async deleteMoment(
    @Param('momentId') momentId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.deleteMoment(userId, parseInt(momentId));
  }

  /**
   * 点赞动态
   */
  @Post('moments/:momentId/like')
  async likeMoment(
    @Param('momentId') momentId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.likeMoment(parseInt(momentId), userId);
  }

  // ==================== 教师评价 ====================

  /**
   * 获取教师评价列表
   */
  @Get(':id/reviews')
  async getTeacherReviews(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.teacherProfileService.getTeacherReviews(
      parseInt(id),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  /**
   * 教师回复评价
   */
  @Post('reviews/:reviewId/reply')
  async replyReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { reply: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.replyReview(userId, parseInt(reviewId), body.reply);
  }

  // ==================== 联系方式解锁 ====================

  /**
   * 解锁联系方式
   */
  @Post('unlock-contact')
  async unlockContact(
    @Body() body: {
      targetUserId: number;
      orderId?: number;
      unlockType: number;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    // 检查会员状态
    const isMember = true; // TODO: 从用户信息获取

    return this.teacherProfileService.unlockContact({
      userId,
      targetUserId: body.targetUserId,
      orderId: body.orderId,
      unlockType: body.unlockType,
      isMember,
    });
  }

  /**
   * 更新微信号
   */
  @Put('wechat')
  async updateWechat(
    @Body() body: { wechatId: string; qrcode?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.teacherProfileService.updateWechat(userId, body.wechatId, body.qrcode);
  }
}
