-- ============================================
-- 棉花糖教育平台 - 完整数据库初始化脚本
-- 修复版：外键约束放到最后添加
-- 版本：v1.0.1
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mht_edu;

-- ============================================
-- 第一部分：删除所有表
-- ============================================
DROP TABLE IF EXISTS `elite_class_student_lessons`;
DROP TABLE IF EXISTS `elite_class_lessons`;
DROP TABLE IF EXISTS `elite_class_students`;
DROP TABLE IF EXISTS `elite_classes`;
DROP TABLE IF EXISTS `order_reviews`;
DROP TABLE IF EXISTS `order_close_history`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `teacher_moments`;
DROP TABLE IF EXISTS `teacher_profiles`;
DROP TABLE IF EXISTS `activities`;
DROP TABLE IF EXISTS `activity_signups`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `product_categories`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `conversations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `message_reminders`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `withdrawals`;
DROP TABLE IF EXISTS `earnings`;
DROP TABLE IF EXISTS `referral_locks`;
DROP TABLE IF EXISTS `share_records`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `memberships`;
DROP TABLE IF EXISTS `super_memberships`;
DROP TABLE IF EXISTS `organizations`;
DROP TABLE IF EXISTS `users`;

-- ============================================
-- 第二部分：创建所有表（不包含外键约束）
-- ============================================

-- ------------------------------
-- 1. 用户表
-- ------------------------------
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
-- 6. 超级会员表
-- ------------------------------
CREATE TABLE `super_memberships` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `type` TINYINT NOT NULL COMMENT '类型: 1购买 2邀请达标',
    `start_at` DATETIME NOT NULL COMMENT '开始时间',
    `expire_at` DATETIME NOT NULL COMMENT '过期时间',
    `invite_teacher_count` INT DEFAULT 0 COMMENT '邀请教师数',
    `invite_parent_count` INT DEFAULT 0 COMMENT '邀请家长数',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 1有效 0无效',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='超级会员表';

-- ------------------------------
-- 7. 支付记录表
-- ------------------------------
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
-- 8. 收益记录表
-- ------------------------------
CREATE TABLE `earnings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `type` SMALLINT NOT NULL COMMENT '类型: 1课时分成 2推荐奖励 3代理分佣',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
    `order_id` INT COMMENT '关联订单',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算 2已提现',
    `description` VARCHAR(255) COMMENT '说明',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收益记录表';

-- ------------------------------
-- 9. 提现表
-- ------------------------------
CREATE TABLE `withdrawals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '提现金额',
    `status` SMALLINT DEFAULT 0 COMMENT '状态: 0待审核 1已通过 2已拒绝 3已打款',
    `bank_name` VARCHAR(50) COMMENT '银行名称',
    `bank_account` VARCHAR(50) COMMENT '银行账号',
    `real_name` VARCHAR(20) COMMENT '真实姓名',
    `reject_reason` VARCHAR(255) COMMENT '拒绝原因',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提现表';

-- ------------------------------
-- 10. 消息会话表
-- ------------------------------
CREATE TABLE `conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user1_id` INT NOT NULL COMMENT '用户1ID',
    `user2_id` INT NOT NULL COMMENT '用户2ID',
    `last_message` TEXT COMMENT '最后一条消息',
    `last_message_time` DATETIME COMMENT '最后消息时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user1` (`user1_id`),
    INDEX `idx_user2` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息会话表';

-- ------------------------------
-- 11. 消息表
-- ------------------------------
CREATE TABLE `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL COMMENT '会话ID',
    `sender_id` INT NOT NULL COMMENT '发送者ID',
    `receiver_id` INT NOT NULL COMMENT '接收者ID',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `type` SMALLINT DEFAULT 1 COMMENT '类型: 1文本 2图片 3联系方式 4试课邀请',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_conversation` (`conversation_id`),
    INDEX `idx_sender` (`sender_id`),
    INDEX `idx_receiver` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ------------------------------
-- 12. 消息提醒表
-- ------------------------------
CREATE TABLE `message_reminders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `type` SMALLINT NOT NULL COMMENT '类型: 1新消息 2订单更新 3会员到期 4系统通知',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `content` TEXT COMMENT '内容',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息提醒表';

-- ------------------------------
-- 13. 通知表
-- ------------------------------
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '用户ID',
    `type` SMALLINT NOT NULL COMMENT '类型',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `content` TEXT COMMENT '内容',
    `data` JSON COMMENT '附加数据',
    `is_read` TINYINT DEFAULT 0 COMMENT '是否已读',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ------------------------------
-- 14. 教师动态表
-- ------------------------------
CREATE TABLE `teacher_moments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `teacher_id` INT NOT NULL COMMENT '教师ID',
    `content` TEXT NOT NULL COMMENT '内容',
    `images` JSON COMMENT '图片列表',
    `video_url` VARCHAR(255) COMMENT '视频链接',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT DEFAULT 0 COMMENT '评论数',
    `status` SMALLINT DEFAULT 1 COMMENT '状态: 1正常 0隐藏',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_teacher` (`teacher_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师动态表';

-- ------------------------------
-- 15. 订单评价表
-- ------------------------------
CREATE TABLE `order_reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL COMMENT '订单ID',
    `user_id` INT NOT NULL COMMENT '评价用户ID',
    `teacher_id` INT NOT NULL COMMENT '教师ID',
    `rating` SMALLINT NOT NULL COMMENT '评分1-5',
    `content` TEXT COMMENT '评价内容',
    `images` JSON COMMENT '图片列表',
    `is_anonymous` TINYINT DEFAULT 0 COMMENT '是否匿名',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order` (`order_id`),
    INDEX `idx_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单评价表';

-- ------------------------------
-- 16. 订单关闭历史表
-- ------------------------------
CREATE TABLE `order_close_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL COMMENT '订单ID',
    `user_id` INT NOT NULL COMMENT '操作用户ID',
    `reason` VARCHAR(255) COMMENT '关闭原因',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单关闭历史表';

-- ------------------------------
-- 17. 活动表
-- ------------------------------
CREATE TABLE `activities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
    `type` VARCHAR(20) NOT NULL COMMENT '类型: visit/lecture/training',
    `cover_image` VARCHAR(255) COMMENT '封面图',
    `description` TEXT COMMENT '活动描述',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `end_time` DATETIME NOT NULL COMMENT '结束时间',
    `address` VARCHAR(255) COMMENT '地址',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `is_online` TINYINT DEFAULT 0 COMMENT '是否线上',
    `online_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线上价格',
    `offline_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线下价格',
    `max_participants` INT DEFAULT 0 COMMENT '最大参与人数',
    `current_participants` INT DEFAULT 0 COMMENT '当前参与人数',
    `target_roles` JSON COMMENT '目标角色',
    `status` SMALLINT DEFAULT 1 COMMENT '状态: 1进行中 0已结束',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_type` (`type`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- ------------------------------
-- 18. 活动报名表
-- ------------------------------
CREATE TABLE `activity_signups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `activity_id` INT NOT NULL COMMENT '活动ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `participation_type` SMALLINT DEFAULT 1 COMMENT '参与方式: 1线上 2线下',
    `status` SMALLINT DEFAULT 1 COMMENT '状态: 1已报名 0已取消',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_activity` (`activity_id`),
    INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';

-- ------------------------------
-- 19. 商品分类表
-- ------------------------------
CREATE TABLE `product_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- ------------------------------
-- 20. 商品表
-- ------------------------------
CREATE TABLE `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT COMMENT '分类ID',
    `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
    `description` TEXT COMMENT '商品描述',
    `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
    `original_price` DECIMAL(10,2) COMMENT '原价',
    `image` VARCHAR(255) COMMENT '主图',
    `images` JSON COMMENT '图片列表',
    `stock` INT DEFAULT -1 COMMENT '库存(-1无限)',
    `sales` INT DEFAULT 0 COMMENT '销量',
    `type` SMALLINT DEFAULT 1 COMMENT '类型: 1实物 2虚拟',
    `delivery_type` SMALLINT DEFAULT 1 COMMENT '交付方式: 1快递 2下载 3网盘',
    `file_url` VARCHAR(255) COMMENT '文件链接',
    `pan_url` VARCHAR(255) COMMENT '网盘链接',
    `status` TINYINT DEFAULT 1 COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category` (`category_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ------------------------------
-- 21. 分销关系锁定表
-- ------------------------------
CREATE TABLE `referral_locks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '被锁定的用户ID',
    `locker_id` INT UNSIGNED NOT NULL COMMENT '锁定者ID',
    `lock_type` VARCHAR(20) NOT NULL COMMENT '锁定类型: invite_link/teacher_profile/activity/elite_class',
    `lock_source_id` INT UNSIGNED COMMENT '锁定来源ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user` (`user_id`),
    INDEX `idx_locker` (`locker_id`),
    INDEX `idx_lock_type` (`lock_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分销关系锁定表';

-- ------------------------------
-- 22. 分享记录表
-- ------------------------------
CREATE TABLE `share_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT '分享者ID',
    `share_type` VARCHAR(20) NOT NULL COMMENT '分享类型',
    `share_source_id` INT COMMENT '分享来源ID',
    `share_code` VARCHAR(20) COMMENT '分享码',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_share_code` (`share_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享记录表';

-- ------------------------------
-- 23. 城市表
-- ------------------------------
CREATE TABLE `cities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(10) NOT NULL COMMENT '城市编码',
    `name` VARCHAR(50) NOT NULL COMMENT '城市名称',
    `province` VARCHAR(50) COMMENT '省份',
    `latitude` DECIMAL(10,7) COMMENT '纬度',
    `longitude` DECIMAL(10,7) COMMENT '经度',
    `status` TINYINT DEFAULT 1 COMMENT '状态',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='城市表';

-- ------------------------------
-- 24. 牛师班表
-- ------------------------------
CREATE TABLE `elite_classes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
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
    PRIMARY KEY (`id`),
    INDEX `idx_teacher` (`teacher_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_subject` (`subject`),
    INDEX `idx_location` (`latitude`, `longitude`),
    INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班表';

-- ------------------------------
-- 25. 牛师班报名表
-- ------------------------------
CREATE TABLE `elite_class_students` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` INT UNSIGNED NOT NULL COMMENT '牛师班ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生ID',
    `referrer_id` INT UNSIGNED DEFAULT NULL COMMENT '推荐人ID',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1正常 0退出',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_class_student` (`class_id`, `student_id`),
    INDEX `idx_class` (`class_id`),
    INDEX `idx_student` (`student_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_referrer` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班报名表';

-- ------------------------------
-- 26. 牛师班课时记录表
-- ------------------------------
CREATE TABLE `elite_class_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
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
    PRIMARY KEY (`id`),
    INDEX `idx_class` (`class_id`),
    INDEX `idx_lesson_time` (`lesson_time`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班课时记录表';

-- ------------------------------
-- 27. 牛师班学生课时消耗表
-- ------------------------------
CREATE TABLE `elite_class_student_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lesson_id` INT UNSIGNED NOT NULL COMMENT '课时ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0已签到 1已请假 2旷课',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_lesson` (`lesson_id`),
    INDEX `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班学生课时消耗表';

-- ============================================
-- 第三部分：添加外键约束
-- ============================================

ALTER TABLE `teacher_profiles` ADD CONSTRAINT `fk_teacher_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `organizations` ADD CONSTRAINT `fk_org_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `fk_payment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `earnings` ADD CONSTRAINT `fk_earning_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `withdrawals` ADD CONSTRAINT `fk_withdrawal_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `conversations` ADD CONSTRAINT `fk_conv_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `conversations` ADD CONSTRAINT `fk_conv_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;
ALTER TABLE `message_reminders` ADD CONSTRAINT `fk_reminder_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `teacher_moments` ADD CONSTRAINT `fk_moment_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `order_reviews` ADD CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
ALTER TABLE `order_reviews` ADD CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `order_reviews` ADD CONSTRAINT `fk_review_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `order_close_history` ADD CONSTRAINT `fk_close_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;
ALTER TABLE `order_close_history` ADD CONSTRAINT `fk_close_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `activity_signups` ADD CONSTRAINT `fk_signup_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE;
ALTER TABLE `activity_signups` ADD CONSTRAINT `fk_signup_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL;
ALTER TABLE `referral_locks` ADD CONSTRAINT `fk_lock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `referral_locks` ADD CONSTRAINT `fk_lock_locker` FOREIGN KEY (`locker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `share_records` ADD CONSTRAINT `fk_share_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_classes` ADD CONSTRAINT `fk_elite_class_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_class_students` ADD CONSTRAINT `fk_enrollment_class` FOREIGN KEY (`class_id`) REFERENCES `elite_classes` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_class_students` ADD CONSTRAINT `fk_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_class_students` ADD CONSTRAINT `fk_enrollment_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `elite_class_lessons` ADD CONSTRAINT `fk_lesson_class` FOREIGN KEY (`class_id`) REFERENCES `elite_classes` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_class_student_lessons` ADD CONSTRAINT `fk_student_lesson_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `elite_class_lessons` (`id`) ON DELETE CASCADE;
ALTER TABLE `elite_class_student_lessons` ADD CONSTRAINT `fk_student_lesson_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `super_memberships` ADD CONSTRAINT `fk_super_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '表结构创建完成！' AS message;
