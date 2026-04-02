-- =====================================================
-- 机构价值体系数据库扩展
-- =====================================================

-- 1. 机构会员表（机构专属会员套餐）
CREATE TABLE IF NOT EXISTS org_memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    membership_type SMALLINT DEFAULT 1 COMMENT '会员类型: 1基础版 2专业版 3旗舰版',
    start_at DATETIME NOT NULL COMMENT '开始时间',
    expire_at DATETIME NOT NULL COMMENT '到期时间',
    teacher_quota INT DEFAULT 10 COMMENT '教师名额上限',
    used_quota INT DEFAULT 0 COMMENT '已使用名额',
    auto_renew SMALLINT DEFAULT 0 COMMENT '是否自动续费',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_expire (expire_at),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构会员表';

-- 2. 机构会员套餐配置表
CREATE TABLE IF NOT EXISTS org_membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '套餐名称',
    type SMALLINT NOT NULL COMMENT '类型: 1基础版 2专业版 3旗舰版',
    duration_days INT NOT NULL COMMENT '有效天数',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    teacher_quota INT DEFAULT 10 COMMENT '教师名额',
    features JSON COMMENT '功能特性',
    commission_discount DECIMAL(5,2) DEFAULT 0 COMMENT '平台抽成减免比例(%)',
    is_active SMALLINT DEFAULT 1 COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构会员套餐配置表';

-- 初始化机构会员套餐
INSERT INTO org_membership_plans (name, type, duration_days, price, teacher_quota, features, commission_discount, sort_order) VALUES
('基础版', 1, 365, 1999, 5, '["教师管理","订单派单","基础数据统计","会员共享"]', 0, 1),
('专业版', 2, 365, 4999, 20, '["教师管理","订单派单","完整数据分析","会员共享","营销工具","优惠券","活动管理"]', 5, 2),
('旗舰版', 3, 365, 9999, 100, '["教师管理","订单派单","完整数据分析","会员共享","营销工具","优惠券","活动管理","专属客服","品牌展示","优先推荐"]', 10, 3);

-- 3. 机构优惠券表
CREATE TABLE IF NOT EXISTS org_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    type SMALLINT DEFAULT 1 COMMENT '类型: 1满减 2折扣 3体验课',
    discount_amount DECIMAL(10,2) COMMENT '减免金额',
    discount_rate DECIMAL(5,2) COMMENT '折扣比例',
    min_amount DECIMAL(10,2) DEFAULT 0 COMMENT '最低消费金额',
    total_count INT DEFAULT 100 COMMENT '发放总数',
    used_count INT DEFAULT 0 COMMENT '已使用数量',
    per_user_limit INT DEFAULT 1 COMMENT '每人限领数量',
    start_at DATETIME NOT NULL COMMENT '开始时间',
    expire_at DATETIME NOT NULL COMMENT '结束时间',
    apply_scope SMALLINT DEFAULT 1 COMMENT '适用范围: 1全部教师 2指定教师',
    teacher_ids JSON COMMENT '适用教师ID列表',
    status SMALLINT DEFAULT 1 COMMENT '状态: 0禁用 1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_status_expire (status, expire_at),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构优惠券表';

-- 4. 用户优惠券领取记录
CREATE TABLE IF NOT EXISTS user_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    coupon_id INT NOT NULL COMMENT '优惠券ID',
    org_id INT NOT NULL COMMENT '机构ID',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0未使用 1已使用 2已过期',
    used_at DATETIME COMMENT '使用时间',
    order_id INT COMMENT '关联订单ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_coupon (coupon_id),
    INDEX idx_status (user_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES org_coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券领取记录';

-- 5. 机构学员CRM表
CREATE TABLE IF NOT EXISTS org_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    student_name VARCHAR(50) NOT NULL COMMENT '学员姓名',
    parent_name VARCHAR(50) COMMENT '家长姓名',
    parent_phone VARCHAR(20) COMMENT '家长电话',
    grade VARCHAR(20) COMMENT '年级',
    subjects JSON COMMENT '学习科目',
    teacher_id INT COMMENT '指定教师ID',
    source VARCHAR(50) COMMENT '来源: platform/referral/activity',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1意向 2试听 3在读 4停课 5结课',
    total_hours INT DEFAULT 0 COMMENT '总课时',
    remaining_hours INT DEFAULT 0 COMMENT '剩余课时',
    total_amount DECIMAL(10,2) DEFAULT 0 COMMENT '总消费金额',
    last_contact_at DATETIME COMMENT '最后联系时间',
    next_follow_at DATETIME COMMENT '下次跟进时间',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (org_id, status),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构学员CRM表';

-- 6. 学员跟进记录表
CREATE TABLE IF NOT EXISTS student_follow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT '学员ID',
    org_id INT NOT NULL COMMENT '机构ID',
    operator_id INT NOT NULL COMMENT '操作人ID',
    follow_type VARCHAR(20) COMMENT '跟进类型: call/visit/message/trial',
    content TEXT COMMENT '跟进内容',
    next_action VARCHAR(100) COMMENT '下一步行动',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_id),
    INDEX idx_org (org_id),
    FOREIGN KEY (student_id) REFERENCES org_students(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学员跟进记录表';

-- 7. 机构财务结算表
CREATE TABLE IF NOT EXISTS org_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    period_start DATE NOT NULL COMMENT '结算周期开始',
    period_end DATE NOT NULL COMMENT '结算周期结束',
    total_orders INT DEFAULT 0 COMMENT '订单总数',
    total_amount DECIMAL(12,2) DEFAULT 0 COMMENT '订单总金额',
    platform_fee DECIMAL(12,2) DEFAULT 0 COMMENT '平台服务费',
    org_income DECIMAL(12,2) DEFAULT 0 COMMENT '机构收入',
    teacher_income DECIMAL(12,2) DEFAULT 0 COMMENT '教师收入',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待确认 1已确认 2已结算',
    settled_at DATETIME COMMENT '结算时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    INDEX idx_period (org_id, period_start, period_end),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构财务结算表';

-- 8. 机构品牌展示配置表
CREATE TABLE IF NOT EXISTS org_brand_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    banner_images JSON COMMENT '轮播图列表',
    intro_video VARCHAR(255) COMMENT '介绍视频',
    featured_teachers JSON COMMENT '推荐教师ID列表',
    success_cases JSON COMMENT '成功案例',
    honors JSON COMMENT '荣誉资质',
    teaching_features TEXT COMMENT '教学特色',
    service_promise TEXT COMMENT '服务承诺',
    faqs JSON COMMENT '常见问题',
    is_priority SMALLINT DEFAULT 0 COMMENT '是否优先推荐',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_org (org_id),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构品牌展示配置表';

-- 9. 机构邀请奖励配置表
CREATE TABLE IF NOT EXISTS org_invite_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '机构ID',
    invite_type SMALLINT DEFAULT 1 COMMENT '邀请类型: 1教师 2家长',
    reward_type SMALLINT DEFAULT 1 COMMENT '奖励类型: 1现金 2优惠券 3会员时长',
    reward_amount DECIMAL(10,2) COMMENT '奖励金额',
    reward_days INT COMMENT '奖励会员天数',
    condition_type VARCHAR(20) COMMENT '条件: register/auth/first_order',
    status SMALLINT DEFAULT 1 COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org (org_id),
    FOREIGN KEY (org_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构邀请奖励配置表';

-- 10. 扩展 organizations 表，添加会员相关字段
ALTER TABLE organizations 
ADD COLUMN membership_type SMALLINT DEFAULT 0 COMMENT '会员类型: 0无 1基础版 2专业版 3旗舰版' AFTER status,
ADD COLUMN membership_expire_at DATETIME COMMENT '会员到期时间' AFTER membership_type,
ADD COLUMN invite_code VARCHAR(20) UNIQUE COMMENT '邀请码' AFTER membership_expire_at,
ADD COLUMN teacher_count INT DEFAULT 0 COMMENT '教师数量' AFTER invite_code,
ADD COLUMN student_count INT DEFAULT 0 COMMENT '学员数量' AFTER teacher_count,
ADD COLUMN total_revenue DECIMAL(12,2) DEFAULT 0 COMMENT '累计营收' AFTER student_count,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '机构评分' AFTER total_revenue,
ADD COLUMN verify_status SMALLINT DEFAULT 0 COMMENT '认证状态: 0未认证 1认证中 2已认证' AFTER rating;

-- 为现有机构生成邀请码
UPDATE organizations SET invite_code = CONCAT('ORG', LPAD(id, 6, '0'), UPPER(SUBSTRING(MD5(RAND()), 1, 4))) WHERE invite_code IS NULL;

-- 11. 扩展 user_orgs 表，添加会员共享字段
ALTER TABLE user_orgs
ADD COLUMN inherit_membership SMALLINT DEFAULT 1 COMMENT '是否继承机构会员: 0否 1是' AFTER status,
ADD COLUMN membership_expire_at DATETIME COMMENT '会员到期时间(继承自机构)' AFTER inherit_membership;

-- 12. 扩展 users 表，添加机构会员共享标记
ALTER TABLE users
ADD COLUMN org_membership_source INT COMMENT '会员来源机构ID' AFTER membership_expire_at;
