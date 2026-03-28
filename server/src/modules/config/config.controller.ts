import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { AdminGuard } from '@/common/guards/admin.guard';

@Controller('admin/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // 获取公开配置（不需要管理员权限）
  @Get('public/site')
  async getPublicSiteConfig() {
    return this.configService.getPublicSiteConfig();
  }

  // 获取所有配置（需要管理员权限）
  @Get()
  @UseGuards(AdminGuard)
  async getAllConfig() {
    return this.configService.getAllConfig();
  }

  // 按分组获取配置
  @Get('group/:group')
  @UseGuards(AdminGuard)
  async getConfigByGroup(@Param('group') group: string) {
    return this.configService.getConfigByGroup(group);
  }

  // 获取单个配置
  @Get(':key')
  @UseGuards(AdminGuard)
  async getConfig(@Param('key') key: string) {
    return this.configService.getConfig(key);
  }

  // 更新单个配置
  @Post('update')
  @UseGuards(AdminGuard)
  async updateConfig(@Body() body: { key: string; value: string }) {
    return this.configService.updateConfig(body.key, body.value);
  }

  // 批量更新配置
  @Post('batch-update')
  @UseGuards(AdminGuard)
  async batchUpdateConfig(@Body() body: { configs: { key: string; value: string }[] }) {
    return this.configService.batchUpdateConfig(body.configs);
  }
}
