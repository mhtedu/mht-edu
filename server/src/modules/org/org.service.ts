import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class OrgService {
  // ==================== 教师管理 ====================

  /**
   * 获取机构教师列表
   */
  async getTeachers(orgId: number, options: {
    keyword?: string;
    status?: number;
  } = {}) {
    let sql = `
      SELECT u.id, u.nickname, u.avatar, u.mobile,
        tp.real_name, tp.gender, tp.education, tp.subjects,
        tp.hourly_rate_min, tp.hourly_rate_max, tp.rating,
        uo.status as org_status, uo.join_time,
        (SELECT COUNT(*) FROM orders WHERE matched_teacher_id = u.id AND status >= 3) as order_count
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN user_orgs uo ON u.id = uo.user_id
      WHERE uo.org_id = ?
    `;
    const params: any[] = [orgId];

    if (options.status !== undefined) {
      sql += ` AND uo.status = ?`;
      params.push(options.status);
    }

    if (options.keyword) {
      sql += ` AND (tp.real_name LIKE ? OR u.mobile LIKE ?)`;
      params.push(`%${options.keyword}%`, `%${options.keyword}%`);
    }

    sql += ` ORDER BY uo.join_time DESC`;

    const teachers = await executeQuery(sql, params);

    // 获取统计数据
    const statsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as disabled
      FROM user_orgs WHERE org_id = ?
    `, [orgId]);

    return {
      list: teachers,
      stats: statsResult[0] || { total: 0, active: 0, pending: 0, disabled: 0 },
    };
  }

  /**
   * 审核教师入驻申请
   */
  async approveTeacher(orgId: number, teacherId: number) {
    await executeQuery(`
      UPDATE user_orgs SET status = 1, join_time = NOW()
      WHERE org_id = ? AND user_id = ?
    `, [orgId, teacherId]);

    return { success: true };
  }

  /**
   * 拒绝教师入驻申请
   */
  async rejectTeacher(orgId: number, teacherId: number) {
    await executeQuery(`
      UPDATE user_orgs SET status = 2
      WHERE org_id = ? AND user_id = ?
    `, [orgId, teacherId]);

    return { success: true };
  }

  /**
   * 更新教师状态
   */
  async updateTeacherStatus(orgId: number, teacherId: number, status: number) {
    await executeQuery(`
      UPDATE user_orgs SET status = ?
      WHERE org_id = ? AND user_id = ?
    `, [status, orgId, teacherId]);

    return { success: true };
  }

  // ==================== 课程管理 ====================

  /**
   * 获取机构课程列表
   */
  async getCourses(orgId: number, options: { keyword?: string } = {}) {
    let sql = `
      SELECT c.*,
        u.nickname as teacher_name, u.avatar as teacher_avatar
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.org_id = ?
    `;
    const params: any[] = [orgId];

    if (options.keyword) {
      sql += ` AND (c.title LIKE ? OR u.nickname LIKE ?)`;
      params.push(`%${options.keyword}%`, `%${options.keyword}%`);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const courses = await executeQuery(sql, params);

    // 获取统计数据
    const statsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
        (SELECT COUNT(*) FROM course_students cs 
         JOIN courses c ON cs.course_id = c.id 
         WHERE c.org_id = ?) as students,
        (SELECT COALESCE(SUM(amount), 0) FROM payments 
         WHERE org_id = ? AND status = 1 
         AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')) as revenue
      FROM courses WHERE org_id = ?
    `, [orgId, orgId, orgId]);

    return {
      list: courses,
      stats: statsResult[0] || { total: 0, active: 0, students: 0, revenue: 0 },
    };
  }

  /**
   * 创建/更新课程
   */
  async saveCourse(orgId: number, data: {
    id?: number;
    title: string;
    subject: string;
    teacher_id: number;
    total_hours: number;
    price_per_hour: number;
    schedule: string;
    address: string;
    description: string;
  }) {
    if (data.id) {
      // 更新
      await executeQuery(`
        UPDATE courses SET 
          title = ?, subject = ?, teacher_id = ?, total_hours = ?,
          price_per_hour = ?, schedule = ?, address = ?, description = ?
        WHERE id = ? AND org_id = ?
      `, [
        data.title, data.subject, data.teacher_id, data.total_hours,
        data.price_per_hour, data.schedule, data.address, data.description,
        data.id, orgId,
      ]);
    } else {
      // 创建
      await executeQuery(`
        INSERT INTO courses (
          org_id, title, subject, teacher_id, total_hours,
          price_per_hour, schedule, address, description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        orgId, data.title, data.subject, data.teacher_id, data.total_hours,
        data.price_per_hour, data.schedule, data.address, data.description,
      ]);
    }

    return { success: true };
  }

  /**
   * 更新课程状态
   */
  async updateCourseStatus(orgId: number, courseId: number, status: number) {
    await executeQuery(`
      UPDATE courses SET status = ?
      WHERE id = ? AND org_id = ?
    `, [status, courseId, orgId]);

    return { success: true };
  }

  // ==================== 机构设置 ====================

  /**
   * 获取机构信息
   */
  async getOrgInfo(orgId: number) {
    const orgs = await executeQuery(`
      SELECT * FROM organizations WHERE id = ?
    `, [orgId]);

    return orgs[0] || null;
  }

  /**
   * 更新机构信息
   */
  async updateOrgInfo(orgId: number, data: Partial<{
    name: string;
    logo: string;
    description: string;
    address: string;
    contact_phone: string;
    contact_email: string;
    business_hours: string;
    subjects: string[];
    city: string;
  }>) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.logo !== undefined) { updates.push('logo = ?'); values.push(data.logo); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.address !== undefined) { updates.push('address = ?'); values.push(data.address); }
    if (data.contact_phone !== undefined) { updates.push('contact_phone = ?'); values.push(data.contact_phone); }
    if (data.contact_email !== undefined) { updates.push('contact_email = ?'); values.push(data.contact_email); }
    if (data.business_hours !== undefined) { updates.push('business_hours = ?'); values.push(data.business_hours); }
    if (data.subjects !== undefined) { updates.push('subjects = ?'); values.push(JSON.stringify(data.subjects)); }
    if (data.city !== undefined) { updates.push('city = ?'); values.push(data.city); }

    if (updates.length > 0) {
      await executeQuery(`
        UPDATE organizations SET ${updates.join(', ')} WHERE id = ?
      `, [...values, orgId]);
    }

    return { success: true };
  }

  // ==================== 邀请功能 ====================

  /**
   * 生成邀请链接和邀请码
   */
  async getInviteInfo(orgId: number) {
    const orgs = await executeQuery(`
      SELECT id, invite_code FROM organizations WHERE id = ?
    `, [orgId]);

    if (orgs.length === 0) {
      throw new Error('机构不存在');
    }

    const org = orgs[0] as any;

    return {
      inviteLink: `https://edu.example.com/invite/${org.invite_code}`,
      inviteCode: org.invite_code,
    };
  }

  /**
   * 发送邀请短信
   */
  async sendInviteSms(orgId: number, phone: string) {
    // TODO: 调用短信服务发送邀请
    // 记录邀请记录
    await executeQuery(`
      INSERT INTO org_invites (org_id, phone, type, status)
      VALUES (?, ?, 'sms', 0)
    `, [orgId, phone]);

    return { success: true };
  }

  /**
   * 获取邀请记录
   */
  async getInviteHistory(orgId: number) {
    const history = await executeQuery(`
      SELECT * FROM org_invites 
      WHERE org_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [orgId]);

    return history;
  }
}
