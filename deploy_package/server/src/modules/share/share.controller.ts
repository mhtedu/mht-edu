import { Controller, Get, Post, Body, Query, Param, Request } from '@nestjs/common';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  /**
   * 生成分享链接/二维码
   */
  @Post('generate')
  async generateShareLink(
    @Body() body: { target_type: string; target_id: number },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.shareService.generateShareLink(userId, body.target_type, body.target_id);
  }

  /**
   * 记录分享行为
   */
  @Post('record')
  async recordShare(
    @Body() body: { share_code: string; channel: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 0;
    return this.shareService.recordShare(userId, body.share_code, body.channel);
  }

  /**
   * 记录分享浏览
   */
  @Post('view')
  async recordView(
    @Body() body: { share_code: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || 0;
    return this.shareService.recordView(userId, body.share_code);
  }

  /**
   * 获取分享详情
   */
  @Get('info/:code')
  async getShareInfo(@Param('code') code: string) {
    return this.shareService.getShareInfo(code);
  }

  /**
   * 获取我的分享记录
   */
  @Get('my-shares')
  async getMyShares(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const userId = req.user?.id || 1;
    return this.shareService.getMyShares(userId, parseInt(page), parseInt(pageSize));
  }

  /**
   * 获取分享收益统计
   */
  @Get('earnings')
  async getShareEarnings(@Request() req: any) {
    const userId = req.user?.id || 1;
    return this.shareService.getShareEarnings(userId);
  }
}
