import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as db from '@/storage/database/mysql-client';
import { NotificationService } from '../notification/notification.service';

interface CreateInvitationDto {
  teacherId: number;
  parentId: number;
  orgId?: number;
  subject: string;
  trialTime: string;
  trialAddress: string;
  trialDuration: number;
  trialFee: number;
}

interface PayInvitationDto {
  invitationId: number;
  userId: number;
  payMethod: 'wechat' | 'balance';
}

interface ConfirmInvitationDto {
  invitationId: number;
  userId: number;
  result: 'success' | 'failed';
  rating?: number;
  feedback?: string;
}

@Injectable()
export class TrialLessonService {
  private readonly logger = new Logger(TrialLessonService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 创建试课邀约
   */
  async createInvitation(dto: CreateInvitationDto) {
    const invitationId = await db.insert(
      `INSERT INTO trial_lesson_invitations 
       (teacher_id, parent_id, org_id, subject, trial_time, trial_address, trial_duration, trial_fee, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        dto.teacherId,
        dto.parentId,
        dto.orgId || null,
        dto.subject,
        dto.trialTime,
        dto.trialAddress,
        dto.trialDuration,
        dto.trialFee,
      ]
    );

    // 获取创建的邀约详情
    const invitation = await this.getInvitationById(invitationId);

    // 发送通知给家长
    await this.sendInvitationNotification(invitation);

    return invitation;
  }

  /**
   * 支付试课费
   */
  async payInvitation(dto: PayInvitationDto) {
    const invitation = await this.getInvitationById(dto.invitationId);
    
    if (!invitation) {
      throw new Error('邀约不存在');
    }

    if (invitation.status !== 'pending') {
      throw new Error('邀约状态不允许支付');
    }

    if (invitation.parent_id !== dto.userId) {
      throw new Error('无权支付此邀约');
    }

    // 更新状态为已支付
    await db.update(
      `UPDATE trial_lesson_invitations 
       SET status = 'paid', paid_at = NOW()
       WHERE id = ?`,
      [dto.invitationId]
    );

    // TODO: 集成微信支付
    // 如果是微信支付，需要调用微信支付API
    // 如果是余额支付，需要扣减用户余额

    // 发送通知给教师
    await this.sendPaymentNotification(invitation);

    return this.getInvitationById(dto.invitationId);
  }

  /**
   * 确认试课结果
   */
  async confirmInvitation(dto: ConfirmInvitationDto) {
    const invitation = await this.getInvitationById(dto.invitationId);
    
    if (!invitation) {
      throw new Error('邀约不存在');
    }

    if (invitation.status !== 'confirmed') {
      throw new Error('邀约状态不允许确认结果');
    }

    // 更新试课结果
    await db.update(
      `UPDATE trial_lesson_invitations 
       SET status = ?, completed_at = NOW(), rating = ?, feedback = ?
       WHERE id = ?`,
      [dto.result, dto.rating || null, dto.feedback || null, dto.invitationId]
    );

    // 进行结算
    await this.settleInvitation(dto.invitationId, dto.result);

    // 发送结算通知
    await this.sendSettlementNotification(invitation, dto.result);

    return this.getInvitationById(dto.invitationId);
  }

  /**
   * 试课结算
   */
  private async settleInvitation(invitationId: number, result: 'success' | 'failed') {
    const invitation = await this.getInvitationById(invitationId);
    if (!invitation) {
      this.logger.error(`邀约不存在: ${invitationId}`);
      return;
    }

    const trialFee = invitation.trial_fee;

    let platformAmount = 0;
    let teacherAmount = 0;

    if (result === 'success') {
      // 试课成功：平台全拿
      platformAmount = trialFee;
      teacherAmount = 0;
    } else {
      // 试课失败：平台50%、教师50%
      platformAmount = Math.floor(trialFee * 0.5);
      teacherAmount = trialFee - platformAmount;
    }

    // 创建结算记录
    await db.insert(
      `INSERT INTO trial_lesson_settlements
       (invitation_id, platform_amount, teacher_amount, status, created_at)
       VALUES (?, ?, ?, 'completed', NOW())`,
      [invitationId, platformAmount, teacherAmount]
    );

    // 发放教师收入
    if (teacherAmount > 0) {
      await db.update(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [teacherAmount, invitation.teacher_id]
      );
    }

    // 计算并发放分销佣金
    await this.distributeCommission(invitation, platformAmount);

    this.logger.log(`试课结算完成: 邀约ID=${invitationId}, 平台=${platformAmount}, 教师=${teacherAmount}`);
  }

  /**
   * 分销佣金计算和发放
   */
  private async distributeCommission(invitation: any, platformAmount: number) {
    // 查找家长的推荐人
    const parentReferrer = await db.queryOne(
      `SELECT referrer_id FROM users WHERE id = ?`,
      [invitation.parent_id]
    );

    if (!parentReferrer || !parentReferrer.referrer_id) {
      return;
    }

    // 查找教师的推荐人
    const teacherReferrer = await db.queryOne(
      `SELECT referrer_id FROM users WHERE id = ?`,
      [invitation.teacher_id]
    );

    // 试课费分销比例：家长端10%，教师端3%
    const parentCommission = Math.floor(platformAmount * 0.1);
    const teacherCommission = Math.floor(platformAmount * 0.03);

    // 发放家长推荐人佣金
    if (parentReferrer.referrer_id && parentCommission > 0) {
      await db.update(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [parentCommission, parentReferrer.referrer_id]
      );

      await db.insert(
        `INSERT INTO commission_records (user_id, type, amount, source_id, source_type, status, created_at)
         VALUES (?, 'trial_lesson', ?, ?, 'trial_lesson', 'settled', NOW())`,
        [parentReferrer.referrer_id, parentCommission, invitation.id]
      );
    }

    // 发放教师推荐人佣金
    if (teacherReferrer && teacherReferrer.referrer_id && teacherCommission > 0) {
      await db.update(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [teacherCommission, teacherReferrer.referrer_id]
      );

      await db.insert(
        `INSERT INTO commission_records (user_id, type, amount, source_id, source_type, status, created_at)
         VALUES (?, 'trial_lesson', ?, ?, 'trial_lesson', 'settled', NOW())`,
        [teacherReferrer.referrer_id, teacherCommission, invitation.id]
      );
    }
  }

  /**
   * 定时任务：自动确认超时订单
   * 每小时执行一次，检查试课时间已过24小时的已确认邀约
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleTimeoutInvitations() {
    this.logger.log('开始处理超时试课邀约...');

    try {
      // 查找试课时间已过24小时且状态为confirmed的邀约
      const [timeoutInvitations] = await db.query(
        `SELECT * FROM trial_lesson_invitations 
         WHERE status = 'confirmed' 
         AND trial_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );

      for (const invitation of timeoutInvitations as any[]) {
        // 自动确认为成功
        await this.confirmInvitation({
          invitationId: invitation.id,
          userId: invitation.parent_id,
          result: 'success',
          feedback: '系统自动确认：试课超时24小时',
        });

        this.logger.log(`自动确认试课成功: 邀约ID=${invitation.id}`);
      }

      this.logger.log(`超时处理完成，共处理 ${(timeoutInvitations as any[]).length} 条邀约`);
    } catch (error) {
      this.logger.error('处理超时邀约失败:', error);
    }
  }

  /**
   * 定时任务：提醒即将开始的试课
   * 每30分钟执行一次
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async remindUpcomingTrials() {
    this.logger.log('开始发送试课提醒...');

    try {
      // 查找1小时内的试课
      const [upcomingInvitations] = await db.query(
        `SELECT * FROM trial_lesson_invitations 
         WHERE status = 'paid' 
         AND trial_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)`
      );

      for (const invitation of upcomingInvitations as any[]) {
        // 发送提醒通知
        await this.sendReminderNotification(invitation);
      }

      this.logger.log(`试课提醒发送完成，共发送 ${(upcomingInvitations as any[]).length} 条提醒`);
    } catch (error) {
      this.logger.error('发送试课提醒失败:', error);
    }
  }

  /**
   * 获取邀约详情
   */
  async getInvitationById(id: number) {
    const invitation = await db.queryOne(
      `SELECT i.*,
              t.name as teacher_name, t.avatar as teacher_avatar,
              p.name as parent_name, p.avatar as parent_avatar,
              o.name as org_name
       FROM trial_lesson_invitations i
       LEFT JOIN users t ON i.teacher_id = t.id
       LEFT JOIN users p ON i.parent_id = p.id
       LEFT JOIN organizations o ON i.org_id = o.id
       WHERE i.id = ?`,
      [id]
    );

    if (invitation) {
      // 获取结算信息
      const settlement = await db.queryOne(
        `SELECT * FROM trial_lesson_settlements WHERE invitation_id = ?`,
        [id]
      );

      if (settlement) {
        invitation.settlement = {
          platform_amount: settlement.platform_amount,
          teacher_amount: settlement.teacher_amount,
          agent_commission: 0, // TODO: 从佣金记录中计算
        };
      }
    }

    return invitation;
  }

  /**
   * 获取用户的邀约列表
   */
  async getMyInvitations(userId: number, role: string) {
    let query = '';
    if (role === 'teacher') {
      query = `
        SELECT i.*,
               p.name as parent_name, p.avatar as parent_avatar,
               o.name as org_name
        FROM trial_lesson_invitations i
        LEFT JOIN users p ON i.parent_id = p.id
        LEFT JOIN organizations o ON i.org_id = o.id
        WHERE i.teacher_id = ?
        ORDER BY i.created_at DESC
      `;
    } else {
      query = `
        SELECT i.*,
               t.name as teacher_name, t.avatar as teacher_avatar,
               o.name as org_name
        FROM trial_lesson_invitations i
        LEFT JOIN users t ON i.teacher_id = t.id
        LEFT JOIN organizations o ON i.org_id = o.id
        WHERE i.parent_id = ?
        ORDER BY i.created_at DESC
      `;
    }

    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  /**
   * 发送邀约通知
   */
  private async sendInvitationNotification(invitation: any) {
    try {
      // 发送微信模板消息
      await this.notificationService.sendTemplateMessage({
        userId: invitation.parent_id,
        templateId: 'trial_invitation',
        data: {
          thing1: { value: invitation.subject },
          time2: { value: invitation.trial_time },
          thing3: { value: invitation.trial_address },
          amount4: { value: `¥${invitation.trial_fee}` },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      this.logger.log(`邀约通知已发送: 邀约ID=${invitation.id}`);
    } catch (error) {
      this.logger.error('发送邀约通知失败:', error);
    }
  }

  /**
   * 发送支付通知
   */
  private async sendPaymentNotification(invitation: any) {
    try {
      // 通知教师
      await this.notificationService.sendTemplateMessage({
        userId: invitation.teacher_id,
        templateId: 'trial_paid',
        data: {
          thing1: { value: invitation.subject },
          time2: { value: invitation.trial_time },
          thing3: { value: invitation.trial_address },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      this.logger.log(`支付通知已发送: 邀约ID=${invitation.id}`);
    } catch (error) {
      this.logger.error('发送支付通知失败:', error);
    }
  }

  /**
   * 发送结算通知
   */
  private async sendSettlementNotification(invitation: any, result: string) {
    try {
      const resultText = result === 'success' ? '试课成功' : '试课失败';

      // 通知家长
      await this.notificationService.sendTemplateMessage({
        userId: invitation.parent_id,
        templateId: 'trial_completed',
        data: {
          thing1: { value: invitation.subject },
          phrase2: { value: resultText },
          time3: { value: new Date().toLocaleString() },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      // 通知教师
      await this.notificationService.sendTemplateMessage({
        userId: invitation.teacher_id,
        templateId: 'trial_completed',
        data: {
          thing1: { value: invitation.subject },
          phrase2: { value: resultText },
          time3: { value: new Date().toLocaleString() },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      this.logger.log(`结算通知已发送: 邀约ID=${invitation.id}`);
    } catch (error) {
      this.logger.error('发送结算通知失败:', error);
    }
  }

  /**
   * 发送提醒通知
   */
  private async sendReminderNotification(invitation: any) {
    try {
      // 提醒家长
      await this.notificationService.sendTemplateMessage({
        userId: invitation.parent_id,
        templateId: 'trial_reminder',
        data: {
          thing1: { value: invitation.subject },
          time2: { value: invitation.trial_time },
          thing3: { value: invitation.trial_address },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      // 提醒教师
      await this.notificationService.sendTemplateMessage({
        userId: invitation.teacher_id,
        templateId: 'trial_reminder',
        data: {
          thing1: { value: invitation.subject },
          time2: { value: invitation.trial_time },
          thing3: { value: invitation.trial_address },
        },
        page: `/pages/trial-detail/index?id=${invitation.id}`,
      });

      this.logger.log(`提醒通知已发送: 邀约ID=${invitation.id}`);
    } catch (error) {
      this.logger.error('发送提醒通知失败:', error);
    }
  }
}
