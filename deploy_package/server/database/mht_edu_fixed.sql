-- ============================================
-- 棉花糖教育平台 - 完整数据库初始化脚本
-- 包含：表结构 + 演示数据
-- 版本：v2.0.0 (修复版，无外键约束)
-- 日期：2025-03-28
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 第一部分：基础表结构
-- ============================================

-- ------------------------------
-- 1. 用户表
-- ------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `openid` VARCHAR(64) COMMENT '微信openid',
    `unionid` VARCHAR(64) COMMENT '微信unionid',
    `mobile` VARCHAR(20) COMMENT '手机号',
    `password` VARCHAR(255) COMMENT '密码',
    `nickname` VARCHAR(50) COMMENT '昵称',
    `avatar` VARCHAR(255) COMMENT '头像',
    `role` SMALLINT NOT NULL DEFAULT 0 COMMENT '角色: 0家长 1教师 2机构 3城市代理',
    `status` SMALLINT DEFAULT 1 COMMENT '状态: 1正常 0封禁',
    `gender` SMALLINT DEFAULT 0 COMMENT '性别: 0未知 1男 2女',
    `membership_type` SMALLINT DEFAULT 0 COMMENT '会员类型: 0免费 1付费',
    `membership_expire_at` DATETIME COMMENT '会员过期时间',
    `membership_terminated` SMALLINT DEFAULT 0 COMMENT '会员权益是否被终止',
    `is_super_member` TINYINT DEFAULT 0 COMMENT '是否超级会员',
    `super_member_expire_at` DATETIME COMMENT '超级会员过期时间',
    `wechat_id` VARCHAR(50) COMMENT '微信号',
    `wechat_qrcode` VARCHAR(255) COMMENT '微信二维码',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `city_code` VARCHAR(10) COMMENT '城市编码',
    `city_name` VARCHAR(50) COMMENT '城市名称',
    `inviter_id` INT COMMENT '一级邀请人ID',
    `inviter_2nd_id` INT COMMENT '二级邀请人ID',
    `city_agent_id` INT COMMENT '所属城市代理ID',
    `affiliated_org_id` INT COMMENT '所属机构ID',
    `last_login_at` DATETIME COMMENT '最后登录时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_openid` (`openid`),
    INDEX `idx_mobile` (`mobile`),
    INDEX `idx_inviter` (`inviter_id`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_city` (`city_code`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ------------------------------
-- 2. 教师扩展表
-- ------------------------------
DROP TABLE IF EXISTS `teacher_profiles`;
CREATE TABLE `teacher_profiles` (
    `user_id` INT PRIMARY KEY COMMENT '用户ID',
    `real_name` VARCHAR(20) COMMENT '真实姓名',
    `gender` SMALLINT COMMENT '性别: 1男 2女',
    `birth_year` INT COMMENT '出生年份',
    `education` VARCHAR(50) COMMENT '学历',
    `school` VARCHAR(100) COMMENT '毕业院校',
    `major` VARCHAR(50) COMMENT '专业',
    `certificates` JSON COMMENT '证书列表',
    `subjects` JSON COMMENT '教学科目',
    `grades` JSON COMMENT '教学年级',
    `teaching_years` INT DEFAULT 0 COMMENT '教学年限',
    `max_distance` INT DEFAULT 10 COMMENT '最大接单距离(km)',
    `hourly_rate_min` DECIMAL(10,2) COMMENT '最低时薪',
    `hourly_rate_max` DECIMAL(10,2) COMMENT '最高时薪',
    `one_line_intro` VARCHAR(100) COMMENT '一句话介绍',
    `intro` TEXT COMMENT '详细介绍',
    `teaching_style` VARCHAR(200) COMMENT '教学风格',
    `achievements` TEXT COMMENT '教学成果',
    `rating` DECIMAL(3,2) DEFAULT 5.0 COMMENT '评分',
    `rating_count` INT DEFAULT 0 COMMENT '评价数',
    `student_count` INT DEFAULT 0 COMMENT '学生数',
    `order_count` INT DEFAULT 0 COMMENT '订单数',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `verify_status` SMALLINT DEFAULT 0 COMMENT '认证状态: 0未认证 1认证中 2已认证 3认证失败',
    `verify_time` DATETIME COMMENT '认证时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_rating` (`rating`),
    INDEX `idx_teaching_years` (`teaching_years`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师扩展表';

-- ------------------------------
-- 3. 机构表
-- ------------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '关联用户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '机构名称',
    `logo` VARCHAR(255) COMMENT '机构Logo',
    `description` TEXT COMMENT '机构介绍',
    `address` VARCHAR(255) COMMENT '机构地址',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `contact_name` VARCHAR(20) COMMENT '联系人',
    `contact_phone` VARCHAR(20) COMMENT '联系电话',
    `business_license` VARCHAR(255) COMMENT '营业执照',
    `verify_status` SMALLINT DEFAULT 0 COMMENT '认证状态',
    `teacher_count` INT DEFAULT 0 COMMENT '教师数量',
    `student_count` INT DEFAULT 0 COMMENT '学生数量',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构表';

-- ------------------------------
-- 4. 订单/需求表
-- ------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_no` VARCHAR(32) COMMENT '订单编号',
    `user_id` INT NOT NULL COMMENT '发布者ID（家长）',
    `subject` VARCHAR(20) NOT NULL COMMENT '科目',
    `student_grade` VARCHAR(20) COMMENT '学生年级',
    `student_gender` SMALLINT DEFAULT 0 COMMENT '学生性别',
    `teaching_mode` SMALLINT DEFAULT 1 COMMENT '授课方式: 1上门 2线上 3均可',
    `address` VARCHAR(255) COMMENT '上课地址',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `time_slots` JSON COMMENT '上课时间段',
    `hourly_rate` DECIMAL(10,2) COMMENT '期望时薪',
    `hourly_rate_negotiable` TINYINT DEFAULT 1 COMMENT '时薪是否可议',
    `description` TEXT COMMENT '需求描述',
    `teacher_requirements` TEXT COMMENT '教师要求',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待接单 1已接单 2进行中 3已完成 4已取消',
    `assigned_teacher_id` INT COMMENT '接单教师ID',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `apply_count` INT DEFAULT 0 COMMENT '抢单次数',
    `expire_at` DATETIME COMMENT '过期时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_subject` (`subject`),
    INDEX `idx_status` (`status`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_assigned_teacher` (`assigned_teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单/需求表';

-- ------------------------------
-- 5. 会员套餐表
-- ------------------------------
DROP TABLE IF EXISTS `memberships`;
CREATE TABLE `memberships` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
    `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
    `original_price` DECIMAL(10,2) COMMENT '原价',
    `duration_days` INT NOT NULL COMMENT '有效天数',
    `features` TEXT COMMENT '权益说明',
    `role` VARCHAR(20) COMMENT '适用角色: all/parent/teacher/org',
    `is_super` TINYINT DEFAULT 0 COMMENT '是否超级会员套餐',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 1上架 0下架',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员套餐表';

-- ------------------------------
-- 6. 支付记录表
-- ------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_no` VARCHAR(32) COMMENT '支付单号',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `order_id` INT COMMENT '关联订单ID',
    `membership_id` INT COMMENT '会员套餐ID',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待支付 1已支付 2已退款 3已取消',
    `payment_method` VARCHAR(20) COMMENT '支付方式: wechat/alipay',
    `transaction_id` VARCHAR(64) COMMENT '第三方交易号',
    `paid_at` DATETIME COMMENT '支付时间',
    `refunded_at` DATETIME COMMENT '退款时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_payment_no` (`payment_no`),
    INDEX `idx_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- ------------------------------
-- 7. 佣金表
-- ------------------------------
DROP TABLE IF EXISTS `commissions`;
CREATE TABLE `commissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '收款用户ID',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '佣金金额',
    `type` VARCHAR(20) COMMENT '佣金类型: order_share/membership_share/elite_class_share',
    `order_id` INT COMMENT '关联订单ID',
    `from_user_id` INT COMMENT '来源用户ID',
    `level` SMALLINT DEFAULT 1 COMMENT '分销层级: 1一级 2二级',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算 2已提现',
    `settled_at` DATETIME COMMENT '结算时间',
    `withdrawn_at` DATETIME COMMENT '提现时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_from_user` (`from_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='佣金表';

-- ------------------------------
-- 8. 活动表
-- ------------------------------
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
    `type` VARCHAR(20) COMMENT '活动类型: visit/training/lecture/other',
    `cover_image` VARCHAR(255) COMMENT '封面图',
    `images` JSON COMMENT '图片列表',
    `description` TEXT COMMENT '活动描述',
    `start_time` DATETIME COMMENT '开始时间',
    `end_time` DATETIME COMMENT '结束时间',
    `address` VARCHAR(255) COMMENT '活动地址',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `is_online` TINYINT DEFAULT 0 COMMENT '是否有线上参与',
    `online_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线上价格',
    `offline_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线下价格',
    `max_participants` INT DEFAULT 0 COMMENT '最大参与人数',
    `current_participants` INT DEFAULT 0 COMMENT '当前参与人数',
    `target_roles` JSON COMMENT '目标角色: [0,1]表示家长和教师',
    `organizer_id` INT COMMENT '组织者ID',
    `organizer_type` VARCHAR(20) COMMENT '组织者类型: platform/org/agent',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0草稿 1报名中 2进行中 3已结束',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_type` (`type`),
    INDEX `idx_status` (`status`),
    INDEX `idx_start_time` (`start_time`),
    INDEX `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- ------------------------------
-- 9. 活动报名表
-- ------------------------------
DROP TABLE IF EXISTS `activity_registrations`;
CREATE TABLE `activity_registrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `activity_id` INT NOT NULL COMMENT '活动ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `participation_type` SMALLINT DEFAULT 1 COMMENT '参与方式: 1线上 2线下',
    `amount` DECIMAL(10,2) DEFAULT 0 COMMENT '支付金额',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待支付 1已报名 2已签到 3已取消',
    `referrer_id` INT COMMENT '推荐人ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_activity_user` (`activity_id`, `user_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';

-- ------------------------------
-- 10. 消息表
-- ------------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `from_user_id` INT NOT NULL COMMENT '发送者ID',
    `to_user_id` INT NOT NULL COMMENT '接收者ID',
    `content` TEXT COMMENT '消息内容',
    `msg_type` SMALLINT DEFAULT 1 COMMENT '消息类型: 1文本 2图片 3语音 4名片 5订单',
    `extra_data` JSON COMMENT '扩展数据',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `read_at` DATETIME COMMENT '阅读时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_from` (`from_user_id`),
    INDEX `idx_to` (`to_user_id`),
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ------------------------------
-- 11. 会话表
-- ------------------------------
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user1_id` INT NOT NULL COMMENT '用户1ID',
    `user2_id` INT NOT NULL COMMENT '用户2ID',
    `last_message` TEXT COMMENT '最后一条消息',
    `last_message_time` DATETIME COMMENT '最后消息时间',
    `user1_unread` INT DEFAULT 0 COMMENT '用户1未读数',
    `user2_unread` INT DEFAULT 0 COMMENT '用户2未读数',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_users` (`user1_id`, `user2_id`),
    INDEX `idx_user1` (`user1_id`),
    INDEX `idx_user2` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- ------------------------------
-- 12. 城市代理表
-- ------------------------------
DROP TABLE IF EXISTS `city_agents`;
CREATE TABLE `city_agents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `city_code` VARCHAR(10) NOT NULL COMMENT '城市编码',
    `city_name` VARCHAR(50) NOT NULL COMMENT '城市名称',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待审核 1已开通 2已禁用',
    `deposit` DECIMAL(10,2) DEFAULT 0 COMMENT '保证金',
    `commission_rate` DECIMAL(5,2) DEFAULT 5.00 COMMENT '佣金比例(%)',
    `total_earnings` DECIMAL(10,2) DEFAULT 0 COMMENT '累计收益',
    `settled_earnings` DECIMAL(10,2) DEFAULT 0 COMMENT '已结算收益',
    `apply_time` DATETIME COMMENT '申请时间',
    `approve_time` DATETIME COMMENT '审核时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_city` (`city_code`),
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='城市代理表';

-- ------------------------------
-- 13. 分享链接表
-- ------------------------------
DROP TABLE IF EXISTS `share_links`;
CREATE TABLE `share_links` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `share_code` VARCHAR(32) NOT NULL COMMENT '分享码',
    `user_id` INT NOT NULL COMMENT '分享者ID',
    `target_type` VARCHAR(20) NOT NULL COMMENT '目标类型: order/teacher/activity/elite_class',
    `target_id` INT NOT NULL COMMENT '目标ID',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `share_count` INT DEFAULT 0 COMMENT '分享次数',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_share_code` (`share_code`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享链接表';

-- ------------------------------
-- 14. 分享日志表
-- ------------------------------
DROP TABLE IF EXISTS `share_logs`;
CREATE TABLE `share_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `share_code` VARCHAR(32) NOT NULL COMMENT '分享码',
    `user_id` INT COMMENT '分享者ID',
    `channel` VARCHAR(20) COMMENT '分享渠道: wechat/moment/qrcode',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_share_code` (`share_code`),
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享日志表';

-- ------------------------------
-- 15. 分享浏览日志表
-- ------------------------------
DROP TABLE IF EXISTS `share_view_logs`;
CREATE TABLE `share_view_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `share_code` VARCHAR(32) NOT NULL COMMENT '分享码',
    `viewer_id` INT COMMENT '浏览者ID',
    `ip` VARCHAR(50) COMMENT 'IP地址',
    `user_agent` VARCHAR(500) COMMENT 'User-Agent',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_share_code` (`share_code`),
    INDEX `idx_viewer` (`viewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享浏览日志表';

-- ------------------------------
-- 16. 潜在用户表（通过分享访问的未注册用户）
-- ------------------------------
DROP TABLE IF EXISTS `potential_users`;
CREATE TABLE `potential_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `share_code` VARCHAR(32) NOT NULL COMMENT '分享码',
    `inviter_id` INT NOT NULL COMMENT '邀请人ID',
    `openid` VARCHAR(64) COMMENT '微信openid',
    `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending待注册 converted已转化',
    `converted_user_id` INT COMMENT '转化后的用户ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_share_code` (`share_code`),
    INDEX `idx_inviter` (`inviter_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='潜在用户表';

-- ============================================
-- 第二部分：牛师班相关表
-- ============================================

-- ------------------------------
-- 17. 牛师班表
-- ------------------------------
DROP TABLE IF EXISTS `elite_classes`;
CREATE TABLE `elite_classes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `teacher_id` INT UNSIGNED NOT NULL COMMENT '教师用户ID',
    `class_name` VARCHAR(100) NOT NULL COMMENT '班级名称',
    `subject` VARCHAR(50) NOT NULL COMMENT '科目',
    `start_time` DATETIME NOT NULL COMMENT '开课时间',
    `total_lessons` INT NOT NULL DEFAULT 0 COMMENT '总课时',
    `current_lesson` INT NOT NULL DEFAULT 0 COMMENT '当前进度(已上课时)',
    `address` VARCHAR(255) NOT NULL COMMENT '上课地址',
    `latitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '纬度',
    `longitude` DECIMAL(10, 7) DEFAULT NULL COMMENT '经度',
    `hourly_rate` DECIMAL(10, 2) NOT NULL COMMENT '单课时费',
    `max_students` INT NOT NULL DEFAULT 20 COMMENT '最大学生数',
    `current_students` INT NOT NULL DEFAULT 0 COMMENT '当前报名人数',
    `description` TEXT COMMENT '班级描述',
    `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0招生中 1进行中 2已结束 3已取消',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_teacher` (`teacher_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_subject` (`subject`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班表';

-- ------------------------------
-- 18. 牛师班报名表
-- ------------------------------
DROP TABLE IF EXISTS `elite_class_enrollments`;
CREATE TABLE `elite_class_enrollments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `class_id` INT UNSIGNED NOT NULL COMMENT '牛师班ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生(家长)ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待确认 1已确认 2试课中 3已正式报名 4已退课',
    `trial_lesson` TINYINT DEFAULT 1 COMMENT '是否试课: 0否 1是',
    `trial_time` DATETIME DEFAULT NULL COMMENT '试课时间',
    `enrolled_at` DATETIME DEFAULT NULL COMMENT '正式报名时间',
    `referrer_id` INT UNSIGNED DEFAULT NULL COMMENT '推荐人ID(分享链接锁定)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_class_student` (`class_id`, `student_id`),
    INDEX `idx_student` (`student_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_referrer` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班报名表';

-- ------------------------------
-- 19. 牛师班课时记录表
-- ------------------------------
DROP TABLE IF EXISTS `elite_class_lessons`;
CREATE TABLE `elite_class_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `class_id` INT UNSIGNED NOT NULL COMMENT '牛师班ID',
    `lesson_no` INT NOT NULL COMMENT '课时序号',
    `lesson_time` DATETIME NOT NULL COMMENT '上课时间',
    `duration` INT DEFAULT 60 COMMENT '课时时长(分钟)',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待上课 1进行中 2已结束',
    `teacher_income` DECIMAL(10, 2) DEFAULT 0 COMMENT '教师收入',
    `platform_income` DECIMAL(10, 2) DEFAULT 0 COMMENT '平台收入(5%)',
    `referrer_income` DECIMAL(10, 2) DEFAULT 0 COMMENT '推荐人收入(10%)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_class` (`class_id`),
    INDEX `idx_lesson_time` (`lesson_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班课时记录表';

-- ------------------------------
-- 20. 牛师班学生课时消耗表
-- ------------------------------
DROP TABLE IF EXISTS `elite_class_student_lessons`;
CREATE TABLE `elite_class_student_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `lesson_id` INT UNSIGNED NOT NULL COMMENT '课时ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0已签到 1已请假 2旷课',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_lesson` (`lesson_id`),
    INDEX `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班学生课时消耗表';

-- ============================================
-- 第三部分：分销关系锁定表（核心）
-- ============================================

-- ------------------------------
-- 21. 分销关系锁定表
-- ------------------------------
DROP TABLE IF EXISTS `referral_locks`;
CREATE TABLE `referral_locks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT '被锁定的用户ID',
    `locker_id` INT UNSIGNED NOT NULL COMMENT '锁定者ID(分享者)',
    `lock_type` VARCHAR(50) NOT NULL COMMENT '锁定类型: teacher_profile/order/activity/elite_class/invite_link/qrcode',
    `lock_source_id` INT UNSIGNED DEFAULT NULL COMMENT '锁定来源ID(如教师ID、订单ID等)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_lock` (`user_id`),
    INDEX `idx_locker` (`locker_id`),
    INDEX `idx_lock_type` (`lock_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分销关系锁定表';

-- ------------------------------
-- 22. 分销关系锁定日志表
-- ------------------------------
DROP TABLE IF EXISTS `referral_lock_logs`;
CREATE TABLE `referral_lock_logs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT '被锁定的用户ID',
    `locker_id` INT UNSIGNED NOT NULL COMMENT '锁定者ID',
    `lock_type` VARCHAR(50) NOT NULL COMMENT '锁定类型',
    `lock_source_id` INT UNSIGNED DEFAULT NULL COMMENT '锁定来源ID',
    `ip` VARCHAR(50) COMMENT 'IP地址',
    `user_agent` VARCHAR(500) COMMENT 'User-Agent',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_locker` (`locker_id`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分销关系锁定日志表';

-- ------------------------------
-- 23. 超级会员表
-- ------------------------------
DROP TABLE IF EXISTS `super_memberships`;
CREATE TABLE `super_memberships` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `type` TINYINT NOT NULL COMMENT '类型: 1付费购买 2邀请达标(教师10人) 3邀请达标(家长10人)',
    `start_at` DATETIME NOT NULL COMMENT '开始时间',
    `expire_at` DATETIME NOT NULL COMMENT '过期时间',
    `invite_teacher_count` INT DEFAULT 0 COMMENT '邀请教师数',
    `invite_parent_count` INT DEFAULT 0 COMMENT '邀请家长数',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1有效 0失效',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='超级会员表';

-- ============================================
-- 第四部分：演示数据
-- ============================================

-- ------------------------------
-- 用户演示数据
-- ------------------------------
INSERT INTO `users` (`id`, `mobile`, `password`, `nickname`, `avatar`, `role`, `status`, `gender`, `membership_type`, `membership_expire_at`, `is_super_member`, `super_member_expire_at`, `city_name`, `inviter_id`) VALUES
(1, '13800000001', '$2b$10$xxxxxxxx', '平台管理员', '', 0, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(100, '13800000100', '$2b$10$xxxxxxxx', '张老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', 1, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(101, '13800000101', '$2b$10$xxxxxxxx', '李老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', 1, 1, 2, 1, '2025-06-30 23:59:59', 0, NULL, '北京', 100),
(102, '13800000102', '$2b$10$xxxxxxxx', '王老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', 1, 1, 1, 0, NULL, 0, NULL, '北京', 100),
(103, '13800000103', '$2b$10$xxxxxxxx', '刘老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', 1, 1, 2, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '上海', NULL),
(104, '13800000104', '$2b$10$xxxxxxxx', '陈老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', 1, 1, 1, 0, NULL, 0, NULL, '上海', 103),
(105, '13800000105', '$2b$10$xxxxxxxx', '周老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou', 1, 1, 2, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '广州', NULL),
(106, '13800000106', '$2b$10$xxxxxxxx', '赵老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao', 1, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(107, '13800000107', '$2b$10$xxxxxxxx', '钱老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=qian', 1, 1, 2, 0, NULL, 0, NULL, '北京', 106),
(108, '13800000108', '$2b$10$xxxxxxxx', '孙老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun', 1, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(200, '13800000200', '$2b$10$xxxxxxxx', '家长张先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent1', 0, 1, 1, 1, '2025-06-30 23:59:59', 0, NULL, '北京', 100),
(201, '13800000201', '$2b$10$xxxxxxxx', '家长李女士', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent2', 0, 1, 2, 0, NULL, 0, NULL, '北京', 100),
(202, '13800000202', '$2b$10$xxxxxxxx', '家长王先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent3', 0, 1, 1, 1, '2025-06-30 23:59:59', 0, NULL, '上海', 103),
(203, '13800000203', '$2b$10$xxxxxxxx', '家长刘女士', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent4', 0, 1, 2, 0, NULL, 0, NULL, '广州', 105),
(204, '13800000204', '$2b$10$xxxxxxxx', '家长陈先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent5', 0, 1, 1, 0, NULL, 0, NULL, '北京', 106),
(300, '13800000300', '$2b$10$xxxxxxxx', '精英教育机构', 'https://api.dicebear.com/7.x/identicon/svg?seed=org1', 2, 1, 0, 1, '2025-12-31 23:59:59', 0, NULL, '北京', NULL),
(301, '13800000301', '$2b$10$xxxxxxxx', '智慧树教育', 'https://api.dicebear.com/7.x/identicon/svg?seed=org2', 2, 1, 0, 1, '2025-12-31 23:59:59', 0, NULL, '上海', NULL);

-- ------------------------------
-- 教师档案演示数据
-- ------------------------------
INSERT INTO `teacher_profiles` (`user_id`, `real_name`, `gender`, `birth_year`, `education`, `school`, `major`, `subjects`, `grades`, `teaching_years`, `hourly_rate_min`, `hourly_rate_max`, `one_line_intro`, `intro`, `teaching_style`, `achievements`, `rating`, `rating_count`, `student_count`, `order_count`, `view_count`, `verify_status`) VALUES
(100, '张伟', 1, 1985, '本科', '北京师范大学', '数学教育', '["数学"]', '["高中","初中"]', 10, 150, 200, '专注高中数学提分，平均提高30分', '10年高中数学教学经验，擅长将复杂问题简单化，帮助学生建立数学思维。', '耐心细致，注重基础', '2023年所带学生平均提高35分', 4.95, 128, 56, 42, 1520, 2),
(101, '李芳', 2, 1990, '硕士', '北京大学', '英语语言文学', '["英语"]', '["高中","初中","小学"]', 8, 120, 180, '英语专业八级，口语纯正', '英语专业硕士，专业八级，擅长口语和写作教学。', '互动式教学，注重应用', '学生口语成绩显著提升', 4.88, 95, 42, 38, 980, 2),
(103, '刘洋', 2, 1988, '本科', '华东师范大学', '物理教育', '["物理"]', '["高中"]', 12, 180, 250, '物理竞赛教练，培养多名省一等奖', '高中物理竞赛教练，培养过多名省一等奖学生。', '逻辑清晰，深入浅出', '2023年培养3名省一等奖', 4.92, 76, 38, 25, 850, 2),
(105, '周婷', 2, 1992, '本科', '华南师范大学', '语文教育', '["语文"]', '["高中","初中"]', 6, 100, 150, '作文教学专家，提分效果显著', '专注作文教学，擅长各类文体写作指导。', '启发式教学，培养思维', '学生作文平均提高10分', 4.85, 62, 35, 28, 720, 2),
(106, '赵强', 1, 1982, '硕士', '清华大学', '化学', '["化学"]', '["高中"]', 15, 200, 300, '清华硕士，化学竞赛金牌教练', '清华大学化学硕士，多年竞赛辅导经验。', '系统化教学，注重方法', '培养多名全国竞赛获奖者', 4.98, 156, 68, 52, 2100, 2),
(108, '孙磊', 1, 1987, '本科', '首都师范大学', '数学教育', '["数学"]', '["初中","小学"]', 8, 120, 160, '小学奥数教练，逻辑思维训练专家', '专注小学奥数和初中数学，逻辑思维训练。', '趣味教学，激发兴趣', '多名学生考入重点中学', 4.90, 88, 45, 35, 1100, 2);

-- ------------------------------
-- 机构演示数据
-- ------------------------------
INSERT INTO `organizations` (`id`, `user_id`, `name`, `logo`, `description`, `address`, `latitude`, `longitude`, `contact_name`, `contact_phone`, `verify_status`, `teacher_count`, `student_count`) VALUES
(1, 300, '精英教育机构', 'https://api.dicebear.com/7.x/identicon/svg?seed=org1', '专注中小学课外辅导，拥有资深教师团队', '北京市海淀区中关村大街1号', 39.9042, 116.4074, '王经理', '13800000001', 2, 15, 120),
(2, 301, '智慧树教育', 'https://api.dicebear.com/7.x/identicon/svg?seed=org2', '综合性教育机构，覆盖K12全科目', '上海市浦东新区陆家嘴环路100号', 31.2304, 121.4737, '李总监', '13800000002', 2, 20, 180);

-- ------------------------------
-- 会员套餐演示数据
-- ------------------------------
INSERT INTO `memberships` (`id`, `name`, `price`, `original_price`, `duration_days`, `features`, `role`, `is_super`, `sort_order`, `status`) VALUES
(1, '月度会员', 29.90, 49.90, 30, '查看联系方式,发布需求无限次,查看教师完整档案', 'all', 0, 1, 1),
(2, '季度会员', 79.90, 149.70, 90, '查看联系方式,发布需求无限次,查看教师完整档案,优先推荐', 'all', 0, 2, 1),
(3, '年度会员', 199.90, 598.80, 365, '查看联系方式,发布需求无限次,查看教师完整档案,优先推荐,专属客服', 'all', 0, 3, 1),
(4, '超级会员', 399.90, 799.90, 365, '所有会员权益,分销佣金比例更高,专属推广资源', 'all', 1, 4, 1);

-- ------------------------------
-- 牛师班演示数据
-- ------------------------------
INSERT INTO `elite_classes` (`id`, `teacher_id`, `class_name`, `subject`, `start_time`, `total_lessons`, `current_lesson`, `address`, `latitude`, `longitude`, `hourly_rate`, `max_students`, `current_students`, `description`, `status`) VALUES
(1, 100, '高中数学精品班', '数学', '2025-04-01 09:00:00', 20, 0, '北京市海淀区中关村大街1号', 39.9042, 116.4074, 150.00, 10, 3, '针对高二学生，系统复习高中数学重点难点', 0),
(2, 101, '初中英语提高班', '英语', '2025-04-05 14:00:00', 15, 0, '北京市朝阳区建国路88号', 39.9087, 116.4608, 120.00, 8, 2, '初中英语语法和阅读专项训练', 0),
(3, 106, '高中化学竞赛班', '化学', '2025-04-10 10:00:00', 30, 0, '北京市西城区金融街7号', 39.9139, 116.3663, 200.00, 5, 1, '针对化学竞赛的系统培训', 0);

-- ------------------------------
-- 活动演示数据
-- ------------------------------
INSERT INTO `activities` (`id`, `title`, `type`, `cover_image`, `description`, `start_time`, `end_time`, `address`, `latitude`, `longitude`, `is_online`, `online_price`, `offline_price`, `max_participants`, `current_participants`, `target_roles`, `status`) VALUES
(1, '家庭教育讲座：如何培养孩子的学习习惯', 'lecture', 'https://api.dicebear.com/7.x/shapes/svg?seed=lecture1', '邀请知名教育专家分享家庭教育经验', '2025-04-15 14:00:00', '2025-04-15 17:00:00', '北京市海淀区中关村大街1号', 39.9042, 116.4074, 1, 0, 0, 100, 35, '[0,1]', 1),
(2, '优秀教师教学经验分享会', 'training', 'https://api.dicebear.com/7.x/shapes/svg?seed=training1', '优秀教师现场演示教学技巧', '2025-04-20 09:00:00', '2025-04-20 12:00:00', '上海市浦东新区陆家嘴环路100号', 31.2304, 121.4737, 0, 0, 49.90, 50, 22, '[1]', 1);

SET FOREIGN_KEY_CHECKS = 1;
