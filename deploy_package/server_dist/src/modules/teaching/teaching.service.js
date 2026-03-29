"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachingService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let TeachingService = class TeachingService {
    async submitTeacherFeedback(data) {
        const existing = await executeQuery(`
      SELECT id FROM trial_feedbacks 
      WHERE order_id = ? AND teacher_id = ? AND feedback_type = 1
    `, [data.orderId, data.teacherId]);
        if (existing.length > 0) {
            await executeQuery(`
        UPDATE trial_feedbacks 
        SET student_level = ?, teaching_suggestion = ?, expected_goals = ?
        WHERE order_id = ? AND teacher_id = ? AND feedback_type = 1
      `, [data.studentLevel, data.teachingSuggestion, data.expectedGoals, data.orderId, data.teacherId]);
            return { success: true, updated: true };
        }
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
    `, [data.orderId, data.teacherId, orders[0].parent_id, data.studentLevel, data.teachingSuggestion, data.expectedGoals]);
        return { success: true };
    }
    async submitParentFeedback(data) {
        const existing = await executeQuery(`
      SELECT id FROM trial_feedbacks 
      WHERE order_id = ? AND parent_id = ? AND feedback_type = 2
    `, [data.orderId, data.parentId]);
        if (existing.length > 0) {
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
    async getTrialFeedback(orderId) {
        const feedbacks = await executeQuery(`
      SELECT * FROM trial_feedbacks WHERE order_id = ?
    `, [orderId]);
        const result = {
            teacherFeedback: null,
            parentFeedback: null,
        };
        feedbacks.forEach((f) => {
            if (f.feedback_type === 1) {
                result.teacherFeedback = f;
            }
            else if (f.feedback_type === 2) {
                result.parentFeedback = f;
            }
        });
        return result;
    }
    async createTeachingPlan(data) {
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
        return { success: true, id: result.insertId };
    }
    async getTeachingPlan(orderId) {
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
    async updateTeachingPlan(orderId, teacherId, data) {
        const updates = [];
        const values = [];
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
    async updateProgress(orderId, teacherId, completedLessons) {
        await executeQuery(`
      UPDATE teaching_plans 
      SET completed_lessons = ?
      WHERE order_id = ? AND teacher_id = ?
    `, [completedLessons, orderId, teacherId]);
        return { success: true };
    }
    async getTeacherPlans(teacherId, status) {
        const conditions = ['tp.teacher_id = ?'];
        const params = [teacherId];
        if (status === 'ongoing') {
            conditions.push('(tp.end_date IS NULL OR tp.end_date >= CURDATE())');
        }
        else if (status === 'completed') {
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
};
exports.TeachingService = TeachingService;
exports.TeachingService = TeachingService = __decorate([
    (0, common_1.Injectable)()
], TeachingService);
//# sourceMappingURL=teaching.service.js.map