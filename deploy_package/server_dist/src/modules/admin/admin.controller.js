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
        const [users] = await db.query('SELECT COUNT(*) as count FROM user WHERE status = 1');
        const [teachers] = await db.query('SELECT COUNT(*) as count FROM teacher WHERE verify_status = 1');
        const [orgs] = await db.query('SELECT COUNT(*) as count FROM organization WHERE verify_status = 1');
        const [orders] = await db.query('SELECT COUNT(*) as count FROM `order` WHERE status = 1');
        const [members] = await db.query('SELECT COUNT(*) as count FROM user WHERE member_expire_time > NOW()');
        const [revenue] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM `order` WHERE status = 1');
        return {
            totalUsers: users[0]?.count || 0,
            totalTeachers: teachers[0]?.count || 0,
            totalOrgs: orgs[0]?.count || 0,
            totalOrders: orders[0]?.count || 0,
            totalMembers: members[0]?.count || 0,
            totalRevenue: revenue[0]?.total || 0,
        };
    }
    async getAdmins() {
        const [admins] = await db.query(`
      SELECT 
        au.id, au.username, au.real_name, au.email, au.phone, 
        au.role_id, au.status, au.last_login_time, au.login_count, au.created_at,
        ar.role_name
      FROM admin_user au
      LEFT JOIN admin_role ar ON au.role_id = ar.id
      WHERE au.status != -1
      ORDER BY au.id ASC
    `);
        return admins;
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
       SET real_name = ?, email = ?, phone = ?, role_id = ?, status = ?, updated_at = NOW()
       WHERE id = ?`, [body.realName, body.email, body.phone, body.roleId, body.status, parseInt(id)]);
        return { success: true };
    }
    async deleteAdmin(id) {
        await db.update('UPDATE admin_user SET status = -1, updated_at = NOW() WHERE id = ?', [parseInt(id)]);
        return { success: true };
    }
    async resetAdminPassword(id) {
        const defaultPassword = '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await db.update('UPDATE admin_user SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, parseInt(id)]);
        return { success: true, password: defaultPassword };
    }
    async getRoles() {
        const [roles] = await db.query(`
      SELECT 
        ar.id, ar.role_name, ar.role_code, ar.description, ar.created_at,
        (SELECT COUNT(*) FROM admin_user WHERE role_id = ar.id AND status = 1) as user_count,
        JSON_LENGTH(ar.permissions) as permission_count
      FROM admin_role ar
      WHERE ar.status = 1
      ORDER BY ar.id ASC
    `);
        return roles.map(role => ({
            ...role,
            permissionCount: role.permission_count || 0,
            userCount: role.user_count || 0
        }));
    }
    async getPermissions() {
        const [permissions] = await db.query(`
      SELECT id, permission_name, permission_code, module, description
      FROM admin_permission
      WHERE status = 1
      ORDER BY module ASC, id ASC
    `);
        const grouped = {};
        permissions.forEach(p => {
            if (!grouped[p.module]) {
                grouped[p.module] = [];
            }
            grouped[p.module].push(p);
        });
        return grouped;
    }
    async updateRolePermissions(id, body) {
        await db.update('UPDATE admin_role SET permissions = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(body.permissions), parseInt(id)]);
        return { success: true };
    }
    async getUsers(page = '1', pageSize = '20', search = '', role = '') {
        const pageNum = parseInt(page);
        const pageSizeNum = parseInt(pageSize);
        const offset = (pageNum - 1) * pageSizeNum;
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (search) {
            whereClause += ' AND (nickname LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (role) {
            whereClause += ' AND role = ?';
            params.push(role);
        }
        const [list] = await db.query(`SELECT id, openid, nickname, phone, avatar, role, member_expire_time, created_at, status
       FROM user ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`, [...params, pageSizeNum, offset]);
        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM user ${whereClause}`, params);
        return {
            list,
            total: countResult[0]?.total || 0,
            page: pageNum,
            pageSize: pageSizeNum
        };
    }
    async getTeachers(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status) {
            whereClause += ' AND verify_status = ?';
            params.push(status);
        }
        const [teachers] = await db.query(`
      SELECT 
        t.id, t.user_id, t.name, t.phone, t.subjects, t.introduction,
        t.verify_status, t.rating, t.created_at,
        u.nickname, u.avatar
      FROM teacher t
      LEFT JOIN user u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.id DESC
    `, params);
        return teachers;
    }
    async getOrgs(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status) {
            whereClause += ' AND verify_status = ?';
            params.push(status);
        }
        const [orgs] = await db.query(`
      SELECT 
        o.id, o.user_id, o.name, o.contact_person, o.contact_phone,
        o.address, o.verify_status, o.created_at,
        u.nickname, u.avatar
      FROM organization o
      LEFT JOIN user u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.id DESC
    `, params);
        return orgs;
    }
    async getOrders(status = '') {
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        const [orders] = await db.query(`
      SELECT 
        o.id, o.order_no, o.user_id, o.order_type, o.amount,
        o.status, o.created_at,
        u.nickname as user_name
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.id DESC
    `, params);
        return orders;
    }
    async getConfig() {
        const [configs] = await db.query('SELECT config_key, config_value FROM site_config WHERE status = 1');
        const configMap = {};
        configs.forEach(c => {
            configMap[c.config_key] = c.config_value;
        });
        return configMap;
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
    (0, common_1.Get)('admins'),
    (0, permission_decorator_1.RequirePermission)('admin:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdmins", null);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
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
    (0, common_1.Get)('permissions'),
    (0, permission_decorator_1.RequirePermission)('role:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Put)('roles/:id/permissions'),
    (0, permission_decorator_1.RequirePermission)('role:edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRolePermissions", null);
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
    (0, common_1.Get)('teachers'),
    (0, permission_decorator_1.RequirePermission)('teacher:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)('orgs'),
    (0, permission_decorator_1.RequirePermission)('org:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrgs", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permission_decorator_1.RequirePermission)('order:view'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrders", null);
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