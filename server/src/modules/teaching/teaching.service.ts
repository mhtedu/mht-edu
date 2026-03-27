import { Injectable } from '@nestjs/common';
import { query } from '@/storage/database/mysql-client';

async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const [rows] = await query(sql, params);
  return rows as any[];
}

@Injectable()
export class TeachingService {
  // ==================== 试课反馈 ====================

  /**
   * 教师提交试课反馈
   */
  async submitTeacherFeedback(data: {
    orderId: number;
    teacherId: number;
    studentLevel: string;
    teachingSuggestion: string;
    expectedGoals: string;
  }) {
    // 检查是否已提交
    const existing = await executeQuery(`
      SELECT id FROM trial_feedbacks 
      WHERE order_id = ? AND teacher_id = ? AND feedback_type = 1
    `, [data.orderId, data.teacherId]);

    if (existing.length > 0) {
      // 更新
      await executeQuery(`
        UPDATE trial_feedbacks 
        SET student_level = ?, teaching_suggestion = ?, expected_goals = ?
        WHERE order_id = ? AND teacher_id = ? AND feedback_type = 1
      `, [data.studentLevel, data.teachingSuggestion, data.expectedGoals, data.orderId, data.teacherId]);
      return { success: true, updated: true };
    }

    // 获取家长ID
    const orders = await executeQuery(`
      SELECT parent_id FROM orders WHERE id = ?
    `, [data.orderId]);

    if (orders.length === 0) {
      throw new Error('订单不存在');
    }

    await executeQuery(`
      INSERT INTO trial_feedbacks (
        order_id, teacher_id, parent_id, feedback_type,
        student_level, teaching_suggestion, expected_goals
      ) VALUES (?, ?, ?, 1, ?, ?, ?)
    `, [data.orderId, data.teacherId, (orders[0] as any).parent_id, data.studentLevel, data.teachingSuggestion, data.expectedGoals]);

    return { success: true };
  }

  /**
   * 家长提交试课反馈
   */
  async submitParentFeedback(data: {
    orderId: number;
    parentId: number;
    teacherId: number;
    satisfaction: number;
    teacherAttitude: number;
    teachingQuality: number;
    willingness: number;
    comment?: string;
  }) {
    // 检查是否已提交
    const existing = await executeQuery(`
      SELECT id FROM trial_feedbacks 
      WHERE order_id = ? AND parent_id = ? AND feedback_type = 2
    `, [data.orderId, data.parentId]);

    if (existing.length > 0) {
      // 更新
      await executeQuery(`
        UPDATE trial_feedbacks 
        SET satisfaction = ?, teacher_attitude = ?, teaching_quality = ?, 
            willingness = ?, parent_comment = ?
        WHERE order_id = ? AND parent_id = ? AND feedback_type = 2
      `, [data.satisfaction, data.teacherAttitude, data.teachingQuality, data.willingness, data.comment || '', data.orderId, data.parentId]);
      return { success: true, updated: true };
    }

    await executeQuery(`
      INSERT INTO trial_feedbacks (
        order_id, teacher_id, parent_id, feedback_type,
        satisfaction, teacher_attitude, teaching_quality, willingness, parent_comment
      ) VALUES (?, ?, ?, 2, ?, ?, ?, ?, ?)
    `, [data.orderId, data.teacherId, data.parentId, data.satisfaction, data.teacherAttitude, data.teachingQuality, data.willingness, data.comment || '']);

    return { success: true };
  }

  /**
   * 获取试课反馈
   */
  async getTrialFeedback(orderId: number) {
    const feedbacks = await executeQuery(`
      SELECT * FROM trial_feedbacks WHERE order_id = ?
    `, [orderId]);

    const result: any = {
      teacherFeedback: null,
      parentFeedback: null,
    };

    feedbacks.forEach((f: any) => {
      if (f.feedback_type === 1) {
        result.teacherFeedback = f;
      } else if (f.feedback_type === 2) {
        result.parentFeedback = f;
      }
    });

    return result;
  }

  // ==================== 教学计划 ====================

  /**
   * 创建教学计划
   */
  async createTeachingPlan(data: {
    orderId: number;
    teacherId: number;
    subject: string;
    totalLessons?: number;
    startDate?: string;
    endDate?: string;
    teachingGoals?: string;
    teachingMethods?: string;
    materials?: string;
    notes?: string;
  }) {
    const result = await executeQuery(`
      INSERT INTO teaching_plans (
        order_id, teacher_id, subject, total_lessons,
        start_date, end_date, teaching_goals, teaching_methods, materials, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.orderId,
      data.teacherId,
      data.subject,
      data.totalLessons || 0,
      data.startDate || null,
      data.endDate || null,
      data.teachingGoals || '',
      data.teachingMethods || '',
      data.materials || '',
      data.notes || '',
    ]);

    return { success: true, id: (result as any).insertId };
  }

  /**
   * 获取教学计划
   */
  async getTeachingPlan(orderId: number) {
    const plans = await executeQuery(`
      SELECT tp.*, 
        o.subject as order_subject, o.student_grade,
        u.nickname as teacher_nickname
      FROM teaching_plans tp
      LEFT JOIN orders o ON tp.order_id = o.id
      LEFT JOIN users u ON tp.teacher_id = u.id
      WHERE tp.order_id = ?
    `, [orderId]);

    if (plans.length === 0) {
      return null;
    }

    return plans[0];
  }

  /**
   * 更新教学计划
   */
  async updateTeachingPlan(orderId: number, teacherId: number, data: Partial<{
    totalLessons: number;
    startDate: string;
    endDate: string;
    teachingGoals: string;
    teachingMethods: string;
    materials: string;
    notes: string;
    completedLessons: number;
  }>) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.totalLessons !== undefined) {
      updates.push('total_lessons = ?');
      values.push(data.totalLessons);
    }
    if (data.startDate !== undefined) {
      updates.push('start_date = ?');
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push('end_date = ?');
      values.push(data.endDate);
    }
    if (data.teachingGoals !== undefined) {
      updates.push('teaching_goals = ?');
      values.push(data.teachingGoals);
    }
    if (data.teachingMethods !== undefined) {
      updates.push('teaching_methods = ?');
      values.push(data.teachingMethods);
    }
    if (data.materials !== undefined) {
      updates.push('materials = ?');
      values.push(data.materials);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.completedLessons !== undefined) {
      updates.push('completed_lessons = ?');
      values.push(data.completedLessons);
    }

    if (updates.length > 0) {
      await executeQuery(`
        UPDATE teaching_plans SET ${updates.join(', ')}
        WHERE order_id = ? AND teacher_id = ?
      `, [...values, orderId, teacherId]);
    }

    return { success: true };
  }

  /**
   * 更新教学进度
   */
  async updateProgress(orderId: number, teacherId: number, completedLessons: number) {
    await executeQuery(`
      UPDATE teaching_plans 
      SET completed_lessons = ?
      WHERE order_id = ? AND teacher_id = ?
    `, [completedLessons, orderId, teacherId]);

    return { success: true };
  }

  /**
   * 获取教师的所有教学计划
   */
  async getTeacherPlans(teacherId: number, status?: string) {
    const conditions = ['tp.teacher_id = ?'];
    const params: any[] = [teacherId];

    if (status === 'ongoing') {
      conditions.push('(tp.end_date IS NULL OR tp.end_date >= CURDATE())');
    } else if (status === 'completed') {
      conditions.push('tp.completed_lessons >= tp.total_lessons');
    }

    return executeQuery(`
      SELECT tp.*,
        o.order_no, o.student_grade,
        u.nickname as parent_nickname, u.avatar as parent_avatar,
        ROUND(tp.completed_lessons / NULLIF(tp.total_lessons, 0) * 100, 1) as progress_percent
      FROM teaching_plans tp
      LEFT JOIN orders o ON tp.order_id = o.id
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY tp.created_at DESC
    `, params);
  }
}
