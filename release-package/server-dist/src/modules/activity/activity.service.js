"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let ActivityService = class ActivityService {
    async getActivityList(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['is_active = 1'];
        const sqlParams = [];
        if (params.role !== undefined) {
            conditions.push('JSON_CONTAINS(target_roles, ?)');
            sqlParams.push(params.role.toString());
        }
        if (params.type) {
            conditions.push('type = ?');
            sqlParams.push(params.type);
        }
        if (params.status) {
            conditions.push('status = ?');
            sqlParams.push(params.status);
        }
        const whereClause = conditions.join(' AND ');
        const activities = await executeQuery(`
      SELECT 
        id, title, type, cover_image, start_time, end_time,
        address, online_price, offline_price, max_participants,
        current_participants, target_roles, status, is_online,
        created_at
      FROM activities
      WHERE ${whereClause}
      ORDER BY start_time ASC, created_at DESC
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM activities WHERE ${whereClause}
    `, sqlParams);
        return {
            list: activities,
            total: countResult[0]?.total || 0,
            page: params.page,
            pageSize: params.pageSize,
        };
    }
    async getActivityDetail(activityId) {
        const activities = await executeQuery(`
      SELECT * FROM activities WHERE id = ? AND is_active = 1
    `, [activityId]);
        if (activities.length === 0) {
            throw new Error('活动不存在');
        }
        const activity = activities[0];
        const signupStats = await executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(participant_count) as total_participants,
        SUM(CASE WHEN signup_type = 1 THEN 1 ELSE 0 END) as online_count,
        SUM(CASE WHEN signup_type = 2 THEN 1 ELSE 0 END) as offline_count
      FROM activity_signups
      WHERE activity_id = ? AND status = 1
    `, [activityId]);
        return {
            ...activity,
            signup_stats: signupStats[0],
        };
    }
    async signupActivity(activityId, userId, signupType, participantName, participantPhone, participantCount) {
        const activities = await executeQuery(`
      SELECT * FROM activities WHERE id = ? AND is_active = 1 FOR UPDATE
    `, [activityId]);
        if (activities.length === 0) {
            throw new Error('活动不存在');
        }
        const activity = activities[0];
        if (activity.status === 'ended') {
            throw new Error('活动已结束');
        }
        if (activity.max_participants > 0) {
            if ((activity.current_participants + participantCount) > activity.max_participants) {
                throw new Error('报名人数已满');
            }
        }
        const existing = await executeQuery(`
      SELECT id FROM activity_signups 
      WHERE activity_id = ? AND user_id = ? AND status != 2
    `, [activityId, userId]);
        if (existing.length > 0) {
            throw new Error('您已报名该活动');
        }
        const price = signupType === 1 ? activity.online_price : activity.offline_price;
        const totalAmount = price * participantCount;
        const result = await executeQuery(`
      INSERT INTO activity_signups 
      (activity_id, user_id, signup_type, participant_name, participant_phone, participant_count, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [activityId, userId, signupType, participantName, participantPhone, participantCount, totalAmount]);
        await executeQuery(`
      UPDATE activities 
      SET current_participants = current_participants + ?
      WHERE id = ?
    `, [participantCount, activityId]);
        return {
            success: true,
            signupId: result.insertId,
            totalAmount,
            message: totalAmount > 0 ? '请完成支付' : '报名成功',
        };
    }
    async getUserSignedActivities(userId, page, pageSize, status) {
        const offset = (page - 1) * pageSize;
        const conditions = ['s.user_id = ?', 's.status != 2'];
        const params = [userId];
        if (status) {
            conditions.push('a.status = ?');
            params.push(status);
        }
        const activities = await executeQuery(`
      SELECT 
        a.id, a.title, a.type, a.cover_image, a.start_time, a.end_time,
        a.address, a.status, a.is_online,
        s.id as signup_id, s.signup_type, s.participant_count, s.total_amount, s.status as signup_status,
        s.created_at as signup_time
      FROM activity_signups s
      LEFT JOIN activities a ON s.activity_id = a.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM activity_signups s
      LEFT JOIN activities a ON s.activity_id = a.id
      WHERE ${conditions.join(' AND ')}
    `, params);
        return {
            list: activities,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async cancelSignup(activityId, userId) {
        const signups = await executeQuery(`
      SELECT * FROM activity_signups 
      WHERE activity_id = ? AND user_id = ? AND status = 1
    `, [activityId, userId]);
        if (signups.length === 0) {
            throw new Error('未找到报名记录');
        }
        const signup = signups[0];
        await executeQuery(`
      UPDATE activity_signups SET status = 2 WHERE id = ?
    `, [signup.id]);
        await executeQuery(`
      UPDATE activities 
      SET current_participants = current_participants - ?
      WHERE id = ?
    `, [signup.participant_count, activityId]);
        return { success: true, message: '取消报名成功' };
    }
    async getActivityParticipants(activityId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        const participants = await executeQuery(`
      SELECT 
        s.id, s.signup_type, s.participant_name, s.participant_count, s.created_at,
        u.nickname, u.avatar
      FROM activity_signups s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.activity_id = ? AND s.status = 1
      ORDER BY s.created_at ASC
      LIMIT ? OFFSET ?
    `, [activityId, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM activity_signups 
      WHERE activity_id = ? AND status = 1
    `, [activityId]);
        return {
            list: participants,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)()
], ActivityService);
//# sourceMappingURL=activity.service.js.map