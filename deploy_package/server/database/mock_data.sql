-- =====================================================
-- 棉花糖教育平台 - 模拟数据初始化脚本
-- 在 phpMyAdmin 中执行此脚本
-- =====================================================

-- 1. 城市数据表（使用cities表名，与后端代码一致）
DROP TABLE IF EXISTS `cities`;
CREATE TABLE `cities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '城市名称',
  `pinyin` VARCHAR(100) DEFAULT NULL COMMENT '拼音',
  `first_letter` CHAR(1) DEFAULT NULL COMMENT '首字母',
  `is_hot` TINYINT DEFAULT 0 COMMENT '是否热门城市',
  `latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `is_active` TINYINT DEFAULT 1 COMMENT '状态 1-启用',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_first_letter` (`first_letter`),
  KEY `idx_is_hot` (`is_hot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市表';

-- 插入城市数据
INSERT INTO `cities` (`name`, `pinyin`, `first_letter`, `is_hot`, `latitude`, `longitude`, `sort_order`) VALUES
('北京', 'beijing', 'B', 1, 39.9042, 116.4074, 1),
('上海', 'shanghai', 'S', 1, 31.2304, 121.4737, 2),
('广州', 'guangzhou', 'G', 1, 23.1291, 113.2644, 3),
('深圳', 'shenzhen', 'S', 1, 22.5431, 114.0579, 4),
('杭州', 'hangzhou', 'H', 1, 30.2741, 120.1551, 5),
('成都', 'chengdu', 'C', 1, 30.5728, 104.0668, 6),
('武汉', 'wuhan', 'W', 1, 30.5928, 114.3055, 7),
('南京', 'nanjing', 'N', 1, 32.0603, 118.7969, 8),
('天津', 'tianjin', 'T', 0, 39.0842, 117.2009, 9),
('重庆', 'chongqing', 'C', 0, 29.4316, 106.9123, 10),
('苏州', 'suzhou', 'S', 0, 31.2989, 120.5853, 11),
('西安', 'xian', 'X', 0, 34.3416, 108.9398, 12),
('长沙', 'changsha', 'C', 0, 28.2282, 112.9388, 13),
('郑州', 'zhengzhou', 'Z', 0, 34.7466, 113.6254, 14),
('青岛', 'qingdao', 'Q', 0, 36.0671, 120.3826, 15),
('大连', 'dalian', 'D', 0, 38.9140, 121.6147, 16),
('厦门', 'xiamen', 'X', 0, 24.4798, 118.0894, 17),
('宁波', 'ningbo', 'N', 0, 29.8683, 121.5440, 18),
('无锡', 'wuxi', 'W', 0, 31.4912, 120.3119, 19),
('合肥', 'hefei', 'H', 0, 31.8206, 117.2272, 20),
('福州', 'fuzhou', 'F', 0, 26.0745, 119.2965, 21),
('哈尔滨', 'haerbin', 'H', 0, 45.8038, 126.5350, 22),
('沈阳', 'shenyang', 'S', 0, 41.8057, 123.4315, 23),
('长春', 'changchun', 'C', 0, 43.8171, 125.3235, 24),
('昆明', 'kunming', 'K', 0, 25.0389, 102.7183, 25),
('南宁', 'nanning', 'N', 0, 22.8170, 108.3665, 26),
('贵阳', 'guiyang', 'G', 0, 26.6470, 106.6302, 27),
('海口', 'haikou', 'H', 0, 20.0440, 110.1999, 28),
('石家庄', 'shijiazhuang', 'S', 0, 38.0428, 114.5149, 29),
('太原', 'taiyuan', 'T', 0, 37.8706, 112.5489, 30);

-- 2. 用户表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `gender` TINYINT DEFAULT 0 COMMENT '性别 0-未知 1-男 2-女',
  `role` TINYINT DEFAULT 0 COMMENT '角色 0-家长 1-教师 2-机构',
  `is_member` TINYINT DEFAULT 0 COMMENT '是否会员',
  `member_expire` DATETIME DEFAULT NULL COMMENT '会员过期时间',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1-正常 0-禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 清空并插入模拟用户数据
TRUNCATE TABLE `user`;
INSERT INTO `user` (`id`, `nickname`, `phone`, `avatar`, `gender`, `role`, `is_member`, `member_expire`, `status`) VALUES
(1, '张家长', '13800138001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', 1, 0, 1, '2025-12-31 23:59:59', 1),
(2, '李老师', '13800138002', 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', 1, 1, 1, '2025-12-31 23:59:59', 1),
(3, '王机构', '13800138003', 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', 1, 2, 0, NULL, 1),
(4, '赵家长', '13800138004', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao', 2, 0, 0, NULL, 1),
(5, '刘老师', '13800138005', 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu', 2, 1, 1, '2025-06-30 23:59:59', 1),
(6, '陈老师', '13800138006', 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen', 1, 1, 0, NULL, 1),
(7, '孙家长', '13800138007', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun', 2, 0, 1, '2025-09-30 23:59:59', 1),
(8, '周老师', '13800138008', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou', 2, 1, 0, NULL, 1);

-- 3. 教师详情表
CREATE TABLE IF NOT EXISTS `teacher_profile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `education` VARCHAR(100) DEFAULT NULL COMMENT '学历',
  `subjects` JSON DEFAULT NULL COMMENT '教授科目',
  `hourly_rate_min` DECIMAL(10,2) DEFAULT 0 COMMENT '最低时薪',
  `hourly_rate_max` DECIMAL(10,2) DEFAULT 0 COMMENT '最高时薪',
  `intro` TEXT COMMENT '个人简介',
  `verify_status` TINYINT DEFAULT 0 COMMENT '认证状态 0-待审核 1-已认证 2-已拒绝',
  `rating` DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分',
  `order_count` INT DEFAULT 0 COMMENT '接单数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师详情表';

-- 清空并插入模拟教师数据
TRUNCATE TABLE `teacher_profile`;
INSERT INTO `teacher_profile` (`user_id`, `real_name`, `education`, `subjects`, `hourly_rate_min`, `hourly_rate_max`, `intro`, `verify_status`, `rating`, `order_count`) VALUES
(2, '李明', '北京大学·硕士', '["数学", "物理"]', 150.00, 200.00, '8年教学经验，擅长中考数学提分，帮助学生快速掌握解题技巧', 1, 4.90, 56),
(5, '刘婷', '清华大学·本科', '["英语", "语文"]', 120.00, 180.00, '英语专八，口语流利，留学英国两年，纯正英式发音', 1, 4.85, 42),
(6, '陈浩', '北京师范大学·博士', '["化学", "生物"]', 200.00, 300.00, '重点中学在职教师，10年一线教学经验', 0, 5.00, 0),
(8, '周雪', '复旦大学·硕士', '["英语", "法语"]', 160.00, 220.00, '精通英语和法语，可进行双语教学，适合有留学需求的学生', 1, 4.88, 38);

-- 4. 需求订单表
CREATE TABLE IF NOT EXISTS `demand_order` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '发布用户ID',
  `subject` VARCHAR(50) NOT NULL COMMENT '科目',
  `hourly_rate` DECIMAL(10,2) DEFAULT 0 COMMENT '期望时薪',
  `student_grade` VARCHAR(20) DEFAULT NULL COMMENT '学生年级',
  `student_gender` TINYINT DEFAULT 0 COMMENT '学生性别',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '上课地址',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `description` TEXT COMMENT '需求描述',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0-待接单 1-已接单 2-已完成 3-已取消',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='需求订单表';

-- 清空并插入模拟订单数据
TRUNCATE TABLE `demand_order`;
INSERT INTO `demand_order` (`id`, `user_id`, `subject`, `hourly_rate`, `student_grade`, `student_gender`, `address`, `lat`, `lng`, `description`, `status`, `created_at`) VALUES
(1, 1, '数学', 180.00, '初三', 1, '朝阳区望京西园', 39.9860, 116.4730, '需要数学指导，目标中考110分以上', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 4, '英语', 150.00, '高二', 2, '海淀区中关村', 39.9840, 116.3070, '英语口语提升，准备出国留学', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 1, '物理', 200.00, '高一', 1, '西城区金融街', 39.9130, 116.3660, '物理成绩不稳定，需要系统提升', 0, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(4, 7, '化学', 160.00, '高三', 1, '丰台区方庄', 39.8720, 116.4280, '高三冲刺阶段，化学需要快速提分', 0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(5, 4, '数学', 170.00, '高一', 2, '浦东新区陆家嘴', 31.2400, 121.5000, '高中数学入门，打好基础', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(6, 7, '英语', 140.00, '初一', 2, '静安区南京西路', 31.2300, 121.4500, '初中英语入门，希望培养兴趣', 0, DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- 5. 机构表
CREATE TABLE IF NOT EXISTS `organization` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '机构名称',
  `contact_name` VARCHAR(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  `lat` DECIMAL(10,6) DEFAULT NULL,
  `lng` DECIMAL(10,6) DEFAULT NULL,
  `intro` TEXT COMMENT '机构简介',
  `verify_status` TINYINT DEFAULT 0 COMMENT '认证状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构表';

-- 清空并插入模拟机构数据
TRUNCATE TABLE `organization`;
INSERT INTO `organization` (`user_id`, `name`, `contact_name`, `contact_phone`, `address`, `intro`, `verify_status`) VALUES
(3, '学而思教育', '王经理', '400-123-4567', '北京市朝阳区建国路88号', '专注K12教育，优质师资团队', 1);

-- 6. 会员套餐表
CREATE TABLE IF NOT EXISTS `membership_plan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '套餐名称',
  `duration_days` INT NOT NULL COMMENT '有效天数',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格',
  `original_price` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
  `features` JSON DEFAULT NULL COMMENT '权益列表',
  `is_popular` TINYINT DEFAULT 0 COMMENT '是否热门',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐表';

-- 清空并插入会员套餐数据
TRUNCATE TABLE `membership_plan`;
INSERT INTO `membership_plan` (`name`, `duration_days`, `price`, `original_price`, `features`, `is_popular`, `status`, `sort_order`) VALUES
('月度会员', 30, 99.00, 99.00, '["查看教师联系方式", "发布需求无限次", "参与活动优惠"]', 0, 1, 1),
('季度会员', 90, 259.00, 297.00, '["查看教师联系方式", "发布需求无限次", "参与活动优惠", "专属客服支持"]', 1, 1, 2),
('年度会员', 365, 799.00, 1188.00, '["查看教师联系方式", "发布需求无限次", "参与活动优惠", "专属客服支持", "优先推荐", "年度报告"]', 0, 1, 3);

-- 7. 活动表
CREATE TABLE IF NOT EXISTS `activity` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL COMMENT '活动标题',
  `type` VARCHAR(20) DEFAULT 'other' COMMENT '活动类型 visit-探校 training-研修 lecture-讲座',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  `is_online` TINYINT DEFAULT 0 COMMENT '是否线上',
  `online_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线上价格',
  `offline_price` DECIMAL(10,2) DEFAULT 0 COMMENT '线下价格',
  `max_participants` INT DEFAULT 0 COMMENT '最大人数',
  `current_participants` INT DEFAULT 0 COMMENT '当前人数',
  `target_roles` JSON DEFAULT NULL COMMENT '目标角色 [0-家长, 1-教师, 2-机构]',
  `status` VARCHAR(20) DEFAULT 'upcoming' COMMENT '状态 upcoming-即将开始 ongoing-进行中 ended-已结束',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 清空并插入模拟活动数据
TRUNCATE TABLE `activity`;
INSERT INTO `activity` (`title`, `type`, `cover_image`, `start_time`, `end_time`, `address`, `is_online`, `online_price`, `offline_price`, `max_participants`, `current_participants`, `target_roles`, `status`) VALUES
('北京四中探校活动', 'visit', 'https://placehold.co/400x200/2563EB/white?text=探校活动', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 3 HOUR, '北京市西城区北京四中', 0, 0.00, 99.00, 50, 32, '[0]', 'upcoming'),
('新高考政策解读讲座', 'lecture', 'https://placehold.co/400x200/10B981/white?text=政策讲座', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 2 HOUR, '线上直播', 1, 29.00, 0.00, 200, 156, '[0, 1]', 'upcoming'),
('教师教学技能提升研修', 'training', 'https://placehold.co/400x200/EC4899/white?text=教师研修', DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 16 DAY), '海淀区教师进修学校', 0, 0.00, 299.00, 30, 28, '[1]', 'upcoming');

-- 8. 牛师班表
CREATE TABLE IF NOT EXISTS `elite_class` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL COMMENT '教师ID',
  `title` VARCHAR(100) NOT NULL COMMENT '班级名称',
  `subject` VARCHAR(50) DEFAULT NULL COMMENT '科目',
  `description` TEXT COMMENT '描述',
  `max_students` INT DEFAULT 20 COMMENT '最大学生数',
  `current_students` INT DEFAULT 0 COMMENT '当前学生数',
  `price` DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0-报名中 1-进行中 2-已结束',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='牛师班表';

-- 清空并插入模拟牛师班数据
TRUNCATE TABLE `elite_class`;
INSERT INTO `elite_class` (`teacher_id`, `title`, `subject`, `description`, `max_students`, `current_students`, `price`, `status`) VALUES
(2, '高考数学冲刺班', '数学', '针对高考数学重难点进行系统讲解，目标130分以上', 20, 15, 2999.00, 1),
(5, '英语口语提升班', '英语', '纯正英语口语训练，提升口语表达能力', 15, 8, 1999.00, 0),
(6, '物理竞赛预备班', '物理', '物理竞赛入门，培养物理思维和解题技巧', 12, 12, 3999.00, 1);

-- 9. 轮播图表
CREATE TABLE IF NOT EXISTS `banner` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
  `image_url` VARCHAR(255) NOT NULL COMMENT '图片地址',
  `link_url` VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
  `position` VARCHAR(50) DEFAULT 'home' COMMENT '位置',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `click_count` INT DEFAULT 0 COMMENT '点击次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表';

-- 清空并插入模拟轮播图数据
TRUNCATE TABLE `banner`;
INSERT INTO `banner` (`title`, `image_url`, `link_url`, `position`, `sort_order`, `status`) VALUES
('欢迎来到棉花糖教育', 'https://placehold.co/750x300/2563EB/white?text=棉花糖教育', '', 'home', 1, 1),
('开通会员享更多权益', 'https://placehold.co/750x300/F59E0B/white?text=会员特权', '/pages/membership/index', 'home', 2, 1),
('邀请好友赚佣金', 'https://placehold.co/750x300/10B981/white?text=邀请好友', '/pages/distribution/index', 'home', 3, 1);

-- 10. 分佣记录表
CREATE TABLE IF NOT EXISTS `commission` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `referrer_id` INT NOT NULL COMMENT '推荐人ID',
  `order_id` INT DEFAULT NULL COMMENT '订单ID',
  `order_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '订单金额',
  `commission_rate` DECIMAL(5,2) DEFAULT 10.00 COMMENT '佣金比例',
  `commission_amount` DECIMAL(10,2) DEFAULT 0 COMMENT '佣金金额',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0-待结算 1-已结算',
  `settled_at` DATETIME DEFAULT NULL COMMENT '结算时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_referrer_id` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分佣记录表';

-- 清空并插入模拟分佣数据
TRUNCATE TABLE `commission`;
INSERT INTO `commission` (`referrer_id`, `order_id`, `order_amount`, `commission_rate`, `commission_amount`, `status`, `settled_at`) VALUES
(2, 1, 199.00, 10.00, 19.90, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, 2, 299.00, 10.00, 29.90, 0, NULL),
(2, 3, 799.00, 10.00, 79.90, 1, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 11. 提现记录表
CREATE TABLE IF NOT EXISTS `withdrawal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '提现金额',
  `account_type` VARCHAR(20) DEFAULT NULL COMMENT '账户类型',
  `account_info` VARCHAR(255) DEFAULT NULL COMMENT '账户信息',
  `status` TINYINT DEFAULT 0 COMMENT '状态 0-待审核 1-已通过 2-已拒绝',
  `reject_reason` VARCHAR(255) DEFAULT NULL COMMENT '拒绝原因',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- 清空并插入模拟提现数据
TRUNCATE TABLE `withdrawal`;
INSERT INTO `withdrawal` (`user_id`, `amount`, `account_type`, `account_info`, `status`) VALUES
(2, 580.00, 'wechat', '微信支付', 0),
(3, 1200.00, 'bank', '银行卡: ****6789', 0),
(5, 350.00, 'alipay', '支付宝', 1);

-- 完成
SELECT '✅ 模拟数据初始化完成！' AS message;
SELECT COUNT(*) AS city_count FROM city;
SELECT COUNT(*) AS user_count FROM user;
SELECT COUNT(*) AS teacher_count FROM teacher_profile;
SELECT COUNT(*) AS order_count FROM demand_order;
