import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';
import { SmsService } from '../sms/sms.service';

// 微信订阅消息模板配置
interface WxTemplate {
  id: string;
  name: string;
  params: string[];
}

// 订阅消息模板ID配置（需要在微信公众平台申请）
const WX_TEMPLATES: Record<string, WxTemplate> = {
  // 抢单成功通知 - 通知家长
  ORDER_GRABBED: {
    id: 'TEMPLATE_ID_ORDER_GRABBED', // 需替换为实际模板ID
    name: '抢单成功通知',
    params: ['thing1', 'thing2', 'time3', 'thing4'], // 订单科目, 牛师姓名, 抢单时间, 备注
  },
  // 匹配成功通知 - 通知老师
  ORDER_MATCHED: {
    id: 'TEMPLATE_ID_ORDER_MATCHED', // 需替换为实际模板ID
    name: '匹配成功通知',
    params: ['thing1', 'thing2', 'phone_number3', 'time4'], // 订单科目, 家长姓名, 联系电话, 匹配时间
  },
  // 订单状态变更通知 - 通知老师/家长
  ORDER_STATUS_CHANGE: {
    id: 'TEMPLATE_ID_ORDER_STATUS', // 需替换为实际模板ID
    name: '订单状态变更',
    params: ['thing1', 'phrase2', 'time3', 'thing4'], // 订单编号, 状态, 时间, 备注
  },
  // 取消匹配通知
  ORDER_CANCELLED: {
    id: 'TEMPLATE_ID_ORDER_CANCELLED', // 需替换为实际模板ID
    name: '订单取消通知',
    params: ['thing1', 'thing2', 'time3', 'thing4'], // 订单科目, 取消原因, 时间, 备注
  },
};

@Injectable()
export class NotificationService {
  constructor(private readonly smsService: SmsService) {}

  /**
   * 发送抢单成功通知（给家长）
   * 当有老师抢单时，通知家长
   */
  async notifyParentOnGrab(
    parentId: number,
    orderId: number,
    teacherName: string,
    subject: string,
  ) {
    const parent = await this.getUserInfo(parentId);
    if (!parent) return;

    const time = this.formatTime(new Date());
    const message = `【棉花糖教育】您好，您的订单(${subject})有新的牛师抢单！牛师：${teacherName}，时间：${time}。请登录查看详情。`;

    // 发送站内消息
    await this.sendInAppMessage(parentId, '抢单通知', message, {
      type: 'order_grabbed',
      orderId,
    });

    // 发送短信通知
    if (parent.mobile) {
      await this.smsService.sendVerificationCode(parent.mobile); // 实际应使用通知类短信
    }

    // 发送微信订阅消息
    if (parent.openid) {
      await this.sendWxSubscribeMessage(parent.openid, WX_TEMPLATES.ORDER_GRABBED, {
        thing1: subject,
        thing2: teacherName,
        time3: time,
        thing4: '请登录小程序查看详情',
      });
    }
  }

  /**
   * 发送匹配成功通知（给老师）
   * 当家长选择老师后，通知老师
   */
  async notifyTeacherOnMatch(
    teacherId: number,
    orderId: number,
    parentName: string,
    parentPhone: string,
    subject: string,
  ) {
    const teacher = await this.getUserInfo(teacherId);
    if (!teacher) return;

    const time = this.formatTime(new Date());
    const message = `【棉花糖教育】恭喜！您已成功匹配订单(${subject})。家长：${parentName}，联系电话：${parentPhone}。请及时联系家长。`;

    // 发送站内消息
    await this.sendInAppMessage(teacherId, '匹配成功', message, {
      type: 'order_matched',
      orderId,
    });

    // 发送短信通知
    if (teacher.mobile) {
      await this.smsService.sendVerificationCode(teacher.mobile);
    }

    // 发送微信订阅消息
    if (teacher.openid) {
      await this.sendWxSubscribeMessage(teacher.openid, WX_TEMPLATES.ORDER_MATCHED, {
        thing1: subject,
        thing2: parentName,
        phone_number3: parentPhone,
        time4: time,
      });
    }
  }

  /**
   * 发送订单状态变更通知
   */
  async notifyOrderStatusChange(
    userId: number,
    orderId: string,
    orderNo: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
  ) {
    const user = await this.getUserInfo(userId);
    if (!user) return;

    const time = this.formatTime(new Date());
    const message = `【棉花糖教育】订单(${orderNo})状态已变更为：${newStatus}。时间：${time}。${reason ? '原因：' + reason : ''}`;

    // 发送站内消息
    await this.sendInAppMessage(userId, '订单状态变更', message, {
      type: 'order_status_change',
      orderId,
    });

    // 发送短信通知
    if (user.mobile) {
      await this.smsService.sendVerificationCode(user.mobile);
    }

    // 发送微信订阅消息
    if (user.openid) {
      await this.sendWxSubscribeMessage(user.openid, WX_TEMPLATES.ORDER_STATUS_CHANGE, {
        thing1: orderNo,
        phrase2: newStatus,
        time3: time,
        thing4: reason || '无',
      });
    }
  }

  /**
   * 发送订单取消通知（给老师）
   */
  async notifyTeacherOnCancel(
    teacherId: number,
    orderId: string,
    orderNo: string,
    subject: string,
    reason: string,
  ) {
    const teacher = await this.getUserInfo(teacherId);
    if (!teacher) return;

    const time = this.formatTime(new Date());
    const message = `【棉花糖教育】订单(${orderNo})已被取消。科目：${subject}。原因：${reason}。时间：${time}。`;

    // 发送站内消息
    await this.sendInAppMessage(teacherId, '订单取消通知', message, {
      type: 'order_cancelled',
      orderId,
    });

    // 发送短信通知
    if (teacher.mobile) {
      await this.smsService.sendVerificationCode(teacher.mobile);
    }

    // 发送微信订阅消息
    if (teacher.openid) {
      await this.sendWxSubscribeMessage(teacher.openid, WX_TEMPLATES.ORDER_CANCELLED, {
        thing1: subject,
        thing2: reason,
        time3: time,
        thing4: '订单已退回订单池',
      });
    }
  }

  /**
   * 发送订单退回池通知（给老师）
   */
  async notifyTeacherOnReopen(
    teacherId: number,
    orderNo: string,
    subject: string,
    reason: string,
  ) {
    const teacher = await this.getUserInfo(teacherId);
    if (!teacher) return;

    const time = this.formatTime(new Date());
    const message = `【棉花糖教育】订单(${orderNo})已取消匹配。科目：${subject}。原因：${reason}。订单已退回订单池。`;

    // 发送站内消息
    await this.sendInAppMessage(teacherId, '订单取消匹配', message, {
      type: 'order_reopen',
      orderNo,
    });

    // 发送短信通知
    if (teacher.mobile) {
      await this.smsService.sendVerificationCode(teacher.mobile);
    }
  }

  /**
   * 发送会员即将过期提醒
   */
  async notifyMembershipExpiring(userId: number, daysLeft: number) {
    const user = await this.getUserInfo(userId);
    if (!user) return;

    const message = `【棉花糖教育】您的会员将在${daysLeft}天后过期，续费可继续享受会员权益。`;

    // 发送站内消息
    await this.sendInAppMessage(userId, '会员到期提醒', message, {
      type: 'membership_expiring',
      daysLeft,
    });

    // 发送短信通知
    if (user.mobile) {
      await this.smsService.sendVerificationCode(user.mobile);
    }
  }

  /**
   * 发送提现结果通知
   */
  async notifyWithdrawResult(userId: number, amount: number, status: 'success' | 'failed', reason?: string) {
    const user = await this.getUserInfo(userId);
    if (!user) return;

    const statusText = status === 'success' ? '成功' : '失败';
    const message = `【棉花糖教育】您的提现申请¥${amount}已${statusText}。${reason || ''}`;

    // 发送站内消息
    await this.sendInAppMessage(userId, '提现通知', message, {
      type: 'withdraw_result',
      amount,
      status,
    });

    // 发送短信通知
    if (user.mobile) {
      await this.smsService.sendVerificationCode(user.mobile);
    }
  }

  /**
   * 发送模板消息（通用方法）
   */
  async sendTemplateMessage(params: {
    userId: number;
    templateId: string;
    data: Record<string, { value: string }>;
    page?: string;
  }) {
    const user = await this.getUserInfo(params.userId);
    if (!user) return;

    const message = `【棉花糖教育】您有一条新通知，请查看。`;

    // 发送站内消息
    await this.sendInAppMessage(params.userId, '系统通知', message, {
      type: params.templateId,
      data: params.data,
    });

    // 发送微信订阅消息
    if (user.openid) {
      await this.sendWxSubscribeMessage(
        user.openid,
        { id: params.templateId, name: params.templateId, params: Object.keys(params.data) },
        Object.fromEntries(Object.entries(params.data).map(([k, v]) => [k, v.value])),
      );
    }
  }

  /**
   * 发送试课邀约通知
   */
  async notifyTrialInvitation(parentId: number, invitationId: number, subject: string, teacherName: string) {
    const parent = await this.getUserInfo(parentId);
    if (!parent) return;

    const message = `【棉花糖教育】您收到一份试课邀约！科目：${subject}，老师：${teacherName}。请登录查看详情。`;

    await this.sendInAppMessage(parentId, '试课邀约', message, {
      type: 'trial_invitation',
      invitationId,
    });

    if (parent.mobile) {
      await this.smsService.sendVerificationCode(parent.mobile);
    }
  }

  /**
   * 发送试课支付成功通知
   */
  async notifyTrialPaid(teacherId: number, invitationId: number, subject: string, parentName: string) {
    const teacher = await this.getUserInfo(teacherId);
    if (!teacher) return;

    const message = `【棉花糖教育】试课邀约已支付！科目：${subject}，家长：${parentName}。请按时参加试课。`;

    await this.sendInAppMessage(teacherId, '试课支付成功', message, {
      type: 'trial_paid',
      invitationId,
    });

    if (teacher.mobile) {
      await this.smsService.sendVerificationCode(teacher.mobile);
    }
  }

  /**
   * 发送试课完成通知
   */
  async notifyTrialCompleted(userId: number, invitationId: number, subject: string, result: string) {
    const user = await this.getUserInfo(userId);
    if (!user) return;

    const resultText = result === 'success' ? '成功' : '失败';
    const message = `【棉花糖教育】试课已确认完成！科目：${subject}，结果：${resultText}。`;

    await this.sendInAppMessage(userId, '试课完成', message, {
      type: 'trial_completed',
      invitationId,
      result,
    });
  }

  /**
   * 发送试课提醒通知
   */
  async notifyTrialReminder(userId: number, invitationId: number, subject: string, trialTime: string) {
    const user = await this.getUserInfo(userId);
    if (!user) return;

    const message = `【棉花糖教育】试课即将开始！科目：${subject}，时间：${trialTime}。请做好准备。`;

    await this.sendInAppMessage(userId, '试课提醒', message, {
      type: 'trial_reminder',
      invitationId,
      trialTime,
    });

    if (user.mobile) {
      await this.smsService.sendVerificationCode(user.mobile);
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取用户信息
   */
  private async getUserInfo(userId: number): Promise<any> {
    try {
      const [users] = await db.query(
        'SELECT id, openid, mobile, nickname FROM users WHERE id = ?',
        [userId],
      );
      return users?.[0] || null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 发送站内消息
   */
  private async sendInAppMessage(
    userId: number,
    title: string,
    content: string,
    data?: any,
  ) {
    try {
      await db.update(
        `INSERT INTO notifications (user_id, title, content, data, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [userId, title, content, JSON.stringify(data || {})],
      );
      console.log(`[Notification] 站内消息已发送: userId=${userId}, title=${title}`);
    } catch (error) {
      console.error('发送站内消息失败:', error);
    }
  }

  /**
   * 发送微信订阅消息
   */
  private async sendWxSubscribeMessage(
    openid: string,
    template: WxTemplate,
    data: Record<string, string>,
  ) {
    try {
      // 获取微信access_token
      const accessToken = await this.getWxAccessToken();
      if (!accessToken) {
        console.log(`[WxNotify] Mock模式: 发送订阅消息到 ${openid}, 模板: ${template.name}`);
        return;
      }

      // 构建订阅消息数据
      const templateData: Record<string, { value: string }> = {};
      Object.keys(data).forEach((key) => {
        templateData[key] = { value: data[key] };
      });

      // 调用微信API发送订阅消息
      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touser: openid,
            template_id: template.id,
            page: 'pages/index/index',
            data: templateData,
          }),
        },
      );

      const result = await response.json();
      if (result.errcode !== 0) {
        console.error('微信订阅消息发送失败:', result);
      } else {
        console.log(`[WxNotify] 订阅消息发送成功: openid=${openid}`);
      }
    } catch (error) {
      console.error('发送微信订阅消息异常:', error);
      console.log(`[WxNotify] Mock模式: 发送订阅消息到 ${openid}`);
    }
  }

  /**
   * 获取微信access_token
   */
  private async getWxAccessToken(): Promise<string | null> {
    try {
      // 从数据库获取微信配置
      const [configs] = await db.query(
        `SELECT config_key, config_value FROM site_config 
         WHERE config_key IN ('wx_appid', 'wx_secret', 'wx_access_token', 'wx_token_expire')`,
      );

      if (!configs || configs.length < 2) {
        return null;
      }

      const configMap: Record<string, string> = {};
      configs.forEach((c: any) => {
        configMap[c.config_key] = c.config_value;
      });

      // 检查缓存的token是否有效
      const cachedToken = configMap['wx_access_token'];
      const tokenExpire = parseInt(configMap['wx_token_expire'] || '0');
      if (cachedToken && tokenExpire > Date.now()) {
        return cachedToken;
      }

      // 请求新的access_token
      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${configMap['wx_appid']}&secret=${configMap['wx_secret']}`,
      );

      const result = await response.json();
      if (result.access_token) {
        // 缓存token（提前5分钟过期）
        const expireTime = Date.now() + (result.expires_in - 300) * 1000;
        await db.update(
          `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
           VALUES ('wx_access_token', ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
          [result.access_token, result.access_token],
        );
        await db.update(
          `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
           VALUES ('wx_token_expire', ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
          [expireTime.toString(), expireTime.toString()],
        );
        return result.access_token;
      }

      return null;
    } catch (error) {
      console.error('获取微信access_token失败:', error);
      return null;
    }
  }

  /**
   * 格式化时间
   */
  private formatTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
}
