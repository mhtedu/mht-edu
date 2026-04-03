import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { CityService } from './city.service';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  /**
   * 获取所有城市列表（按首字母分组）
   */
  @Get('all')
  async getAllCities() {
    return this.cityService.getAllCities();
  }

  /**
   * 获取热门城市
   */
  @Get('hot')
  async getHotCities() {
    return this.cityService.getHotCities();
  }

  /**
   * 搜索城市
   */
  @Get('search')
  async searchCities(@Query('keyword') keyword: string) {
    return this.cityService.searchCities(keyword);
  }

  /**
   * 根据经纬度获取最近城市
   */
  @Get('nearest')
  async getNearestCity(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    return this.cityService.getNearestCity(
      parseFloat(latitude),
      parseFloat(longitude),
    );
  }

  /**
   * 更新用户选择的城市
   */
  @Post('select')
  async updateUserCity(
    @Body() body: { cityId: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.cityService.updateUserCity(userId, body.cityId);
  }

  /**
   * 获取城市详情
   */
  @Get(':id')
  async getCityDetail(@Param('id') id: string) {
    return this.cityService.getCityDetail(parseInt(id));
  }

  /**
   * 获取城市教师列表
   */
  @Get(':cityName/teachers')
  async getCityTeachers(
    @Param('cityName') cityName: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.cityService.getCityTeachers(
      cityName,
      parseInt(page),
      parseInt(pageSize),
    );
  }
}
