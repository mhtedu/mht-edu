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
    latitude DECIMAL(10,7) COMMENT '纬度',
    longitude DECIMAL(10,7) COMMENT '经度',
    city_code VARCHAR(10) COMMENT '城市编码',
    inviter_id INT COMMENT '一级邀请人ID',
    inviter_2nd_id INT COMMENT '二级邀请人ID',
    city_agent_id INT COMMENT '所属城市代理ID',
    affiliated_org_id INT COMMENT '所属机构ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_mobile (mobile),
    INDEX idx_inviter (inviter_id),
    INDEX idx_location (latitude, longitude)
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
    photos JSON COMMENT '照片列表',
    schedule_settings JSON COMMENT '排课设置',
    verify_status SMALLINT DEFAULT 0 COMMENT '认证状态: 0未认证 1待审核 2已认证 3驳回',
    verify_reject_reason VARCHAR(255) COMMENT '驳回原因',
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
