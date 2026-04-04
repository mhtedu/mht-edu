import { Controller, Get, Post, Put, Body, Query, Param, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { SmsService } from '../sms/sms.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * 用户登录（验证码登录）
   */
  @Public()
  @Post('login')
  async login(@Body() body: { mobile: string; code: string }) {
    if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
      return { success: false, message: '请输入正确的手机号' };
    }
    if (!body.code || body.code.length !== 6) {
      return { success: false, message: '请输入6位验证码' };
    }

    // 验证验证码
    const isValid = await this.smsService.verifyCode(body.mobile, body.code);
    if (!isValid) {
      return { success: false, message: '验证码错误或已过期' };
    }

    return this.userService.login(body.mobile);
  }

  /**
   * 用户注册
   */
  @Public()
  @Post('register')
  async register(@Body() body: { mobile: string; code: string; nickname?: string; role?: number; platform?: string }) {
    if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
      return { success: false, message: '请输入正确的手机号' };
    }
    if (!body.code || body.code.length !== 6) {
      return { success: false, message: '请输入6位验证码' };
    }

    // 验证验证码
    const isValid = await this.smsService.verifyCode(body.mobile, body.code);
    if (!isValid) {
      return { success: false, message: '验证码错误或已过期' };
    }

    return this.userService.register(body.mobile, body.nickname, body.role, body.platform);
  }

  /**
   * 发送验证码
   */
  @Public()
  @Post('send-code')
  async sendCode(@Body() body: { mobile: string; type?: string }) {
    if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
      return { success: false, message: '请输入正确的手机号' };
    }

    const result = await this.smsService.sendVerificationCode(body.mobile);
    return result;
  }

  /**
   * 获取当前用户信息
   */
  @Get('info')
  async getUserInfo(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getUserInfo(userId);
  }

  /**
   * 获取教师列表（支持LBS）
   */
  @Get('teachers/list')
  async getTeachersList(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('subject') subject?: string,
    @Query('grade') grade?: string,
    @Query('keyword') keyword?: string,
    @Query('city') city?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.userService.getTeachersList({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      subject,
      grade,
      keyword,
      city,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取订单列表（教师端）
   */
  @Get('orders/list')
  async getOrdersList(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('subject') subject?: string,
    @Query('city') city?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.userService.getOrdersList({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      subject,
      city,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
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
   * 获取会员信息（按角色类型查询）
   */
  @Get('membership')
  async getMembershipInfo(
    @Request() req: any,
    @Query('role_type') roleType?: string,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.getMembershipInfo(userId, roleType);
  }

  /**
   * 获取所有角色的会员状态
   */
  @Get('membership/all')
  async getAllMembershipInfo(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getAllMembershipInfo(userId);
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

  /**
   * 获取孩子列表
   */
  @Get('children')
  async getChildren(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.userService.getChildren(userId);
  }

  /**
   * 添加孩子
   */
  @Post('children')
  async addChild(
    @Body() body: {
      name: string;
      gender?: number;
      birth_date?: string;
      grade?: string;
      school?: string;
      subjects?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.addChild(userId, body);
  }

  /**
   * 更新孩子信息
   */
  @Put('children/:id')
  async updateChild(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      gender?: number;
      birth_date?: string;
      grade?: string;
      school?: string;
      subjects?: string;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.updateChild(userId, parseInt(id), body);
  }

  /**
   * 删除孩子
   */
  @Post('children/:id/delete')
  async deleteChild(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.userService.deleteChild(userId, parseInt(id));
  }
}
