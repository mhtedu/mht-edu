"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let LessonService = class LessonService {
    async createLessonRecord(data) {
        const result = await executeQuery(`
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
        await this.updateOrderLessonStats(data.orderId, data.lessonHours);
        return {
            success: true,
            id: result.insertId,
        };
    }
    async getLessonRecords(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = [];
        const sqlParams = [];
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
        const records = await executeQuery(`
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
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM lesson_records lr ${whereClause}
    `, sqlParams);
        return {
            list: records,
            total: countResult[0]?.total || 0,
            page: params.page,
            pageSize: params.pageSize,
        };
    }
    async getLessonRecordDetail(id) {
        const records = await executeQuery(`
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
    async updateLessonRecord(id, userId, data) {
        const records = await executeQuery(`
      SELECT teacher_id, parent_id FROM lesson_records WHERE id = ?
    `, [id]);
        if (records.length === 0) {
            throw new Error('课时记录不存在');
        }
        const record = records[0];
        const isTeacher = record.teacher_id === userId;
        const isParent = record.parent_id === userId;
        if (!isTeacher && !isParent) {
            throw new Error('无权限操作');
        }
        const updates = [];
        const values = [];
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
        if (isParent && data.parentComment !== undefined) {
            updates.push('parent_comment = ?');
            values.push(data.parentComment);
        }
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE lesson_records SET ${updates.join(', ')} WHERE id = ?
      `, [...values, id]);
        }
        return { success: true };
    }
    async confirmLesson(id, parentId, comment) {
        const records = await executeQuery(`
      SELECT parent_id FROM lesson_records WHERE id = ?
    `, [id]);
        if (records.length === 0) {
            throw new Error('课时记录不存在');
        }
        if (records[0].parent_id !== parentId) {
            throw new Error('无权限操作');
        }
        await executeQuery(`
      UPDATE lesson_records 
      SET status = 1, parent_confirm_at = NOW(), parent_comment = ?
      WHERE id = ?
    `, [comment || '', id]);
        return { success: true };
    }
    async disputeLesson(id, parentId, comment) {
        const records = await executeQuery(`
      SELECT parent_id FROM lesson_records WHERE id = ?
    `, [id]);
        if (records.length === 0) {
            throw new Error('课时记录不存在');
        }
        if (records[0].parent_id !== parentId) {
            throw new Error('无权限操作');
        }
        await executeQuery(`
      UPDATE lesson_records 
      SET status = 2, parent_comment = ?
      WHERE id = ?
    `, [comment, id]);
        return { success: true };
    }
    async getLessonStats(teacherId, month) {
        const conditions = ['teacher_id = ?'];
        const params = [teacherId];
        if (month) {
            conditions.push('DATE_FORMAT(lesson_date, "%Y-%m") = ?');
            params.push(month);
        }
        const stats = await executeQuery(`
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
    async updateOrderLessonStats(orderId, addedHours) {
        await executeQuery(`
      UPDATE orders 
      SET completed_hours = COALESCE(completed_hours, 0) + ?
      WHERE id = ?
    `, [addedHours, orderId]);
    }
    async getTeacherSchedules(teacherId) {
        return executeQuery(`
      SELECT * FROM teacher_schedules WHERE teacher_id = ? ORDER BY day_of_week, start_time
    `, [teacherId]);
    }
    async setTeacherSchedule(teacherId, schedules) {
        await executeQuery(`DELETE FROM teacher_schedules WHERE teacher_id = ?`, [teacherId]);
        for (const schedule of schedules) {
            await executeQuery(`
        INSERT INTO teacher_schedules (teacher_id, day_of_week, start_time, end_time, is_available, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [teacherId, schedule.dayOfWeek, schedule.startTime, schedule.endTime, schedule.isAvailable ? 1 : 0, schedule.note || '']);
        }
        return { success: true };
    }
    async checkTeacherAvailability(teacherId, date, startTime, endTime) {
        const dayOfWeek = new Date(date).getDay();
        const schedules = await executeQuery(`
      SELECT * FROM teacher_schedules 
      WHERE teacher_id = ? AND day_of_week = ? AND is_available = 1
      AND start_time <= ? AND end_time >= ?
    `, [teacherId, dayOfWeek, startTime, endTime]);
        if (schedules.length === 0) {
            return { available: false, reason: '教师该时段未开放' };
        }
        const conflicts = await executeQuery(`
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
    async getTeacherMonthlyLessons(teacherId, year, month) {
        const lessons = await executeQuery(`
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
        const calendar = {};
        lessons.forEach((lesson) => {
            const date = lesson.lesson_date.toISOString().split('T')[0];
            if (!calendar[date]) {
                calendar[date] = [];
            }
            calendar[date].push(lesson);
        });
        return calendar;
    }
};
exports.LessonService = LessonService;
exports.LessonService = LessonService = __decorate([
    (0, common_1.Injectable)()
], LessonService);
//# sourceMappingURL=lesson.service.js.map