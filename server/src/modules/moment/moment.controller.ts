import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MomentService } from './moment.service';

@Controller('moments')
export class MomentController {
  constructor(private readonly momentService: MomentService) {}

  /**
   * 上传文件
   */
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 最大50MB
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('上传文件:', file?.originalname, file?.mimetype, file?.size);

    if (!file) {
      return { code: 400, msg: '请选择文件', data: null };
    }

    try {
      const result = await this.momentService.uploadFile(file);
      console.log('上传成功:', result);

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error: any) {
      console.error('上传失败:', error);
      return {
        code: 500,
        msg: error.message || '上传失败',
        data: null,
      };
    }
  }

  /**
   * 发布动态
   */
  @Post()
  @HttpCode(200)
  async createMoment(
    @Req() req: any,
    @Body() body: { content: string; media: { type: string; key: string }[] }
  ) {
    console.log('发布动态:', body);

    const userId = req.user?.id || 1; // TODO: 从 JWT 获取用户ID

    try {
      const result = await this.momentService.createMoment(userId, body);

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error: any) {
      console.error('发布失败:', error);
      return {
        code: 500,
        msg: error.message || '发布失败',
        data: null,
      };
    }
  }

  /**
   * 获取动态列表
   */
  @Get()
  async getMoments(
    @Query('userId') userId?: number,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10
  ) {
    console.log('获取动态列表:', { userId, page, pageSize });

    try {
      const moments = await this.momentService.getMoments(
        userId ? Number(userId) : undefined,
        Number(page),
        Number(pageSize)
      );

      return {
        code: 200,
        msg: 'success',
        data: moments,
      };
    } catch (error: any) {
      console.error('获取失败:', error);
      return {
        code: 500,
        msg: error.message || '获取失败',
        data: [],
      };
    }
  }

  /**
   * 点赞动态
   */
  @Post(':id/like')
  @HttpCode(200)
  async likeMoment(@Req() req: any, @Param('id') momentId: number) {
    console.log('点赞动态:', momentId);

    const userId = req.user?.id || 1;

    try {
      const result = await this.momentService.likeMoment(userId, Number(momentId));

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error: any) {
      console.error('点赞失败:', error);
      return {
        code: 400,
        msg: error.message || '点赞失败',
        data: null,
      };
    }
  }

  /**
   * 评论动态
   */
  @Post(':id/comment')
  @HttpCode(200)
  async commentMoment(
    @Req() req: any,
    @Param('id') momentId: number,
    @Body() body: { content: string }
  ) {
    console.log('评论动态:', momentId, body.content);

    const userId = req.user?.id || 1;

    if (!body.content?.trim()) {
      return { code: 400, msg: '请输入评论内容', data: null };
    }

    try {
      const result = await this.momentService.commentMoment(
        userId,
        Number(momentId),
        body.content
      );

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error: any) {
      console.error('评论失败:', error);
      return {
        code: 500,
        msg: error.message || '评论失败',
        data: null,
      };
    }
  }

  /**
   * 获取动态评论
   */
  @Get(':id/comments')
  async getComments(
    @Param('id') momentId: number,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20
  ) {
    console.log('获取评论:', momentId);

    try {
      const comments = await this.momentService.getComments(
        Number(momentId),
        Number(page),
        Number(pageSize)
      );

      return {
        code: 200,
        msg: 'success',
        data: comments,
      };
    } catch (error: any) {
      console.error('获取评论失败:', error);
      return {
        code: 500,
        msg: error.message || '获取失败',
        data: [],
      };
    }
  }
}
