"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mysql_client_1 = require("../../storage/database/mysql-client");
async function executeQuery(sql, params = []) {
    const [rows] = await (0, mysql_client_1.query)(sql, params);
    return rows;
}
let UserService = class UserService {
    async getUserInfo(userId) {
        const users = await executeQuery(`
      SELECT u.*, 
        tp.real_name, tp.subjects, tp.rating as teacher_rating,
        o.org_name, o.status as org_status
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN organizations o ON u.id = o.user_id
      WHERE u.id = ?
    `, [userId]);
        if (users.length === 0) {
            throw new Error('用户不存在');
        }
        const user = users[0];
        delete user.openid;
        return user;
    }
    async updateUserInfo(userId, data) {
        const updates = [];
        const values = [];
        if (data.nickname) {
            updates.push('nickname = ?');
            values.push(data.nickname);
        }
        if (data.avatar) {
            updates.push('avatar = ?');
            values.push(data.avatar);
        }
        if (updates.length > 0) {
            await executeQuery(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `, [...values, userId]);
        }
        return { success: true };
    }
    async updateLocation(userId, data) {
        await executeQuery(`
      UPDATE users SET latitude = ?, longitude = ?, address = ?
      WHERE id = ?
    `, [data.latitude, data.longitude, data.address || '', userId]);
        return { success: true };
    }
    async switchRole(userId, role) {
        const users = await executeQuery(`
      SELECT role FROM users WHERE id = ?
    `, [userId]);
        const user = users[0];
        const currentRole = user.role;
        if (role === 1 && currentRole !== 1) {
            const profiles = await executeQuery(`
        SELECT verify_status FROM teacher_profiles WHERE user_id = ?
      `, [userId]);
            if (profiles.length === 0 || profiles[0].verify_status !== 1) {
                throw new Error('请先完成教师认证');
            }
        }
        if (role === 2 && currentRole !== 2) {
            const orgs = await executeQuery(`
        SELECT status FROM organizations WHERE user_id = ?
      `, [userId]);
            if (orgs.length === 0 || orgs[0].status !== 1) {
                throw new Error('请先完成机构认证');
            }
        }
        await executeQuery(`
      UPDATE users SET role = ? WHERE id = ?
    `, [role, userId]);
        return { success: true };
    }
    async getMembershipInfo(userId) {
        const users = await executeQuery(`
      SELECT membership_type, membership_expire_at FROM users WHERE id = ?
    `, [userId]);
        const user = users[0];
        const now = new Date();
        const isMember = user?.membership_type === 1 &&
            new Date(user.membership_expire_at) > now;
        const usage = await executeQuery(`
      SELECT 
        SUM(CASE WHEN type = 'view_contact' THEN 1 ELSE 0 END) as view_count,
        SUM(CASE WHEN type = 'send_message' THEN 1 ELSE 0 END) as message_count
      FROM member_usage_log
      WHERE user_id = ? AND DATE(created_at) = CURDATE()
    `, [userId]);
        return {
            is_member: isMember,
            expire_at: user?.membership_expire_at,
            remaining_days: isMember ?
                Math.ceil((new Date(user.membership_expire_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            today_usage: usage[0] || { view_count: 0, message_count: 0 },
        };
    }
    async getMembershipPlans(role) {
        const conditions = role ? `WHERE role = ${role}` : '';
        const plans = await executeQuery(`
      SELECT * FROM membership_plans ${conditions} AND is_active = 1
      ORDER BY role, sort_order
    `);
        return plans;
    }
    async getEarnings(userId) {
        const commissions = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 0 THEN amount ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as available,
        COALESCE(SUM(CASE WHEN status = 2 THEN amount ELSE 0 END), 0) as withdrawn,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE user_id = ?
    `, [userId]);
        const monthEarnings = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as month_total
      FROM commissions
      WHERE user_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
    `, [userId]);
        return {
            ...commissions[0],
            month_earnings: monthEarnings[0]?.month_total || 0,
        };
    }
    async getEarningRecords(userId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        const records = await executeQuery(`
      SELECT c.*, 
        fu.nickname as from_nickname, fu.avatar as from_avatar,
        p.payment_no
      FROM commissions c
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN payments p ON c.payment_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM commissions WHERE user_id = ?
    `, [userId]);
        return {
            list: records,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async requestWithdrawal(userId, amount, bankInfo) {
        const commissions = await executeQuery(`
      SELECT COALESCE(SUM(CASE WHEN status = 1 THEN amount ELSE 0 END), 0) as available
      FROM commissions
      WHERE user_id = ?
    `, [userId]);
        const available = commissions[0].available;
        if (amount > available) {
            throw new Error('可提现余额不足');
        }
        const result = await executeQuery(`
      INSERT INTO withdrawals (user_id, amount, bank_info)
      VALUES (?, ?, ?)
    `, [userId, amount, JSON.stringify(bankInfo)]);
        return { success: true, id: result.insertId };
    }
    async getInviteInfo(userId) {
        const users = await executeQuery(`
      SELECT invite_code FROM users WHERE id = ?
    `, [userId]);
        const inviteCode = users[0]?.invite_code;
        const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_invites,
        SUM(CASE WHEN membership_type = 1 THEN 1 ELSE 0 END) as member_invites,
        COALESCE(SUM(invite_reward), 0) as total_reward
      FROM users
      WHERE inviter_id = ?
    `, [userId]);
        return {
            invite_code: inviteCode,
            ...stats[0],
        };
    }
    async getInviteList(userId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        const list = await executeQuery(`
      SELECT id, nickname, avatar, role, membership_type, created_at
      FROM users
      WHERE inviter_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, pageSize, offset]);
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM users WHERE inviter_id = ?
    `, [userId]);
        return {
            list,
            total: countResult[0]?.total || 0,
            page,
            pageSize,
        };
    }
    async getTeacherProfile(userId) {
        const profiles = await executeQuery(`
      SELECT * FROM teacher_profiles WHERE user_id = ?
    `, [userId]);
        if (profiles.length === 0) {
            return null;
        }
        return profiles[0];
    }
    async updateTeacherProfile(userId, data) {
        const existing = await executeQuery(`
      SELECT id FROM teacher_profiles WHERE user_id = ?
    `, [userId]);
        if (existing.length > 0) {
            const updates = Object.entries(data)
                .filter(([_, value]) => value !== undefined)
                .map(([key, _]) => {
                if (key === 'certificates') {
                    return `${key} = ?`;
                }
                return `${key} = ?`;
            });
            const values = Object.entries(data)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => {
                if (key === 'certificates') {
                    return JSON.stringify(value);
                }
                return value;
            });
            if (updates.length > 0) {
                await executeQuery(`
          UPDATE teacher_profiles SET ${updates.join(', ')}, verify_status = 0
          WHERE user_id = ?
        `, [...values, userId]);
            }
        }
        else {
            await executeQuery(`
        INSERT INTO teacher_profiles (user_id, real_name, gender, education, subjects, grades, 
          teaching_years, hourly_rate, bio, certificates)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                userId,
                data.real_name || '',
                data.gender || 0,
                data.education || '',
                data.subjects || '',
                data.grades || '',
                data.teaching_years || 0,
                data.hourly_rate || 0,
                data.bio || '',
                JSON.stringify(data.certificates || []),
            ]);
        }
        return { success: true };
    }
    async getOrgProfile(userId) {
        const orgs = await executeQuery(`
      SELECT * FROM organizations WHERE user_id = ?
    `, [userId]);
        if (orgs.length === 0) {
            return null;
        }
        return orgs[0];
    }
    async updateOrgProfile(userId, data) {
        const existing = await executeQuery(`
      SELECT id FROM organizations WHERE user_id = ?
    `, [userId]);
        if (existing.length > 0) {
            const updates = Object.entries(data)
                .filter(([_, value]) => value !== undefined)
                .map(([key, _]) => `${key} = ?`);
            const values = Object.entries(data)
                .filter(([_, value]) => value !== undefined)
                .map(([_, value]) => value);
            if (updates.length > 0) {
                await executeQuery(`
          UPDATE organizations SET ${updates.join(', ')}, status = 0
          WHERE user_id = ?
        `, [...values, userId]);
            }
        }
        else {
            await executeQuery(`
        INSERT INTO organizations (user_id, org_name, license_no, contact_name, contact_phone, address, intro)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                userId,
                data.org_name || '',
                data.license_no || '',
                data.contact_name || '',
                data.contact_phone || '',
                data.address || '',
                data.intro || '',
            ]);
        }
        return { success: true };
    }
    async bindInviter(userId, inviteCode) {
        const users = await executeQuery(`
      SELECT inviter_id FROM users WHERE id = ?
    `, [userId]);
        if (users[0].inviter_id) {
            throw new Error('已绑定邀请人');
        }
        const inviters = await executeQuery(`
      SELECT id, inviter_id FROM users WHERE invite_code = ?
    `, [inviteCode]);
        if (inviters.length === 0) {
            throw new Error('邀请码无效');
        }
        const inviter = inviters[0];
        if (inviter.id === userId) {
            throw new Error('不能绑定自己');
        }
        await executeQuery(`
      UPDATE users SET inviter_id = ?, inviter_2nd_id = ?
      WHERE id = ?
    `, [inviter.id, inviter.inviter_id, userId]);
        return { success: true };
    }
    async uploadAvatar(userId, file) {
        const avatarUrl = `/uploads/avatar_${userId}_${Date.now()}.jpg`;
        await executeQuery(`
      UPDATE users SET avatar = ? WHERE id = ?
    `, [avatarUrl, userId]);
        return { url: avatarUrl };
    }
    async getSettings(userId) {
        const users = await executeQuery(`
      SELECT settings FROM users WHERE id = ?
    `, [userId]);
        const settings = users[0]?.settings;
        return settings ? JSON.parse(settings) : {};
    }
    async updateSettings(userId, key, value) {
        const users = await executeQuery(`
      SELECT settings FROM users WHERE id = ?
    `, [userId]);
        const settings = users[0]?.settings ?
            JSON.parse(users[0].settings) : {};
        settings[key] = value;
        await executeQuery(`
      UPDATE users SET settings = ? WHERE id = ?
    `, [JSON.stringify(settings), userId]);
        return { success: true };
    }
    async getTeachersList(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['u.role = 1', 'u.status = 1', 'tp.verify_status = 2'];
        const sqlParams = [];
        if (params.subject && params.subject !== '全部') {
            conditions.push('FIND_IN_SET(?, tp.subjects) > 0');
            sqlParams.push(params.subject);
        }
        if (params.grade) {
            conditions.push('FIND_IN_SET(?, tp.grades) > 0');
            sqlParams.push(params.grade);
        }
        if (params.keyword) {
            conditions.push('(u.nickname LIKE ? OR tp.real_name LIKE ? OR tp.intro LIKE ?)');
            sqlParams.push(`%${params.keyword}%`, `%${params.keyword}%`, `%${params.keyword}%`);
        }
        if (params.city && params.city !== '定位中...') {
            conditions.push('u.city_name LIKE ?');
            sqlParams.push(`%${params.city}%`);
        }
        const whereClause = conditions.join(' AND ');
        let distanceSelect = 'NULL as distance';
        let distanceOrder = '';
        if (params.latitude && params.longitude) {
            distanceSelect = `
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(u.latitude))
          ), 2
        ) as distance
      `;
            sqlParams.unshift(params.latitude, params.longitude, params.latitude);
            distanceOrder = 'ORDER BY distance ASC';
        }
        const teachers = await executeQuery(`
      SELECT 
        u.id, u.nickname, u.avatar, u.latitude, u.longitude, u.city_name,
        tp.real_name, tp.gender, tp.education, tp.subjects, tp.grades, 
        tp.teaching_years, tp.hourly_rate_min, tp.hourly_rate_max, tp.intro, tp.one_line_intro,
        tp.rating, tp.review_count, tp.view_count, tp.success_count,
        ${distanceSelect}
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY tp.rating DESC, tp.view_count DESC, u.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);
        const formattedTeachers = teachers.map((t) => ({
            ...t,
            distance_text: t.distance ? (t.distance < 1 ? `${Math.round(t.distance * 1000)}m` : `${t.distance.toFixed(1)}km`) : '',
            subjects: t.subjects ? t.subjects.split(',').filter((s) => s) : [],
        }));
        const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      WHERE ${whereClause}
    `, sqlParams);
        return formattedTeachers;
    }
    async getOrdersList(params) {
        const offset = (params.page - 1) * params.pageSize;
        const conditions = ['o.status = 0'];
        const sqlParams = [];
        if (params.subject && params.subject !== '全部') {
            conditions.push('o.subject = ?');
            sqlParams.push(params.subject);
        }
        if (params.city && params.city !== '定位中...') {
            conditions.push('o.address LIKE ?');
            sqlParams.push(`%${params.city}%`);
        }
        const whereClause = conditions.join(' AND ');
        let distanceSelect = 'NULL as distance';
        let distanceOrder = '';
        if (params.latitude && params.longitude) {
            distanceSelect = `
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(o.latitude)) *
            cos(radians(o.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(o.latitude))
          ), 2
        ) as distance
      `;
            sqlParams.unshift(params.latitude, params.longitude, params.latitude);
            distanceOrder = 'ORDER BY distance ASC';
        }
        const orders = await executeQuery(`
      SELECT 
        o.id, o.order_no, o.subject, o.hourly_rate, o.student_grade, o.student_gender,
        o.address, o.description, o.status, o.view_count, o.created_at,
        ${distanceSelect},
        u.nickname as parent_nickname, u.avatar as parent_avatar
      FROM orders o
      LEFT JOIN users u ON o.parent_id = u.id
      WHERE ${whereClause}
      ${distanceOrder || 'ORDER BY o.created_at DESC'}
      LIMIT ? OFFSET ?
    `, [...sqlParams, params.pageSize, offset]);
        const formattedOrders = orders.map((o) => ({
            ...o,
            distance_text: o.distance ? (o.distance < 1 ? `${Math.round(o.distance * 1000)}m` : `${o.distance.toFixed(1)}km`) : '',
            contact_hidden: true,
        }));
        return formattedOrders;
    }
    async login(mobile) {
        try {
            const users = await executeQuery(`
        SELECT * FROM users WHERE mobile = ?
      `, [mobile]);
            if (users.length === 0) {
                return { success: false, message: '用户不存在，请先注册' };
            }
            const user = users[0];
            const token = `token_${user.id}_${Date.now()}`;
            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        nickname: user.nickname,
                        mobile: user.mobile,
                        avatar: user.avatar,
                        role: user.role,
                    },
                },
            };
        }
        catch (error) {
            console.log('[User Mock] 数据库错误，开发模式返回模拟用户');
            const mockUserId = Math.floor(Math.random() * 10000) + 1;
            return {
                success: true,
                data: {
                    token: `token_${mockUserId}_${Date.now()}`,
                    user: {
                        id: mockUserId,
                        nickname: `用户${mobile.slice(-4)}`,
                        mobile,
                        avatar: '',
                        role: 0,
                    },
                },
            };
        }
    }
    async register(mobile, nickname, role) {
        try {
            const existingUsers = await executeQuery(`
        SELECT id FROM users WHERE mobile = ?
      `, [mobile]);
            if (existingUsers.length > 0) {
                return this.login(mobile);
            }
            const inviteCode = `U${Date.now().toString(36).toUpperCase()}`;
            const userId = await (0, mysql_client_1.insert)(`
        INSERT INTO users (mobile, nickname, role, invite_code, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [mobile, nickname || `用户${mobile.slice(-4)}`, role || 0, inviteCode]);
            const token = `token_${userId}_${Date.now()}`;
            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: userId,
                        nickname: nickname || `用户${mobile.slice(-4)}`,
                        mobile,
                        avatar: '',
                        role: role || 0,
                    },
                },
            };
        }
        catch (error) {
            console.log('[User Mock] 数据库错误，开发模式返回模拟用户');
            const mockUserId = Math.floor(Math.random() * 10000) + 1;
            return {
                success: true,
                data: {
                    token: `token_${mockUserId}_${Date.now()}`,
                    user: {
                        id: mockUserId,
                        nickname: nickname || `用户${mobile.slice(-4)}`,
                        mobile,
                        avatar: '',
                        role: role || 0,
                    },
                },
            };
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user.service.js.map