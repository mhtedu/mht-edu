-- 棉花糖教育平台数据库初始化脚本
-- MySQL 8.0+

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mht_edu;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) COMMENT '微信openid',
    unionid VARCHAR(64) COMMENT '微信unionid',
    mobile VARCHAR(20) COMMENT '手机号',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像',
    role SMALLINT NOT NULL DEFAULT 0 COMMENT '角色: 0家长 1教师 2机构 3城市代理',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1正常 0封禁',
    membership_type SMALLINT DEFAULT 0 COMMENT '会员类型: 0免费 1付费',
    membership_expire_at DATETIME COMMENT '会员过期时间',
    membership_terminated SMALLINT DEFAULT 0 COMMENT '会员权益是否被终止(关闭订单导致)',
    wechat_id VARCHAR(50) COMMENT '微信号',
    wechat_qrcode VARCHAR(255) COMMENT '微信二维码',
    latitude DECIMAL(10,7) COMMENT '纬度',
    longitude DECIMAL(10,7) COMMENT '经度',
    city_code VARCHAR(10) COMMENT '城市编码',
    city_name VARCHAR(50) COMMENT '城市名称',
    inviter_id INT COMMENT '一级邀请人ID',
    inviter_2nd_id INT COMMENT '二级邀请人ID',
    city_agent_id INT COMMENT '所属城市代理ID',
    affiliated_org_id INT COMMENT '所属机构ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_mobile (mobile),
    INDEX idx_inviter (inviter_id),
    INDEX idx_location (latitude, longitude),
    INDEX idx_city (city_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 教师扩展表
CREATE TABLE IF NOT EXISTS teacher_profiles (
    user_id INT PRIMARY KEY COMMENT '用户ID',
    real_name VARCHAR(20) COMMENT '真实姓名',
    gender SMALLINT COMMENT '性别: 1男 2女',
    birth_year INT COMMENT '出生年份',
    education VARCHAR(50) COMMENT '学历',
    certificates JSON COMMENT '证书列表',
    subjects JSON COMMENT '教学科目',
    max_distance INT DEFAULT 10 COMMENT '最大接单距离(km)',
    hourly_rate_min DECIMAL(10,2) COMMENT '最低时薪',
    hourly_rate_max DECIMAL(10,2) COMMENT '最高时薪',
    intro TEXT COMMENT '个人简介',
    one_line_intro VARCHAR(100) COMMENT '一句话介绍',
    photos JSON COMMENT '照片列表',
    videos JSON COMMENT '视频列表',
    cover_photo VARCHAR(255) COMMENT '封面照片',
    schedule_settings JSON COMMENT '排课设置',
    verify_status SMALLINT DEFAULT 0 COMMENT '认证状态: 0未认证 1待审核 2已认证 3驳回',
    verify_reject_reason VARCHAR(255) COMMENT '驳回原因',
    rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分',
    review_count INT DEFAULT 0 COMMENT '评价数',
    view_count INT DEFAULT 0 COMMENT '主页浏览量',
    teaching_years INT DEFAULT 0 COMMENT '教学年限',
    success_count INT DEFAULT 0 COMMENT '成功签约数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师扩展表';

-- 机构表
CREATE TABLE IF NOT EXISTS organizations (
    user_id INT PRIMARY KEY COMMENT '用户ID',
    org_name VARCHAR(100) NOT NULL COMMENT '机构名称',
    license VARCHAR(255) COMMENT '营业执照',
    address VARCHAR(255) COMMENT '地址',
    contact_person VARCHAR(20) COMMENT '联系人',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    intro TEXT COMMENT '机构介绍',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待审核 1已审核 2驳回',
    reject_reason VARCHAR(255) COMMENT '驳回原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构表';

-- 城市代理表
CREATE TABLE IF NOT EXISTS city_agents (
    user_id INT PRIMARY KEY COMMENT '用户ID',
    city_code VARCHAR(10) NOT NULL COMMENT '城市编码',
    city_name VARCHAR(50) NOT NULL COMMENT '城市名称',
    commission_rate DECIMAL(5,2) DEFAULT 5.00 COMMENT '分佣比例(%)',
    balance DECIMAL(12,2) DEFAULT 0.00 COMMENT '余额',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_city_code (city_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市代理表';

-- 家长需求/订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL COMMENT '订单编号',
    parent_id INT NOT NULL COMMENT '家长ID',
    subject VARCHAR(50) NOT NULL COMMENT '科目',
    hourly_rate DECIMAL(10,2) NOT NULL COMMENT '时薪',
    student_gender SMALLINT COMMENT '学生性别',
    student_grade VARCHAR(20) COMMENT '学生年级',
    address VARCHAR(255) NOT NULL COMMENT '地址',
    latitude DECIMAL(10,7) NOT NULL COMMENT '纬度',
    longitude DECIMAL(10,7) NOT NULL COMMENT '经度',
    description TEXT COMMENT '需求描述',
    status SMALLINT NOT NULL DEFAULT 0 COMMENT '状态: 0待抢单 1已匹配 2试课中 3已签约 4已完成 5已解除',
    matched_teacher_id INT COMMENT '匹配教师ID',
    matched_at DATETIME COMMENT '匹配时间',
    expire_at DATETIME COMMENT '过期时间',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_status_expire (status, expire_at),
    INDEX idx_location (latitude, longitude),
    INDEX idx_order_no (order_no),
    FOREIGN KEY (parent_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单抢单记录表
CREATE TABLE IF NOT EXISTS order_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    status SMALLINT NOT NULL DEFAULT 0 COMMENT '状态: 0待处理 1已接单 2已拒绝 3已解除',
    contact_unlocked SMALLINT DEFAULT 0 COMMENT '联系方式是否解锁: 0否 1是',
    unlocked_at DATETIME COMMENT '解锁时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抢单记录表';

-- 会话表
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type SMALLINT NOT NULL DEFAULT 0 COMMENT '类型: 0订单沟通 1系统通知',
    order_id INT COMMENT '关联订单ID',
    user1_id INT NOT NULL COMMENT '用户1ID',
    user2_id INT NOT NULL COMMENT '用户2ID',
    last_message TEXT COMMENT '最后一条消息',
    last_message_at DATETIME COMMENT '最后消息时间',
    user1_unread INT DEFAULT 0 COMMENT '用户1未读数',
    user2_unread INT DEFAULT 0 COMMENT '用户2未读数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表';

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL COMMENT '会话ID',
    sender_id INT NOT NULL COMMENT '发送者ID',
    content TEXT NOT NULL COMMENT '消息内容',
    msg_type SMALLINT DEFAULT 0 COMMENT '消息类型: 0文本 1图片 2系统 3机器人',
    is_read SMALLINT DEFAULT 0 COMMENT '是否已读',
    is_robot SMALLINT DEFAULT 0 COMMENT '是否机器人消息',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 消息提醒表（婚恋网模式：查看/留言会提醒对方）
CREATE TABLE IF NOT EXISTS message_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '被提醒用户ID',
    from_user_id INT NOT NULL COMMENT '触发用户ID',
    type SMALLINT NOT NULL COMMENT '类型: 1查看资料 2查看联系方式 3发送消息 4抢单',
    target_id INT COMMENT '关联ID(订单/用户)',
    content VARCHAR(255) COMMENT '提醒内容',
    is_read SMALLINT DEFAULT 0 COMMENT '是否已读',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_from_user (from_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息提醒表';

-- 会员套餐表
CREATE TABLE IF NOT EXISTS membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '套餐名称',
    role SMALLINT NOT NULL COMMENT '角色: 0家长 1教师 2机构',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    duration_days INT NOT NULL COMMENT '有效期(天)',
    features JSON COMMENT '权益列表',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    cover VARCHAR(255) COMMENT '封面图',
    images JSON COMMENT '图片列表',
    description TEXT COMMENT '商品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    original_price DECIMAL(10,2) COMMENT '原价',
    stock INT DEFAULT 0 COMMENT '库存',
    sales INT DEFAULT 0 COMMENT '销量',
    category VARCHAR(50) COMMENT '分类',
    is_active SMALLINT DEFAULT 1 COMMENT '是否上架',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    target_type SMALLINT NOT NULL COMMENT '类型: 1会员 2商品',
    target_id INT NOT NULL COMMENT '目标ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    payment_no VARCHAR(64) NOT NULL COMMENT '支付单号',
    transaction_id VARCHAR(64) COMMENT '微信交易号',
    status SMALLINT NOT NULL DEFAULT 0 COMMENT '状态: 0待支付 1已支付 2已退款',
    paid_at DATETIME COMMENT '支付时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_payment_no (payment_no),
    INDEX idx_transaction_id (transaction_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 分佣记录表
CREATE TABLE IF NOT EXISTS commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '受益用户ID',
    from_user_id INT COMMENT '来源用户ID',
    payment_id INT NOT NULL COMMENT '支付记录ID',
    level_type SMALLINT NOT NULL COMMENT '类型: 1一级 2二级 3城市代理 4机构',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    rate DECIMAL(5,2) NOT NULL COMMENT '比例(%)',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算 2已提现',
    settled_at DATETIME COMMENT '结算时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_payment (payment_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分佣记录表';

-- 提现记录表
CREATE TABLE IF NOT EXISTS withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '提现金额',
    bank_name VARCHAR(50) COMMENT '银行名称',
    bank_account VARCHAR(50) COMMENT '银行账号',
    real_name VARCHAR(20) COMMENT '真实姓名',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待审核 1已通过 2已拒绝',
    reject_reason VARCHAR(255) COMMENT '拒绝原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- 广告位表
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    position VARCHAR(50) NOT NULL COMMENT '位置: home_top, home_middle',
    title VARCHAR(100) COMMENT '标题',
    image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
    link_url VARCHAR(255) COMMENT '跳转链接',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告位表';

-- 联系方式查看日志
CREATE TABLE IF NOT EXISTS contact_view_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '查看用户ID',
    target_user_id INT NOT NULL COMMENT '被查看用户ID',
    ip VARCHAR(45) COMMENT 'IP地址',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系方式查看日志';

-- 用户行为日志（用于机器人触发）
CREATE TABLE IF NOT EXISTS user_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    action_type SMALLINT NOT NULL COMMENT '行为类型: 1查看教师 2查看订单 3尝试联系',
    target_id INT COMMENT '目标ID',
    target_type VARCHAR(20) COMMENT '目标类型',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为日志';

-- 初始化会员套餐数据
INSERT INTO membership_plans (name, role, price, original_price, duration_days, features, is_active, sort_order) VALUES
('家长月卡', 0, 29.90, 59.00, 30, '["查看教师联系方式","无限发布需求","优先匹配"]', 1, 1),
('家长季卡', 0, 79.00, 177.00, 90, '["查看教师联系方式","无限发布需求","优先匹配","专属客服"]', 1, 2),
('家长年卡', 0, 199.00, 708.00, 365, '["查看教师联系方式","无限发布需求","优先匹配","专属客服","推荐奖励翻倍"]', 1, 3),
('教师月卡', 1, 39.90, 79.00, 30, '["查看家长联系方式","无限抢单","优先展示"]', 1, 1),
('教师季卡', 1, 99.00, 237.00, 90, '["查看家长联系方式","无限抢单","优先展示","专属客服"]', 1, 2),
('教师年卡', 1, 259.00, 948.00, 365, '["查看家长联系方式","无限抢单","优先展示","专属客服","推荐奖励翻倍"]', 1, 3),
('机构月卡', 2, 99.00, 199.00, 30, '["查看所有联系方式","无限发布课程","教师管理"]', 1, 1),
('机构年卡', 2, 699.00, 2388.00, 365, '["查看所有联系方式","无限发布课程","教师管理","数据分析","品牌推广"]', 1, 2);

-- 初始化测试广告
INSERT INTO banners (position, title, image_url, link_url, sort_order, is_active) VALUES
('home_top', '新用户首月会员5折', 'https://placehold.co/750x300/2563EB/white?text=新用户福利', '/pages/membership/index', 1, 1),
('home_middle', '邀请好友得现金', 'https://placehold.co/750x200/EC4899/white?text=邀请有礼', '/pages/distribution/index', 2, 1);

-- 创建机器人用户（用于模拟沟通）
INSERT INTO users (id, mobile, nickname, avatar, role, status) VALUES
(1, 'system', '系统助手', 'https://placehold.co/100/2563EB/white?text=助手', 1, 1),
(2, 'robot_teacher', '智能教师助手', 'https://placehold.co/100/10B981/white?text=AI', 1, 1),
(3, 'robot_parent', '智能家长助手', 'https://placehold.co/100/EC4899/white?text=AI', 0, 1);

-- ==================== 新增功能表 ====================

-- 系统配置表（网站名称、logo、分销比例等）
CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(20) DEFAULT 'string' COMMENT '类型: string, number, json, boolean',
    description VARCHAR(255) COMMENT '配置说明',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 科目表
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '科目名称',
    category VARCHAR(50) COMMENT '分类: 文科、理科、艺术、语言',
    icon VARCHAR(255) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科目表';

-- 年级表
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '年级名称',
    stage VARCHAR(20) COMMENT '学段: 幼儿园、小学、初中、高中、大学',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='年级表';

-- 课时记录表（教师端课时管理）
CREATE TABLE IF NOT EXISTS lesson_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    parent_id INT NOT NULL COMMENT '家长ID',
    lesson_date DATE NOT NULL COMMENT '上课日期',
    lesson_start_time TIME NOT NULL COMMENT '开始时间',
    lesson_end_time TIME NOT NULL COMMENT '结束时间',
    lesson_hours DECIMAL(4,1) NOT NULL COMMENT '课时数(小时)',
    lesson_content TEXT COMMENT '教学内容',
    homework TEXT COMMENT '课后作业',
    student_performance TEXT COMMENT '学生表现',
    next_lesson_plan TEXT COMMENT '下节课计划',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待确认 1已确认 2有异议',
    parent_confirm_at DATETIME COMMENT '家长确认时间',
    parent_comment TEXT COMMENT '家长备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_parent (parent_id),
    INDEX idx_date (lesson_date),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课时记录表';

-- 教师排课日历表
CREATE TABLE IF NOT EXISTS teacher_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL COMMENT '教师ID',
    day_of_week SMALLINT NOT NULL COMMENT '星期几: 0-6 (周日-周六)',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    is_available SMALLINT DEFAULT 1 COMMENT '是否可预约',
    note VARCHAR(100) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师排课日历表';

-- 试课反馈表
CREATE TABLE IF NOT EXISTS trial_feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    parent_id INT NOT NULL COMMENT '家长ID',
    feedback_type SMALLINT NOT NULL COMMENT '类型: 1教师填写 2家长填写',
    -- 教师填写字段
    student_level VARCHAR(50) COMMENT '学生基础水平',
    teaching_suggestion TEXT COMMENT '教学建议',
    expected_goals TEXT COMMENT '预期目标',
    -- 家长填写字段
    satisfaction SMALLINT COMMENT '满意度: 1-5分',
    teacher_attitude SMALLINT COMMENT '教师态度: 1-5分',
    teaching_quality SMALLINT COMMENT '教学质量: 1-5分',
    willingness SMALLINT COMMENT '签约意愿: 0不考虑 1考虑中 2确定签约',
    parent_comment TEXT COMMENT '家长评价',
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_parent (parent_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试课反馈表';

-- 教学计划表
CREATE TABLE IF NOT EXISTS teaching_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    subject VARCHAR(50) NOT NULL COMMENT '科目',
    total_lessons INT COMMENT '总课时',
    completed_lessons INT DEFAULT 0 COMMENT '已完成课时',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    teaching_goals TEXT COMMENT '教学目标',
    teaching_methods TEXT COMMENT '教学方法',
    materials TEXT COMMENT '教材资料',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教学计划表';

-- 订单公海池表（解约回流）
CREATE TABLE IF NOT EXISTS order_pool (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '原始订单ID',
    original_parent_id INT NOT NULL COMMENT '原家长ID',
    original_teacher_id INT COMMENT '原教师ID',
    release_reason VARCHAR(255) COMMENT '释放原因',
    release_type SMALLINT NOT NULL COMMENT '释放类型: 1家长取消 2教师解约 3系统回收',
    pool_status SMALLINT DEFAULT 0 COMMENT '池状态: 0待分配 1已分配 2已过期',
    assigned_teacher_id INT COMMENT '新分配教师ID',
    assigned_at DATETIME COMMENT '分配时间',
    expire_at DATETIME COMMENT '过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_status (pool_status),
    INDEX idx_expire (expire_at),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单公海池表';

-- 机构教师关联表
CREATE TABLE IF NOT EXISTS org_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    status SMALLINT DEFAULT 1 COMMENT '状态: 0待审核 1已绑定 2已解绑',
    commission_rate DECIMAL(5,2) DEFAULT 10.00 COMMENT '机构分佣比例(%)',
    bind_at DATETIME COMMENT '绑定时间',
    unbind_at DATETIME COMMENT '解绑时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_org_teacher (org_id, teacher_id),
    INDEX idx_org (org_id),
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (org_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构教师关联表';

-- 机构派单记录表
CREATE TABLE IF NOT EXISTS org_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    order_id INT NOT NULL COMMENT '订单ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    assign_type SMALLINT DEFAULT 1 COMMENT '类型: 1推荐 2指派',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待处理 1已接受 2已拒绝',
    assign_note TEXT COMMENT '派单备注',
    teacher_note TEXT COMMENT '教师备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (org_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构派单记录表';

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    parent_id INT NOT NULL COMMENT '家长ID',
    teacher_id INT NOT NULL COMMENT '教师ID',
    rating SMALLINT NOT NULL COMMENT '评分: 1-5',
    content TEXT COMMENT '评价内容',
    tags JSON COMMENT '标签',
    is_anonymous SMALLINT DEFAULT 0 COMMENT '是否匿名',
    reply TEXT COMMENT '教师回复',
    reply_at DATETIME COMMENT '回复时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_teacher (teacher_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';

-- 分销配置表
CREATE TABLE IF NOT EXISTS distribution_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level SMALLINT NOT NULL COMMENT '层级: 1一级 2二级 3城市代理 4机构',
    rate DECIMAL(5,2) NOT NULL COMMENT '分佣比例(%)',
    description VARCHAR(100) COMMENT '说明',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销配置表';

-- 区域合伙人统计表
CREATE TABLE IF NOT EXISTS agent_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL COMMENT '代理ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    new_users INT DEFAULT 0 COMMENT '新增用户',
    new_orders INT DEFAULT 0 COMMENT '新增订单',
    total_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '交易总额',
    commission_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '分佣金额',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent_date (agent_id, stat_date),
    FOREIGN KEY (agent_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='区域合伙人统计表';

-- 信息流广告表（首页中部）
CREATE TABLE IF NOT EXISTS feed_ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容描述',
    image_url VARCHAR(255) COMMENT '图片',
    ad_type SMALLINT DEFAULT 1 COMMENT '类型: 1图片 2图文 3视频',
    link_url VARCHAR(255) COMMENT '跳转链接',
    position VARCHAR(50) DEFAULT 'home_middle' COMMENT '位置',
    target_roles JSON COMMENT '目标角色: [0,1,2]',
    view_count INT DEFAULT 0 COMMENT '曝光次数',
    click_count INT DEFAULT 0 COMMENT '点击次数',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='信息流广告表';

-- ==================== 初始化数据 ====================

-- 初始化系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('site_name', '棉花糖教育成长平台', 'string', '网站名称'),
('site_logo', 'https://placehold.co/200x60/2563EB/white?text=棉花糖教育', 'string', '网站Logo'),
('site_description', '专业的家教信息撮合平台', 'string', '网站描述'),
('contact_phone', '400-888-8888', 'string', '客服电话'),
('contact_wechat', 'mht_edu', 'string', '客服微信'),
('user_agreement', 'https://example.com/agreement', 'string', '用户协议链接'),
('privacy_policy', 'https://example.com/privacy', 'string', '隐私政策链接'),
('order_expire_days', '7', 'number', '订单过期天数'),
('trial_lesson_hours', '2', 'number', '试课时长(小时)');

-- 初始化分销配置
INSERT INTO distribution_configs (level, rate, description, is_active) VALUES
(1, 20.00, '一级推荐人分佣', 1),
(2, 10.00, '二级推荐人分佣', 1),
(3, 5.00, '城市代理分佣', 1),
(4, 10.00, '机构分佣', 1);

-- 初始化科目
INSERT INTO subjects (name, category, sort_order, is_active) VALUES
('语文', '文科', 1, 1),
('数学', '理科', 2, 1),
('英语', '语言', 3, 1),
('物理', '理科', 4, 1),
('化学', '理科', 5, 1),
('生物', '理科', 6, 1),
('政治', '文科', 7, 1),
('历史', '文科', 8, 1),
('地理', '文科', 9, 1),
('钢琴', '艺术', 10, 1),
('吉他', '艺术', 11, 1),
('小提琴', '艺术', 12, 1),
('美术', '艺术', 13, 1),
('书法', '艺术', 14, 1),
('舞蹈', '艺术', 15, 1),
('围棋', '艺术', 16, 1),
('编程', '技能', 17, 1),
('游泳', '体育', 18, 1),
('篮球', '体育', 19, 1);

-- 初始化年级
INSERT INTO grades (name, stage, sort_order, is_active) VALUES
('幼儿园小班', '幼儿园', 1, 1),
('幼儿园中班', '幼儿园', 2, 1),
('幼儿园大班', '幼儿园', 3, 1),
('一年级', '小学', 4, 1),
('二年级', '小学', 5, 1),
('三年级', '小学', 6, 1),
('四年级', '小学', 7, 1),
('五年级', '小学', 8, 1),
('六年级', '小学', 9, 1),
('初一', '初中', 10, 1),
('初二', '初中', 11, 1),
('初三', '初中', 12, 1),
('高一', '高中', 13, 1),
('高二', '高中', 14, 1),
('高三', '高中', 15, 1);

-- 初始化信息流广告
INSERT INTO feed_ads (title, content, image_url, ad_type, link_url, position, target_roles, sort_order, is_active) VALUES
('优秀教师推荐', '精选优质教师，教学质量有保障', 'https://placehold.co/750x300/10B981/white?text=优秀教师推荐', 1, '/pages/index/index?tab=teachers', 'home_middle', '[0]', 1, 1),
('成为签约教师', '加入棉花糖教育，开启您的教学生涯', 'https://placehold.co/750x300/2563EB/white?text=教师入驻', 1, '/pages/login/index', 'home_middle', '[1]', 2, 1);

-- ==================== 教师主页相关表 ====================

-- 教师动态表
CREATE TABLE IF NOT EXISTS teacher_moments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL COMMENT '教师ID',
    content TEXT NOT NULL COMMENT '动态内容',
    images JSON COMMENT '图片列表',
    video_url VARCHAR(255) COMMENT '视频URL',
    video_cover VARCHAR(255) COMMENT '视频封面',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    is_visible SMALLINT DEFAULT 1 COMMENT '是否可见',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_created (created_at DESC),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师动态表';

-- 动态点赞表
CREATE TABLE IF NOT EXISTS moment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moment_id INT NOT NULL COMMENT '动态ID',
    user_id INT NOT NULL COMMENT '点赞用户ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_moment_user (moment_id, user_id),
    INDEX idx_moment (moment_id),
    FOREIGN KEY (moment_id) REFERENCES teacher_moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态点赞表';

-- 动态评论表
CREATE TABLE IF NOT EXISTS moment_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moment_id INT NOT NULL COMMENT '动态ID',
    user_id INT NOT NULL COMMENT '评论用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    reply_to_id INT COMMENT '回复评论ID',
    is_visible SMALLINT DEFAULT 1 COMMENT '是否可见',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moment (moment_id),
    FOREIGN KEY (moment_id) REFERENCES teacher_moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态评论表';

-- 联系方式解锁记录表
CREATE TABLE IF NOT EXISTS contact_unlocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT COMMENT '关联订单ID',
    user_id INT NOT NULL COMMENT '解锁用户ID',
    target_user_id INT NOT NULL COMMENT '被解锁用户ID',
    unlock_type SMALLINT NOT NULL COMMENT '类型: 1查看手机 2查看微信 3全部解锁',
    cost_amount DECIMAL(10,2) DEFAULT 0 COMMENT '花费金额',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_target (target_user_id),
    INDEX idx_order (order_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系方式解锁记录表';

-- 订单关闭原因表
CREATE TABLE IF NOT EXISTS order_close_reasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    user_id INT NOT NULL COMMENT '操作用户ID',
    close_type SMALLINT NOT NULL COMMENT '类型: 1未达成合作 2家长取消 3系统关闭',
    reason VARCHAR(255) COMMENT '关闭原因',
    feedback TEXT COMMENT '详细反馈',
    to_pool SMALLINT DEFAULT 0 COMMENT '是否进入公海池',
    membership_terminated SMALLINT DEFAULT 0 COMMENT '是否导致会员权益终止',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单关闭原因表';

-- 城市表
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_code VARCHAR(10) NOT NULL UNIQUE COMMENT '城市编码',
    city_name VARCHAR(50) NOT NULL COMMENT '城市名称',
    province VARCHAR(50) COMMENT '省份',
    latitude DECIMAL(10,7) COMMENT '纬度',
    longitude DECIMAL(10,7) COMMENT '经度',
    is_hot SMALLINT DEFAULT 0 COMMENT '是否热门城市',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_province (province),
    INDEX idx_hot (is_hot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市表';

-- 初始化热门城市
INSERT INTO cities (city_code, city_name, province, is_hot, sort_order) VALUES
('110000', '北京', '北京', 1, 1),
('310000', '上海', '上海', 1, 2),
('440100', '广州', '广东', 1, 3),
('440300', '深圳', '广东', 1, 4),
('330100', '杭州', '浙江', 1, 5),
('320100', '南京', '江苏', 1, 6),
('420100', '武汉', '湖北', 1, 7),
('510100', '成都', '四川', 1, 8),
('500100', '重庆', '重庆', 0, 9),
('120000', '天津', '天津', 0, 10),
('610100', '西安', '陕西', 0, 11),
('430100', '长沙', '湖南', 0, 12);
