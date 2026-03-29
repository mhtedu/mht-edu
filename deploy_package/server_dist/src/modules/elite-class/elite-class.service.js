"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EliteClassService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let EliteClassService = class EliteClassService {
    async checkSuperMember(userId) {
        const superMembers = await executeQuery(`
      SELECT * FROM super_memberships 
      WHERE user_id = ? AND status = 1 AND expire_at > NOW()
    `, [userId]);
        if (superMembers.length > 0) {
            return { isSuper: true };
        }
        const inviteStats = await executeQuery(`
      SELECT COUNT(*) as total_count
      FROM users u
      WHERE u.inviter_id = ? AND u.status = 1
    `, [userId]);
        const totalCount = inviteStats[0]?.total_count || 0;
        if (totalCount >= 10) {
            await this.grantSuperMember(userId, 2);
            return { isSuper: true };
        }
        return {
            isSuper: false,
            reason: `已邀请${totalCount}人，还需邀请${10 - totalCount}人即可免费开通`
        };
    }
    async grantSuperMember(userId, type, days = 365) {
        await executeQuery(`
      INSERT INTO super_memberships (user_id, type, start_at, expire_at, status)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 1)
      ON DUPLICATE KEY UPDATE 
        type = VALUES(type),
        expire_at = DATE_ADD(GREATEST(expire_at, NOW()), INTERVAL ? DAY),
        status = 1
    `, [userId, type, days, days]);
        await executeQuery(`
      UPDATE users SET is_super_member = 1, super_member_expire_at = DATE_ADD(NOW(), INTERVAL ? DAY)
      WHERE id = ?
    `, [days, userId]);
    }
    async createClass(userId, data) {
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
            id: result.insertId
        };
    }
    async getClassList(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['ec.status IN (0, 1)'];
        const sqlParams = [];
        if (params.subject && params.subject !== '全部') {
            conditions.push('ec.subject = ?');
            sqlParams.push(params.subject);
        }
        if (params.keyword) {
            conditions.push('(ec.class_name LIKE ? OR ec.description LIKE ?)');
            sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
        }
        if (params.city && params.city !== '定位中...') {
            conditions.push('ec.address LIKE ?');
            sqlParams.push(`%${params.city}%`);
        }
        const whereClause = conditions.join(' AND ');
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
        const formattedClasses = classes.map((c) => ({
            ...c,
            distance_text: c.distance ? (c.distance < 1 ? `${Math.round(c.distance * 1000)}m` : `${c.distance.toFixed(1)}km`) : '',
            remaining_seats: c.max_students - c.current_students,
        }));
        return formattedClasses;
    }
    async getClassDetail(classId, userId) {
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
        const classInfo = classes[0];
        if (userId) {
            const enrollments = await executeQuery(`
        SELECT * FROM elite_class_enrollments 
        WHERE class_id = ? AND student_id = ?
      `, [classId, userId]);
            classInfo.is_enrolled = enrollments.length > 0;
            classInfo.enrollment_status = enrollments.length > 0 ? enrollments[0].status : null;
        }
        return classInfo;
    }
    async enrollClass(userId, classId, referrerId) {
        const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND status IN (0, 1)
    `, [classId]);
        if (classes.length === 0) {
            throw new Error('牛师班不存在或已停止招生');
        }
        const classInfo = classes[0];
        if (classInfo.current_students >= classInfo.max_students) {
            throw new Error('班级已满员');
        }
        const existing = await executeQuery(`
      SELECT * FROM elite_class_enrollments WHERE class_id = ? AND student_id = ?
    `, [classId, userId]);
        if (existing.length > 0) {
            throw new Error('您已报名该班级');
        }
        if (referrerId && referrerId !== userId) {
            await this.lockShareRelation(userId, referrerId, 'elite_class', classId);
        }
        await executeQuery(`
      INSERT INTO elite_class_enrollments (class_id, student_id, status, trial_lesson, referrer_id)
      VALUES (?, ?, 0, 1, ?)
    `, [classId, userId, referrerId]);
        await executeQuery(`
      UPDATE elite_classes SET current_students = current_students + 1 WHERE id = ?
    `, [classId]);
        return { success: true, message: '报名成功，等待教师确认' };
    }
    async lockShareRelation(userId, lockerId, lockType, sourceId) {
        const existing = await executeQuery(`
      SELECT * FROM referral_locks WHERE user_id = ?
    `, [userId]);
        if (existing.length > 0) {
            console.log(`用户 ${userId} 已被锁定，跳过`);
            return;
        }
        await executeQuery(`
      INSERT INTO referral_locks (user_id, locker_id, lock_type, lock_source_id)
      VALUES (?, ?, ?, ?)
    `, [userId, lockerId, lockType, sourceId]);
        await executeQuery(`
      UPDATE users 
      SET inviter_id = ?, 
          inviter_2nd_id = (SELECT inviter_id FROM users WHERE id = ?),
          updated_at = NOW()
      WHERE id = ? AND inviter_id IS NULL
    `, [lockerId, lockerId, userId]);
        await executeQuery(`
      INSERT INTO referral_lock_logs (user_id, locker_id, lock_type, lock_source_id)
      VALUES (?, ?, ?, ?)
    `, [userId, lockerId, lockType, sourceId]);
        console.log(`分销关系锁定成功: 用户 ${userId} -> 推荐人 ${lockerId}`);
    }
    async confirmEnrollment(teacherId, enrollmentId) {
        const enrollments = await executeQuery(`
      SELECT e.*, ec.teacher_id FROM elite_class_enrollments e
      LEFT JOIN elite_classes ec ON e.class_id = ec.id
      WHERE e.id = ?
    `, [enrollmentId]);
        if (enrollments.length === 0) {
            throw new Error('报名记录不存在');
        }
        const enrollment = enrollments[0];
        if (enrollment.teacher_id !== teacherId) {
            throw new Error('无权操作');
        }
        await executeQuery(`
      UPDATE elite_class_enrollments SET status = 1, updated_at = NOW()
      WHERE id = ?
    `, [enrollmentId]);
        return { success: true };
    }
    async updateLessonProgress(teacherId, classId, lessonNo) {
        const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);
        if (classes.length === 0) {
            throw new Error('无权操作');
        }
        const classInfo = classes[0];
        const hourlyRate = classInfo.hourly_rate;
        const platformRate = 0.05;
        const referrerRate = 0.10;
        const teacherRate = 0.85;
        const platformIncome = hourlyRate * platformRate;
        const referrerIncome = hourlyRate * referrerRate;
        const teacherIncome = hourlyRate * teacherRate;
        await executeQuery(`
      UPDATE elite_classes SET current_lesson = ? WHERE id = ?
    `, [lessonNo, classId]);
        await executeQuery(`
      INSERT INTO elite_class_lessons (class_id, lesson_no, lesson_time, status, teacher_income, platform_income, referrer_income)
      VALUES (?, ?, NOW(), 2, ?, ?, ?)
    `, [classId, lessonNo, teacherIncome, platformIncome, referrerIncome]);
        const enrollments = await executeQuery(`
      SELECT DISTINCT referrer_id FROM elite_class_enrollments 
      WHERE class_id = ? AND referrer_id IS NOT NULL
    `, [classId]);
        for (const e of enrollments) {
            const referrerId = e.referrer_id;
            await executeQuery(`
        INSERT INTO commissions (user_id, amount, type, from_user_id, status)
        VALUES (?, ?, 'elite_class_share', ?, 1)
      `, [referrerId, referrerIncome / (enrollments.length || 1), teacherId]);
        }
        return { success: true };
    }
    async getTeacherClasses(userId, status) {
        const conditions = ['ec.teacher_id = ?'];
        const params = [userId];
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
    async getEnrolledStudents(teacherId, classId) {
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
    async closeClass(teacherId, classId, reason) {
        const classes = await executeQuery(`
      SELECT * FROM elite_classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);
        if (classes.length === 0) {
            throw new Error('无权操作');
        }
        const classInfo = classes[0];
        const status = classInfo.current_lesson >= classInfo.total_lessons ? 2 : 3;
        await executeQuery(`
      UPDATE elite_classes SET status = ? WHERE id = ?
    `, [status, classId]);
        return { success: true, status };
    }
};
exports.EliteClassService = EliteClassService;
exports.EliteClassService = EliteClassService = __decorate([
    (0, common_1.Injectable)()
], EliteClassService);
//# sourceMappingURL=elite-class.service.js.map