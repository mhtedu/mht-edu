-- ============================================
-- 棉花糖教育平台 - 完整数据库初始化脚本
-- 适用于 MySQL 5.7+
-- 版本：v2.0.0 (无外键约束版本)
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 第一部分：删除所有表（按依赖顺序）
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
DROP TABLE IF EXISTS `admin_operation_log`;
DROP TABLE IF EXISTS `admin_user`;
DROP TABLE IF EXISTS `admin_role`;
DROP TABLE IF EXISTS `admin_permission`;
DROP TABLE IF EXISTS `site_config`;
DROP TABLE IF EXISTS `system_config`;

-- ============================================
-- 第二部分：创建所有表（不包含外键约束）
-- ============================================

-- ------------------------------
-- 1. 用户表
-- ------------------------------
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mobile` VARCHAR(20) NOT NULL COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `role` TINYINT NOT NULL DEFAULT 0 COMMENT '角色：0=家长，1=教师，2=机构',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=禁用，1=正常',
  `gender` TINYINT DEFAULT NULL COMMENT '性别：1=男，2=女',
  `membership_type` TINYINT NOT NULL DEFAULT 0 COMMENT '会员类型：0=普通，1=月度，2=年度',
  `membership_expire_at` DATETIME DEFAULT NULL COMMENT '会员过期时间',
  `is_super_member` TINYINT NOT NULL DEFAULT 0 COMMENT '是否超级会员：0=否，1=是',
  `super_member_expire_at` DATETIME DEFAULT NULL COMMENT '超级会员过期时间',
  `city_name` VARCHAR(50) DEFAULT NULL COMMENT '所在城市',
  `inviter_id` INT DEFAULT NULL COMMENT '邀请人ID',
  `referral_code` VARCHAR(20) DEFAULT NULL COMMENT '专属推荐码',
  `locked_by` INT DEFAULT NULL COMMENT '被锁定的推荐人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mobile` (`mobile`),
  UNIQUE KEY `uk_referral_code` (`referral_code`),
  KEY `idx_role` (`role`),
  KEY `idx_city` (`city_name`),
  KEY `idx_inviter` (`inviter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ------------------------------
-- 2. 教师资料表
-- ------------------------------
CREATE TABLE `teacher_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(100) DEFAULT NULL COMMENT '教师职称/头衔',
  `subjects` VARCHAR(200) DEFAULT NULL COMMENT '教授科目（JSON数组）',
  `education` VARCHAR(50) DEFAULT NULL COMMENT '学历',
  `experience_years` INT DEFAULT 0 COMMENT '教学年限',
  `bio` TEXT DEFAULT NULL COMMENT '个人简介',
  `certificates` TEXT DEFAULT NULL COMMENT '资格证书（JSON数组）',
  `photos` TEXT DEFAULT NULL COMMENT '教学照片（JSON数组）',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `service_radius` INT DEFAULT 5000 COMMENT '服务半径（米）',
  `rating` DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分',
  `review_count` INT DEFAULT 0 COMMENT '评价数量',
  `student_count` INT DEFAULT 0 COMMENT '学生数量',
  `is_verified` TINYINT NOT NULL DEFAULT 0 COMMENT '是否认证：0=否，1=是',
  `is_featured` TINYINT NOT NULL DEFAULT 0 COMMENT '是否推荐：0=否，1=是',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_location` (`latitude`, `longitude`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师资料表';

-- ------------------------------
-- 3. 机构表
-- ------------------------------
CREATE TABLE `organizations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT '机构名称',
  `logo` VARCHAR(500) DEFAULT NULL COMMENT '机构Logo',
  `description` TEXT DEFAULT NULL COMMENT '机构简介',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '详细地址',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `contact_name` VARCHAR(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `business_license` VARCHAR(100) DEFAULT NULL COMMENT '营业执照号',
  `is_verified` TINYINT NOT NULL DEFAULT 0 COMMENT '是否认证',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构表';

-- ------------------------------
-- 4. 订单表
-- ------------------------------
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `user_id` INT NOT NULL COMMENT '家长ID',
  `teacher_id` INT DEFAULT NULL COMMENT '接单教师ID',
  `title` VARCHAR(200) NOT NULL COMMENT '订单标题',
  `description` TEXT DEFAULT NULL COMMENT '需求描述',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '科目',
  `grade` VARCHAR(20) DEFAULT NULL COMMENT '年级',
  `student_count` INT DEFAULT 1 COMMENT '学生数量',
  `lesson_count` INT DEFAULT NULL COMMENT '课时数量',
  `budget_min` DECIMAL(10,2) DEFAULT NULL COMMENT '预算下限',
  `budget_max` DECIMAL(10,2) DEFAULT NULL COMMENT '预算上限',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '上门地址',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=待接单，1=进行中，2=已完成，3=已关闭',
  `accepted_at` DATETIME DEFAULT NULL COMMENT '接单时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_status` (`status`),
  KEY `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ------------------------------
-- 5. 会话表
-- ------------------------------
CREATE TABLE `conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user1_id` INT NOT NULL COMMENT '用户1 ID',
  `user2_id` INT NOT NULL COMMENT '用户2 ID',
  `last_message` TEXT DEFAULT NULL COMMENT '最后一条消息',
  `last_message_at` DATETIME DEFAULT NULL COMMENT '最后消息时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users` (`user1_id`, `user2_id`),
  KEY `idx_user2` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- ------------------------------
-- 6. 消息表
-- ------------------------------
CREATE TABLE `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `content` TEXT NOT NULL COMMENT '消息内容',
  `type` TINYINT NOT NULL DEFAULT 0 COMMENT '类型：0=文本，1=图片，2=语音',
  `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- ------------------------------
-- 7. 活动表
-- ------------------------------
CREATE TABLE `activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '活动标题',
  `cover` VARCHAR(500) DEFAULT NULL COMMENT '封面图片',
  `description` TEXT DEFAULT NULL COMMENT '活动描述',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `location` VARCHAR(200) DEFAULT NULL COMMENT '活动地点',
  `max_participants` INT DEFAULT NULL COMMENT '最大参与人数',
  `current_participants` INT DEFAULT 0 COMMENT '当前参与人数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=未开始，1=进行中，2=已结束',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动表';

-- ------------------------------
-- 8. 活动报名表
-- ------------------------------
CREATE TABLE `activity_signups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `activity_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=取消，1=已报名',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_user` (`activity_id`, `user_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动报名表';

-- ------------------------------
-- 9. 产品分类表
-- ------------------------------
CREATE TABLE `product_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `icon` VARCHAR(500) DEFAULT NULL COMMENT '分类图标',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品分类表';

-- ------------------------------
-- 10. 产品表
-- ------------------------------
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT DEFAULT NULL,
  `name` VARCHAR(200) NOT NULL COMMENT '产品名称',
  `cover` VARCHAR(500) DEFAULT NULL COMMENT '封面图片',
  `images` TEXT DEFAULT NULL COMMENT '产品图片（JSON数组）',
  `description` TEXT DEFAULT NULL COMMENT '产品描述',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `original_price` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
  `stock` INT DEFAULT 0 COMMENT '库存',
  `sales` INT DEFAULT 0 COMMENT '销量',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=下架，1=上架',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表';

-- ------------------------------
-- 11. 收益表
-- ------------------------------
CREATE TABLE `earnings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `type` TINYINT NOT NULL COMMENT '类型：1=分销佣金，2=推荐奖励',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=待结算，1=已结算',
  `related_id` INT DEFAULT NULL COMMENT '关联ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收益表';

-- ------------------------------
-- 12. 提现表
-- ------------------------------
CREATE TABLE `withdrawals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL COMMENT '提现金额',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=待审核，1=已通过，2=已拒绝',
  `alipay_account` VARCHAR(100) DEFAULT NULL COMMENT '支付宝账号',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提现表';

-- ------------------------------
-- 13. 牛师班表
-- ------------------------------
CREATE TABLE `elite_classes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL COMMENT '教师ID',
  `title` VARCHAR(200) NOT NULL COMMENT '班级标题',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '科目',
  `grade` VARCHAR(20) DEFAULT NULL COMMENT '年级',
  `description` TEXT DEFAULT NULL COMMENT '班级描述',
  `cover` VARCHAR(500) DEFAULT NULL COMMENT '封面图片',
  `max_students` INT DEFAULT 10 COMMENT '最大学生数',
  `current_students` INT DEFAULT 0 COMMENT '当前学生数',
  `price_per_lesson` DECIMAL(10,2) DEFAULT NULL COMMENT '每课时价格',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=筹备中，1=进行中，2=已结束',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班表';

-- ------------------------------
-- 14. 牛师班学生表
-- ------------------------------
CREATE TABLE `elite_class_students` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `class_id` INT NOT NULL,
  `student_id` INT NOT NULL COMMENT '学生（家长）ID',
  `referrer_id` INT DEFAULT NULL COMMENT '推荐人ID',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1=在读',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_student` (`class_id`, `student_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_referrer` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班学生表';

-- ------------------------------
-- 15. 牛师班课时表
-- ------------------------------
CREATE TABLE `elite_class_lessons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `class_id` INT NOT NULL,
  `lesson_no` INT NOT NULL COMMENT '课时编号',
  `title` VARCHAR(200) DEFAULT NULL COMMENT '课时标题',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=未开始，1=进行中，2=已结束',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班课时表';

-- ------------------------------
-- 16. 牛师班学生课时消耗表
-- ------------------------------
CREATE TABLE `elite_class_student_lessons` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lesson_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `is_present` TINYINT DEFAULT 1 COMMENT '是否出勤',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lesson_student` (`lesson_id`, `student_id`),
  KEY `idx_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班学生课时消耗表';

-- ------------------------------
-- 17. 教师动态表
-- ------------------------------
CREATE TABLE `teacher_moments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL,
  `content` TEXT NOT NULL COMMENT '动态内容',
  `images` TEXT DEFAULT NULL COMMENT '图片（JSON数组）',
  `like_count` INT DEFAULT 0 COMMENT '点赞数',
  `comment_count` INT DEFAULT 0 COMMENT '评论数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师动态表';

-- ------------------------------
-- 18. 订单评价表
-- ------------------------------
CREATE TABLE `order_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT '评价人（家长）',
  `teacher_id` INT NOT NULL COMMENT '被评价教师',
  `rating` TINYINT NOT NULL COMMENT '评分：1-5',
  `content` TEXT DEFAULT NULL COMMENT '评价内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单评价表';

-- ------------------------------
-- 19. 支付记录表
-- ------------------------------
CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `order_no` VARCHAR(32) NOT NULL COMMENT '支付单号',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
  `type` TINYINT NOT NULL COMMENT '类型：1=会员，2=超级会员，3=产品',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=待支付，1=已支付，2=已退款',
  `payment_method` VARCHAR(20) DEFAULT NULL COMMENT '支付方式',
  `transaction_id` VARCHAR(100) DEFAULT NULL COMMENT '第三方交易号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- ------------------------------
-- 20. 推荐锁定表
-- ------------------------------
CREATE TABLE `referral_locks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '被锁定用户',
  `locker_id` INT NOT NULL COMMENT '锁定推荐人',
  `locked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  KEY `idx_locker` (`locker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐锁定表';

-- ------------------------------
-- 21. 分享记录表
-- ------------------------------
CREATE TABLE `share_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` TINYINT NOT NULL COMMENT '类型：1=教师主页，2=活动，3=需求',
  `related_id` INT DEFAULT NULL COMMENT '关联ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享记录表';

-- ------------------------------
-- 22. 消息提醒表
-- ------------------------------
CREATE TABLE `message_reminders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` TINYINT NOT NULL COMMENT '类型：1=新订单，2=新消息，3=活动提醒',
  `content` TEXT DEFAULT NULL,
  `is_read` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息提醒表';

-- ------------------------------
-- 23. 通知表
-- ------------------------------
CREATE TABLE `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) DEFAULT NULL,
  `content` TEXT DEFAULT NULL,
  `type` TINYINT DEFAULT NULL,
  `is_read` TINYINT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ------------------------------
-- 24. 订单关闭历史表
-- ------------------------------
CREATE TABLE `order_close_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `reason` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单关闭历史表';

-- ------------------------------
-- 25. 会员套餐表
-- ------------------------------
CREATE TABLE `memberships` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `type` TINYINT NOT NULL COMMENT '1=月度，2=年度',
  `price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2) DEFAULT NULL,
  `features` TEXT DEFAULT NULL COMMENT '权益说明（JSON）',
  `sort` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员套餐表';

-- ------------------------------
-- 26. 超级会员套餐表
-- ------------------------------
CREATE TABLE `super_memberships` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` TINYINT NOT NULL,
  `start_at` DATETIME NOT NULL,
  `expire_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='超级会员套餐表';

-- ------------------------------
-- 27. 城市表
-- ------------------------------
CREATE TABLE `cities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '城市名称',
  `province` VARCHAR(50) DEFAULT NULL COMMENT '省份',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `is_hot` TINYINT NOT NULL DEFAULT 0 COMMENT '是否热门城市',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_province` (`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='城市表';

-- ------------------------------
-- 28. 管理员角色表
-- ------------------------------
CREATE TABLE `admin_role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `role_name` VARCHAR(50) DEFAULT NULL COMMENT '角色显示名',
  `role_code` VARCHAR(50) DEFAULT NULL COMMENT '角色代码',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
  `permissions` TEXT DEFAULT NULL COMMENT '权限列表（JSON）',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=禁用，1=启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色表';

-- ------------------------------
-- 29. 管理员用户表
-- ------------------------------
CREATE TABLE `admin_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像',
  `role_id` INT DEFAULT NULL COMMENT '角色ID',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0=禁用，1=启用',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `login_count` INT DEFAULT 0 COMMENT '登录次数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表';

-- ------------------------------
-- 30. 管理员操作日志表
-- ------------------------------
CREATE TABLE `admin_operation_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '管理员ID',
  `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target` VARCHAR(200) DEFAULT NULL COMMENT '操作对象',
  `detail` TEXT DEFAULT NULL COMMENT '操作详情',
  `ip` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ------------------------------
-- 31. 站点配置表
-- ------------------------------
CREATE TABLE `site_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT DEFAULT NULL COMMENT '配置值',
  `config_type` VARCHAR(20) DEFAULT 'string' COMMENT '配置类型：string,number,json,boolean',
  `description` VARCHAR(200) DEFAULT NULL COMMENT '配置说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点配置表';

SELECT '✅ 所有表创建完成' AS message;

-- ============================================
-- 第三部分：插入演示数据
-- ============================================

-- 插入用户演示数据
INSERT INTO `users` (`id`, `mobile`, `password`, `nickname`, `avatar`, `role`, `status`, `gender`, `membership_type`, `membership_expire_at`, `is_super_member`, `super_member_expire_at`, `city_name`, `inviter_id`) VALUES
(1, '13800000001', '$2b$10$xxxxxxxx', '平台管理员', '', 0, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(100, '13800000100', '$2b$10$xxxxxxxx', '张老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', 1, 1, 1, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '北京', NULL),
(101, '13800000101', '$2b$10$xxxxxxxx', '李老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', 1, 1, 2, 1, '2025-06-30 23:59:59', 0, NULL, '北京', 100),
(102, '13800000102', '$2b$10$xxxxxxxx', '王老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', 1, 1, 1, 0, NULL, 0, NULL, '北京', 100),
(103, '13800000103', '$2b$10$xxxxxxxx', '刘老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', 1, 1, 2, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '上海', NULL),
(104, '13800000104', '$2b$10$xxxxxxxx', '陈老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', 1, 1, 1, 0, NULL, 0, NULL, '上海', 103),
(105, '13800000105', '$2b$10$xxxxxxxx', '周老师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou', 1, 1, 2, 1, '2025-12-31 23:59:59', 1, '2025-12-31 23:59:59', '广州', NULL),
(200, '13800000200', '$2b$10$xxxxxxxx', '家长张先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent1', 0, 1, 1, 1, '2025-06-30 23:59:59', 0, NULL, '北京', 100),
(201, '13800000201', '$2b$10$xxxxxxxx', '家长李女士', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent2', 0, 1, 2, 0, NULL, 0, NULL, '北京', 100),
(202, '13800000202', '$2b$10$xxxxxxxx', '家长王先生', 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent3', 0, 1, 1, 1, '2025-06-30 23:59:59', 0, NULL, '上海', 103);

-- 插入教师资料演示数据
INSERT INTO `teacher_profiles` (`user_id`, `title`, `subjects`, `education`, `experience_years`, `bio`, `rating`, `review_count`, `student_count`, `is_verified`, `is_featured`, `latitude`, `longitude`, `service_radius`) VALUES
(100, '数学名师', '["数学","奥数"]', '硕士', 10, '海淀区重点中学数学教师，擅长奥数辅导', 4.95, 28, 45, 1, 1, 39.9599, 116.2982, 10000),
(101, '语文教师', '["语文","作文"]', '本科', 5, '专注于小学语文教学，作文指导经验丰富', 4.80, 15, 30, 1, 0, 39.9042, 116.4074, 5000),
(102, '英语教师', '["英语","口语"]', '本科', 3, '英语专业八级，擅长口语培训', 4.70, 8, 15, 0, 0, 39.9142, 116.4074, 3000),
(103, '物理教师', '["物理"]', '硕士', 8, '北京某重点高中物理教师，竞赛辅导经验丰富', 4.90, 22, 38, 1, 1, 31.2304, 121.4737, 8000),
(104, '化学教师', '["化学"]', '本科', 4, '化学师范专业毕业，教学方法独特', 4.65, 6, 12, 0, 0, 31.2304, 121.4737, 5000),
(105, '数学教师', '["数学"]', '硕士', 6, '广州某培训机构数学教研组长', 4.85, 18, 28, 1, 0, 23.1291, 113.2644, 6000);

-- 插入订单演示数据
INSERT INTO `orders` (`id`, `order_no`, `user_id`, `teacher_id`, `title`, `description`, `subject`, `grade`, `student_count`, `lesson_count`, `budget_min`, `budget_max`, `status`, `created_at`) VALUES
(1, 'ORD20250101001', 200, 100, '小学数学辅导', '需要一位有经验的数学老师，孩子五年级', '数学', '五年级', 1, 20, 150, 200, 1, NOW()),
(2, 'ORD20250101002', 201, 101, '作文辅导', '孩子写作能力较弱，需要系统辅导', '语文', '四年级', 1, 10, 120, 150, 0, NOW()),
(3, 'ORD20250101003', 202, 103, '高中物理竞赛辅导', '希望找有竞赛辅导经验的老师', '物理', '高二', 1, 30, 300, 400, 1, NOW());

-- 插入会员套餐数据
INSERT INTO `memberships` (`name`, `type`, `price`, `original_price`, `features`, `sort`) VALUES
('月度会员', 1, 29.90, 49.90, '["查看教师联系方式","发布需求不限次数","优先推荐"]', 1),
('年度会员', 2, 199.00, 598.80, '["查看教师联系方式","发布需求不限次数","优先推荐","专属客服"]', 2);

-- 插入活动演示数据
INSERT INTO `activities` (`title`, `cover`, `description`, `start_time`, `end_time`, `location`, `max_participants`, `current_participants`, `status`) VALUES
('数学思维训练营', 'https://api.dicebear.com/7.x/shapes/svg?seed=math', '培养数学思维能力，激发学习兴趣', '2025-02-01 09:00:00', '2025-02-03 17:00:00', '海淀区中关村大街', 50, 35, 0),
('作文写作技巧讲座', 'https://api.dicebear.com/7.x/shapes/svg?seed=writing', '掌握写作技巧，提高作文水平', '2025-01-20 14:00:00', '2025-01-20 17:00:00', '线上直播', 200, 128, 1);

-- 插入热门城市数据
INSERT INTO `cities` (`name`, `province`, `latitude`, `longitude`, `is_hot`, `sort`) VALUES
('北京', '北京', 39.9042, 116.4074, 1, 1),
('上海', '上海', 31.2304, 121.4737, 1, 2),
('广州', '广东', 23.1291, 113.2644, 1, 3),
('深圳', '广东', 22.5431, 114.0579, 1, 4),
('杭州', '浙江', 30.2741, 120.1551, 1, 5),
('南京', '江苏', 32.0603, 118.7969, 1, 6),
('成都', '四川', 30.5728, 104.0668, 1, 7),
('武汉', '湖北', 30.5928, 114.3055, 1, 8),
('天津', '天津', 39.0842, 117.2009, 0, 9),
('重庆', '重庆', 29.4316, 106.9123, 0, 10),
('西安', '陕西', 34.3416, 108.9398, 0, 11),
('苏州', '江苏', 31.2989, 120.5853, 0, 12),
('郑州', '河南', 34.7466, 113.6254, 0, 13),
('长沙', '湖南', 28.2282, 112.9388, 0, 14),
('青岛', '山东', 36.0671, 120.3826, 0, 15);

-- 插入产品分类数据
INSERT INTO `product_categories` (`name`, `icon`, `sort`) VALUES
('教辅书籍', 'https://api.dicebear.com/7.x/shapes/svg?seed=book', 1),
('学习文具', 'https://api.dicebear.com/7.x/shapes/svg?seed=pen', 2),
('电子设备', 'https://api.dicebear.com/7.x/shapes/svg?seed=device', 3),
('课程礼包', 'https://api.dicebear.com/7.x/shapes/svg?seed=gift', 4);

-- 插入产品数据
INSERT INTO `products` (`category_id`, `name`, `cover`, `description`, `price`, `original_price`, `stock`, `sales`, `status`) VALUES
(1, '小学数学思维训练套装', 'https://api.dicebear.com/7.x/shapes/svg?seed=math-set', '包含小学1-6年级数学思维训练教材', 99.00, 158.00, 500, 128, 1),
(2, '高级学习文具礼盒', 'https://api.dicebear.com/7.x/shapes/svg?seed=stationery', '包含铅笔、橡皮、尺子、笔袋等', 68.00, 98.00, 300, 56, 1),
(3, '智能学习平板', 'https://api.dicebear.com/7.x/shapes/svg?seed=tablet', '10.1英寸学习平板，内置海量学习资源', 1999.00, 2999.00, 50, 12, 1),
(4, '寒假数学特训营', 'https://api.dicebear.com/7.x/shapes/svg?seed=camp', '名师直播授课，10课时强化训练', 599.00, 999.00, 100, 89, 1);

-- 插入站点配置
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `description`) VALUES
('site_name', '棉花糖教育成长平台', 'string', '站点名称'),
('site_logo', 'https://api.dicebear.com/7.x/shapes/svg?seed=mht', 'string', '站点Logo'),
('contact_phone', '400-123-4567', 'string', '客服电话'),
('contact_email', 'support@mht-edu.com', 'string', '客服邮箱'),
('membership_price_monthly', '29.90', 'number', '月度会员价格'),
('membership_price_yearly', '199.00', 'number', '年度会员价格'),
('super_member_price', '999.00', 'number', '超级会员价格'),
('referral_reward_rate', '0.1', 'number', '推荐奖励比例'),
('withdraw_min_amount', '100', 'number', '最低提现金额'),
('service_radius_default', '5000', 'number', '默认服务半径（米）');

-- 插入管理员角色
INSERT INTO `admin_role` (`id`, `name`, `role_name`, `role_code`, `description`, `permissions`, `status`) VALUES
(1, '超级管理员', '超级管理员', 'super_admin', '拥有所有权限', '["*"]', 1),
(2, '运营管理员', '运营管理员', 'operator', '负责日常运营管理', '["user.*","order.*","activity.*","product.*"]', 1),
(3, '客服', '客服', 'service', '负责用户咨询和投诉处理', '["user.view","order.view","activity.view"]', 1);

-- 插入默认超级管理员账号
-- 密码: admin123 (bcrypt加密后的哈希值)
INSERT INTO `admin_user` (`id`, `username`, `password`, `real_name`, `role_id`, `status`) VALUES
(1, 'admin', '$2b$10$l5yw7zkS19pyB/PD//iOEuWCvWegtY0Ch9S/bccrEYe5EcrxUGBA6', '超级管理员', 1, 1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '============================================' AS '';
SELECT '✅ 数据库初始化完成！' AS message;
SELECT '============================================' AS '';
SELECT '默认管理员账号信息：' AS info;
SELECT '用户名: admin' AS username;
SELECT '密码: admin123' AS password;
SELECT '============================================' AS '';
