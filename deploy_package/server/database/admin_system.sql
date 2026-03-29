-- =====================================================
-- 棉花糖教育平台 - 管理员系统数据库
-- 修复版：外键约束放到最后添加
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 管理员角色表
CREATE TABLE IF NOT EXISTS `admin_role` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL COMMENT '角色名称',
    `role_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色代码',
    `description` VARCHAR(255) COMMENT '角色描述',
    `permissions` JSON COMMENT '权限列表JSON',
    `status` TINYINT DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_role_code` (`role_code`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色表';

-- 2. 管理员表（不带外键约束）
CREATE TABLE IF NOT EXISTS `admin_user` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
    `real_name` VARCHAR(50) COMMENT '真实姓名',
    `email` VARCHAR(100) COMMENT '邮箱',
    `phone` VARCHAR(20) COMMENT '手机号',
    `avatar` VARCHAR(255) COMMENT '头像URL',
    `role_id` INT COMMENT '角色ID',
    `last_login_time` DATETIME COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(50) COMMENT '最后登录IP',
    `login_count` INT DEFAULT 0 COMMENT '登录次数',
    `status` TINYINT DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_username` (`username`),
    INDEX `idx_role_id` (`role_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 3. 管理员操作日志表
CREATE TABLE IF NOT EXISTS `admin_operation_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL COMMENT '管理员ID',
    `admin_name` VARCHAR(50) COMMENT '管理员用户名',
    `module` VARCHAR(50) COMMENT '操作模块',
    `action` VARCHAR(50) COMMENT '操作动作',
    `target_type` VARCHAR(50) COMMENT '操作对象类型',
    `target_id` INT COMMENT '操作对象ID',
    `content` TEXT COMMENT '操作内容',
    `ip` VARCHAR(50) COMMENT 'IP地址',
    `user_agent` VARCHAR(255) COMMENT '用户代理',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_id` (`admin_id`),
    INDEX `idx_module` (`module`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- 4. 权限定义表
CREATE TABLE IF NOT EXISTS `admin_permission` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `permission_name` VARCHAR(50) NOT NULL COMMENT '权限名称',
    `permission_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '权限代码',
    `module` VARCHAR(50) COMMENT '所属模块',
    `description` VARCHAR(255) COMMENT '权限描述',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_permission_code` (`permission_code`),
    INDEX `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限定义表';

-- 5. 管理员登录日志表
CREATE TABLE IF NOT EXISTS `admin_login_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT COMMENT '管理员ID',
    `username` VARCHAR(50) COMMENT '用户名',
    `login_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    `login_ip` VARCHAR(50) COMMENT '登录IP',
    `login_location` VARCHAR(100) COMMENT '登录地点',
    `user_agent` VARCHAR(255) COMMENT '用户代理',
    `login_status` TINYINT COMMENT '登录状态 1-成功 0-失败',
    `fail_reason` VARCHAR(255) COMMENT '失败原因',
    INDEX `idx_admin_id` (`admin_id`),
    INDEX `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员登录日志表';

-- =====================================================
-- 添加外键约束（在所有表创建之后）
-- =====================================================
ALTER TABLE `admin_user` ADD CONSTRAINT `fk_admin_user_role` FOREIGN KEY (`role_id`) REFERENCES `admin_role`(`id`) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 初始化数据
-- =====================================================

-- 清空现有权限数据（重新导入）
DELETE FROM `admin_permission` WHERE 1=1;

-- 插入权限定义
INSERT INTO `admin_permission` (`permission_name`, `permission_code`, `module`, `description`, `sort_order`) VALUES
-- 仪表盘
('查看仪表盘', 'dashboard:view', 'dashboard', '查看数据概览', 1),

-- 用户管理
('查看用户列表', 'user:list', 'user', '查看用户列表', 10),
('查看用户详情', 'user:detail', 'user', '查看用户详情', 11),
('编辑用户', 'user:edit', 'user', '编辑用户信息', 12),
('禁用用户', 'user:disable', 'user', '禁用/启用用户', 13),
('导出用户数据', 'user:export', 'user', '导出用户数据', 14),

-- 教师管理
('查看教师列表', 'teacher:list', 'teacher', '查看教师列表', 20),
('审核教师认证', 'teacher:verify', 'teacher', '审核教师认证', 21),
('编辑教师', 'teacher:edit', 'teacher', '编辑教师信息', 22),

-- 机构管理
('查看机构列表', 'org:list', 'org', '查看机构列表', 30),
('审核机构', 'org:audit', 'org', '审核机构入驻', 31),
('编辑机构', 'org:edit', 'org', '编辑机构信息', 32),

-- 订单管理
('查看订单列表', 'order:list', 'order', '查看订单列表', 40),
('查看订单详情', 'order:detail', 'order', '查看订单详情', 41),
('分配订单', 'order:assign', 'order', '分配订单给教师', 42),
('关闭订单', 'order:close', 'order', '关闭订单', 43),

-- 会员管理
('查看会员套餐', 'membership:list', 'membership', '查看会员套餐', 50),
('创建会员套餐', 'membership:create', 'membership', '创建会员套餐', 51),
('编辑会员套餐', 'membership:edit', 'membership', '编辑会员套餐', 52),
('删除会员套餐', 'membership:delete', 'membership', '删除会员套餐', 53),

-- 活动管理
('查看活动列表', 'activity:list', 'activity', '查看活动列表', 60),
('创建活动', 'activity:create', 'activity', '创建活动', 61),
('编辑活动', 'activity:edit', 'activity', '编辑活动', 62),
('删除活动', 'activity:delete', 'activity', '删除活动', 63),

-- 商品管理
('查看商品列表', 'product:list', 'product', '查看商品列表', 70),
('创建商品', 'product:create', 'product', '创建商品', 71),
('编辑商品', 'product:edit', 'product', '编辑商品', 72),
('删除商品', 'product:delete', 'product', '删除商品', 73),

-- 广告位管理
('查看广告列表', 'banner:list', 'banner', '查看广告列表', 80),
('创建广告', 'banner:create', 'banner', '创建广告', 81),
('编辑广告', 'banner:edit', 'banner', '编辑广告', 82),
('删除广告', 'banner:delete', 'banner', '删除广告', 83),

-- 分佣管理
('查看分佣记录', 'commission:list', 'commission', '查看分佣记录', 90),
('结算分佣', 'commission:settle', 'commission', '结算分佣', 91),

-- 提现管理
('查看提现申请', 'withdrawal:list', 'withdrawal', '查看提现申请', 100),
('审核提现', 'withdrawal:audit', 'withdrawal', '审核提现申请', 101),

-- 代理管理
('查看代理商列表', 'agent:list', 'agent', '查看代理商列表', 110),
('创建代理商', 'agent:create', 'agent', '创建代理商', 111),
('编辑代理商', 'agent:edit', 'agent', '编辑代理商', 112),

-- 系统配置
('查看系统配置', 'config:view', 'config', '查看系统配置', 120),
('修改系统配置', 'config:edit', 'config', '修改系统配置', 121),

-- 支付配置
('查看支付配置', 'payment:view', 'payment', '查看支付配置', 130),
('修改支付配置', 'payment:edit', 'payment', '修改支付配置', 131),

-- 管理员管理
('查看管理员列表', 'admin:list', 'admin', '查看管理员列表', 140),
('创建管理员', 'admin:create', 'admin', '创建管理员', 141),
('编辑管理员', 'admin:edit', 'admin', '编辑管理员', 142),
('删除管理员', 'admin:delete', 'admin', '删除管理员', 143),

-- 角色管理
('查看角色列表', 'role:list', 'role', '查看角色列表', 150),
('创建角色', 'role:create', 'role', '创建角色', 151),
('编辑角色', 'role:edit', 'role', '编辑角色', 152),
('删除角色', 'role:delete', 'role', '删除角色', 153);

-- 清空现有角色数据（重新导入）
DELETE FROM `admin_role` WHERE 1=1;

-- 插入默认角色
INSERT INTO `admin_role` (`id`, `role_name`, `role_code`, `description`, `permissions`, `status`) VALUES
(1, '超级管理员', 'super_admin', '拥有所有权限', '["dashboard:view","user:list","user:detail","user:edit","user:disable","user:export","teacher:list","teacher:verify","teacher:edit","org:list","org:audit","org:edit","order:list","order:detail","order:assign","order:close","membership:list","membership:create","membership:edit","membership:delete","activity:list","activity:create","activity:edit","activity:delete","product:list","product:create","product:edit","product:delete","banner:list","banner:create","banner:edit","banner:delete","commission:list","commission:settle","withdrawal:list","withdrawal:audit","agent:list","agent:create","agent:edit","config:view","config:edit","payment:view","payment:edit","admin:list","admin:create","admin:edit","admin:delete","role:list","role:create","role:edit","role:delete"]', 1),
(2, '运营管理员', 'operator', '负责日常运营管理', '["dashboard:view","user:list","user:detail","teacher:list","teacher:verify","org:list","order:list","order:detail","membership:list","activity:list","activity:create","activity:edit","product:list","product:edit","banner:list","banner:create","banner:edit","commission:list","withdrawal:list"]', 1),
(3, '客服管理员', 'customer_service', '负责客服和用户管理', '["dashboard:view","user:list","user:detail","user:edit","order:list","order:detail","withdrawal:list"]', 1),
(4, '财务管理', 'finance', '负责财务和分佣管理', '["dashboard:view","order:list","commission:list","commission:settle","withdrawal:list","withdrawal:audit"]', 1),
(5, '内容管理', 'content_manager', '负责内容和活动管理', '["dashboard:view","activity:list","activity:create","activity:edit","product:list","product:create","product:edit","banner:list","banner:create","banner:edit"]', 1);

-- 清空现有管理员数据
DELETE FROM `admin_user` WHERE 1=1;

-- 插入默认超级管理员账号
-- 密码: admin123 (bcrypt加密后的哈希值)
INSERT INTO `admin_user` (`id`, `username`, `password`, `real_name`, `role_id`, `status`) VALUES
(1, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '超级管理员', 1, 1);

-- 默认账号信息:
-- 用户名: admin
-- 密码: admin123

SELECT '管理员系统初始化完成！' AS message;
SELECT '默认账号: admin / admin123' AS account_info;
