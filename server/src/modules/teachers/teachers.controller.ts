import { Controller, Get, Query } from '@nestjs/common';
import { TeacherProfileService } from '../teacher-profile/teacher-profile.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('teachers')
export class TeachersController {
  constructor(private readonly teacherProfileService: TeacherProfileService) {}

  /**
   * 获取附近教师列表
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
}
