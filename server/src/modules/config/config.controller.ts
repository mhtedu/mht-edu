import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // 获取公开配置（不需要登录）
  @Public()
  @Get('public')
  async getPublicSiteConfig() {
    return this.configService.getPublicSiteConfig();
  }

  // 获取广告位列表（不需要登录）
  @Public()
  @Get('ads/:positionKey')
  async getAds(@Param('positionKey') positionKey: string) {
    return this.configService.getAdsByPosition(positionKey);
  }
}

@Controller('admin/config')
export class AdminConfigController {
  constructor(private readonly configService: ConfigService) {}

  // 获取公开配置（不需要管理员权限）
  @Public()
  @Get('public/site')
  async getPublicSiteConfig() {
    return this.configService.getPublicSiteConfig();
  }

  // 按分组获取配置
  @Get('group/:group')
  @Public()
  async getConfigByGroup(@Param('group') group: string) {
    return this.configService.getConfigByGroup(group);
  }

  // 获取单个配置
  @Get(':key')
  @Public()
  async getConfig(@Param('key') key: string) {
    return this.configService.getConfig(key);
  }

  // 更新单个配置
  @Post('update')
  @Public()
  async updateConfig(@Body() body: { key: string; value: string }) {
    return this.configService.updateConfig(body.key, body.value);
  }

  // 批量更新配置
  @Post('batch-update')
  @Public()
  async batchUpdateConfig(@Body() body: { configs: { key: string; value: string }[] }) {
    return this.configService.batchUpdateConfig(body.configs);
  }
}
