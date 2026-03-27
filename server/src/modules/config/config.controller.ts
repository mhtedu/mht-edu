import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // ==================== 系统配置 ====================

  @Get('system')
  async getAllConfigs() {
    return this.configService.getAllConfigs();
  }

  @Get('system/:key')
  async getConfig(@Param('key') key: string) {
    return this.configService.getConfig(key);
  }

  @Post('system')
  async setConfig(
    @Body() body: { key: string; value: any; description?: string },
  ) {
    return this.configService.setConfig(body.key, body.value, body.description);
  }

  @Post('system/batch')
  async setConfigs(@Body() body: Record<string, any>) {
    return this.configService.setConfigs(body);
  }

  // ==================== 分销配置 ====================

  @Get('distribution')
  async getDistributionConfigs() {
    return this.configService.getDistributionConfigs();
  }

  @Put('distribution/:level')
  async updateDistributionConfig(
    @Param('level') level: string,
    @Body() body: { rate: number },
  ) {
    return this.configService.updateDistributionConfig(parseInt(level), body.rate);
  }

  // ==================== 科目管理 ====================

  @Get('subjects')
  async getSubjects(@Query('category') category?: string) {
    return this.configService.getSubjects(category);
  }

  @Post('subjects')
  async addSubject(
    @Body() body: { name: string; category: string; icon?: string; sortOrder?: number },
  ) {
    return this.configService.addSubject(body);
  }

  @Put('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; category: string; icon: string; sortOrder: number; isActive: number }>,
  ) {
    return this.configService.updateSubject(parseInt(id), body);
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    return this.configService.deleteSubject(parseInt(id));
  }

  // ==================== 年级管理 ====================

  @Get('grades')
  async getGrades(@Query('stage') stage?: string) {
    return this.configService.getGrades(stage);
  }

  // ==================== 会员权益管理 ====================

  @Get('membership-plans')
  async getMembershipPlans(@Query('role') role?: string) {
    return this.configService.getMembershipPlans(role ? parseInt(role) : undefined);
  }

  @Post('membership-plans')
  async createMembershipPlan(
    @Body() body: {
      name: string;
      role: number;
      price: number;
      originalPrice: number;
      durationDays: number;
      features: string[];
    },
  ) {
    return this.configService.createMembershipPlan(body);
  }

  @Put('membership-plans/:id')
  async updateMembershipPlan(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      price: number;
      originalPrice: number;
      durationDays: number;
      features: string[];
      isActive: number;
      sortOrder: number;
    }>,
  ) {
    return this.configService.updateMembershipPlan(parseInt(id), body);
  }

  @Delete('membership-plans/:id')
  async deleteMembershipPlan(@Param('id') id: string) {
    return this.configService.deleteMembershipPlan(parseInt(id));
  }
}
