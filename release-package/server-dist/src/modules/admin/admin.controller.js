"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permission_guard_1 = require("../auth/guards/permission.guard");
const permission_decorator_1 = require("../auth/decorators/permission.decorator");
const bcrypt = require("bcrypt");
const db = require("../../storage/database/mysql-client");
let AdminController = class AdminController {
    async getStatsOverview() {
        try {
            const [users] = await db.query('SELECT COUNT(*) as count FROM users WHERE status = 1');
            const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher_profiles WHERE verify_status = 1');
            const [orgs] = await db.query('SELECT COUNT(*) as count FROM organizations WHERE verify_status = 1');
            const [orders] = await db.query('SELECT COUNT(*) as count FROM orders WHERE status = 1');
            const [members] = await db.query('SELECT COUNT(*) as count FROM users WHERE membership_expire_at > NOW()');
            const [revenue] = await db.query('SELECT COALESCE(SUM(50), 0) as total FROM orders WHERE status = 1');
            return {
                totalUsers: users[0]?.count || 0,
                totalTeachers: teachers[0]?.count || 0,
                totalOrgs: orgs[0]?.count || 0,
                totalOrders: orders[0]?.count || 0,
                totalMembers: members[0]?.count || 0,
                totalRevenue: revenue[0]?.total || 0,
            };
        }
        catch (error) {
            console.error('获取统计数据失败:', error);
            return {
                totalUsers: 0,
                totalTeachers: 0,
                totalOrgs: 0,
                totalOrders: 0,
                totalMembers: 0,
                totalRevenue: 0,
            };
        }
    }
    async getUsers(page = '1', pageSize = '20', search = '', role = '') {
        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);
        const offset = (pageNum - 1) * pageSizeNum;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (search) {
            whereClause += ' AND (nickname LIKE ? OR mobile LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            whereClause += ' AND role = ?';
            params.push(role);
        }
        try {
            const [list] = await db.query(`SELECT id, openid, nickname, mobile as phone, avatar, role, 
                membership_type, membership_expire_at as member_expire_time, 
                created_at, status, city_name
         FROM users ${whereClause}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`, [...params, pageSizeNum, offset]);
            const [countResult] = await db.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
            const roleMap = { 0: 'parent', 1: 'teacher', 2: 'org' };
            const listWithRole = list.map(u => ({
                ...u,
                role: roleMap[u.role] || 'parent',
                isMember: u.membership_type === 1
            }));
            return {
                list: listWithRole,
                total: countResult[0]?.total || 0,
                page: pageNum,
                pageSize: pageSizeNum
            };
        }
        catch (error) {
            console.error('获取用户列表失败:', error);
            return { list: [], total: 0, page: pageNum, pageSize: pageSizeNum };
        }
    }
    async getUser(id) {
        const [users] = await db.query(`SELECT id, openid, unionid, nickname, mobile, avatar, role, gender,
              membership_type, membership_expire_at, wechat_id,
              latitude, longitude, city_code, city_name,
              inviter_id, inviter_2nd_id, city_agent_id, affiliated_org_id,
              last_login_at, created_at, status
       FROM users WHERE id = ?`, [parseInt(id)]);
        if (!users || users.length === 0) {
            throw new common_1.HttpException('用户不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return users[0];
    }
    async updateUser(id, body) {
        const roleMap = { 'parent': 0, 'teacher': 1, 'org': 2 };
        const roleValue = body.role ? roleMap[body.role] : undefined;
        await db.update(`UPDATE users 
       SET nickname = COALESCE(?, nickname),
           mobile = COALESCE(?, mobile),
           role = COALESCE(?, role),
           membership_type = COALESCE(?, membership_type),
           membership_expire_at = COALESCE(?, membership_expire_at),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ?`, [body.nickname, body.mobile, roleValue, body.membership_type, body.membership_expire_at, body.status, parseInt(id)]);
        return { success: true };
    }
    async updateUserStatus(id, body) {
        await db.update('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [body.status, parseInt(id)]);
        return { success: true };
    }
    async getTeachers(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status === 'pending') {
            whereClause += ' AND tp.verify_status = 0';
        }
        else if (status === 'approved') {
            whereClause += ' AND tp.verify_status = 1';
        }
        else if (status === 'rejected') {
            whereClause += ' AND tp.verify_status = 2';
        }
        try {
            const [teachers] = await db.query(`
        SELECT 
          tp.user_id as id, tp.user_id, tp.real_name as name, tp.education,
          tp.school, tp.major, tp.subjects, tp.intro as introduction,
          tp.teaching_years, tp.hourly_rate_min, tp.hourly_rate_max,
          tp.rating, tp.verify_status, tp.created_at,
          u.nickname, u.avatar, u.mobile as phone
        FROM teacher_profiles tp
        LEFT JOIN users u ON tp.user_id = u.id
        ${whereClause}
        ORDER BY tp.created_at DESC
      `, params);
            return teachers.map(t => ({
                ...t,
                subject: Array.isArray(t.subjects) ? t.subjects.join('、') : t.subjects
            }));
        }
        catch (error) {
            console.error('获取教师列表失败:', error);
            return [];
        }
    }
    async getTeacher(id) {
        const [teachers] = await db.query(`
      SELECT 
        tp.*, u.nickname, u.avatar, u.mobile
      FROM teacher_profiles tp
      LEFT JOIN users u ON tp.user_id = u.id
      WHERE tp.user_id = ?
    `, [parseInt(id)]);
        if (!teachers || teachers.length === 0) {
            throw new common_1.HttpException('教师不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return teachers[0];
    }
    async approveTeacher(id) {
        await db.update('UPDATE teacher_profiles SET verify_status = 1, verify_time = NOW(), updated_at = NOW() WHERE user_id = ?', [parseInt(id)]);
        await db.update('UPDATE users SET role = 1, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async rejectTeacher(id, body) {
        await db.update('UPDATE teacher_profiles SET verify_status = 2, updated_at = NOW() WHERE user_id = ?', [parseInt(id)]);
        return { success: true };
    }
    async getOrgs(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status === 'pending') {
            whereClause += ' AND o.verify_status = 0';
        }
        else if (status === 'approved') {
            whereClause += ' AND o.verify_status = 1';
        }
        try {
            const [orgs] = await db.query(`
        SELECT 
          o.id, o.user_id, o.name, o.contact_person, o.contact_phone,
          o.address, o.description, o.verify_status, o.created_at,
          u.nickname, u.avatar
        FROM organizations o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
      `, params);
            return orgs;
        }
        catch (error) {
            console.error('获取机构列表失败:', error);
            return [];
        }
    }
    async approveOrg(id) {
        await db.update('UPDATE organizations SET verify_status = 1, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async rejectOrg(id, body) {
        await db.update('UPDATE organizations SET verify_status = 2, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async getOrders(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(parseInt(status));
        }
        try {
            const [orders] = await db.query(`
        SELECT 
          o.id, o.order_no, o.user_id, o.subject, o.student_grade,
          o.teaching_mode, o.address, o.hourly_rate, o.status,
          o.view_count, o.apply_count, o.created_at,
          u.nickname as user_name, u.mobile as user_phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ${whereClause}
        ORDER BY o.created_at DESC
      `, params);
            return orders;
        }
        catch (error) {
            console.error('获取订单列表失败:', error);
            return [];
        }
    }
    async getAdmins() {
        try {
            const [admins] = await db.query(`
        SELECT 
          au.id, au.username, au.real_name, au.email, au.phone, 
          au.role_id, au.status, au.last_login_at as last_login_time, au.login_count, au.created_at,
          ar.role_name
        FROM admin_user au
        LEFT JOIN admin_role ar ON au.role_id = ar.id
        WHERE au.status != -1
        ORDER BY au.id ASC
      `);
            return admins;
        }
        catch (error) {
            console.error('获取管理员列表失败:', error);
            return [];
        }
    }
    async getAdmin(id) {
        const [admins] = await db.query(`
      SELECT au.*, ar.role_name
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.id = ?
    `, [parseInt(id)]);
        if (!admins || admins.length === 0) {
            throw new common_1.HttpException('管理员不存在', common_1.HttpStatus.NOT_FOUND);
        }
        return admins[0];
    }
    async createAdmin(body) {
        const [existing] = await db.query('SELECT id FROM admin_user WHERE username = ?', [body.username]);
        if (existing.length > 0) {
            return { success: false, message: '用户名已存在' };
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const insertId = await db.insert(`INSERT INTO admin_user (username, password, real_name, email, phone, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`, [body.username, hashedPassword, body.realName, body.email, body.phone, body.roleId]);
        return { success: true, id: insertId };
    }
    async updateAdmin(id, body) {
        await db.update(`UPDATE admin_user 
       SET real_name = COALESCE(?, real_name), 
           email = COALESCE(?, email), 
           phone = COALESCE(?, phone), 
           role_id = COALESCE(?, role_id), 
           status = COALESCE(?, status), 
           updated_at = NOW()
       WHERE id = ?`, [body.realName, body.email, body.phone, body.roleId, body.status, parseInt(id)]);
        return { success: true };
    }
    async updateAdminStatus(id, body) {
        await db.update('UPDATE admin_user SET status = ?, updated_at = NOW() WHERE id = ?', [body.status, parseInt(id)]);
        return { success: true };
    }
    async deleteAdmin(id) {
        await db.update('UPDATE admin_user SET status = -1, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async resetAdminPassword(id, body) {
        const newPassword = body.newPassword || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.update('UPDATE admin_user SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, parseInt(id)]);
        return { success: true, newPassword };
    }
    async getRoles() {
        try {
            const [roles] = await db.query(`
        SELECT 
          ar.id, ar.role_name, ar.role_code, ar.description, ar.created_at,
          (SELECT COUNT(*) FROM admin_user WHERE role_id = ar.id AND status = 1) as user_count
        FROM admin_role ar
        WHERE ar.status = 1
        ORDER BY ar.id ASC
      `);
            return roles.map(role => ({
                ...role,
                permissionCount: role.permissions ? JSON.parse(role.permissions).length : 0,
                userCount: role.user_count || 0
            }));
        }
        catch (error) {
            console.error('获取角色列表失败:', error);
            return [];
        }
    }
    async getRole(id) {
        const [roles] = await db.query('SELECT * FROM admin_role WHERE id = ?', [parseInt(id)]);
        if (!roles || roles.length === 0) {
            throw new common_1.HttpException('角色不存在', common_1.HttpStatus.NOT_FOUND);
        }
        const role = roles[0];
        return {
            ...role,
            permissions: role.permissions ? JSON.parse(role.permissions) : []
        };
    }
    async updateRole(id, body) {
        const updates = [];
        const params = [];
        if (body.roleName) {
            updates.push('role_name = ?');
            params.push(body.roleName);
        }
        if (body.permissions) {
            updates.push('permissions = ?');
            params.push(JSON.stringify(body.permissions));
        }
        if (updates.length === 0) {
            return { success: true };
        }
        updates.push('updated_at = NOW()');
        params.push(parseInt(id));
        await db.update(`UPDATE admin_role SET ${updates.join(', ')} WHERE id = ?`, params);
        return { success: true };
    }
    async deleteRole(id) {
        const [users] = await db.query('SELECT COUNT(*) as count FROM admin_user WHERE role_id = ? AND status = 1', [parseInt(id)]);
        if (users[0]?.count > 0) {
            throw new common_1.HttpException('该角色正在被使用，无法删除', common_1.HttpStatus.BAD_REQUEST);
        }
        await db.update('UPDATE admin_role SET status = 0, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async getConfig() {
        try {
            const [configs] = await db.query('SELECT config_key, config_value FROM site_config WHERE status = 1');
            const configMap = {};
            configs.forEach(c => {
                configMap[c.config_key] = c.config_value;
            });
            return configMap;
        }
        catch (error) {
            console.error('获取系统配置失败:', error);
            return {};
        }
    }
    async updateConfig(body) {
        for (const [key, value] of Object.entries(body)) {
            await db.update(`INSERT INTO site_config (config_key, config_value, status, created_at, updated_at)
         VALUES (?, ?, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`, [key, value, value]);
        }
        return { success: true };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, permission_decorator_1.RequirePermission)('dashboard:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStatsOverview", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, permission_decorator_1.RequirePermission)('user:view'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, permission_decorator_1.RequirePermission)('user:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, permission_decorator_1.RequirePermission)('user:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, permission_decorator_1.RequirePermission)('user:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Get)('teachers'),
    (0, permission_decorator_1.RequirePermission)('teacher:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)('teachers/:id'),
    (0, permission_decorator_1.RequirePermission)('teacher:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacher", null);
__decorate([
    (0, common_1.Post)('teachers/:id/approve'),
    (0, permission_decorator_1.RequirePermission)('teacher:audit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveTeacher", null);
__decorate([
    (0, common_1.Post)('teachers/:id/reject'),
    (0, permission_decorator_1.RequirePermission)('teacher:audit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectTeacher", null);
__decorate([
    (0, common_1.Get)('orgs'),
    (0, permission_decorator_1.RequirePermission)('org:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrgs", null);
__decorate([
    (0, common_1.Post)('orgs/:id/approve'),
    (0, permission_decorator_1.RequirePermission)('org:audit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveOrg", null);
__decorate([
    (0, common_1.Post)('orgs/:id/reject'),
    (0, permission_decorator_1.RequirePermission)('org:audit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectOrg", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permission_decorator_1.RequirePermission)('order:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('admins'),
    (0, permission_decorator_1.RequirePermission)('admin:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmins", null);
__decorate([
    (0, common_1.Get)('admins/:id'),
    (0, permission_decorator_1.RequirePermission)('admin:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmin", null);
__decorate([
    (0, common_1.Post)('admins'),
    (0, permission_decorator_1.RequirePermission)('admin:create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Put)('admins/:id'),
    (0, permission_decorator_1.RequirePermission)('admin:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdmin", null);
__decorate([
    (0, common_1.Put)('admins/:id/status'),
    (0, permission_decorator_1.RequirePermission)('admin:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminStatus", null);
__decorate([
    (0, common_1.Delete)('admins/:id'),
    (0, permission_decorator_1.RequirePermission)('admin:delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteAdmin", null);
__decorate([
    (0, common_1.Post)('admins/:id/reset-password'),
    (0, permission_decorator_1.RequirePermission)('admin:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetAdminPassword", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, permission_decorator_1.RequirePermission)('role:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, permission_decorator_1.RequirePermission)('role:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRole", null);
__decorate([
    (0, common_1.Put)('roles/:id'),
    (0, permission_decorator_1.RequirePermission)('role:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, permission_decorator_1.RequirePermission)('role:delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, permission_decorator_1.RequirePermission)('config:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    (0, permission_decorator_1.RequirePermission)('config:edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateConfig", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard)
], AdminController);
//# sourceMappingURL=admin.controller.js.map