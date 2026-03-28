import { Controller, Get, Post, Body, Query, Request } from '@nestjs/common';
import { ReferralLockService } from './referral-lock.service';

@Controller('referral')
export class ReferralLockController {
  constructor(private readonly referralLockService: ReferralLockService) {}

  /**
   * 通过分享码锁定分销关系
   */
  @Post('lock-by-share-code')
  async lockByShareCode(
    @Request() req: any,
    @Body() body: { shareCode: string }
  ) {
    const userId = req.user?.id || 0;
    if (!userId) {
      return { code: 401, msg: '请先登录', data: null };
    }
    
    const result = await this.referralLockService.lockByShareCode(userId, body.shareCode);
    return { code: 200, msg: result.reason, data: { locked: result.locked } };
  }

  /**
   * 通过邀请码锁定分销关系
   */
  @Post('lock-by-invite-code')
  async lockByInviteCode(
    @Request() req: any,
    @Body() body: { inviteCode: string }
  ) {
    const userId = req.user?.id || 0;
    if (!userId) {
      return { code: 401, msg: '请先登录', data: null };
    }
    
    const result = await this.referralLockService.lockByInviteCode(userId, body.inviteCode);
    return { code: 200, msg: result.reason, data: { locked: result.locked } };
  }

  /**
   * 锁定分销关系（通用）
   */
  @Post('lock')
  async lockRelation(
    @Request() req: any,
    @Body() body: { lockerId: number; lockType: string; sourceId?: number }
  ) {
    const userId = req.user?.id || 0;
    if (!userId) {
      return { code: 401, msg: '请先登录', data: null };
    }
    
    const result = await this.referralLockService.lockRelation(
      userId,
      body.lockerId,
      body.lockType,
      body.sourceId
    );
    return { code: 200, msg: result.reason, data: { locked: result.locked } };
  }

  /**
   * 检查是否已被锁定
   */
  @Get('is-locked')
  async isLocked(@Request() req: any) {
    const userId = req.user?.id || 0;
    if (!userId) {
      return { code: 200, data: { is_locked: false } };
    }
    
    const isLocked = await this.referralLockService.isLocked(userId);
    return { code: 200, data: { is_locked: isLocked } };
  }

  /**
   * 获取我的推荐人
   */
  @Get('my-locker')
  async getMyLocker(@Request() req: any) {
    const userId = req.user?.id || 0;
    if (!userId) {
      return { code: 401, msg: '请先登录', data: null };
    }
    
    const locker = await this.referralLockService.getLocker(userId);
    return { code: 200, data: locker };
  }

  /**
   * 获取邀请统计
   */
  @Get('invite-stats')
  async getInviteStats(@Request() req: any) {
    const userId = req.user?.id || 1;
    
    const stats = await this.referralLockService.getInviteStats(userId);
    const inviteCode = this.referralLockService.generateInviteCode(userId);
    
    return { 
      code: 200, 
      data: {
        ...stats,
        invite_code: inviteCode,
      }
    };
  }

  /**
   * 生成我的邀请码
   */
  @Get('my-invite-code')
  async getMyInviteCode(@Request() req: any) {
    const userId = req.user?.id || 1;
    const inviteCode = this.referralLockService.generateInviteCode(userId);
    
    return { 
      code: 200, 
      data: { 
        invite_code: inviteCode,
        invite_link: `https://your-domain.com/invite?code=${inviteCode}`,
      }
    };
  }
}
