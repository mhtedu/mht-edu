-- ===========================================
-- 棉花糖教育平台 - MySQL 数据库结构
-- ===========================================
-- 创建时间: 2024-03
-- 数据库版本: MySQL 8.0+
-- 字符集: utf8mb4
-- ===========================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===================
-- 用户表
-- ===================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
    `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
    `mobile` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    `role` TINYINT NOT NULL DEFAULT 0 COMMENT '角色: 0家长 1教师 2机构 3代理商',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 1正常 0封禁',
    `membership_type` TINYINT DEFAULT 0 COMMENT '会员类型: 0免费 1付费',
    `membership_expire_at` DATETIME DEFAULT NULL COMMENT '会员过期时间',
    `latitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
    `longitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
    `city_code` VARCHAR(10) DEFAULT NULL COMMENT '城市编码',
    `inviter_id` INT UNSIGNED DEFAULT NULL COMMENT '一级邀请人ID',
    `inviter_2nd_id` INT UNSIGNED DEFAULT NULL COMMENT '二级邀请人ID',
    `city_agent_id` INT UNSIGNED DEFAULT NULL COMMENT '所属城市代理ID',
    `affiliated_org_id` INT UNSIGNED DEFAULT NULL COMMENT '挂靠机构ID',
    `invite_code` VARCHAR(20) DEFAULT NULL COMMENT '专属邀请码',
    `balance` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '账户余额(分)',
    `total_commission` DECIMAL(10, 2) DEFAULT 0.00 COMMENT '累计佣金(分)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_openid` (`openid`),
    UNIQUE KEY `uk_invite_code` (`invite_code`),
    INDEX `idx_mobile` (`mobile`),
    INDEX `idx_role` (`role`),
    INDEX `idx_inviter` (`inviter_id`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_city_agent` (`city_agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ===================
-- 教师扩展表
-- ===================
DROP TABLE IF EXISTS `teacher_profiles`;
CREATE TABLE `teacher_profiles` (
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `real_name` VARCHAR(20) DEFAULT NULL COMMENT '真实姓名',
    `gender` TINYINT DEFAULT NULL COMMENT '性别: 1男 2女',
    `birth_year` INT DEFAULT NULL COMMENT '出生年份',
    `education` VARCHAR(50) DEFAULT NULL COMMENT '学历',
    `certificates` JSON DEFAULT NULL COMMENT '资质证书',
    `subjects` JSON DEFAULT NULL COMMENT '教授科目',
    `max_distance` INT DEFAULT 10 COMMENT '最大接单距离(km)',
    `hourly_rate_min` DECIMAL(10, 2) DEFAULT NULL COMMENT '最低时薪',
    `hourly_rate_max` DECIMAL(10, 2) DEFAULT NULL COMMENT '最高时薪',
    `intro` TEXT DEFAULT NULL COMMENT '个人简介',
    `photos` JSON DEFAULT NULL COMMENT '照片列表',
    `teaching_years` INT DEFAULT 0 COMMENT '教龄',
    `student_count` INT DEFAULT 0 COMMENT '累计学生数',
    `order_count` INT DEFAULT 0 COMMENT '累计订单数',
    `avg_rating` DECIMAL(3, 2) DEFAULT 0.00 COMMENT '平均评分',
    `verify_status` TINYINT DEFAULT 0 COMMENT '认证状态: 0未认证 1认证中 2已认证 3认证失败',
    `verify_at` DATETIME DEFAULT NULL COMMENT '认证时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_teacher_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师扩展表';

-- ===================
-- 订单表
-- ===================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
    `parent_id` INT UNSIGNED NOT NULL COMMENT '家长用户ID',
    `teacher_id` INT UNSIGNED DEFAULT NULL COMMENT '接单教师ID',
    `subject` VARCHAR(20) NOT NULL COMMENT '科目',
    `hourly_rate` DECIMAL(10, 2) NOT NULL COMMENT '时薪',
    `student_grade` VARCHAR(20) DEFAULT NULL COMMENT '学生年级',
    `student_gender` TINYINT DEFAULT NULL COMMENT '学生性别: 1男 2女',
    `address` VARCHAR(255) DEFAULT NULL COMMENT '上课地址',
    `latitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
    `longitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
    `description` TEXT DEFAULT NULL COMMENT '需求描述',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待抢单 1已匹配 2试课中 3已签约 4已完成 5已解除',
    `matched_at` DATETIME DEFAULT NULL COMMENT '匹配时间',
    `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
    `cancel_reason` VARCHAR(255) DEFAULT NULL COMMENT '取消原因',
    `view_count` INT DEFAULT 0 COMMENT '查看次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    INDEX `idx_parent` (`parent_id`),
    INDEX `idx_teacher` (`teacher_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ===================
-- 会员套餐表
-- ===================
DROP TABLE IF EXISTS `membership_plans`;
CREATE TABLE `membership_plans` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
    `role` TINYINT NOT NULL COMMENT '适用角色',
    `duration_days` INT NOT NULL COMMENT '有效天数',
    `price` INT NOT NULL COMMENT '价格(分)',
    `original_price` INT DEFAULT NULL COMMENT '原价(分)',
    `features` JSON DEFAULT NULL COMMENT '权益说明',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员套餐表';

-- ===================
-- 交易记录表
-- ===================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `type` TINYINT NOT NULL COMMENT '类型: 1会员购买 2佣金提现 3订单支付',
    `amount` INT NOT NULL COMMENT '金额(分)',
    `balance_before` INT DEFAULT 0 COMMENT '变动前余额(分)',
    `balance_after` INT DEFAULT 0 COMMENT '变动后余额(分)',
    `status` TINYINT DEFAULT 0 COMMENT '状态: 0待处理 1成功 2失败',
    `related_id` INT UNSIGNED DEFAULT NULL COMMENT '关联ID',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- ===================
-- 佣金记录表
-- ===================
DROP TABLE IF EXISTS `commissions`;
CREATE TABLE `commissions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '获佣用户ID',
    `from_user_id` INT UNSIGNED NOT NULL COMMENT '来源用户ID',
    `order_id` INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
    `transaction_id` INT UNSIGNED DEFAULT NULL COMMENT '关联交易ID',
    `level` TINYINT NOT NULL COMMENT '层级: 1一级 2二级',
    `rate` DECIMAL(5, 2) NOT NULL COMMENT '佣金比例(%)',
    `amount` INT NOT NULL COMMENT '佣金金额(分)',
    `status` TINYINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算 2已提现',
    `settled_at` DATETIME DEFAULT NULL COMMENT '结算时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_from_user` (`from_user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='佣金记录表';

-- ===================
-- 消息表
-- ===================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `from_user_id` INT UNSIGNED NOT NULL COMMENT '发送者ID',
    `to_user_id` INT UNSIGNED NOT NULL COMMENT '接收者ID',
    `type` TINYINT NOT NULL COMMENT '类型: 1系统 2聊天 3订单通知',
    `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
    `content` TEXT NOT NULL COMMENT '内容',
    `related_id` INT UNSIGNED DEFAULT NULL COMMENT '关联ID',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_to_user` (`to_user_id`),
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ===================
-- 广告位表
-- ===================
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `link_url` VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
    `position` VARCHAR(20) DEFAULT 'home' COMMENT '位置',
    `sort` INT DEFAULT 0 COMMENT '排序',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
    `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
    `click_count` INT DEFAULT 0 COMMENT '点击次数',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_position` (`position`),
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广告位表';

-- ===================
-- 操作日志表
-- ===================
DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE `admin_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED DEFAULT NULL COMMENT '操作用户ID',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '目标类型',
    `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
    `content` TEXT DEFAULT NULL COMMENT '操作内容',
    `ip` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT '用户代理',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ===================
-- 初始数据
-- ===================

-- 插入会员套餐
INSERT INTO `membership_pl` (`name`, `role`, `duration_days`, `price`, `original_price`, `features`, `sort`) VALUES
('家长月卡', 0, 30, 9900, 12900, '["无限发布需求", "主动搜索教师", "查看联系方式", "分销返佣"]', 1),
('家长季卡', 0, 90, 26900, 38700, '["无限发布需求", "主动搜索教师", "查看联系方式", "分销返佣", "优先客服"]', 2),
('家长年卡', 0, 365, 89900, 154800, '["无限发布需求", "主动搜索教师", "查看联系方式", "分销返佣", "优先客服", "专属顾问"]', 3),
('教师月卡', 1, 30, 9900, 12900, '["无限抢单", "查看联系方式", "分销返佣"]', 1),
('教师季卡', 1, 90, 26900, 38700, '["无限抢单", "查看联系方式", "分销返佣", "优先派单"]', 2),
('教师年卡', 1, 365, 89900, 154800, '["无限抢单", "查看联系方式", "分销返佣", "优先派单", "专属展示"]', 3);

-- 插入测试广告
INSERT INTO `banners` (`title`, `image_url`, `link_url`, `position`, `sort`) VALUES
('欢迎来到棉花糖教育', 'https://placehold.co/750x300/2563EB/white?text=棉花糖教育', '', 'home', 1),
('开通会员享更多权益', 'https://placehold.co/750x300/F59E0B/white?text=会员特权', '/pages/membership/index', 'home', 2),
('邀请好友赚佣金', 'https://placehold.co/750x300/10B981/white?text=邀请有礼', '/pages/distribution/index', 'home', 3);

SET FOREIGN_KEY_CHECKS = 1;
