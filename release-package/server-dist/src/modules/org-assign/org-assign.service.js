"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgAssignService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let OrgAssignService = class OrgAssignService {
    async getOrgTeachers(orgId, status) {
        const conditions = ['ot.org_id = ?'];
        const params = [orgId];
        if (status !== undefined) {
            conditions.push('ot.status = ?');
            params.push(status);
        }
        return executeQuery(`
      SELECT ot.*, 
        u.nickname, u.avatar, u.mobile,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years
      FROM org_teachers ot
      LEFT JOIN users u ON ot.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ot.teacher_id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ot.bind_at DESC
    `, params);
    }
    async inviteTeacher(orgId, teacherId, commissionRate) {
        const existing = await executeQuery(`
      SELECT id, status FROM org_teachers WHERE org_id = ? AND teacher_id = ?
    `, [orgId, teacherId]);
        if (existing.length > 0) {
            const record = existing[0];
            if (record.status === 1) {
                throw new Error('教师已绑定该机构');
            }
            await executeQuery(`
        UPDATE org_teachers SET status = 0, bind_at = NULL
        WHERE org_id = ? AND teacher_id = ?
      `, [orgId, teacherId]);
            return { success: true, message: '邀请已重新发送' };
        }
        await executeQuery(`
      INSERT INTO org_teachers (org_id, teacher_id, status, commission_rate)
      VALUES (?, ?, 0, ?)
    `, [orgId, teacherId, commissionRate || 10]);
        return { success: true, message: '邀请已发送' };
    }
    async handleInvite(teacherId, orgId, accept) {
        if (accept) {
            await executeQuery(`
        UPDATE org_teachers 
        SET status = 1, bind_at = NOW()
        WHERE org_id = ? AND teacher_id = ? AND status = 0
      `, [orgId, teacherId]);
            await executeQuery(`
        UPDATE users SET affiliated_org_id = ? WHERE id = ?
      `, [orgId, teacherId]);
        }
        else {
            await executeQuery(`
        UPDATE org_teachers SET status = 2, unbind_at = NOW()
        WHERE org_id = ? AND teacher_id = ? AND status = 0
      `, [orgId, teacherId]);
        }
        return { success: true };
    }
    async unbindTeacher(orgId, teacherId) {
        await executeQuery(`
      UPDATE org_teachers SET status = 2, unbind_at = NOW()
      WHERE org_id = ? AND teacher_id = ?
    `, [orgId, teacherId]);
        await executeQuery(`
      UPDATE users SET affiliated_org_id = NULL WHERE id = ?
    `, [teacherId]);
        return { success: true };
    }
    async setTeacherCommission(orgId, teacherId, rate) {
        await executeQuery(`
      UPDATE org_teachers SET commission_rate = ?
      WHERE org_id = ? AND teacher_id = ?
    `, [rate, orgId, teacherId]);
        return { success: true };
    }
    async assignOrder(data) {
        const teachers = await executeQuery(`
      SELECT id FROM org_teachers 
      WHERE org_id = ? AND teacher_id = ? AND status = 1
    `, [data.orgId, data.teacherId]);
        if (teachers.length === 0) {
            throw new Error('该教师不属于您的机构');
        }
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [data.orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        await executeQuery(`
      INSERT INTO org_assignments (org_id, order_id, teacher_id, assign_type, assign_note)
      VALUES (?, ?, ?, ?, ?)
    `, [data.orgId, data.orderId, data.teacherId, data.assignType, data.note || '']);
        if (data.assignType === 2) {
            await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 1)
      `, [data.orderId, data.teacherId]);
            await executeQuery(`
        UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
        WHERE id = ?
      `, [data.teacherId, data.orderId]);
        }
        return { success: true };
    }
    async handleAssignment(teacherId, assignmentId, accept, note) {
        const assignments = await executeQuery(`
      SELECT * FROM org_assignments WHERE id = ? AND teacher_id = ?
    `, [assignmentId, teacherId]);
        if (assignments.length === 0) {
            throw new Error('派单记录不存在');
        }
        const assignment = assignments[0];
        if (assignment.status !== 0) {
            throw new Error('该派单已处理');
        }
        const status = accept ? 1 : 2;
        await executeQuery(`
      UPDATE org_assignments SET status = ?, teacher_note = ?
      WHERE id = ?
    `, [status, note || '', assignmentId]);
        if (accept) {
            await executeQuery(`
        INSERT INTO order_matches (order_id, teacher_id, status)
        VALUES (?, ?, 1)
      `, [assignment.order_id, teacherId]);
            await executeQuery(`
        UPDATE orders SET status = 1, matched_teacher_id = ?, matched_at = NOW()
        WHERE id = ?
      `, [teacherId, assignment.order_id]);
        }
        return { success: true };
    }
    async getOrgAssignments(orgId, status) {
        const conditions = ['oa.org_id = ?'];
        const params = [orgId];
        if (status !== undefined) {
            conditions.push('oa.status = ?');
            params.push(status);
        }
        return executeQuery(`
      SELECT oa.*,
        o.order_no, o.subject, o.student_grade, o.hourly_rate,
        u.nickname as teacher_nickname, u.avatar as teacher_avatar,
        tp.real_name as teacher_name
      FROM org_assignments oa
      LEFT JOIN orders o ON oa.order_id = o.id
      LEFT JOIN users u ON oa.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON oa.teacher_id = tp.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY oa.created_at DESC
    `, params);
    }
    async getTeacherAssignments(teacherId, status) {
        const conditions = ['oa.teacher_id = ?'];
        const params = [teacherId];
        if (status !== undefined) {
            conditions.push('oa.status = ?');
            params.push(status);
        }
        return executeQuery(`
      SELECT oa.*,
        o.order_no, o.subject, o.student_grade, o.hourly_rate, o.address,
        org.org_name
      FROM org_assignments oa
      LEFT JOIN orders o ON oa.order_id = o.id
      LEFT JOIN organizations org ON oa.org_id = org.user_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY oa.created_at DESC
    `, params);
    }
    async recommendTeachers(orgId, orderId) {
        const orders = await executeQuery(`
      SELECT * FROM orders WHERE id = ?
    `, [orderId]);
        if (orders.length === 0) {
            throw new Error('订单不存在');
        }
        const order = orders[0];
        const teachers = await executeQuery(`
      SELECT ot.commission_rate,
        u.id, u.nickname, u.avatar, u.latitude, u.longitude,
        tp.real_name, tp.subjects, tp.education, tp.rating, tp.teaching_years, tp.hourly_rate,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(u.latitude))
          ), 2
        ) as distance
      FROM org_teachers ot
      LEFT JOIN users u ON ot.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON ot.teacher_id = tp.user_id
      WHERE ot.org_id = ? AND ot.status = 1
        AND FIND_IN_SET(?, tp.subjects) > 0
      ORDER BY tp.rating DESC, distance ASC
      LIMIT 10
    `, [order.latitude, order.longitude, order.latitude, orgId, order.subject]);
        return teachers;
    }
};
exports.OrgAssignService = OrgAssignService;
exports.OrgAssignService = OrgAssignService = __decorate([
    (0, common_1.Injectable)()
], OrgAssignService);
//# sourceMappingURL=org-assign.service.js.map