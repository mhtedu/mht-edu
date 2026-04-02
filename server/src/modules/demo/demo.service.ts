import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as db from '@/storage/database/mysql-client';

// 机器人用户配置
interface RobotUser {
  id: number;
  role: 'teacher' | 'parent';
  nickname: string;
  avatar: string;
  is_active: boolean;
  behavior_config: {
    grabOrderProbability: number;      // 抢单概率 (0-1)
    commentProbability: number;        // 评论概率 (0-1)
    likeProbability: number;           // 点赞概率 (0-1)
    onlineHours: { start: number; end: number }; // 在线时段
    subjects: string[];                 // 擅长科目(老师)
    responseDelay: { min: number; max: number }; // 响应延迟(秒)
  };
}

// 演示数据配置
export interface DemoConfig {
  enabled: boolean;
  robotTeachers: number;     // 机器人老师数量
  robotParents: number;      // 机器人家长数量
  demoOrders: number;        // 演示订单数量
  autoGrabEnabled: boolean;  // 自动抢单
  autoCommentEnabled: boolean; // 自动评论
  activeHours: { start: number; end: number }; // 活跃时段
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private robotUsers: Map<number, RobotUser> = new Map();
  private config: DemoConfig = {
    enabled: true,
    robotTeachers: 20,
    robotParents: 30,
    demoOrders: 15,
    autoGrabEnabled: true,
    autoCommentEnabled: true,
    activeHours: { start: 8, end: 22 },
  };

  constructor() {
    this.loadRobotUsers();
  }

  // ==================== 演示用户管理 ====================

  /**
   * 创建演示用户
   */
  async createDemoUser(data: {
    role: 'teacher' | 'parent' | 'org';
    nickname: string;
    avatar?: string;
    mobile?: string;
    gender?: number;
    city_name?: string;
    is_member?: boolean;
    // 老师特有属性
    subjects?: string;
    education?: string;
    teaching_years?: number;
    hourly_rate?: number;
    real_name?: string;
    // 机器人配置
    is_robot?: boolean;
    behavior_config?: any;
  }) {
    const roleMap = { parent: 0, teacher: 1, org: 2 };
    const roleValue = roleMap[data.role] || 0;

    // 生成openid
    const openid = `demo_${data.role}_${Date.now()}_${Math.random().toString(36).slice(-6)}`;

    // 插入用户
    const userId = await db.insert(
      `INSERT INTO users (
        openid, nickname, avatar, mobile, role, gender, city_name,
        membership_type, membership_expire_at, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        openid,
        data.nickname,
        data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.nickname)}`,
        data.mobile || null,
        roleValue,
        data.gender || 0,
        data.city_name || '北京',
        data.is_member ? 1 : 0,
        data.is_member ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      ],
    );

    // 如果是老师，创建教师档案
    if (data.role === 'teacher' && userId) {
      const rating = 4.5 + Math.random() * 0.5;
      const reviewCount = Math.floor(Math.random() * 50) + 10;
      // subjects字段是JSON数组类型
      const subjectsArray = (data.subjects || '数学,英语').split(',').map(s => s.trim());
      await db.update(
        `INSERT INTO teacher_profiles (
          user_id, real_name, subjects, education, teaching_years, 
          hourly_rate_min, hourly_rate_max, verify_status, rating, review_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 2, ?, ?, NOW())`,
        [
          userId,
          data.real_name || data.nickname,
          JSON.stringify(subjectsArray),
          data.education || '本科',
          data.teaching_years || 3,
          data.hourly_rate || 100,
          (data.hourly_rate || 100) + 50,
          rating,
          reviewCount,
        ],
      );
    }

    // 如果是机器人用户，保存配置
    if (data.is_robot) {
      await this.saveRobotConfig(userId, data.role as 'teacher' | 'parent', data.behavior_config);
    }

    return { success: true, userId };
  }

  /**
   * 批量创建演示老师
   */
  async createDemoTeachers(count: number = 20) {
    const teacherNames = [
      '李老师', '王老师', '张老师', '刘老师', '陈老师', '杨老师', '黄老师', '赵老师',
      '周老师', '吴老师', '徐老师', '孙老师', '马老师', '朱老师', '胡老师', '郭老师',
      '林老师', '何老师', '高老师', '罗老师', '郑老师', '梁老师', '谢老师', '宋老师',
      '唐老师', '许老师', '韩老师', '冯老师', '邓老师', '曹老师', '彭老师', '曾老师',
    ];

    const subjects = [
      ['数学', '物理'],
      ['英语'],
      ['语文', '作文'],
      ['化学', '生物'],
      ['数学', '奥数'],
      ['英语', '口语'],
      ['物理', '化学'],
      ['钢琴', '音乐'],
      ['美术', '书法'],
      ['编程', '计算机'],
    ];

    const educations = ['本科', '硕士', '博士', '本科', '硕士'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];

    const created: number[] = [];

    for (let i = 0; i < count; i++) {
      const name = teacherNames[i % teacherNames.length] + (Math.floor(i / teacherNames.length) || '');
      const subject = subjects[i % subjects.length].join(',');
      const education = educations[i % educations.length];
      const city = cities[i % cities.length];
      const teachingYears = 2 + Math.floor(Math.random() * 10);
      const hourlyRate = 80 + Math.floor(Math.random() * 150);
      const isMember = Math.random() > 0.3; // 70%是会员

      const result = await this.createDemoUser({
        role: 'teacher',
        nickname: name,
        gender: Math.random() > 0.3 ? 1 : 2, // 70%男老师
        city_name: city,
        is_member: isMember,
        subjects: subject,
        education: education,
        teaching_years: teachingYears,
        hourly_rate: hourlyRate,
        real_name: name,
        is_robot: true,
        behavior_config: {
          grabOrderProbability: 0.3 + Math.random() * 0.5,
          commentProbability: 0.2 + Math.random() * 0.4,
          likeProbability: 0.3 + Math.random() * 0.5,
          onlineHours: { start: 9, end: 21 },
          subjects: subjects[i % subjects.length],
          responseDelay: { min: 30, max: 300 },
        },
      });

      if (result.userId) {
        created.push(result.userId);
      }
    }

    await this.loadRobotUsers();
    return { success: true, count: created.length, users: created };
  }

  /**
   * 批量创建演示家长
   */
  async createDemoParents(count: number = 30) {
    const parentNames = [
      '小明妈妈', '小红爸爸', '小刚妈妈', '小芳妈妈', '小华爸爸',
      '小丽妈妈', '小强爸爸', '小美妈妈', '小龙爸爸', '小英妈妈',
      '小军妈妈', '小芳爸爸', '小伟妈妈', '小娟爸爸', '小杰妈妈',
      '小霞爸爸', '小磊妈妈', '小艳爸爸', '小波妈妈', '小娟妈妈',
      '小涛爸爸', '小婷妈妈', '小宇爸爸', '小雪妈妈', '小峰爸爸',
      '小芳妈妈', '小明爸爸', '小红妈妈', '小华妈妈', '小丽爸爸',
    ];

    const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];
    const subjects = ['数学', '英语', '语文', '物理', '化学', '钢琴', '美术', '编程'];

    const created: number[] = [];

    for (let i = 0; i < count; i++) {
      const name = parentNames[i % parentNames.length] + (Math.floor(i / parentNames.length) || '');
      const city = cities[i % cities.length];
      const isMember = Math.random() > 0.4; // 60%是会员

      const result = await this.createDemoUser({
        role: 'parent',
        nickname: name,
        gender: name.includes('妈妈') ? 2 : 1,
        city_name: city,
        is_member: isMember,
        is_robot: true,
        behavior_config: {
          grabOrderProbability: 0,
          commentProbability: 0.2 + Math.random() * 0.3,
          likeProbability: 0.3 + Math.random() * 0.4,
          onlineHours: { start: 10, end: 22 },
          subjects: subjects.slice(0, 2),
          responseDelay: { min: 60, max: 600 },
        },
      });

      if (result.userId) {
        created.push(result.userId);
      }
    }

    await this.loadRobotUsers();
    return { success: true, count: created.length, users: created };
  }

  // ==================== 演示订单管理 ====================

  /**
   * 创建演示订单
   */
  async createDemoOrder(data: {
    parent_id?: number;
    subject: string;
    grade: string;
    budget: number;
    address: string;
    description?: string;
    latitude?: number;
    longitude?: number;
  }) {
    // 如果没有指定家长，随机选择一个机器人家长
    let parentId = data.parent_id;
    if (!parentId) {
      const [parents] = await db.query(
        `SELECT id FROM users WHERE role = 0 AND openid LIKE 'demo_parent%' ORDER BY RAND() LIMIT 1`,
      );
      if (parents && parents.length > 0) {
        parentId = (parents[0] as any).id;
      }
    }

    if (!parentId) {
      throw new Error('没有可用的演示家长');
    }

    const orderNo = `DEMO${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const orderId = await db.insert(
      `INSERT INTO orders (
        order_no, user_id, parent_id, subject, student_grade, 
        hourly_rate, address, latitude, longitude, description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        orderNo,
        parentId,
        parentId,
        data.subject,
        data.grade,
        data.budget,
        data.address,
        data.latitude || null,
        data.longitude || null,
        data.description || '',
      ],
    );

    return { success: true, orderId, orderNo };
  }

  /**
   * 批量创建演示订单
   */
  async createDemoOrders(count: number = 15) {
    const subjects = ['数学', '英语', '语文', '物理', '化学', '钢琴', '美术', '编程'];
    const grades = ['小学一年级', '小学三年级', '小学五年级', '初一', '初二', '初三', '高一', '高二'];
    const addresses = [
      '北京市海淀区中关村大街',
      '北京市朝阳区望京SOHO',
      '北京市西城区金融街',
      '上海市浦东新区陆家嘴',
      '广州市天河区珠江新城',
      '深圳市南山区科技园',
    ];

    const created: number[] = [];

    for (let i = 0; i < count; i++) {
      const subject = subjects[i % subjects.length];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const budget = 80 + Math.floor(Math.random() * 150);
      const address = addresses[Math.floor(Math.random() * addresses.length)];

      const result = await this.createDemoOrder({
        subject,
        grade,
        budget,
        address,
        description: `需要找一位有耐心的${subject}老师，孩子${grade}，希望周末上课`,
      });

      if (result.orderId) {
        created.push(result.orderId);
      }
    }

    return { success: true, count: created.length, orders: created };
  }

  // ==================== 机器人行为模拟 ====================

  /**
   * 加载机器人用户配置
   */
  private async loadRobotUsers() {
    try {
      const [robots] = await db.query(
        `SELECT id, role, nickname, avatar FROM users WHERE openid LIKE 'demo_%'`,
      );

      this.robotUsers.clear();
      for (const robot of robots as any[]) {
        const role = robot.role === 1 ? 'teacher' : 'parent';
        this.robotUsers.set(robot.id, {
          id: robot.id,
          role,
          nickname: robot.nickname,
          avatar: robot.avatar,
          is_active: true,
          behavior_config: this.getDefaultBehaviorConfig(role),
        });
      }

      this.logger.log(`已加载 ${this.robotUsers.size} 个机器人用户`);
    } catch (error) {
      this.logger.error('加载机器人用户失败:', error);
    }
  }

  /**
   * 获取默认行为配置
   */
  private getDefaultBehaviorConfig(role: 'teacher' | 'parent'): RobotUser['behavior_config'] {
    if (role === 'teacher') {
      return {
        grabOrderProbability: 0.4,
        commentProbability: 0.3,
        likeProbability: 0.5,
        onlineHours: { start: 9, end: 21 },
        subjects: ['数学', '英语'],
        responseDelay: { min: 30, max: 300 },
      };
    }
    return {
      grabOrderProbability: 0,
      commentProbability: 0.25,
      likeProbability: 0.4,
      onlineHours: { start: 10, end: 22 },
      subjects: [],
      responseDelay: { min: 60, max: 600 },
    };
  }

  /**
   * 保存机器人配置
   */
  private async saveRobotConfig(userId: number, role: 'teacher' | 'parent', config?: any) {
    const defaultConfig = this.getDefaultBehaviorConfig(role);
    const finalConfig = { ...defaultConfig, ...config };

    // 存储到数据库（使用site_config或专门的表）
    await db.update(
      `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
       VALUES (?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
      [
        `robot_config_${userId}`,
        JSON.stringify(finalConfig),
        JSON.stringify(finalConfig),
      ],
    );
  }

  /**
   * 定时任务：模拟机器人抢单
   * 每5分钟执行一次
   */
  @Cron('*/5 * * * *')
  async simulateGrabOrders() {
    if (!this.config.enabled || !this.config.autoGrabEnabled) {
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    
    // 检查是否在活跃时段
    if (hour < this.config.activeHours.start || hour >= this.config.activeHours.end) {
      return;
    }

    try {
      // 获取待抢单的订单
      const [orders] = await db.query(
        `SELECT id, subject FROM orders WHERE status = 0 ORDER BY created_at DESC LIMIT 10`,
      );

      if (!orders || orders.length === 0) {
        return;
      }

      // 遍历机器人老师，决定是否抢单
      for (const [robotId, robot] of this.robotUsers) {
        if (robot.role !== 'teacher') continue;

        const behaviorConfig = robot.behavior_config;
        
        // 概率判断
        if (Math.random() > behaviorConfig.grabOrderProbability) {
          continue;
        }

        // 随机选择一个订单
        const order = (orders as any[])[Math.floor(Math.random() * orders.length)];

        // 检查是否已抢单
        const [existing] = await db.query(
          `SELECT id FROM order_matches WHERE order_id = ? AND teacher_id = ?`,
          [order.id, robotId],
        );

        if (existing && existing.length > 0) {
          continue;
        }

        // 创建抢单记录
        await db.update(
          `INSERT INTO order_matches (order_id, teacher_id, status, created_at)
           VALUES (?, ?, 0, NOW())`,
          [order.id, robotId],
        );

        this.logger.log(`机器人 ${robot.nickname} 抢单成功: 订单ID=${order.id}`);
      }
    } catch (error) {
      this.logger.error('模拟抢单失败:', error);
    }
  }

  /**
   * 定时任务：模拟机器人评论动态
   * 每10分钟执行一次
   */
  @Cron('*/10 * * * *')
  async simulateComments() {
    if (!this.config.enabled || !this.config.autoCommentEnabled) {
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    
    if (hour < this.config.activeHours.start || hour >= this.config.activeHours.end) {
      return;
    }

    const comments = [
      '老师很专业，孩子进步很大！',
      '教学方法很好，孩子很喜欢。',
      '耐心细致，讲解清晰。',
      '准时上课，态度认真。',
      '性价比高，推荐！',
      '老师很有责任心。',
      '孩子成绩提高了不少。',
      '课后会布置合适的作业。',
    ];

    try {
      // 获取最近的动态
      const [moments] = await db.query(
        `SELECT id FROM moments ORDER BY created_at DESC LIMIT 10`,
      );

      if (!moments || moments.length === 0) {
        return;
      }

      // 随机选择一个机器人评论
      for (const [robotId, robot] of this.robotUsers) {
        if (Math.random() > robot.behavior_config.commentProbability) {
          continue;
        }

        const moment = (moments as any[])[Math.floor(Math.random() * moments.length)];
        const comment = comments[Math.floor(Math.random() * comments.length)];

        await db.update(
          `INSERT INTO moment_comments (moment_id, user_id, content, created_at)
           VALUES (?, ?, ?, NOW())`,
          [moment.id, robotId, comment],
        );

        this.logger.log(`机器人 ${robot.nickname} 评论了动态: "${comment}"`);
        break; // 每次只执行一个评论
      }
    } catch (error) {
      this.logger.error('模拟评论失败:', error);
    }
  }

  /**
   * 定时任务：模拟机器人点赞
   * 每3分钟执行一次
   */
  @Cron('*/3 * * * *')
  async simulateLikes() {
    if (!this.config.enabled) {
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    
    if (hour < this.config.activeHours.start || hour >= this.config.activeHours.end) {
      return;
    }

    try {
      // 获取最近的动态
      const [moments] = await db.query(
        `SELECT id FROM moments ORDER BY created_at DESC LIMIT 5`,
      );

      if (!moments || moments.length === 0) {
        return;
      }

      for (const [robotId, robot] of this.robotUsers) {
        if (Math.random() > robot.behavior_config.likeProbability) {
          continue;
        }

        const moment = (moments as any[])[Math.floor(Math.random() * moments.length)];

        // 检查是否已点赞
        const [existing] = await db.query(
          `SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?`,
          [moment.id, robotId],
        );

        if (existing && existing.length > 0) {
          continue;
        }

        await db.update(
          `INSERT INTO moment_likes (moment_id, user_id, created_at)
           VALUES (?, ?, NOW())`,
          [moment.id, robotId],
        );

        this.logger.log(`机器人 ${robot.nickname} 点赞了动态`);
        break;
      }
    } catch (error) {
      this.logger.error('模拟点赞失败:', error);
    }
  }

  // ==================== 配置管理 ====================

  /**
   * 获取配置
   */
  getConfig(): DemoConfig {
    return this.config;
  }

  /**
   * 更新配置
   */
  async updateConfig(config: Partial<DemoConfig>) {
    this.config = { ...this.config, ...config };

    // 保存到数据库
    await db.update(
      `INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
       VALUES ('demo_config', ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
      [JSON.stringify(this.config), JSON.stringify(this.config)],
    );

    return { success: true, config: this.config };
  }

  /**
   * 获取机器人用户列表
   */
  async getRobotUsers() {
    const [users] = await db.query(
      `SELECT u.id, u.nickname, u.avatar, u.role, u.city_name, 
              u.membership_type, u.created_at,
              tp.real_name, tp.subjects, tp.rating
       FROM users u
       LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
       WHERE u.openid LIKE 'demo_%'
       ORDER BY u.role, u.id`,
    );

    return users;
  }

  /**
   * 删除演示数据
   */
  async clearDemoData() {
    try {
      // 删除演示用户的关联数据
      await db.update(`DELETE FROM order_matches WHERE teacher_id IN (SELECT id FROM users WHERE openid LIKE 'demo_%')`);
      await db.update(`DELETE FROM orders WHERE order_no LIKE 'DEMO%'`);
      await db.update(`DELETE FROM moment_comments WHERE user_id IN (SELECT id FROM users WHERE openid LIKE 'demo_%')`);
      await db.update(`DELETE FROM moment_likes WHERE user_id IN (SELECT id FROM users WHERE openid LIKE 'demo_%')`);
      await db.update(`DELETE FROM teacher_profiles WHERE user_id IN (SELECT id FROM users WHERE openid LIKE 'demo_%')`);
      await db.update(`DELETE FROM users WHERE openid LIKE 'demo_%'`);

      this.robotUsers.clear();
      this.logger.log('已清除所有演示数据');

      return { success: true, message: '演示数据已清除' };
    } catch (error) {
      this.logger.error('清除演示数据失败:', error);
      return { success: false, message: '清除失败' };
    }
  }

  /**
   * 初始化演示数据（一键生成）
   */
  async initDemoData() {
    // 创建机器人老师
    const teachersResult = await this.createDemoTeachers(this.config.robotTeachers);
    
    // 创建机器人家长
    const parentsResult = await this.createDemoParents(this.config.robotParents);
    
    // 创建演示订单
    const ordersResult = await this.createDemoOrders(this.config.demoOrders);

    return {
      success: true,
      message: '演示数据初始化完成',
      data: {
        teachers: teachersResult.count,
        parents: parentsResult.count,
        orders: ordersResult.count,
      },
    };
  }
}
