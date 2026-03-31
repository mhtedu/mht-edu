"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let OrgService = class OrgService {
    async getTeachers(orgId, options = {}) {
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
        const params = [orgId];
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
    async approveTeacher(orgId, teacherId) {
        await executeQuery(`
      UPDATE user_orgs SET status = 1, join_time = NOW()
      WHERE org_id = ? AND user_id = ?
    `, [orgId, teacherId]);
        return { success: true };
    }
    async rejectTeacher(orgId, teacherId) {
        await executeQuery(`
      UPDATE user_orgs SET status = 2
      WHERE org_id = ? AND user_id = ?
    `, [orgId, teacherId]);
        return { success: true };
    }
    async updateTeacherStatus(orgId, teacherId, status) {
        await executeQuery(`
      UPDATE user_orgs SET status = ?
      WHERE org_id = ? AND user_id = ?
    `, [status, orgId, teacherId]);
        return { success: true };
    }
    async getCourses(orgId, options = {}) {
        let sql = `
      SELECT c.*,
        u.nickname as teacher_name, u.avatar as teacher_avatar
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.org_id = ?
    `;
        const params = [orgId];
        if (options.keyword) {
            sql += ` AND (c.title LIKE ? OR u.nickname LIKE ?)`;
            params.push(`%${options.keyword}%`, `%${options.keyword}%`);
        }
        sql += ` ORDER BY c.created_at DESC`;
        const courses = await executeQuery(sql, params);
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
    async saveCourse(orgId, data) {
        if (data.id) {
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
        }
        else {
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
    async updateCourseStatus(orgId, courseId, status) {
        await executeQuery(`
      UPDATE courses SET status = ?
      WHERE id = ? AND org_id = ?
    `, [status, courseId, orgId]);
        return { success: true };
    }
    async getOrgInfo(orgId) {
        const orgs = await executeQuery(`
      SELECT * FROM organizations WHERE id = ?
    `, [orgId]);
        return orgs[0] || null;
    }
    async updateOrgInfo(orgId, data) {
        const updates = [];
        const values = [];
        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.logo !== undefined) {
            updates.push('logo = ?');
            values.push(data.logo);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description);
        }
        if (data.address !== undefined) {
            updates.push('address = ?');
            values.push(data.address);
        }
        if (data.contact_phone !== undefined) {
            updates.push('contact_phone = ?');
            values.push(data.contact_phone);
        }
        if (data.contact_email !== undefined) {
            updates.push('contact_email = ?');
            values.push(data.contact_email);
        }
        if (data.business_hours !== undefined) {
            updates.push('business_hours = ?');
            values.push(data.business_hours);
        }
        if (data.subjects !== undefined) {
            updates.push('subjects = ?');
            values.push(JSON.stringify(data.subjects));
        }
        if (data.city !== undefined) {
            updates.push('city = ?');
            values.push(data.city);
        }
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE organizations SET ${updates.join(', ')} WHERE id = ?
      `, [...values, orgId]);
        }
        return { success: true };
    }
    async getInviteInfo(orgId) {
        const orgs = await executeQuery(`
      SELECT id, invite_code FROM organizations WHERE id = ?
    `, [orgId]);
        if (orgs.length === 0) {
            throw new Error('机构不存在');
        }
        const org = orgs[0];
        return {
            inviteLink: `https://edu.example.com/invite/${org.invite_code}`,
            inviteCode: org.invite_code,
        };
    }
    async sendInviteSms(orgId, phone) {
        await executeQuery(`
      INSERT INTO org_invites (org_id, phone, type, status)
      VALUES (?, ?, 'sms', 0)
    `, [orgId, phone]);
        return { success: true };
    }
    async getInviteHistory(orgId) {
        const history = await executeQuery(`
      SELECT * FROM org_invites 
      WHERE org_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [orgId]);
        return history;
    }
};
exports.OrgService = OrgService;
exports.OrgService = OrgService = __decorate([
    (0, common_1.Injectable)()
], OrgService);
//# sourceMappingURL=org.service.js.map