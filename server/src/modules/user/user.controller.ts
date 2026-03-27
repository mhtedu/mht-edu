import { Controller, Get, Post, Put, Body, Query, Param, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取当前用户信息
   */
  @Get('info')
  async getUserInfo(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getUserInfo(userId);
  }

  /**
   * 更新用户信息
   */
  @Put('info')
  async updateUserInfo(
    @Body() body: { nickname?: string; avatar?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateUserInfo(userId, body);
  }

  /**
   * 更新位置信息
   */
  @Post('location')
  async updateLocation(
    @Body() body: { latitude: number; longitude: number; address?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateLocation(userId, body);
  }

  /**
   * 切换角色
   */
  @Post('switch-role')
  async switchRole(
    @Body() body: { role: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.switchRole(userId, body.role);
  }

  /**
   * 获取会员信息
   */
  @Get('membership')
  async getMembershipInfo(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getMembershipInfo(userId);
  }

  /**
   * 获取会员套餐列表
   */
  @Get('membership/plans')
  async getMembershipPlans(@Query('role') role: string) {
    return this.userService.getMembershipPlans(parseInt(role) || 0);
  }

  /**
   * 获取收益信息
   */
  @Get('earnings')
  async getEarnings(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getEarnings(userId);
  }

  /**
   * 获取收益明细
   */
  @Get('earnings/records')
  async getEarningRecords(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.userService.getEarningRecords(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 申请提现
   */
  @Post('withdraw')
  async requestWithdrawal(
    @Body() body: { amount: number; bankInfo: any },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.requestWithdrawal(userId, body.amount, body.bankInfo);
  }

  /**
   * 获取邀请信息
   */
  @Get('invite')
  async getInviteInfo(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getInviteInfo(userId);
  }

  /**
   * 获取邀请列表
   */
  @Get('invite/list')
  async getInviteList(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.userService.getInviteList(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取教师档案
   */
  @Get('teacher-profile')
  async getTeacherProfile(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getTeacherProfile(userId);
  }

  /**
   * 更新教师档案
   */
  @Post('teacher-profile')
  async updateTeacherProfile(
    @Body() body: {
      real_name?: string;
      gender?: number;
      education?: string;
      subjects?: string;
      grades?: string;
      teaching_years?: number;
      hourly_rate?: number;
      bio?: string;
      certificates?: string[];
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateTeacherProfile(userId, body);
  }

  /**
   * 获取机构档案
   */
  @Get('org-profile')
  async getOrgProfile(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getOrgProfile(userId);
  }

  /**
   * 更新机构档案
   */
  @Post('org-profile')
  async updateOrgProfile(
    @Body() body: {
      org_name?: string;
      license_no?: string;
      contact_name?: string;
      contact_phone?: string;
      address?: string;
      intro?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateOrgProfile(userId, body);
  }

  /**
   * 绑定邀请码
   */
  @Post('bind-inviter')
  async bindInviter(
    @Body() body: { inviteCode: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.bindInviter(userId, body.inviteCode);
  }

  /**
   * 上传头像
   */
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.uploadAvatar(userId, file);
  }

  /**
   * 获取用户设置
   */
  @Get('settings')
  async getSettings(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getSettings(userId);
  }

  /**
   * 更新用户设置
   */
  @Put('settings')
  async updateSettings(
    @Body() body: { key: string; value: any },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateSettings(userId, body.key, body.value);
  }
}
