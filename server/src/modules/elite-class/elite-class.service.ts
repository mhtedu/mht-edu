import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class EliteClassService {
  /**
   * 检查用户是否为超级会员
   * 条件：付费购买 或 邀请10人（任意角色）
   */
  async checkSuperMember(userId: number): Promise<{ isSuper: boolean; reason?: string }> {
    // 1. 检查付费超级会员
    const superMembers = await executeQuery(`
      SELECT * FROM super_memberships 
      WHERE user_id = ? AND status = 1 AND expire_at > NOW()
    `, [userId]);

    if (superMembers.length > 0) {
      return { isSuper: true };
    }

    // 2. 检查邀请达标情况（任意角色累计10人）
    const inviteStats = await executeQuery(`
      SELECT COUNT(*) as total_count
      FROM users u
      WHERE u.inviter_id = ? AND u.status = 1
    `, [userId]);

    const totalCount = (inviteStats[0] as any)?.total_count || 0;

    if (totalCount >= 10) {
      // 自动授予超级会员资格
      await this.grantSuperMember(userId, 2); // type=2 邀请达标
      return { isSuper: true };
    }

    return { 
      isSuper: false, 
      reason: `已邀请${totalCount}人，还需邀请${10 - totalCount}人即可免费开通` 
    };
  }

  /**
   * 授予超级会员资格
   */
  async grantSuperMember(userId: number, type: number, days: number = 365) {
    await executeQuery(`
      INSERT INTO super_memberships (user_id, type, start_at, expire_at, status)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 1)
      ON DUPLICATE KEY UPDATE 
        type = VALUES(type),
        expire_at = DATE_ADD(GREATEST(expire_at, NOW()), INTERVAL ? DAY),
        status = 1
    `, [userId, type, days, days]);

    // 更新用户表
    await executeQuery(`
      UPDATE users SET is_super_member = 1, super_member_expire_at = DATE_ADD(NOW(), INTERVAL ? DAY)
      WHERE id = ?
    `, [days, userId]);
  }

  /**
   * 创建牛师班
   */
  async createClass(userId: number, data: any) {
    // 检查超级会员资格
    const { isSuper, reason } = await this.checkSuperMember(userId);
    if (!isSuper) {
      throw new Error(`创建牛师班需要超级会员资格。${reason || ''}`);
    }

    const result = await executeQuery(`
      INSERT INTO elite_classes (
        teacher_id, class_name, subject, start_time, total_lessons, 
        address, latitude, longitude, hourly_rate, max_students, description, cover_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      data.class_name,
      data.subject,
      data.start_time,
      data.total_lessons,
      data.address,
      data.latitude,
      data.longitude,
      data.hourly_rate,
      data.max_students,
      data.description,
      data.cover_image,
    ]);

    return { 
      success: true, 
      id: (result as any).insertId 
    };
  }

  /**
   * 获取牛师班列表（家长端）
   */
  async getClassList(params: {
    latitude?: number;
    longitude?: number;
    subject?: string;
    keyword?: string;
    city?: string;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = ['ec.status IN (0, 1)']; // 招生中或进行中
    const sqlParams: any[] = [];

    // 科目筛选
    if (params.subject && params.subject !== '全部') {
      conditions.push('ec.subject = ?');
      sqlParams.push(params.subject);
    }

    // 关键词搜索
    if (params.keyword) {
      conditions.push('(ec.class_name LIKE ? OR ec.description LIKE ?)');
      sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
    }

    // 城市筛选
    if (params.city && params.city !== '定位中...') {
      conditions.push('ec.address LIKE ?');
      sqlParams.push(`%${params.city}%`);
    }

    const whereClause = conditions.join(' AND ');

    // LBS距离计算
    let distanceSelect = 'NULL as distance';
    let distanceOrder = '';
    if (params.latitude && params.longitude) {
      distanceSelect = `
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(ec.latitude)) *
            cos(radians(ec.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(ec.latitude))
          ), 2
        ) as distance
      `;
      sqlParams.unshift(params.latitude, params.longitude, params.latitude);
      distanceOrder = 'ORDER BY distance ASC';
    }

    const classes = await executeQuery(`
      SELECT 
        ec.*,
        u.nickname as teacher_nickname, u.avatar as teacher_avatar,
        tp.real_name as teacher_real_name, tp.rating as teacher_rating,
        tp.teaching_years, tp.one_line_intro,
        ${distanceSelect}
      FROM elite_classes ec
      LEFT JOIN users u ON ec.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ec.teacher_id = tp.user_id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY ec.current_students DESC, ec.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    // 处理返回数据格式
    const formattedClasses = classes.map((c: any) => ({
      ...c,
      distance_text: c.distance ? (c.distance < 1 ? `${Math.round(c.distance * 1000)}m` : `${c.distance.toFixed(1)}km`) : '',
      remaining_seats: c.max_students - c.current_students,
    }));

    return formattedClasses;
  }

  /**
   * 获取牛师班详情
   */
  async getClassDetail(classId: number, userId?: number) {
    const classes = await executeQuery(`
      SELECT 
        ec.*,
        u.nickname as teacher_nickname, u.avatar as teacher_avatar,
        tp.real_name as teacher_real_name, tp.rating as teacher_rating,
        tp.teaching_years, tp.education, tp.subjects, tp.one_line_intro, tp.intro as teacher_intro
      FROM elite_classes ec
      LEFT JOIN users u ON ec.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ec.teacher_id = tp.user_id
      WHERE ec.id = ?
    `, [classId]);

    if (classes.length === 0) {
      throw new Error('牛师班不存在');
    }

    const classInfo = classes[0] as any;

    // 检查用户是否已报名
    if (userId) {
      const enrollments = await executeQuery(`
        SELECT * FROM elite_class_enrollments 
        WHERE class_id = ? AND student_id = ?
      `, [classId, userId]);
      classInfo.is_enrolled = enrollments.length > 0;
      classInfo.enrollment_status = enrollments.length > 0 ? (enrollments[0] as any).status : null;
    }

    return classInfo;
  }

  /**
   * 报名牛师班（含试课）
   * 同时锁定分销关系
   */
  async enrollClass(userId: number, classId: number, referrerId?: number) {
    // 检查班级是否存在且可报名
    const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND status IN (0, 1)
    `, [classId]);

    if (classes.length === 0) {
      throw new Error('牛师班不存在或已停止招生');
    }

    const classInfo = classes[0] as any;

    // 检查是否已满员
    if (classInfo.current_students >= classInfo.max_students) {
      throw new Error('班级已满员');
    }

    // 检查是否已报名
    const existing = await executeQuery(`
      SELECT * FROM elite_class_enrollments WHERE class_id = ? AND student_id = ?
    `, [classId, userId]);

    if (existing.length > 0) {
      throw new Error('您已报名该班级');
    }

    // 锁定分销关系（核心逻辑：第一次点击即锁定）
    if (referrerId && referrerId !== userId) {
      await this.lockShareRelation(userId, referrerId, 'elite_class', classId);
    }

    // 创建报名记录
    await executeQuery(`
      INSERT INTO elite_class_enrollments (class_id, student_id, status, trial_lesson, referrer_id)
      VALUES (?, ?, 0, 1, ?)
    `, [classId, userId, referrerId]);

    // 更新报名人数
    await executeQuery(`
      UPDATE elite_classes SET current_students = current_students + 1 WHERE id = ?
    `, [classId]);

    return { success: true, message: '报名成功，等待教师确认' };
  }

  /**
   * 锁定分享关系（核心方法）
   * 规则：第一次点击即锁定，永久有效，不可覆盖
   */
  async lockShareRelation(userId: number, lockerId: number, lockType: string, sourceId?: number) {
    // 检查是否已有锁定关系
    const existing = await executeQuery(`
      SELECT * FROM referral_locks WHERE user_id = ?
    `, [userId]);

    if (existing.length > 0) {
      // 已有锁定关系，不覆盖
      console.log(`用户 ${userId} 已被锁定，跳过`);
      return;
    }

    // 创建锁定关系
    await executeQuery(`
      INSERT INTO referral_locks (user_id, locker_id, lock_type, lock_source_id)
      VALUES (?, ?, ?, ?)
    `, [userId, lockerId, lockType, sourceId]);

    // 同时更新用户表的邀请关系
    await executeQuery(`
      UPDATE users 
      SET inviter_id = ?, 
          inviter_2nd_id = (SELECT inviter_id FROM users WHERE id = ?),
          updated_at = NOW()
      WHERE id = ? AND inviter_id IS NULL
    `, [lockerId, lockerId, userId]);

    // 记录锁定日志
    await executeQuery(`
      INSERT INTO referral_lock_logs (user_id, locker_id, lock_type, lock_source_id)
      VALUES (?, ?, ?, ?)
    `, [userId, lockerId, lockType, sourceId]);

    console.log(`分销关系锁定成功: 用户 ${userId} -> 推荐人 ${lockerId}`);
  }

  /**
   * 确认报名
   */
  async confirmEnrollment(teacherId: number, enrollmentId: number) {
    // 验证权限
    const enrollments = await executeQuery(`
      SELECT e.*, ec.teacher_id FROM elite_class_enrollments e
      LEFT JOIN elite_classes ec ON e.class_id = ec.id
      WHERE e.id = ?
    `, [enrollmentId]);

    if (enrollments.length === 0) {
      throw new Error('报名记录不存在');
    }

    const enrollment = enrollments[0] as any;
    if (enrollment.teacher_id !== teacherId) {
      throw new Error('无权操作');
    }

    // 更新状态
    await executeQuery(`
      UPDATE elite_class_enrollments SET status = 1, updated_at = NOW()
      WHERE id = ?
    `, [enrollmentId]);

    return { success: true };
  }

  /**
   * 更新课时进度
   */
  async updateLessonProgress(teacherId: number, classId: number, lessonNo: number) {
    // 验证权限
    const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);

    if (classes.length === 0) {
      throw new Error('无权操作');
    }

    const classInfo = classes[0] as any;
    const hourlyRate = classInfo.hourly_rate;

    // 计算分成
    const platformRate = 0.05; // 5%
    const referrerRate = 0.10; // 10%
    const teacherRate = 0.85; // 85%

    const platformIncome = hourlyRate * platformRate;
    const referrerIncome = hourlyRate * referrerRate;
    const teacherIncome = hourlyRate * teacherRate;

    // 更新进度
    await executeQuery(`
      UPDATE elite_classes SET current_lesson = ? WHERE id = ?
    `, [lessonNo, classId]);

    // 记录课时
    await executeQuery(`
      INSERT INTO elite_class_lessons (class_id, lesson_no, lesson_time, status, teacher_income, platform_income, referrer_income)
      VALUES (?, ?, NOW(), 2, ?, ?, ?)
    `, [classId, lessonNo, teacherIncome, platformIncome, referrerIncome]);

    // 发放佣金给推荐人
    const enrollments = await executeQuery(`
      SELECT DISTINCT referrer_id FROM elite_class_enrollments 
      WHERE class_id = ? AND referrer_id IS NOT NULL
    `, [classId]);

    for (const e of enrollments) {
      const referrerId = (e as any).referrer_id;
      await executeQuery(`
        INSERT INTO commissions (user_id, amount, type, from_user_id, status)
        VALUES (?, ?, 'elite_class_share', ?, 1)
      `, [referrerId, referrerIncome / (enrollments.length || 1), teacherId]);
    }

    return { success: true };
  }

  /**
   * 获取教师的牛师班列表
   */
  async getTeacherClasses(userId: number, status?: number) {
    const conditions: string[] = ['ec.teacher_id = ?'];
    const params: any[] = [userId];

    if (status !== undefined) {
      conditions.push('ec.status = ?');
      params.push(status);
    }

    const classes = await executeQuery(`
      SELECT ec.*, 
        (SELECT COUNT(*) FROM elite_class_enrollments WHERE class_id = ec.id) as actual_students
      FROM elite_classes ec
      WHERE ${conditions.join(' AND ')}
      ORDER BY ec.created_at DESC
    `, params);

    return classes;
  }

  /**
   * 获取报名学生列表
   */
  async getEnrolledStudents(teacherId: number, classId: number) {
    // 验证权限
    const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);

    if (classes.length === 0) {
      throw new Error('无权操作');
    }

    const students = await executeQuery(`
      SELECT 
        e.*,
        u.nickname, u.avatar, u.mobile
      FROM elite_class_enrollments e
      LEFT JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
      ORDER BY e.created_at ASC
    `, [classId]);

    return students;
  }

  /**
   * 取消/结束牛师班
   */
  async closeClass(teacherId: number, classId: number, reason?: string) {
    // 验证权限
    const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);

    if (classes.length === 0) {
      throw new Error('无权操作');
    }

    const classInfo = classes[0] as any;
    const status = classInfo.current_lesson >= classInfo.total_lessons ? 2 : 3; // 已结束或已取消

    await executeQuery(`
      UPDATE elite_classes SET status = ? WHERE id = ?
    `, [status, classId]);

    return { success: true, status };
  }
}
