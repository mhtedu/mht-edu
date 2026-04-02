-- ===========================================
-- 牛师班功能 - 数据库表结构
-- ===========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===================
-- 牛师班表
-- ===================
DROP TABLE IF EXISTS `elite_classes`;
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
    INDEX `idx_start_time` (`start_time`),
    CONSTRAINT `fk_elite_class_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班表';

-- ===================
-- 牛师班报名表
-- ===================
DROP TABLE IF EXISTS `elite_class_enrollments`;
CREATE TABLE `elite_class_enrollments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_id` INT UNSIGNED NOT NULL COMMENT '牛师班ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生(家长)ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待确认 1已确认 2试课中 3已正式报名 4已退课',
    `trial_lesson` TINYINT DEFAULT 1 COMMENT '是否试课: 0否 1是',
    `trial_time` DATETIME DEFAULT NULL COMMENT '试课时间',
    `enrolled_at` DATETIME DEFAULT NULL COMMENT '正式报名时间',
    `referrer_id` INT UNSIGNED DEFAULT NULL COMMENT '推荐人ID(分享链接锁定)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_class_student` (`class_id`, `student_id`),
    INDEX `idx_student` (`student_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_referrer` (`referrer_id`),
    CONSTRAINT `fk_enrollment_class` FOREIGN KEY (`class_id`) REFERENCES `elite_classes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enrollment_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_enrollment_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班报名表';

-- ===================
-- 牛师班课时记录表
-- ===================
DROP TABLE IF EXISTS `elite_class_lessons`;
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
    CONSTRAINT `fk_lesson_class` FOREIGN KEY (`class_id`) REFERENCES `elite_classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班课时记录表';

-- ===================
-- 牛师班学生课时消耗表
-- ===================
DROP TABLE IF EXISTS `elite_class_student_lessons`;
CREATE TABLE `elite_class_student_lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lesson_id` INT UNSIGNED NOT NULL COMMENT '课时ID',
    `student_id` INT UNSIGNED NOT NULL COMMENT '学生ID',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0已签到 1已请假 2旷课',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_lesson` (`lesson_id`),
    INDEX `idx_student` (`student_id`),
    CONSTRAINT `fk_student_lesson_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `elite_class_lessons` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_student_lesson_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='牛师班学生课时消耗表';

-- ===================
-- 分享关系锁定表
-- ===================
DROP TABLE IF EXISTS `share_locks`;
CREATE TABLE `share_locks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '被锁定的用户ID',
    `locker_id` INT UNSIGNED NOT NULL COMMENT '锁定者ID(分享者)',
    `lock_type` VARCHAR(50) NOT NULL COMMENT '锁定类型: teacher_profile/order/activity/elite_class',
    `lock_source_id` INT UNSIGNED DEFAULT NULL COMMENT '锁定来源ID(如教师ID、订单ID等)',
    `expire_at` DATETIME DEFAULT NULL COMMENT '过期时间(NULL表示永久)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_lock` (`user_id`),
    INDEX `idx_locker` (`locker_id`),
    INDEX `idx_lock_type` (`lock_type`),
    CONSTRAINT `fk_share_lock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_share_lock_locker` FOREIGN KEY (`locker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享关系锁定表';

-- ===================
-- 超级会员表
-- ===================
DROP TABLE IF EXISTS `super_memberships`;
CREATE TABLE `super_memberships` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
    `type` TINYINT NOT NULL COMMENT '类型: 1付费购买 2邀请达标(教师10人) 3邀请达标(家长10人)',
    `start_at` DATETIME NOT NULL COMMENT '开始时间',
    `expire_at` DATETIME NOT NULL COMMENT '过期时间',
    `invite_teacher_count` INT DEFAULT 0 COMMENT '邀请教师数',
    `invite_parent_count` INT DEFAULT 0 COMMENT '邀请家长数',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1有效 0失效',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_super_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='超级会员表';

-- ===================
-- 在用户表中添加超级会员字段
-- ===================
ALTER TABLE `users` ADD COLUMN `is_super_member` TINYINT DEFAULT 0 COMMENT '是否超级会员' AFTER `membership_expire_at`;
ALTER TABLE `users` ADD COLUMN `super_member_expire_at` DATETIME DEFAULT NULL COMMENT '超级会员过期时间' AFTER `is_super_member`;

-- ===================
-- 添加超级会员套餐
-- ===================
INSERT INTO `memberships` (`name`, `price`, `duration_days`, `features`, `role`, `is_super`) VALUES
('教师超级会员-月度', 99.00, 30, '创建牛师班,优先展示,专属客服,免费发布需求', 'teacher', 1),
('教师超级会员-季度', 269.00, 90, '创建牛师班,优先展示,专属客服,免费发布需求,推广特权', 'teacher', 1),
('教师超级会员-年度', 999.00, 365, '创建牛师班,优先展示,专属客服,免费发布需求,推广特权,品牌展示', 'teacher', 1);

-- ===================
-- 牛师班演示数据
-- ===================
INSERT INTO `elite_classes` (`teacher_id`, `class_name`, `subject`, `start_time`, `total_lessons`, `current_lesson`, `address`, `latitude`, `longitude`, `hourly_rate`, `max_students`, `current_students`, `description`, `status`) VALUES
(100, '中考数学冲刺班', '数学', DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 0, '北京市朝阳区望京西园四区', 39.991, 116.478, 180, 10, 3, '针对中考数学重点难点，系统讲解函数、几何、方程等核心知识点。每周六下午2点上课。', 0),
(101, '英语口语提升班', '英语', DATE_ADD(NOW(), INTERVAL 10 DAY), 15, 0, '北京市海淀区中关村南大街', 40.012, 116.489, 150, 8, 2, '外教口语互动，提升英语口语表达能力。适合初高中生。', 0),
(106, '奥数竞赛班', '数学', DATE_ADD(NOW(), INTERVAL 5 DAY), 30, 0, '北京市西城区金融街', 39.978, 116.456, 250, 15, 5, '针对数学竞赛，培养数学思维和解题技巧。有奥数获奖经历者优先。', 0),
(108, '高考物理冲刺班', '物理', DATE_ADD(NOW(), INTERVAL 14 DAY), 25, 0, '北京市东城区东直门', 40.023, 116.512, 220, 12, 4, '高校教师主讲，深入浅出讲解高中物理重点难点。', 0),
(105, '雅思口语特训班', '英语', DATE_ADD(NOW(), INTERVAL 3 DAY), 12, 0, '北京市丰台区方庄', 39.967, 116.445, 200, 6, 2, '留英硕士授课，纯正英式发音，雅思口语7分冲刺。', 0);

SET FOREIGN_KEY_CHECKS = 1;
