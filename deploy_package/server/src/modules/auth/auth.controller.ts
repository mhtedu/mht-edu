import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RequirePermission } from './decorators/permission.decorator';
import { Public } from './decorators/public.decorator';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 管理员登录
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  /**
   * 获取当前用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  /**
   * 更新个人信息
   */
  @UseGuards(JwtAuthGuard)
  @Post('profile/update')
  async updateProfile(@Request() req, @Body() body: {
    realName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) {
    return this.authService.updateProfile(req.user.id, body);
  }

  /**
   * 修改密码
   */
  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  async changePassword(@Request() req, @Body() body: {
    oldPassword: string;
    newPassword: string;
  }) {
    return this.authService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }

  /**
   * 退出登录
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  /**
   * 获取用户权限列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async getPermissions(@Request() req) {
    return this.authService.getPermissions(req.user.id);
  }
}
