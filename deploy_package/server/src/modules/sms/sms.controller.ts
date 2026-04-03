import { Controller, Get, Post, Put, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  /**
   * 获取短信配置（管理员）
   */
  @Get('config')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('config:view')
  async getConfig() {
    const config = await this.smsService.getConfig();
    
    // 隐藏敏感信息
    if (config) {
      return {
        access_key_id: config.access_key_id ? `${config.access_key_id.slice(0, 4)}****` : '',
        access_key_secret: config.access_key_secret ? '******' : '',
        sign_name: config.sign_name,
        template_code: config.template_code,
        enabled: config.enabled,
      };
    }
    
    return {
      access_key_id: '',
      access_key_secret: '',
      sign_name: '',
      template_code: '',
      enabled: 0,
    };
  }

  /**
   * 更新短信配置（管理员）
   */
  @Put('config')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('config:edit')
  async updateConfig(@Body() body: {
    access_key_id?: string;
    access_key_secret?: string;
    sign_name?: string;
    template_code?: string;
    enabled?: number;
  }) {
    // 如果传入的是掩码值，不更新
    const config = {
      ...body,
      access_key_id: body.access_key_id?.includes('****') ? undefined : body.access_key_id,
      access_key_secret: body.access_key_secret === '******' ? undefined : body.access_key_secret,
    };

    await this.smsService.updateConfig(config);
    return { success: true };
  }

  /**
   * 发送验证码（公开接口）
   */
  @Post('send-code')
  @Public()
  async sendCode(@Body() body: { mobile: string }) {
    if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
      return { success: false, message: '请输入正确的手机号' };
    }

    const result = await this.smsService.sendVerificationCode(body.mobile);
    return result;
  }

  /**
   * 验证验证码（内部接口）
   */
  @Post('verify-code')
  async verifyCode(@Body() body: { mobile: string; code: string }) {
    const isValid = await this.smsService.verifyCode(body.mobile, body.code);
    return { success: isValid };
  }

  /**
   * 测试短信发送（管理员）
   */
  @Post('test')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('config:edit')
  async testSms(@Body() body: { mobile: string }) {
    if (!body.mobile || !/^1[3-9]\d{9}$/.test(body.mobile)) {
      return { success: false, message: '请输入正确的手机号' };
    }

    const result = await this.smsService.sendVerificationCode(body.mobile);
    return result;
  }
}
