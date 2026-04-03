import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class RobotService {
  // 关键词匹配规则
  private readonly keywordRules = [
    // 会员相关
    {
      keywords: ['会员', 'vip', '开通', '付费', '价格', '多少钱', '费用'],
      responses: [
        '开通会员即可享受完整服务！家长会员29.9元/月起，教师会员39.9元/月起。会员可查看联系方式、无限发布/抢单、优先匹配等特权。点击[这里]开通会员吧！',
        '成为会员后可以：\n✅ 查看教师/家长联系方式\n✅ 无限发布需求/抢单\n✅ 优先匹配推荐\n✅ 专属客服服务\n\n家长月卡仅需29.9元，教师月卡仅需39.9元，立即开通享更多权益！',
      ],
    },
    // 价格/费用相关
    {
      keywords: ['时薪', '收费', '报价', '课时费', '怎么收费'],
      responses: [
        '教师时薪根据科目、年级、教师资历不同而有所差异。一般来说：\n• 小学：80-150元/小时\n• 初中：120-200元/小时\n• 高中：150-300元/小时\n\n具体价格可以在教师详情页查看，开通会员后可与教师直接沟通协商~',
      ],
    },
    // 联系方式相关
    {
      keywords: ['联系方式', '电话', '微信', '手机', '怎么联系'],
      responses: [
        '开通会员后即可查看教师/家长的联系方式哦！会员可以：\n✅ 查看手机号和微信号\n✅ 直接发送消息沟通\n✅ 发起试课邀请\n\n立即开通会员，开始您的学习之旅吧！',
      ],
    },
    // 订单相关
    {
      keywords: ['订单', '抢单', '发布', '需求', '怎么找'],
      responses: [
        '家长可以发布学习需求，教师会主动抢单。发布流程：\n1. 点击首页"发布需求"按钮\n2. 填写科目、年级、时间等信息\n3. 等待教师抢单\n4. 选择合适的教师匹配\n\n开通会员可以发布更多需求，获得更多教师推荐！',
      ],
    },
    // 教师相关
    {
      keywords: ['教师', '老师', '怎么选', '怎么找老师'],
      responses: [
        '平台汇聚了众多优秀教师，您可以根据以下方式筛选：\n• 按科目筛选\n• 按距离筛选\n• 按评分排序\n• 查看教师主页和评价\n\n开通会员后可以查看教师详细资料和联系方式，帮助您找到最合适的老师！',
      ],
    },
    // 试课相关
    {
      keywords: ['试课', '试听', '体验', '第一次'],
      responses: [
        '首次合作建议先试课，双方互相了解。试课流程：\n1. 匹配成功后预约试课时间\n2. 试课时长通常为1-2小时\n3. 试课后双方确认是否继续合作\n4. 确认后进入正式教学阶段\n\n试课是双向选择的过程，确保找到最适合的搭档！',
      ],
    },
    // 退款相关
    {
      keywords: ['退款', '退钱', '取消', '投诉', '不满意'],
      responses: [
        '如果您对服务不满意，可以：\n1. 与对方协商解决\n2. 申请取消订单\n3. 联系客服投诉\n\n如需人工客服帮助，请拨打客服电话：400-888-8888',
      ],
    },
    // 机构相关
    {
      keywords: ['机构', '教育机构', '培训班', '学校'],
      responses: [
        '平台支持教育机构入驻！机构可以：\n✅ 管理旗下教师\n✅ 发布课程活动\n✅ 获得分佣收益\n\n机构入驻请联系：400-888-8888',
      ],
    },
    // 分销相关
    {
      keywords: ['邀请', '分销', '佣金', '推荐', '赚钱'],
      responses: [
        '邀请好友赚取佣金！规则如下：\n• 一级推荐：20%分佣\n• 二级推荐：10%分佣\n• 城市代理：5%分佣\n\n邀请越多，收益越多！快去邀请好友吧~',
      ],
    },
  ];

  // 默认回复
  private readonly defaultResponses = [
    '您好！我是智能助手小糖，很高兴为您服务！请问有什么可以帮助您的吗？',
    '我可以帮您解答关于会员、找老师、发布需求、联系方式等问题。您也可以直接描述您的需求~',
    '如果您有具体问题，可以直接告诉我，例如：\n• "怎么开通会员"\n• "如何找老师"\n• "收费标准是什么"\n• "怎么联系老师"\n\n我会尽力为您解答！',
  ];

  // 欢迎消息
  private readonly welcomeMessages = {
    0: '您好！欢迎来到棉花糖教育成长平台🎉\n\n我是您的专属助手小糖，可以帮助您：\n• 寻找优秀教师\n• 发布学习需求\n• 了解会员权益\n\n请问您需要什么帮助呢？',
    1: '您好！欢迎加入棉花糖教育成长平台🎉\n\n我是您的专属助手小糖，可以帮助您：\n• 查看匹配需求\n• 管理教学订单\n• 了解会员权益\n\n请问您需要什么帮助呢？',
    2: '您好！欢迎来到棉花糖教育成长平台🎉\n\n我是您的专属助手小糖，可以帮助您：\n• 管理教师团队\n• 发布课程活动\n• 查看分佣收益\n\n请问您需要什么帮助呢？',
  };

  /**
   * 处理消息
   */
  async handleMessage(userId: number, message: string, conversationId?: number) {
    // 检查用户会员状态
    const [users] = await db.query(`
      SELECT membership_type, membership_expire_at, role 
      FROM users WHERE id = ?
    `, [userId]);

    const user = users[0] as any;
    const isMember = user?.membership_type === 1 && 
                     new Date(user.membership_expire_at) > new Date();

    // 根据关键词匹配回复
    const response = this.matchResponse(message.toLowerCase(), isMember, user?.role);

    // 如果有会话ID，保存消息
    if (conversationId) {
      await this.saveMessage(conversationId, userId, message, response);
    }

    return {
      success: true,
      message: response,
      is_robot: true,
      suggest_actions: this.getSuggestActions(isMember, user?.role),
    };
  }

  /**
   * 获取欢迎消息
   */
  async getWelcomeMessage(targetRole: number) {
    const welcome = this.welcomeMessages[targetRole] || this.welcomeMessages[0];
    
    return {
      success: true,
      message: welcome,
      is_robot: true,
      suggest_actions: [
        { text: '如何开通会员', action: '会员' },
        { text: '如何找老师', action: '教师' },
        { text: '发布需求', action: '订单' },
      ],
    };
  }

  /**
   * 关键词匹配
   */
  private matchResponse(message: string, isMember: boolean, role: number): string {
    // 遍历关键词规则
    for (const rule of this.keywordRules) {
      for (const keyword of rule.keywords) {
        if (message.includes(keyword)) {
          // 随机返回一个回复
          const responses = rule.responses;
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }

    // 非会员用户特殊引导
    if (!isMember) {
      if (message.includes('看') || message.includes('查看') || message.includes('怎么')) {
        return '开通会员后可以查看完整信息和联系方式哦！家长月卡仅需29.9元，教师月卡仅需39.9元。点击下方开通会员按钮，立即享受完整服务！';
      }
    }

    // 默认回复
    return this.defaultResponses[Math.floor(Math.random() * this.defaultResponses.length)];
  }

  /**
   * 获取建议操作
   */
  private getSuggestActions(isMember: boolean, role: number): { text: string; action: string }[] {
    const actions: { text: string; action: string }[] = [];

    if (!isMember) {
      actions.push({ text: '开通会员', action: 'membership' });
    }

    if (role === 0) {
      // 家长
      actions.push(
        { text: '如何找老师', action: '教师' },
        { text: '发布需求', action: '订单' },
      );
    } else if (role === 1) {
      // 教师
      actions.push(
        { text: '查看需求', action: '订单' },
        { text: '如何抢单', action: '抢单' },
      );
    }

    return actions;
  }

  /**
   * 保存消息记录
   */
  private async saveMessage(
    conversationId: number,
    userId: number,
    userMessage: string,
    robotResponse: string,
  ) {
    try {
      // 保存用户消息
      await db.query(`
        INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
        VALUES (?, ?, ?, 0, 0)
      `, [conversationId, userId, userMessage]);

      // 保存机器人回复
      await db.query(`
        INSERT INTO messages (conversation_id, sender_id, content, msg_type, is_robot)
        VALUES (?, 1, ?, 0, 1)
      `, [conversationId, robotResponse]);

      // 更新会话最后消息
      await db.query(`
        UPDATE conversations 
        SET last_message = ?, last_message_at = NOW()
        WHERE id = ?
      `, [robotResponse.substring(0, 200), conversationId]);
    } catch (error) {
      console.error('保存机器人消息失败:', error);
    }
  }
}
