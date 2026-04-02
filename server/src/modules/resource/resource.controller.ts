import { Controller, Get, Post, Body, Query, Param, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceService } from './resource.service';

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  /**
   * 获取资源分类列表
   */
  @Get('categories')
  async getCategories() {
    return this.resourceService.getCategories();
  }

  /**
   * 获取资源列表
   */
  @Get('list')
  async getResourceList(
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
    @Query('priceType') priceType?: string,
    @Query('sort') sort?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Request() req?: any,
  ) {
    const userId = req.user?.id;
    return this.resourceService.getResourceList({
      category,
      type,
      keyword,
      priceType,
      sort,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      userId,
    });
  }

  /**
   * 获取资源详情
   */
  @Get('detail/:id')
  async getResourceDetail(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    return this.resourceService.getResourceDetail(parseInt(id), userId);
  }

  /**
   * 上传资源
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (!body.title) {
      throw new BadRequestException('请填写资源标题');
    }
    if (!body.category_id) {
      throw new BadRequestException('请选择资源分类');
    }

    return this.resourceService.uploadResource(userId, file, {
      title: body.title,
      description: body.description,
      category_id: parseInt(body.category_id),
      type: body.type || 'document',
      price: parseFloat(body.price) || 0,
      is_free: body.is_free === 'true' || body.is_free === true,
      cover_image: body.cover_image,
      tags: body.tags ? JSON.parse(body.tags) : [],
    });
  }

  /**
   * 更新资源
   */
  @Post('update/:id')
  async updateResource(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.resourceService.updateResource(parseInt(id), userId, body);
  }

  /**
   * 删除资源
   */
  @Post('delete/:id')
  async deleteResource(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 1;
    return this.resourceService.deleteResource(parseInt(id), userId);
  }

  /**
   * 购买资源
   */
  @Post('purchase/:id')
  async purchaseResource(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 1;
    return this.resourceService.purchaseResource(parseInt(id), userId);
  }

  /**
   * 下载资源
   */
  @Get('download/:id')
  async downloadResource(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 1;
    return this.resourceService.getDownloadUrl(parseInt(id), userId);
  }

  /**
   * 获取用户上传的资源
   */
  @Get('my-uploads')
  async getMyUploads(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Request() req?: any,
  ) {
    const userId = req.user?.id || 1;
    return this.resourceService.getUserResources(userId, {
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取用户购买的资源
   */
  @Get('my-purchases')
  async getMyPurchases(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Request() req?: any,
  ) {
    const userId = req.user?.id || 1;
    return this.resourceService.getUserPurchases(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }

  /**
   * 获取资源收入统计
   */
  @Get('earnings')
  async getEarnings(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.resourceService.getResourceEarnings(userId);
  }
}
