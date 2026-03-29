"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherProfileService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let TeacherProfileService = class TeacherProfileService {
    async getTeacherProfile(teacherId, viewerId) {
        const users = await executeQuery(`
      SELECT id, nickname, avatar, mobile, wechat_id, role, 
        membership_type, membership_expire_at, city_name
      FROM users WHERE id = ?
    `, [teacherId]);
        if (users.length === 0) {
            throw new Error('教师不存在');
        }
        const user = users[0];
        const profiles = await executeQuery(`
      SELECT * FROM teacher_profiles WHERE user_id = ?
    `, [teacherId]);
        const profile = profiles[0] || {};
        let contactUnlocked = false;
        let wechatUnlocked = false;
        if (viewerId) {
            const unlocks = await executeQuery(`
        SELECT unlock_type FROM contact_unlocks 
        WHERE user_id = ? AND target_user_id = ?
        ORDER BY created_at DESC LIMIT 1
      `, [viewerId, teacherId]);
            if (unlocks.length > 0) {
                contactUnlocked = [1, 3].includes(unlocks[0].unlock_type);
                wechatUnlocked = [2, 3].includes(unlocks[0].unlock_type);
            }
        }
        await executeQuery(`
      UPDATE teacher_profiles SET view_count = view_count + 1 WHERE user_id = ?
    `, [teacherId]);
        return {
            ...user,
            ...profile,
            contact_unlocked: contactUnlocked,
            wechat_unlocked: wechatUnlocked,
            mobile: contactUnlocked ? user.mobile : this.maskMobile(user.mobile),
            wechat_id: wechatUnlocked ? user.wechat_id : null,
        };
    }
    async updateTeacherProfile(teacherId, data) {
        const existing = await executeQuery(`
      SELECT user_id FROM teacher_profiles WHERE user_id = ?
    `, [teacherId]);
        if (existing.length === 0) {
            await executeQuery(`
        INSERT INTO teacher_profiles (
          user_id, real_name, gender, birth_year, education,
          subjects, hourly_rate_min, hourly_rate_max, intro, one_line_intro,
          photos, videos, cover_photo, teaching_years
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                teacherId,
                data.realName || '',
                data.gender || null,
                data.birthYear || null,
                data.education || '',
                JSON.stringify(data.subjects || []),
                data.hourlyRateMin || 0,
                data.hourlyRateMax || 0,
                data.intro || '',
                data.oneLineIntro || '',
                JSON.stringify(data.photos || []),
                JSON.stringify(data.videos || []),
                data.coverPhoto || '',
                data.teachingYears || 0,
            ]);
        }
        else {
            const updates = [];
            const values = [];
            if (data.realName !== undefined) {
                updates.push('real_name = ?');
                values.push(data.realName);
            }
            if (data.gender !== undefined) {
                updates.push('gender = ?');
                values.push(data.gender);
            }
            if (data.birthYear !== undefined) {
                updates.push('birth_year = ?');
                values.push(data.birthYear);
            }
            if (data.education !== undefined) {
                updates.push('education = ?');
                values.push(data.education);
            }
            if (data.subjects !== undefined) {
                updates.push('subjects = ?');
                values.push(JSON.stringify(data.subjects));
            }
            if (data.hourlyRateMin !== undefined) {
                updates.push('hourly_rate_min = ?');
                values.push(data.hourlyRateMin);
            }
            if (data.hourlyRateMax !== undefined) {
                updates.push('hourly_rate_max = ?');
                values.push(data.hourlyRateMax);
            }
            if (data.intro !== undefined) {
                updates.push('intro = ?');
                values.push(data.intro);
            }
            if (data.oneLineIntro !== undefined) {
                updates.push('one_line_intro = ?');
                values.push(data.oneLineIntro);
            }
            if (data.photos !== undefined) {
                updates.push('photos = ?');
                values.push(JSON.stringify(data.photos));
            }
            if (data.videos !== undefined) {
                updates.push('videos = ?');
                values.push(JSON.stringify(data.videos));
            }
            if (data.coverPhoto !== undefined) {
                updates.push('cover_photo = ?');
                values.push(data.coverPhoto);
            }
            if (data.teachingYears !== undefined) {
                updates.push('teaching_years = ?');
                values.push(data.teachingYears);
            }
            if (updates.length > 0) {
                await executeQuery(`
          UPDATE teacher_profiles SET ${updates.join(', ')} WHERE user_id = ?
        `, [...values, teacherId]);
            }
        }
        return { success: true };
    }
    async publishMoment(teacherId, data) {
        const result = await executeQuery(`
      INSERT INTO teacher_moments (teacher_id, content, images, video_url, video_cover)
      VALUES (?, ?, ?, ?, ?)
    `, [
            teacherId,
            data.content,
            JSON.stringify(data.images || []),
            data.videoUrl || null,
            data.videoCover || null,
        ]);
        return { success: true, id: result.insertId };
    }
    async getMoments(teacherId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const moments = await executeQuery(`
      SELECT tm.*, 
        u.nickname, u.avatar
      FROM teacher_moments tm
      LEFT JOIN users u ON tm.teacher_id = u.id
      WHERE tm.teacher_id = ? AND tm.is_visible = 1
      ORDER BY tm.created_at DESC
      LIMIT ? OFFSET ?
    `, [teacherId, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM teacher_moments 
      WHERE teacher_id = ? AND is_visible = 1
    `, [teacherId]);
        return {
            list: moments,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async deleteMoment(teacherId, momentId) {
        await executeQuery(`
      UPDATE teacher_moments SET is_visible = 0 
      WHERE id = ? AND teacher_id = ?
    `, [momentId, teacherId]);
        return { success: true };
    }
    async likeMoment(momentId, userId) {
        const existing = await executeQuery(`
      SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?
    `, [momentId, userId]);
        if (existing.length > 0) {
            await executeQuery(`DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?`, [momentId, userId]);
            await executeQuery(`UPDATE teacher_moments SET like_count = like_count - 1 WHERE id = ?`, [momentId]);
            return { success: true, liked: false };
        }
        else {
            await executeQuery(`INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)`, [momentId, userId]);
            await executeQuery(`UPDATE teacher_moments SET like_count = like_count + 1 WHERE id = ?`, [momentId]);
            return { success: true, liked: true };
        }
    }
    async getTeacherReviews(teacherId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const reviews = await executeQuery(`
      SELECT r.*,
        CASE WHEN r.is_anonymous = 1 THEN '匿名用户' ELSE u.nickname END as parent_nickname,
        CASE WHEN r.is_anonymous = 1 THEN NULL ELSE u.avatar END as parent_avatar
      FROM reviews r
      LEFT JOIN users u ON r.parent_id = u.id
      WHERE r.teacher_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [teacherId, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM reviews WHERE teacher_id = ?
    `, [teacherId]);
        const ratingStats = await executeQuery(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE teacher_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [teacherId]);
        return {
            list: reviews,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
            ratingStats,
        };
    }
    async replyReview(teacherId, reviewId, reply) {
        const reviews = await executeQuery(`
      SELECT id FROM reviews WHERE id = ? AND teacher_id = ?
    `, [reviewId, teacherId]);
        if (reviews.length === 0) {
            throw new Error('评价不存在或无权限');
        }
        await executeQuery(`
      UPDATE reviews SET reply = ?, reply_at = NOW() WHERE id = ?
    `, [reply, reviewId]);
        return { success: true };
    }
    async unlockContact(data) {
        const targets = await executeQuery(`
      SELECT id, mobile, wechat_id FROM users WHERE id = ?
    `, [data.targetUserId]);
        if (targets.length === 0) {
            throw new Error('用户不存在');
        }
        const target = targets[0];
        let costAmount = 0;
        if (!data.isMember) {
            costAmount = data.unlockType === 3 ? 29.9 : 19.9;
        }
        await executeQuery(`
      INSERT INTO contact_unlocks (order_id, user_id, target_user_id, unlock_type, cost_amount)
      VALUES (?, ?, ?, ?, ?)
    `, [data.orderId || null, data.userId, data.targetUserId, data.unlockType, costAmount]);
        const result = { success: true, costAmount };
        if ([1, 3].includes(data.unlockType)) {
            result.mobile = target.mobile;
        }
        if ([2, 3].includes(data.unlockType)) {
            result.wechat_id = target.wechat_id;
        }
        return result;
    }
    async updateWechat(userId, wechatId, qrcode) {
        await executeQuery(`
      UPDATE users SET wechat_id = ?, wechat_qrcode = ? WHERE id = ?
    `, [wechatId, qrcode || null, userId]);
        return { success: true };
    }
    async getTeacherStats(teacherId) {
        const stats = await executeQuery(`
      SELECT 
        tp.view_count,
        tp.rating,
        tp.review_count,
        tp.success_count,
        tp.teaching_years,
        (SELECT COUNT(*) FROM teacher_moments WHERE teacher_id = ? AND is_visible = 1) as moment_count,
        (SELECT COUNT(*) FROM orders WHERE matched_teacher_id = ? AND status >= 3) as completed_orders
      FROM teacher_profiles tp
      WHERE tp.user_id = ?
    `, [teacherId, teacherId, teacherId]);
        return stats[0] || {
            view_count: 0,
            rating: 5.0,
            review_count: 0,
            success_count: 0,
            teaching_years: 0,
            moment_count: 0,
            completed_orders: 0,
        };
    }
    maskMobile(mobile) {
        if (!mobile || mobile.length < 7)
            return mobile;
        return mobile.substring(0, 3) + '****' + mobile.substring(mobile.length - 4);
    }
};
exports.TeacherProfileService = TeacherProfileService;
exports.TeacherProfileService = TeacherProfileService = __decorate([
    (0, common_1.Injectable)()
], TeacherProfileService);
//# sourceMappingURL=teacher-profile.service.js.map