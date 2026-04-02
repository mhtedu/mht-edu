import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class OrgValueService {
  // ==================== 优惠券管理 ====================

  /**
   * 创建优惠券
   */
  async createCoupon(orgId: number, data: {
    name: string;
    type: number;
    discount_amount?: number;
    discount_rate?: number;
    min_amount?: number;
    total_count: number;
    per_user_limit?: number;
    start_at: string;
    expire_at: string;
    apply_scope?: number;
    teacher_ids?: number[];
  }) {
    const result = await executeQuery(`
      INSERT INTO org_coupons (
        org_id, name, type, discount_amount, discount_rate, 
        min_amount, total_count, per_user_limit, start_at, expire_at,
        apply_scope, teacher_ids
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orgId, data.name, data.type, data.discount_amount || 0, data.discount_rate || 0,
      data.min_amount || 0, data.total_count, data.per_user_limit || 1,
      data.start_at, data.expire_at, data.apply_scope || 1,
      data.teacher_ids ? JSON.stringify(data.teacher_ids) : null
    ]);

    return { success: true, coupon_id: (result as any).insertId };
  }

  /**
   * 获取机构优惠券列表
   */
  async getCoupons(orgId: number, status?: number) {
    let sql = `
      SELECT oc.*, 
        (SELECT COUNT(*) FROM user_coupons WHERE coupon_id = oc.id) as received_count
      FROM org_coupons oc
      WHERE oc.org_id = ?
    `;
    const params: any[] = [orgId];

    if (status !== undefined) {
      sql += ' AND oc.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY oc.created_at DESC';

    const coupons = await executeQuery(sql, params);

    return coupons.map((c: any) => ({
      ...c,
      teacher_ids: c.teacher_ids ? JSON.parse(c.teacher_ids) : null,
    }));
  }

  /**
   * 用户领取优惠券
   */
  async receiveCoupon(userId: number, couponId: number) {
    // 获取优惠券信息
    const coupons = await executeQuery(`
      SELECT * FROM org_coupons WHERE id = ? AND status = 1
    `, [couponId]);

    if (coupons.length === 0) {
      throw new Error('优惠券不存在或已下架');
    }

    const coupon = coupons[0] as any;

    // 检查时间
    const now = new Date();
    if (new Date(coupon.start_at) > now) {
      throw new Error('优惠券未开始');
    }
    if (new Date(coupon.expire_at) < now) {
      throw new Error('优惠券已过期');
    }

    // 检查库存
    const receivedCount = await executeQuery(`
      SELECT COUNT(*) as count FROM user_coupons WHERE coupon_id = ?
    `, [couponId]);

    if ((receivedCount[0] as any).count >= coupon.total_count) {
      throw new Error('优惠券已领完');
    }

    // 检查用户领取次数
    const userReceivedCount = await executeQuery(`
      SELECT COUNT(*) as count FROM user_coupons WHERE coupon_id = ? AND user_id = ?
    `, [couponId, userId]);

    if ((userReceivedCount[0] as any).count >= coupon.per_user_limit) {
      throw new Error('已达到领取上限');
    }

    // 领取
    await executeQuery(`
      INSERT INTO user_coupons (user_id, coupon_id, org_id, status)
      VALUES (?, ?, ?, 0)
    `, [userId, couponId, coupon.org_id]);

    return { success: true };
  }

  /**
   * 获取用户可用优惠券
   */
  async getUserCoupons(userId: number, orgId?: number, teacherId?: number) {
    let sql = `
      SELECT uc.*, oc.name, oc.type, oc.discount_amount, oc.discount_rate, 
        oc.min_amount, oc.apply_scope, oc.teacher_ids, oc.expire_at,
        o.org_name
      FROM user_coupons uc
      LEFT JOIN org_coupons oc ON uc.coupon_id = oc.id
      LEFT JOIN organizations o ON uc.org_id = o.user_id
      WHERE uc.user_id = ? AND uc.status = 0 AND oc.expire_at > NOW()
    `;
    const params: any[] = [userId];

    if (orgId) {
      sql += ' AND uc.org_id = ?';
      params.push(orgId);
    }

    sql += ' ORDER BY oc.expire_at ASC';

    const coupons = await executeQuery(sql, params);

    // 过滤适用的优惠券
    return coupons.filter((c: any) => {
      if (c.apply_scope === 2 && c.teacher_ids && teacherId) {
        const teacherIds = JSON.parse(c.teacher_ids);
        return teacherIds.includes(teacherId);
      }
      return true;
    });
  }

  // ==================== 学员CRM管理 ====================

  /**
   * 创建学员
   */
  async createStudent(orgId: number, data: {
    student_name: string;
    parent_name?: string;
    parent_phone?: string;
    grade?: string;
    subjects?: string[];
    teacher_id?: number;
    source?: string;
    notes?: string;
  }) {
    const result = await executeQuery(`
      INSERT INTO org_students (
        org_id, student_name, parent_name, parent_phone, grade,
        subjects, teacher_id, source, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orgId, data.student_name, data.parent_name || '', data.parent_phone || '',
      data.grade || '', JSON.stringify(data.subjects || []),
      data.teacher_id || null, data.source || 'platform', data.notes || ''
    ]);

    // 更新机构学员数量
    await executeQuery(`
      UPDATE organizations SET student_count = student_count + 1 WHERE user_id = ?
    `, [orgId]);

    return { success: true, student_id: (result as any).insertId };
  }

  /**
   * 获取学员列表
   */
  async getStudents(orgId: number, options: {
    keyword?: string;
    status?: number;
    teacher_id?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT os.*, u.nickname as teacher_name
      FROM org_students os
      LEFT JOIN users u ON os.teacher_id = u.id
      WHERE os.org_id = ?
    `;
    const params: any[] = [orgId];

    if (options.keyword) {
      sql += ` AND (os.student_name LIKE ? OR os.parent_name LIKE ? OR os.parent_phone LIKE ?)`;
      params.push(`%${options.keyword}%`, `%${options.keyword}%`, `%${options.keyword}%`);
    }

    if (options.status !== undefined) {
      sql += ' AND os.status = ?';
      params.push(options.status);
    }

    if (options.teacher_id) {
      sql += ' AND os.teacher_id = ?';
      params.push(options.teacher_id);
    }

    sql += ' ORDER BY os.updated_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const students = await executeQuery(sql, params);

    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total FROM org_students WHERE org_id = ?
    `;
    const countResult = await executeQuery(countSql, [orgId]);

    return {
      list: students.map((s: any) => ({
        ...s,
        subjects: s.subjects ? JSON.parse(s.subjects) : [],
      })),
      total: (countResult[0] as any)?.total || 0,
      page,
      pageSize,
    };
  }

  /**
   * 更新学员状态
   */
  async updateStudentStatus(orgId: number, studentId: number, status: number) {
    await executeQuery(`
      UPDATE org_students SET status = ? WHERE id = ? AND org_id = ?
    `, [status, studentId, orgId]);

    return { success: true };
  }

  /**
   * 添加跟进记录
   */
  async addFollowRecord(orgId: number, data: {
    student_id: number;
    operator_id: number;
    follow_type: string;
    content: string;
    next_action?: string;
  }) {
    await executeQuery(`
      INSERT INTO student_follow_records (
        student_id, org_id, operator_id, follow_type, content, next_action
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.student_id, orgId, data.operator_id,
      data.follow_type, data.content, data.next_action || ''
    ]);

    // 更新学员最后联系时间
    await executeQuery(`
      UPDATE org_students SET last_contact_at = NOW() WHERE id = ?
    `, [data.student_id]);

    return { success: true };
  }

  /**
   * 获取跟进记录
   */
  async getFollowRecords(studentId: number) {
    const records = await executeQuery(`
      SELECT sfr.*, u.nickname as operator_name
      FROM student_follow_records sfr
      LEFT JOIN users u ON sfr.operator_id = u.id
      WHERE sfr.student_id = ?
      ORDER BY sfr.created_at DESC
      LIMIT 50
    `, [studentId]);

    return records;
  }

  /**
   * 获取待跟进学员列表
   */
  async getPendingFollowStudents(orgId: number) {
    const students = await executeQuery(`
      SELECT * FROM org_students 
      WHERE org_id = ? 
      AND (next_follow_at IS NULL OR next_follow_at <= NOW())
      AND status IN (1, 2)
      ORDER BY next_follow_at ASC
      LIMIT 20
    `, [orgId]);

    return students;
  }

  // ==================== 财务结算 ====================

  /**
   * 获取机构财务概览
   */
  async getFinancialOverview(orgId: number) {
    // 本月数据
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthStats = await executeQuery(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(platform_fee), 0) as platform_fee,
        COALESCE(SUM(org_income), 0) as org_income,
        COALESCE(SUM(teacher_income), 0) as teacher_income
      FROM org_settlements 
      WHERE org_id = ? AND period_start >= ?
    `, [orgId, monthStart]);

    // 累计数据
    const totalStats = await executeQuery(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(org_income), 0) as org_income,
        COALESCE(SUM(teacher_income), 0) as teacher_income
      FROM org_settlements 
      WHERE org_id = ?
    `, [orgId]);

    // 待结算金额
    const pendingSettlement = await executeQuery(`
      SELECT COALESCE(SUM(org_income), 0) as pending_amount
      FROM org_settlements 
      WHERE org_id = ? AND status = 0
    `, [orgId]);

    return {
      month: monthStats[0] || { order_count: 0, total_amount: 0, platform_fee: 0, org_income: 0, teacher_income: 0 },
      total: totalStats[0] || { total_amount: 0, org_income: 0, teacher_income: 0 },
      pending_settlement: (pendingSettlement[0] as any)?.pending_amount || 0,
    };
  }

  /**
   * 获取结算记录列表
   */
  async getSettlements(orgId: number, options: {
    status?: number;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT * FROM org_settlements WHERE org_id = ?
    `;
    const params: any[] = [orgId];

    if (options.status !== undefined) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY period_start DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const settlements = await executeQuery(sql, params);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM org_settlements WHERE org_id = ?
    `, [orgId]);

    return {
      list: settlements,
      total: (countResult[0] as any)?.total || 0,
      page,
      pageSize,
    };
  }

  // ==================== 机构数据分析 ====================

  /**
   * 获取机构数据分析
   */
  async getDataAnalysis(orgId: number, period: string = 'month') {
    // 根据时间范围计算日期
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // 订单趋势
    const orderTrend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(hourly_rate * COALESCE(completed_hours, 1)) as amount
      FROM orders o
      LEFT JOIN teacher_profiles tp ON o.matched_teacher_id = tp.user_id
      WHERE tp.user_id IN (SELECT user_id FROM user_orgs WHERE org_id = ?)
      AND o.created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [orgId, startDate]);

    // 教师绩效排行
    const teacherPerformance = await executeQuery(`
      SELECT 
        u.id, u.nickname, u.avatar,
        tp.real_name, tp.subjects,
        COUNT(DISTINCT o.id) as order_count,
        SUM(CASE WHEN o.status >= 3 THEN 1 ELSE 0 END) as success_count,
        AVG(r.rating) as avg_rating
      FROM user_orgs uo
      LEFT JOIN users u ON uo.user_id = u.id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN orders o ON u.id = o.matched_teacher_id AND o.created_at >= ?
      LEFT JOIN reviews r ON o.id = r.order_id
      WHERE uo.org_id = ? AND uo.status = 1
      GROUP BY u.id
      ORDER BY success_count DESC
      LIMIT 10
    `, [startDate, orgId]);

    // 学员增长趋势
    const studentTrend = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_count
      FROM org_students
      WHERE org_id = ? AND created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [orgId, startDate]);

    // 科目分布
    const subjectDistribution = await executeQuery(`
      SELECT 
        subject,
        COUNT(*) as count
      FROM orders o
      LEFT JOIN user_orgs uo ON o.matched_teacher_id = uo.user_id
      WHERE uo.org_id = ? AND o.created_at >= ?
      GROUP BY subject
      ORDER BY count DESC
    `, [orgId, startDate]);

    return {
      order_trend: orderTrend,
      teacher_performance: teacherPerformance,
      student_trend: studentTrend,
      subject_distribution: subjectDistribution,
    };
  }

  // ==================== 品牌展示管理 ====================

  /**
   * 获取机构品牌配置
   */
  async getBrandConfig(orgId: number) {
    const configs = await executeQuery(`
      SELECT * FROM org_brand_configs WHERE org_id = ?
    `, [orgId]);

    if (configs.length === 0) {
      return {
        banner_images: [],
        intro_video: null,
        featured_teachers: [],
        success_cases: [],
        honors: [],
        teaching_features: '',
        service_promise: '',
        faqs: [],
        is_priority: 0,
      };
    }

    const config = configs[0] as any;
    return {
      ...config,
      banner_images: config.banner_images ? JSON.parse(config.banner_images) : [],
      featured_teachers: config.featured_teachers ? JSON.parse(config.featured_teachers) : [],
      success_cases: config.success_cases ? JSON.parse(config.success_cases) : [],
      honors: config.honors ? JSON.parse(config.honors) : [],
      faqs: config.faqs ? JSON.parse(config.faqs) : [],
    };
  }

  /**
   * 更新机构品牌配置
   */
  async updateBrandConfig(orgId: number, data: {
    banner_images?: string[];
    intro_video?: string;
    featured_teachers?: number[];
    success_cases?: any[];
    honors?: string[];
    teaching_features?: string;
    service_promise?: string;
    faqs?: any[];
  }) {
    // 检查是否存在
    const existing = await executeQuery(`
      SELECT id FROM org_brand_configs WHERE org_id = ?
    `, [orgId]);

    if (existing.length === 0) {
      // 创建
      await executeQuery(`
        INSERT INTO org_brand_configs (
          org_id, banner_images, intro_video, featured_teachers,
          success_cases, honors, teaching_features, service_promise, faqs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orgId,
        data.banner_images ? JSON.stringify(data.banner_images) : null,
        data.intro_video || null,
        data.featured_teachers ? JSON.stringify(data.featured_teachers) : null,
        data.success_cases ? JSON.stringify(data.success_cases) : null,
        data.honors ? JSON.stringify(data.honors) : null,
        data.teaching_features || '',
        data.service_promise || '',
        data.faqs ? JSON.stringify(data.faqs) : null,
      ]);
    } else {
      // 更新
      const updates: string[] = [];
      const values: any[] = [];

      if (data.banner_images !== undefined) {
        updates.push('banner_images = ?');
        values.push(JSON.stringify(data.banner_images));
      }
      if (data.intro_video !== undefined) {
        updates.push('intro_video = ?');
        values.push(data.intro_video);
      }
      if (data.featured_teachers !== undefined) {
        updates.push('featured_teachers = ?');
        values.push(JSON.stringify(data.featured_teachers));
      }
      if (data.success_cases !== undefined) {
        updates.push('success_cases = ?');
        values.push(JSON.stringify(data.success_cases));
      }
      if (data.honors !== undefined) {
        updates.push('honors = ?');
        values.push(JSON.stringify(data.honors));
      }
      if (data.teaching_features !== undefined) {
        updates.push('teaching_features = ?');
        values.push(data.teaching_features);
      }
      if (data.service_promise !== undefined) {
        updates.push('service_promise = ?');
        values.push(data.service_promise);
      }
      if (data.faqs !== undefined) {
        updates.push('faqs = ?');
        values.push(JSON.stringify(data.faqs));
      }

      if (updates.length > 0) {
        await executeQuery(`
          UPDATE org_brand_configs SET ${updates.join(', ')} WHERE org_id = ?
        `, [...values, orgId]);
      }
    }

    return { success: true };
  }
}
