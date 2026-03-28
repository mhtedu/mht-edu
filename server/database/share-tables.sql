-- 分享功能相关表

USE mht_edu;

-- 分享链接表
CREATE TABLE IF NOT EXISTS share_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_code VARCHAR(32) NOT NULL UNIQUE COMMENT '分享码',
    user_id INT NOT NULL COMMENT '分享者ID',
    target_type VARCHAR(20) NOT NULL COMMENT '目标类型: order, teacher, activity',
    target_id INT NOT NULL COMMENT '目标ID',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    share_count INT DEFAULT 0 COMMENT '分享次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_code (share_code),
    INDEX idx_target (target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享链接表';

-- 分享日志表
CREATE TABLE IF NOT EXISTS share_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_code VARCHAR(32) NOT NULL COMMENT '分享码',
    user_id INT COMMENT '分享用户ID',
    channel VARCHAR(20) COMMENT '分享渠道: wechat, timeline, qq',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (share_code),
    FOREIGN KEY (share_code) REFERENCES share_links(share_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享日志表';

-- 分享浏览日志表
CREATE TABLE IF NOT EXISTS share_view_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_code VARCHAR(32) NOT NULL COMMENT '分享码',
    viewer_id INT COMMENT '浏览者ID(0为未登录)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (share_code),
    FOREIGN KEY (share_code) REFERENCES share_links(share_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享浏览日志表';

-- 潜在用户表（通过分享链接访问但未注册的用户）
CREATE TABLE IF NOT EXISTS potential_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_code VARCHAR(32) NOT NULL COMMENT '分享码',
    inviter_id INT NOT NULL COMMENT '邀请人ID',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, registered, converted',
    registered_user_id INT COMMENT '注册后的用户ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inviter (inviter_id),
    INDEX idx_status (status),
    FOREIGN KEY (share_code) REFERENCES share_links(share_code) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='潜在用户表';

-- 机构代录需求表
CREATE TABLE IF NOT EXISTS org_proxy_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    org_id INT NOT NULL COMMENT '机构ID',
    parent_name VARCHAR(50) COMMENT '家长姓名',
    parent_phone VARCHAR(20) COMMENT '家长电话',
    share_to_parent SMALLINT DEFAULT 1 COMMENT '是否分享给家长',
    parent_share_code VARCHAR(32) COMMENT '家长分享码',
    parent_viewed SMALLINT DEFAULT 0 COMMENT '家长是否已查看',
    conversation_with_org SMALLINT DEFAULT 1 COMMENT '对话由机构承接',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_org (org_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构代录需求表';

-- 分享收益表（记录通过分享产生的佣金）
CREATE TABLE IF NOT EXISTS share_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '分享者ID',
    share_code VARCHAR(32) NOT NULL COMMENT '分享码',
    from_user_id INT COMMENT '来源用户ID',
    order_id INT COMMENT '关联订单ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '佣金金额',
    status SMALLINT DEFAULT 0 COMMENT '状态: 0待结算 1已结算 2已提现',
    settled_at DATETIME COMMENT '结算时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_share_code (share_code),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享收益表';

SELECT '分享功能表创建完成' as message;
