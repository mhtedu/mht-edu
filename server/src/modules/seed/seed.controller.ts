import { Controller, Post, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import * as db from '@/storage/database/mysql-client';

/**
 * 测试数据初始化控制器
 * 仅用于开发和测试环境
 */
@Controller('seed')
export class SeedController {

  /**
   * 初始化所有测试数据
   * GET /api/seed/init?force=true
   */
  @Get('init')
  @Public()
  async initAllData(@Query('force') force: string = 'false') {
    const results = {
      teachers: { success: false, count: 0, message: '' },
      parents: { success: false, count: 0, message: '' },
      orders: { success: false, count: 0, message: '' },
      activities: { success: false, count: 0, message: '' },
      invitations: { success: false, count: 0, message: '' },
    };

    try {
      // 1. 填充教师数据
      results.teachers = await this.seedTeachers(force === 'true');
    } catch (e: any) {
      results.teachers.message = e.message;
    }

    try {
      // 2. 填充家长数据
      results.parents = await this.seedParents(force === 'true');
    } catch (e: any) {
      results.parents.message = e.message;
    }

    try {
      // 3. 填充订单数据
      results.orders = await this.seedOrders(force === 'true');
    } catch (e: any) {
      results.orders.message = e.message;
    }

    try {
      // 4. 填充活动数据
      results.activities = await this.seedActivities(force === 'true');
    } catch (e: any) {
      results.activities.message = e.message;
    }

    try {
      // 5. 填充邀约数据
      results.invitations = await this.seedInvitations(force === 'true');
    } catch (e: any) {
      results.invitations.message = e.message;
    }

    return {
      success: true,
      message: '测试数据初始化完成',
      results,
    };
  }

  /**
   * 填充教师数据
   */
  private async seedTeachers(force: boolean): Promise<{ success: boolean; count: number; message: string }> {
    // 检查现有数据
    const [existing] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles');
    if (!force && (existing as any[])[0].count > 10) {
      return { success: true, count: (existing as any[])[0].count, message: '教师数据已存在，跳过初始化' };
    }

    // 教师数据模板
    const teacherTemplates = [
      // 数学名师
      { name: '张明远', subjects: ['数学', '奥数'], education: '清华大学硕士', experience: 15, bio: '清华数学系硕士，曾获全国奥数金牌，擅长培养数学思维', minRate: 280, maxRate: 380, rating: 4.98 },
      { name: '王建国', subjects: ['数学'], education: '北京大学博士', experience: 12, bio: '北大数学博士，高考数学满分导师', minRate: 250, maxRate: 350, rating: 4.95 },
      { name: '李思远', subjects: ['数学', '竞赛数学'], education: '中科院硕士', experience: 10, bio: '数学竞赛教练，培养学生获省一等奖', minRate: 270, maxRate: 350, rating: 4.92 },
      { name: '陈志强', subjects: ['数学'], education: '北京师范大学硕士', experience: 8, bio: '北师大教育硕士，擅长因材施教', minRate: 220, maxRate: 300, rating: 4.88 },
      { name: '刘德华', subjects: ['数学', '奥数'], education: '复旦大学硕士', experience: 11, bio: '奥数金牌教练，教学方法独特', minRate: 240, maxRate: 320, rating: 4.90 },
      { name: '赵文华', subjects: ['数学'], education: '中国人民大学硕士', experience: 9, bio: '高考数学研究专家，提分效果显著', minRate: 200, maxRate: 280, rating: 4.85 },
      { name: '孙小明', subjects: ['数学'], education: '首都师范大学硕士', experience: 7, bio: '专注中小学数学，耐心细致', minRate: 180, maxRate: 250, rating: 4.82 },
      { name: '周永康', subjects: ['数学', '奥数'], education: '清华大学博士', experience: 13, bio: '清华博士，数学思维培养专家', minRate: 300, maxRate: 400, rating: 4.96 },
      
      // 语文名师
      { name: '林晓燕', subjects: ['语文', '作文'], education: '北京大学硕士', experience: 14, bio: '北大中文系硕士，作文教学专家', minRate: 260, maxRate: 350, rating: 4.97 },
      { name: '陈美玲', subjects: ['语文'], education: '北京师范大学硕士', experience: 11, bio: '语文教育专家，擅长阅读理解教学', minRate: 220, maxRate: 300, rating: 4.91 },
      { name: '王秀英', subjects: ['语文', '作文'], education: '华东师范大学硕士', experience: 9, bio: '作文大赛优秀指导老师', minRate: 200, maxRate: 280, rating: 4.87 },
      { name: '李雪梅', subjects: ['语文'], education: '首都师范大学硕士', experience: 8, bio: '专注语文基础教学，耐心负责', minRate: 180, maxRate: 250, rating: 4.84 },
      { name: '张丽华', subjects: ['语文', '古文'], education: '南京大学硕士', experience: 10, bio: '古诗词爱好者，国学教育专家', minRate: 210, maxRate: 290, rating: 4.89 },
      
      // 英语名师
      { name: 'David Chen', subjects: ['英语', '口语'], education: '哈佛大学硕士', experience: 12, bio: '哈佛毕业，纯正美式发音，口语教学专家', minRate: 350, maxRate: 450, rating: 4.99 },
      { name: 'Sarah Wang', subjects: ['英语', '雅思'], education: '剑桥大学硕士', experience: 10, bio: '剑桥英语教育硕士，雅思8.5分', minRate: 320, maxRate: 420, rating: 4.95 },
      { name: '刘思琪', subjects: ['英语'], education: '北京外国语大学硕士', experience: 8, bio: '北外高翻毕业，专八优秀', minRate: 250, maxRate: 320, rating: 4.88 },
      { name: '王佳琪', subjects: ['英语', '口语'], education: '上海外国语大学硕士', experience: 7, bio: '留学背景，口语流利自然', minRate: 220, maxRate: 300, rating: 4.85 },
      { name: '张美娜', subjects: ['英语'], education: '北京语言大学硕士', experience: 9, bio: '英语教育专家，语法讲解清晰', minRate: 200, maxRate: 280, rating: 4.82 },
      { name: '李梦瑶', subjects: ['英语', '托福'], education: '哥伦比亚大学硕士', experience: 6, bio: '哥大TESOL硕士，托福110+', minRate: 280, maxRate: 380, rating: 4.91 },
      
      // 物理名师
      { name: '张伟', subjects: ['物理'], education: '清华大学博士', experience: 15, bio: '清华物理博士，物理竞赛金牌教练', minRate: 300, maxRate: 400, rating: 4.96 },
      { name: '李志华', subjects: ['物理', '竞赛物理'], education: '北京大学硕士', experience: 12, bio: '物理竞赛教练，多名学生获省奖', minRate: 270, maxRate: 350, rating: 4.93 },
      { name: '王建平', subjects: ['物理'], education: '中科院硕士', experience: 10, bio: '物理教学专家，实验演示生动', minRate: 240, maxRate: 320, rating: 4.88 },
      { name: '陈永强', subjects: ['物理'], education: '北京师范大学硕士', experience: 8, bio: '耐心细致，适合基础薄弱学生', minRate: 200, maxRate: 280, rating: 4.84 },
      { name: '刘明辉', subjects: ['物理', '竞赛物理'], education: '中国科技大学硕士', experience: 11, bio: '中科大物理系毕业，竞赛经验丰富', minRate: 280, maxRate: 380, rating: 4.91 },
      
      // 化学名师
      { name: '王丽娟', subjects: ['化学'], education: '清华大学硕士', experience: 13, bio: '清华化学系硕士，化学竞赛教练', minRate: 280, maxRate: 380, rating: 4.94 },
      { name: '李艳红', subjects: ['化学'], education: '北京大学硕士', experience: 10, bio: '化学教学专家，擅长有机化学', minRate: 250, maxRate: 320, rating: 4.90 },
      { name: '张秀芳', subjects: ['化学', '竞赛化学'], education: '中科院硕士', experience: 9, bio: '化学竞赛金牌教练', minRate: 270, maxRate: 350, rating: 4.88 },
      { name: '陈小燕', subjects: ['化学'], education: '北京师范大学硕士', experience: 7, bio: '化学实验教学专家', minRate: 200, maxRate: 280, rating: 4.82 },
      { name: '刘芳芳', subjects: ['化学'], education: '南京大学硕士', experience: 8, bio: '专注高考化学，提分效果明显', minRate: 210, maxRate: 290, rating: 4.85 },
      
      // 生物名师
      { name: '周美玲', subjects: ['生物'], education: '北京大学生物学博士', experience: 14, bio: '北大生物博士，生物竞赛教练', minRate: 290, maxRate: 380, rating: 4.95 },
      { name: '李晓燕', subjects: ['生物'], education: '清华大学硕士', experience: 11, bio: '生物奥赛优秀指导教师', minRate: 260, maxRate: 340, rating: 4.89 },
      { name: '王红梅', subjects: ['生物'], education: '中科院硕士', experience: 9, bio: '生物实验教学专家', minRate: 230, maxRate: 300, rating: 4.86 },
      { name: '张秀英', subjects: ['生物'], education: '北京师范大学硕士', experience: 8, bio: '适合基础薄弱学生', minRate: 180, maxRate: 260, rating: 4.82 },
      
      // 历史名师
      { name: '赵明华', subjects: ['历史'], education: '北京大学硕士', experience: 16, bio: '历史学硕士，高考历史专家', minRate: 260, maxRate: 350, rating: 4.94 },
      { name: '李建国', subjects: ['历史'], education: '中国人民大学硕士', experience: 12, bio: '历史教学专家，知识体系清晰', minRate: 230, maxRate: 310, rating: 4.88 },
      { name: '王文华', subjects: ['历史'], education: '北京师范大学硕士', experience: 10, bio: '历史故事化教学，生动有趣', minRate: 200, maxRate: 280, rating: 4.85 },
      { name: '陈志明', subjects: ['历史'], education: '首都师范大学硕士', experience: 8, bio: '专注高考历史，提分效果好', minRate: 180, maxRate: 260, rating: 4.81 },
      
      // 地理名师
      { name: '刘志强', subjects: ['地理'], education: '北京师范大学硕士', experience: 13, bio: '地理教育专家，图文并茂', minRate: 240, maxRate: 320, rating: 4.91 },
      { name: '张美华', subjects: ['地理'], education: '南京大学硕士', experience: 10, bio: '地理竞赛优秀指导教师', minRate: 210, maxRate: 290, rating: 4.86 },
      { name: '李晓红', subjects: ['地理'], education: '华东师范大学硕士', experience: 8, bio: '地理知识系统讲解', minRate: 180, maxRate: 260, rating: 4.82 },
      { name: '王建新', subjects: ['地理'], education: '中科院硕士', experience: 9, bio: '自然地理专家，善于图表分析', minRate: 200, maxRate: 280, rating: 4.84 },
      
      // 政治名师
      { name: '陈伟明', subjects: ['政治'], education: '中国人民大学博士', experience: 15, bio: '人大政治学博士，高考政治专家', minRate: 260, maxRate: 350, rating: 4.93 },
      { name: '李志国', subjects: ['政治'], education: '北京大学硕士', experience: 12, bio: '政治教学专家，答题技巧强', minRate: 240, maxRate: 320, rating: 4.89 },
      { name: '王秀芳', subjects: ['政治'], education: '北京师范大学硕士', experience: 9, bio: '政治时政热点分析专家', minRate: 200, maxRate: 280, rating: 4.85 },
      { name: '张丽娜', subjects: ['政治'], education: '首都师范大学硕士', experience: 7, bio: '适合政治入门学习', minRate: 180, maxRate: 250, rating: 4.81 },
      
      // 编程名师
      { name: '刘强', subjects: ['编程', 'Python'], education: '清华大学计算机硕士', experience: 10, bio: '编程竞赛教练，信息学奥赛专家', minRate: 320, maxRate: 420, rating: 4.95 },
      { name: '张志远', subjects: ['编程', 'C++'], education: '北京大学硕士', experience: 8, bio: 'C++专家，NOIP获奖导师', minRate: 290, maxRate: 380, rating: 4.91 },
      { name: '王明辉', subjects: ['编程', 'Python'], education: '中科院硕士', experience: 7, bio: 'Python编程教育专家', minRate: 260, maxRate: 350, rating: 4.87 },
      { name: '李建国', subjects: ['编程', 'Java'], education: '浙江大学硕士', experience: 9, bio: 'Java开发专家，编程思维培养', minRate: 280, maxRate: 370, rating: 4.89 },
      
      // 美术名师
      { name: '赵艺华', subjects: ['美术', '素描'], education: '中央美术学院硕士', experience: 14, bio: '央美毕业，素描教学专家', minRate: 280, maxRate: 380, rating: 4.96 },
      { name: '刘美玲', subjects: ['美术', '水彩'], education: '中国美术学院硕士', experience: 11, bio: '水彩画专家，色彩敏感度培养', minRate: 260, maxRate: 350, rating: 4.91 },
      { name: '张晓艺', subjects: ['美术', '油画'], education: '清华大学美术学院硕士', experience: 9, bio: '油画创作与教学专家', minRate: 240, maxRate: 330, rating: 4.87 },
      { name: '王艺文', subjects: ['美术', '国画'], education: '中央美术学院硕士', experience: 12, bio: '国画大师，传统艺术传承', minRate: 280, maxRate: 370, rating: 4.93 },
      
      // 音乐名师
      { name: '李音华', subjects: ['钢琴'], education: '中央音乐学院硕士', experience: 16, bio: '钢琴演奏家，考级通过率100%', minRate: 350, maxRate: 450, rating: 4.98 },
      { name: '王美声', subjects: ['声乐'], education: '中国音乐学院硕士', experience: 13, bio: '声乐教育专家，艺考辅导经验丰富', minRate: 300, maxRate: 400, rating: 4.94 },
      { name: '张小提琴', subjects: ['小提琴'], education: '上海音乐学院硕士', experience: 11, bio: '小提琴演奏家，培养多名获奖学生', minRate: 320, maxRate: 420, rating: 4.92 },
      { name: '刘吉他', subjects: ['吉他'], education: '四川音乐学院硕士', experience: 8, bio: '吉他教学专家，适合零基础', minRate: 220, maxRate: 300, rating: 4.85 },
    ];

    let count = 0;
    const errors: string[] = [];

    for (let i = 0; i < teacherTemplates.length; i++) {
      const t = teacherTemplates[i];
      
      try {
        // 1. 创建用户账号 (role=2 表示教师)
        const inviteCode = `T${Date.now().toString(36).toUpperCase()}${i}`;
        const [userResult] = await db.query(
          `INSERT INTO users (mobile, nickname, avatar, role, invite_code, status, created_at, updated_at)
           VALUES (?, ?, ?, 2, ?, 1, NOW(), NOW())`,
          [
            `138${String(10000000 + i).padStart(8, '0')}`,
            t.name,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.name)}`,
            inviteCode
          ]
        );
        const userId = (userResult as any).insertId;

        // 2. 创建教师档案
        await db.query(
          `INSERT INTO teacher_profiles 
           (user_id, real_name, education, subjects, hourly_rate_min, hourly_rate_max, 
            intro, one_line_intro, teaching_years, verify_status, rating, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
          [
            userId,
            t.name,
            t.education,
            JSON.stringify(t.subjects),
            t.minRate,
            t.maxRate,
            t.bio,
            t.bio.substring(0, 30) + '...',
            t.experience,
            t.rating
          ]
        );
        count++;
      } catch (e: any) {
        if (!e.message.includes('Duplicate')) {
          errors.push(`${t.name}: ${e.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      message: errors.length > 0 ? `成功${count}条，失败: ${errors.slice(0, 3).join('; ')}` : `成功创建${count}条教师数据`
    };
  }

  /**
   * 填充家长数据
   */
  private async seedParents(force: boolean): Promise<{ success: boolean; count: number; message: string }> {
    // 检查现有数据 - 家长存储在users表中，role=1
    const [existing] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = 1');
    if (!force && (existing as any[])[0].count > 20) {
      return { success: true, count: (existing as any[])[0].count, message: '家长数据已存在，跳过初始化' };
    }

    // 家长姓氏
    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
    
    let count = 0;
    const errors: string[] = [];

    // 创建120个家长
    for (let i = 0; i < 120; i++) {
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const name = `${surname}家长${i + 1}`;
      
      try {
        // 创建用户账号 (role=1 表示家长)
        const inviteCode = `P${Date.now().toString(36).toUpperCase()}${i}`;
        await db.query(
          `INSERT INTO users (mobile, nickname, avatar, role, invite_code, status, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, 1, NOW(), NOW())`,
          [
            `139${String(10000000 + i).padStart(8, '0')}`,
            name,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            inviteCode
          ]
        );
        count++;
      } catch (e: any) {
        if (!e.message.includes('Duplicate')) {
          errors.push(`${name}: ${e.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      message: errors.length > 0 ? `成功${count}条，失败: ${errors.slice(0, 3).join('; ')}` : `成功创建${count}条家长数据`
    };
  }

  /**
   * 填充订单数据
   */
  private async seedOrders(force: boolean): Promise<{ success: boolean; count: number; message: string }> {
    // 检查现有数据
    const [existing] = await db.query('SELECT COUNT(*) as count FROM orders');
    if (!force && (existing as any[])[0].count > 20) {
      return { success: true, count: (existing as any[])[0].count, message: '订单数据已存在，跳过初始化' };
    }

    // 获取家长ID列表 (role=1)
    const [parents] = await db.query('SELECT id FROM users WHERE role = 1 LIMIT 100');
    const parentIds = (parents as any[]).map(p => p.id);

    if (parentIds.length === 0) {
      return { success: false, count: 0, message: '没有家长数据，请先初始化家长' };
    }

    const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '编程', '美术', '钢琴'];
    const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
    const descriptions = [
      '孩子基础薄弱，需要系统补习',
      '希望提高学习成绩，准备期末考试',
      '对某些知识点理解困难，需要重点讲解',
      '准备参加竞赛，需要专业辅导',
      '培养学习兴趣，打好基础',
      '中考/高考冲刺，急需提分',
      '培养特长，艺术类考级准备',
      '假期补课，预习新学期内容',
    ];
    const addresses = [
      '海淀区中关村', '朝阳区望京', '西城区金融街', '东城区王府井',
      '朝阳区三里屯', '海淀区五道口', '丰台区方庄', '通州区万达'
    ];
    const statuses = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4]; // 各种状态的订单

    let count = 0;
    const errors: string[] = [];

    // 创建100个订单
    for (let i = 0; i < 100; i++) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const parentId = parentIds[Math.floor(Math.random() * parentIds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hourlyRate = Math.floor(Math.random() * 200) + 150;
      const orderNo = `ORD${Date.now()}${i}`;
      
      try {
        await db.query(
          `INSERT INTO orders 
           (order_no, user_id, parent_id, subject, student_grade, hourly_rate, description, address, status, 
            latitude, longitude, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 
                   39.9 + RAND() * 0.1, 116.3 + RAND() * 0.2, 
                   DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY), NOW())`,
          [
            orderNo,
            parentId, // user_id 和 parent_id 相同
            parentId,
            subject,
            grade,
            hourlyRate,
            description,
            address,
            status
          ]
        );
        count++;
      } catch (e: any) {
        if (!e.message.includes('Duplicate')) {
          errors.push(`订单${i + 1}: ${e.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      message: errors.length > 0 ? `成功${count}条，失败: ${errors.slice(0, 3).join('; ')}` : `成功创建${count}条订单数据`
    };
  }

  /**
   * 填充活动数据
   */
  private async seedActivities(force: boolean): Promise<{ success: boolean; count: number; message: string }> {
    // 检查现有数据
    const [existing] = await db.query('SELECT COUNT(*) as count FROM activities');
    if (!force && (existing as any[])[0].count > 5) {
      return { success: true, count: (existing as any[])[0].count, message: '活动数据已存在，跳过初始化' };
    }

    const activities = [
      {
        title: '新春特惠活动',
        description: '新年新气象，名师课程享8折优惠',
        cover_image: 'https://picsum.photos/seed/activity1/400/200',
        start_time: new Date('2025-01-01'),
        end_time: new Date('2025-02-15'),
        status: 1,
      },
      {
        title: '数学竞赛集训营',
        description: '清华博士带队，备战全国数学竞赛',
        cover_image: 'https://picsum.photos/seed/activity2/400/200',
        start_time: new Date('2025-03-01'),
        end_time: new Date('2025-03-15'),
        status: 1,
      },
      {
        title: '高考冲刺班',
        description: '最后冲刺，名师押题，助你金榜题名',
        cover_image: 'https://picsum.photos/seed/activity3/400/200',
        start_time: new Date('2025-04-01'),
        end_time: new Date('2025-06-01'),
        status: 1,
      },
      {
        title: '英语口语夏令营',
        description: '沉浸式英语学习，地道口语训练',
        cover_image: 'https://picsum.photos/seed/activity4/400/200',
        start_time: new Date('2025-07-01'),
        end_time: new Date('2025-07-31'),
        status: 1,
      },
      {
        title: '艺术考级集训',
        description: '美术、音乐考级集训，专业辅导',
        cover_image: 'https://picsum.photos/seed/activity5/400/200',
        start_time: new Date('2025-05-01'),
        end_time: new Date('2025-08-31'),
        status: 1,
      },
      {
        title: '邀请有礼',
        description: '邀请好友注册，双方各得50元优惠券',
        cover_image: 'https://picsum.photos/seed/activity6/400/200',
        start_time: new Date('2025-01-01'),
        end_time: new Date('2025-12-31'),
        status: 1,
      },
      {
        title: '名师公开课',
        description: '免费体验名师授课，感受优质教育',
        cover_image: 'https://picsum.photos/seed/activity7/400/200',
        start_time: new Date('2025-02-01'),
        end_time: new Date('2025-12-31'),
        status: 1,
      },
      {
        title: '编程体验课',
        description: '零基础学编程，培养逻辑思维',
        cover_image: 'https://picsum.photos/seed/activity8/400/200',
        start_time: new Date('2025-01-15'),
        end_time: new Date('2025-06-30'),
        status: 1,
      },
    ];

    let count = 0;
    const errors: string[] = [];

    for (const activity of activities) {
      try {
        await db.query(
          `INSERT INTO activities 
           (title, description, cover_image, type, start_time, end_time, status, is_active, created_at, updated_at)
           VALUES (?, ?, ?, 'promotion', ?, ?, ?, 1, NOW(), NOW())`,
          [
            activity.title,
            activity.description,
            activity.cover_image,
            activity.start_time,
            activity.end_time,
            activity.status,
          ]
        );
        count++;
      } catch (e: any) {
        if (!e.message.includes('Duplicate')) {
          errors.push(`${activity.title}: ${e.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      message: errors.length > 0 ? `成功${count}条，失败: ${errors.slice(0, 3).join('; ')}` : `成功创建${count}条活动数据`
    };
  }

  /**
   * 填充邀约数据
   */
  private async seedInvitations(force: boolean): Promise<{ success: boolean; count: number; message: string }> {
    // 检查现有数据
    const [existing] = await db.query('SELECT COUNT(*) as count FROM invitations');
    if (!force && (existing as any[])[0].count > 10) {
      return { success: true, count: (existing as any[])[0].count, message: '邀约数据已存在，跳过初始化' };
    }

    // 获取教师和家长ID
    const [teachers] = await db.query('SELECT id FROM users WHERE role = 2 LIMIT 50');
    const [parents] = await db.query('SELECT id FROM users WHERE role = 1 LIMIT 100');

    const teacherIds = (teachers as any[]).map(t => t.id);
    const parentIds = (parents as any[]).map(p => p.id);

    if (teacherIds.length === 0 || parentIds.length === 0) {
      return { success: false, count: 0, message: '缺少教师或家长数据' };
    }

    const invitationTypes = ['teacher_to_parent', 'parent_to_teacher', 'order_apply'];
    const statuses = [0, 0, 0, 1, 1, 2]; // pending, accepted, rejected
    const messages = [
      '您好，我对您的订单很感兴趣，希望能为您提供教学服务',
      '希望能与您合作，共同帮助孩子提高成绩',
      '我是该领域的专业老师，有丰富的教学经验',
      '期待与您进一步沟通',
    ];

    let count = 0;
    const errors: string[] = [];

    // 创建50条邀约
    for (let i = 0; i < 50; i++) {
      const type = invitationTypes[Math.floor(Math.random() * invitationTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const teacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const parentId = parentIds[Math.floor(Math.random() * parentIds.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];

      try {
        await db.query(
          `INSERT INTO invitations 
           (from_user_id, to_user_id, order_id, invitation_type, message, status, expired_at, created_at, updated_at)
           VALUES (?, ?, NULL, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY), NOW())`,
          [
            type === 'teacher_to_parent' ? teacherId : parentId,
            type === 'teacher_to_parent' ? parentId : teacherId,
            type,
            message,
            status
          ]
        );
        count++;
      } catch (e: any) {
        if (!e.message.includes('Duplicate')) {
          errors.push(`邀约${i + 1}: ${e.message}`);
        }
      }
    }

    return {
      success: true,
      count,
      message: errors.length > 0 ? `成功${count}条，失败: ${errors.slice(0, 3).join('; ')}` : `成功创建${count}条邀约数据`
    };
  }

  /**
   * 单独填充教师数据
   * GET /api/seed/teachers?force=true
   */
  @Get('teachers')
  @Public()
  async seedTeachersOnly(@Query('force') force: string = 'false') {
    return this.seedTeachers(force === 'true');
  }

  /**
   * 单独填充家长数据
   * GET /api/seed/parents?force=true
   */
  @Get('parents')
  @Public()
  async seedParentsOnly(@Query('force') force: string = 'false') {
    return this.seedParents(force === 'true');
  }

  /**
   * 单独填充订单数据
   * GET /api/seed/orders?force=true
   */
  @Get('orders')
  @Public()
  async seedOrdersOnly(@Query('force') force: string = 'false') {
    return this.seedOrders(force === 'true');
  }

  /**
   * 单独填充活动数据
   * GET /api/seed/activities?force=true
   */
  @Get('activities')
  @Public()
  async seedActivitiesOnly(@Query('force') force: string = 'false') {
    return this.seedActivities(force === 'true');
  }

  /**
   * 查询当前数据统计
   * GET /api/seed/stats
   */
  @Get('stats')
  @Public()
  async getStats() {
    const [users] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles WHERE verify_status = 1');
    const [orders] = await db.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const [activities] = await db.query('SELECT COUNT(*) as count FROM activities WHERE status = 1');
    const [invitations] = await db.query('SELECT status, COUNT(*) as count FROM invitations GROUP BY status');

    return {
      users,
      teachers: (teachers as any[])[0]?.count || 0,
      orders,
      activities: (activities as any[])[0]?.count || 0,
      invitations,
    };
  }
}
