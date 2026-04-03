import { Injectable } from '@nestjs/common';
import * as db from '@/storage/database/mysql-client';


@Injectable()
export class LessonService {
  // ==================== 课时记录管理 ====================

  /**
   * 创建课时记录
   */
  async createLessonRecord(data: {
    orderId: number;
    teacherId: number;
    parentId: number;
    lessonDate: string;
    lessonStartTime: string;
    lessonEndTime: string;
    lessonHours: number;
    lessonContent?: string;
    homework?: string;
    studentPerformance?: string;
    nextLessonPlan?: string;
  }) {
    const [result] = await db.query(`
      INSERT INTO lesson_records (
        order_id, teacher_id, parent_id, lesson_date,
        lesson_start_time, lesson_end_time, lesson_hours,
        lesson_content, homework, student_performance, next_lesson_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.orderId,
      data.teacherId,
      data.parentId,
      data.lessonDate,
      data.lessonStartTime,
      data.lessonEndTime,
      data.lessonHours,
      data.lessonContent || '',
      data.homework || '',
      data.studentPerformance || '',
      data.nextLessonPlan || '',
    ]);

    // 更新订单课时统计
    await this.updateOrderLessonStats(data.orderId, data.lessonHours);

    return {
      success: true,
      id: (result as any).insertId,
    };
  }

  /**
   * 获取课时记录列表
   */
  async getLessonRecords(params: {
    orderId?: number;
    teacherId?: number;
    parentId?: number;
    startDate?: string;
    endDate?: string;
    status?: number;
    page: number;
    pageSize: number;
  }) {
    const offset = (params.page - 1) * params.pageSize;
    const conditions: string[] = [];
    const sqlParams: any[] = [];

    if (params.orderId) {
      conditions.push('lr.order_id = ?');
      sqlParams.push(params.orderId);
    }
    if (params.teacherId) {
      conditions.push('lr.teacher_id = ?');
      sqlParams.push(params.teacherId);
    }
    if (params.parentId) {
      conditions.push('lr.parent_id = ?');
      sqlParams.push(params.parentId);
    }
    if (params.startDate) {
      conditions.push('lr.lesson_date >= ?');
      sqlParams.push(params.startDate);
    }
    if (params.endDate) {
      conditions.push('lr.lesson_date <= ?');
      sqlParams.push(params.endDate);
    }
    if (params.status !== undefined) {
      conditions.push('lr.status = ?');
      sqlParams.push(params.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [records] = await db.query(`
      SELECT lr.*,
        o.order_no, o.subject,
        u.nickname as parent_nickname, u.avatar as parent_avatar,
        t.nickname as teacher_nickname, t.avatar as teacher_avatar,
        tp.real_name as teacher_name
      FROM lesson_records lr
      LEFT JOIN orders o ON lr.order_id = o.id
      LEFT JOIN users u ON lr.parent_id = u.id
      LEFT JOIN users t ON lr.teacher_id = t.id
      LEFT JOIN teacher_profiles tp ON lr.teacher_id = tp.user_id
      ${whereClause}
      ORDER BY lr.lesson_date DESC, lr.lesson_start_time DESC
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM lesson_records lr ${whereClause}
    `, sqlParams);

    return {
      list: records,
      total: countResult[0]?.total || 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * 获取课时记录详情
   */
  async getLessonRecordDetail(id: number) {
    const [records] = await db.query(`
      SELECT lr.*,
        o.order_no, o.subject, o.student_grade,
        u.nickname as parent_nickname, u.avatar as parent_avatar, u.mobile as parent_mobile,
        t.nickname as teacher_nickname, t.avatar as teacher_avatar,
        tp.real_name as teacher_name, tp.subjects as teacher_subjects
      FROM lesson_records lr
      LEFT JOIN orders o ON lr.order_id = o.id
      LEFT JOIN users u ON lr.parent_id = u.id
      LEFT JOIN users t ON lr.teacher_id = t.id
      LEFT JOIN teacher_profiles tp ON lr.teacher_id = tp.user_id
      WHERE lr.id = ?
    `, [id]);

    if (records.length === 0) {
      throw new Error('课时记录不存在');
    }

    return records[0];
  }

  /**
   * 更新课时记录
   */
  async updateLessonRecord(id: number, userId: number, data: Partial<{
    lessonContent: string;
    homework: string;
    studentPerformance: string;
    nextLessonPlan: string;
    parentComment: string;
  }>) {
    // 验证权限
    const [records] = await db.query(`
      SELECT teacher_id, parent_id FROM lesson_records WHERE id = ?
    `, [id]);

    if (records.length === 0) {
      throw new Error('课时记录不存在');
    }

    const record = records[0] as any;
    const isTeacher = record.teacher_id === userId;
    const isParent = record.parent_id === userId;

    if (!isTeacher && !isParent) {
      throw new Error('无权限操作');
    }

    const updates: string[] = [];
    const values: any[] = [];

    // 只有教师可以编辑教学相关字段
    if (isTeacher) {
      if (data.lessonContent !== undefined) {
        updates.push('lesson_content = ?');
        values.push(data.lessonContent);
      }
      if (data.homework !== undefined) {
        updates.push('homework = ?');
        values.push(data.homework);
      }
      if (data.studentPerformance !== undefined) {
        updates.push('student_performance = ?');
        values.push(data.studentPerformance);
      }
      if (data.nextLessonPlan !== undefined) {
        updates.push('next_lesson_plan = ?');
        values.push(data.nextLessonPlan);
      }
    }

    // 家长可以添加备注
    if (isParent && data.parentComment !== undefined) {
      updates.push('parent_comment = ?');
      values.push(data.parentComment);
    }

    if (updates.length > 0) {
      await db.query(`
        UPDATE lesson_records SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
    }

    return { success: true };
  }

  /**
   * 家长确认课时
   */
  async confirmLesson(id: number, parentId: number, comment?: string) {
    const [records] = await db.query(`
      SELECT parent_id FROM lesson_records WHERE id = ?
    `, [id]);

    if (records.length === 0) {
      throw new Error('课时记录不存在');
    }

    if ((records[0] as any).parent_id !== parentId) {
      throw new Error('无权限操作');
    }

    await db.query(`
      UPDATE lesson_records 
      SET status = 1, parent_confirm_at = NOW(), parent_comment = ?
      WHERE id = ?
    `, [comment || '', id]);

    return { success: true };
  }

  /**
   * 家长提出异议
   */
  async disputeLesson(id: number, parentId: number, comment: string) {
    const [records] = await db.query(`
      SELECT parent_id FROM lesson_records WHERE id = ?
    `, [id]);

    if (records.length === 0) {
      throw new Error('课时记录不存在');
    }

    if ((records[0] as any).parent_id !== parentId) {
      throw new Error('无权限操作');
    }

    await db.query(`
      UPDATE lesson_records 
      SET status = 2, parent_comment = ?
      WHERE id = ?
    `, [comment, id]);

    return { success: true };
  }

  /**
   * 获取课时统计
   */
  async getLessonStats(teacherId: number, month?: string) {
    const conditions = ['teacher_id = ?'];
    const params: any[] = [teacherId];

    if (month) {
      conditions.push('DATE_FORMAT(lesson_date, "%Y-%m") = ?');
      params.push(month);
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_lessons,
        SUM(lesson_hours) as total_hours,
        COUNT(DISTINCT order_id) as total_orders,
        COUNT(DISTINCT parent_id) as total_parents,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as disputed_count
      FROM lesson_records
      WHERE ${conditions.join(' AND ')}
    `, params);

    return stats[0];
  }

  /**
   * 更新订单课时统计
   */
  private async updateOrderLessonStats(orderId: number, addedHours: number) {
    await db.query(`
      UPDATE orders 
      SET completed_hours = COALESCE(completed_hours, 0) + ?
      WHERE id = ?
    `, [addedHours, orderId]);
  }

  // ==================== 教师排课日历 ====================

  /**
   * 获取教师排课设置
   */
  async getTeacherSchedules(teacherId: number) {
    const [schedules] = await db.query(`
      SELECT * FROM teacher_schedules WHERE teacher_id = ? ORDER BY day_of_week, start_time
    `, [teacherId]) as [any[], any];
    return schedules;
  }

  /**
   * 设置教师排课时间
   */
  async setTeacherSchedule(teacherId: number, schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    note?: string;
  }>) {
    // 先删除原有设置
    await db.query(`DELETE FROM teacher_schedules WHERE teacher_id = ?`, [teacherId]);

    // 批量插入新设置
    for (const schedule of schedules) {
      await db.query(`
        INSERT INTO teacher_schedules (teacher_id, day_of_week, start_time, end_time, is_available, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [teacherId, schedule.dayOfWeek, schedule.startTime, schedule.endTime, schedule.isAvailable ? 1 : 0, schedule.note || '']);
    }

    return { success: true };
  }

  /**
   * 检查教师某天是否有空
   */
  async checkTeacherAvailability(teacherId: number, date: string, startTime: string, endTime: string) {
    const dayOfWeek = new Date(date).getDay();

    // 检查排课设置
    const [schedules] = await db.query(`
      SELECT * FROM teacher_schedules 
      WHERE teacher_id = ? AND day_of_week = ? AND is_available = 1
      AND start_time <= ? AND end_time >= ?
    `, [teacherId, dayOfWeek, startTime, endTime]);

    if (schedules.length === 0) {
      return { available: false, reason: '教师该时段未开放' };
    }

    // 检查是否有冲突的课程
    const [conflicts] = await db.query(`
      SELECT * FROM lesson_records 
      WHERE teacher_id = ? AND lesson_date = ?
      AND ((lesson_start_time < ? AND lesson_end_time > ?) 
        OR (lesson_start_time < ? AND lesson_end_time > ?))
    `, [teacherId, date, endTime, startTime, startTime, endTime]);

    if (conflicts.length > 0) {
      return { available: false, reason: '教师该时段已有课程' };
    }

    return { available: true };
  }

  /**
   * 获取教师某月的课程日历
   */
  async getTeacherMonthlyLessons(teacherId: number, year: number, month: number) {
    const [lessons] = await db.query(`
      SELECT lr.*, o.subject, o.student_grade,
        u.nickname as parent_nickname
      FROM lesson_records lr
      LEFT JOIN orders o ON lr.order_id = o.id
      LEFT JOIN users u ON lr.parent_id = u.id
      WHERE lr.teacher_id = ? 
        AND YEAR(lr.lesson_date) = ? 
        AND MONTH(lr.lesson_date) = ?
      ORDER BY lr.lesson_date, lr.lesson_start_time
    `, [teacherId, year, month]);

    // 按日期分组
    const calendar: Record<string, any[]> = {};
    lessons.forEach((lesson: any) => {
      const date = lesson.lesson_date.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(lesson);
    });

    return calendar;
  }
}
