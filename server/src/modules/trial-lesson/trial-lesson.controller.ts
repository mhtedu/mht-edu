import { Controller, Post, Get, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { TrialLessonService } from './trial-lesson.service';

@Controller('trial-lesson')
export class TrialLessonController {
  constructor(private readonly trialLessonService: TrialLessonService) {}

  /**
   * 创建试课邀约
   */
  @Post('create')
  async createInvitation(
    @Request() req: any,
    @Body() body: {
      targetUserId: number;
      subject: string;
      trialTime: string;
      trialAddress: string;
      trialDuration: number;
      trialFee: number;
    }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { code: -1, msg: '请先登录' };
    }

    try {
      // 获取用户角色，判断是教师还是家长发起
      const isTeacher = req.user?.role === 'teacher';

      const invitation = await this.trialLessonService.createInvitation({
        teacherId: isTeacher ? userId : body.targetUserId,
        parentId: isTeacher ? body.targetUserId : userId,
        subject: body.subject,
        trialTime: body.trialTime,
        trialAddress: body.trialAddress,
        trialDuration: body.trialDuration,
        trialFee: body.trialFee,
      });

      return { code: 0, msg: '邀约创建成功', data: invitation };
    } catch (error) {
      return { code: -1, msg: error.message || '创建失败' };
    }
  }

  /**
   * 支付试课费
   */
  @Post('pay')
  async payInvitation(
    @Request() req: any,
    @Body() body: {
      invitationId: number;
      payMethod: 'wechat' | 'balance';
    }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { code: -1, msg: '请先登录' };
    }

    try {
      const invitation = await this.trialLessonService.payInvitation({
        invitationId: body.invitationId,
        userId,
        payMethod: body.payMethod,
      });

      // TODO: 如果是微信支付，返回支付参数
      const payParams = body.payMethod === 'wechat' ? {
        timeStamp: '',
        nonceStr: '',
        package: '',
        signType: 'RSA',
        paySign: '',
      } : null;

      return { 
        code: 0, 
        msg: '支付成功', 
        data: { invitation, payParams }
      };
    } catch (error) {
      return { code: -1, msg: error.message || '支付失败' };
    }
  }

  /**
   * 确认试课结果
   */
  @Post('confirm')
  async confirmInvitation(
    @Request() req: any,
    @Body() body: {
      invitationId: number;
      result: 'success' | 'failed';
      rating?: number;
      feedback?: string;
    }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { code: -1, msg: '请先登录' };
    }

    try {
      const invitation = await this.trialLessonService.confirmInvitation({
        invitationId: body.invitationId,
        userId,
        result: body.result,
        rating: body.rating,
        feedback: body.feedback,
      });

      return { code: 0, msg: '确认成功', data: invitation };
    } catch (error) {
      return { code: -1, msg: error.message || '确认失败' };
    }
  }

  /**
   * 获取邀约详情
   */
  @Get('invitation/:id')
  async getInvitation(
    @Request() req: any,
    @Param('id') id: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { code: -1, msg: '请先登录' };
    }

    try {
      const invitation = await this.trialLessonService.getInvitationById(parseInt(id));
      
      if (!invitation) {
        return { code: -1, msg: '邀约不存在' };
      }

      return { code: 0, data: invitation };
    } catch (error) {
      return { code: -1, msg: error.message || '获取失败' };
    }
  }

  /**
   * 获取我的邀约列表
   */
  @Get('my-invitations')
  async getMyInvitations(
    @Request() req: any,
    @Query('status') status?: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      return { code: -1, msg: '请先登录' };
    }

    try {
      const role = req.user?.role || 'parent';
      let invitations = await this.trialLessonService.getMyInvitations(userId, role);

      // 按状态过滤
      if (status && status !== 'all') {
        invitations = invitations.filter((i: any) => i.status === status);
      }

      return { code: 0, data: invitations };
    } catch (error) {
      return { code: -1, msg: error.message || '获取失败' };
    }
  }

  /**
   * 手动触发超时处理（测试用）
   */
  @Post('auto-confirm')
  async autoConfirm() {
    try {
      await this.trialLessonService.handleTimeoutInvitations();
      return { code: 0, msg: '超时处理完成' };
    } catch (error) {
      return { code: -1, msg: error.message || '处理失败' };
    }
  }
}
