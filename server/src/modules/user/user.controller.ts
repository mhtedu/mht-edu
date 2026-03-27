import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: {
    openid?: string;
    mobile?: string;
    nickname?: string;
    avatar?: string;
    role: number;
    inviter_id?: number;
  }) {
    return await this.userService.createUser(body);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.userService.getUserById(parseInt(id));
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: Partial<{
      nickname: string;
      avatar: string;
      mobile: string;
      latitude: string;
      longitude: string;
      city_code: string;
    }>
  ) {
    return await this.userService.updateUser(parseInt(id), body);
  }

  @Post(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body() body: { latitude: string; longitude: string; city_code?: string }
  ) {
    return await this.userService.updateUserLocation(
      parseInt(id),
      body.latitude,
      body.longitude,
      body.city_code
    );
  }

  @Get('teachers/list')
  async getTeachers(@Query() query: {
    latitude?: string;
    longitude?: string;
    subject?: string;
    maxDistance?: string;
    page?: string;
    pageSize?: string;
  }) {
    return await this.userService.getTeachers({
      ...query,
      maxDistance: query.maxDistance ? parseInt(query.maxDistance) : undefined,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
    });
  }

  @Get('teachers/:userId/profile')
  async getTeacherProfile(@Param('userId') userId: string) {
    return await this.userService.getTeacherProfile(parseInt(userId));
  }

  @Put('teachers/:userId/profile')
  async updateTeacherProfile(
    @Param('userId') userId: string,
    @Body() body: Partial<{
      real_name: string;
      gender: number;
      birth_year: string;
      education: string;
      certificates: any[];
      subjects: string[];
      max_distance: number;
      hourly_rate_min: string;
      hourly_rate_max: string;
      intro: string;
      photos: string[];
    }>
  ) {
    return await this.userService.updateTeacherProfile(parseInt(userId), body);
  }
}
