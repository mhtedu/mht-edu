-- =====================================================
-- 站点配置表 - 完整版（包含所有可配置参数）
-- 在 phpMyAdmin 中执行此脚本
-- =====================================================

-- 如果表不存在则创建
CREATE TABLE IF NOT EXISTS `site_config` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `config_type` VARCHAR(50) DEFAULT 'text' COMMENT '配置类型: text/number/password/json/textarea',
  `config_group` VARCHAR(50) DEFAULT 'basic' COMMENT '配置分组: basic/wechat/sms/map/payment/member/other',
  `description` VARCHAR(255) COMMENT '配置描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_config_key` (`config_key`),
  KEY `idx_config_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置表';

-- 清空现有配置（可选，首次导入时取消注释）
-- TRUNCATE TABLE `site_config`;

-- =====================================================
-- 1. 基础配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
-- 站点基本信息
('site_name', '棉花糖教育平台', 'text', 'basic', '站点名称', 1),
('site_domain', 'mt.dajiaopei.com', 'text', 'basic', '站点域名', 2),
('site_logo', '', 'text', 'basic', '站点Logo URL', 3),
('site_description', '基于LBS的教育信息撮合平台，整合家长、个体教师、教育机构资源', 'textarea', 'basic', '站点描述', 4),
('site_keywords', '家教,教育,培训,教师,辅导', 'text', 'basic', 'SEO关键词', 5),
('site_icp', '', 'text', 'basic', 'ICP备案号', 6),
('copyright', '© 2024 棉花糖教育平台 版权所有', 'text', 'basic', '版权信息', 7),

-- 联系方式
('contact_phone', '400-123-4567', 'text', 'basic', '客服电话', 10),
('contact_email', 'service@mht-edu.com', 'text', 'basic', '客服邮箱', 11),
('contact_wechat', 'mht_edu_service', 'text', 'basic', '客服微信号', 12),
('contact_qq', '', 'text', 'basic', '客服QQ', 13),
('contact_address', '北京市朝阳区', 'text', 'basic', '公司地址', 14),

-- 工作时间
('work_time', '周一至周日 9:00-21:00', 'text', 'basic', '客服工作时间', 15)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 2. 微信小程序配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('wechat_appid', '', 'text', 'wechat', '微信小程序AppID', 20),
('wechat_secret', '', 'password', 'wechat', '微信小程序AppSecret', 21),
('wechat_token', '', 'text', 'wechat', '消息推送Token', 22),
('wechat_aes_key', '', 'text', 'wechat', '消息加密Key', 23)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 3. 微信支付配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('wechat_pay_mch_id', '', 'text', 'payment', '微信支付商户号', 30),
('wechat_pay_api_key', '', 'password', 'payment', '微信支付API密钥(V2)', 31),
('wechat_pay_api_v3_key', '', 'password', 'payment', '微信支付APIv3密钥', 32),
('wechat_pay_serial_no', '', 'text', 'payment', '商户证书序列号', 33),
('wechat_pay_private_key', '', 'textarea', 'payment', '商户私钥内容(apiclient_key.pem)', 34),
('wechat_pay_cert_path', '/www/wwwroot/mht-edu/server/certs/apiclient_cert.pem', 'text', 'payment', '商户证书路径', 35),
('wechat_pay_notify_url', 'https://mt.dajiaopei.com/api/payment/notify', 'text', 'payment', '支付回调地址', 36)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 4. 短信配置（阿里云）
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('sms_provider', 'aliyun', 'text', 'sms', '短信服务商(aliyun/tencent)', 40),
('sms_access_key_id', '', 'text', 'sms', '阿里云AccessKeyId', 41),
('sms_access_key_secret', '', 'password', 'sms', '阿里云AccessKeySecret', 42),
('sms_sign_name', '棉花糖教育', 'text', 'sms', '短信签名', 43),
('sms_template_code_login', '', 'text', 'sms', '登录验证码模板ID', 44),
('sms_template_code_verify', '', 'text', 'sms', '通用验证码模板ID', 45),
('sms_template_code_notify', '', 'text', 'sms', '通知类短信模板ID', 46)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 5. 地图定位配置（腾讯地图）
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('map_provider', 'tencent', 'text', 'map', '地图服务商(tencent/amap/baidu)', 50),
('map_key', '', 'text', 'map', '地图API Key', 51),
('map_secret_key', '', 'password', 'map', '地图Secret Key', 52),
('map_default_city', '北京', 'text', 'map', '默认城市', 53),
('map_default_lat', '39.9042', 'text', 'map', '默认纬度', 54),
('map_default_lng', '116.4074', 'text', 'map', '默认经度', 55),
('map_search_radius', '50', 'number', 'map', '搜索半径(km)', 56)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 6. 会员配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('member_monthly_price', '99', 'number', 'member', '月度会员价格(元)', 60),
('member_quarterly_price', '259', 'number', 'member', '季度会员价格(元)', 61),
('member_yearly_price', '799', 'number', 'member', '年度会员价格(元)', 62),
('member_super_price', '999', 'number', 'member', '超级会员价格(元)', 63),
('member_benefits', '["查看教师联系方式","发布需求无限次","参与活动优惠","专属客服支持"]', 'json', 'member', '会员权益列表(JSON)', 64),
('member_invite_count', '10', 'number', 'member', '邀请多少人可成为超级会员', 65)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 7. 分佣配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('commission_platform_rate', '5', 'number', 'commission', '平台抽成比例(%)', 70),
('commission_referrer_rate', '10', 'number', 'commission', '推荐人佣金比例(%)', 71),
('commission_2nd_referrer_rate', '3', 'number', 'commission', '二级推荐人佣金比例(%)', 72),
('commission_agent_rate', '5', 'number', 'commission', '城市代理佣金比例(%)', 73),
('commission_min_amount', '1', 'number', 'commission', '最低提现金额(元)', 74),
('commission_withdraw_fee_rate', '0.6', 'number', 'commission', '提现手续费比例(%)', 75)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 8. 订单配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('order_expire_hours', '72', 'number', 'order', '订单过期时间(小时)', 80),
('order_auto_close_hours', '168', 'number', 'order', '订单自动关闭时间(小时)', 81),
('order_max_distance', '50', 'number', 'order', '最大接单距离(km)', 82),
('order_cancel_penalty_rate', '10', 'number', 'order', '取消订单违约金比例(%)', 83)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 9. 机器人客服配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('robot_enabled', '1', 'number', 'robot', '是否启用机器人客服(0/1)', 90),
('robot_welcome_msg', '您好，我是棉花糖教育智能客服，有什么可以帮助您的？', 'textarea', 'robot', '机器人欢迎语', 91),
('robot_member_guide', '开通会员即可查看教师联系方式，享受更多权益！', 'textarea', 'robot', '会员引导语', 92),
('robot_transfer_keywords', '人工,客服,转人工', 'text', 'robot', '转人工关键词(逗号分隔)', 93)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 10. AI大模型配置（可选）
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('ai_provider', '', 'text', 'ai', 'AI服务商(openai/deepseek/qwen)', 100),
('ai_api_key', '', 'password', 'ai', 'AI API Key', 101),
('ai_api_url', '', 'text', 'ai', 'AI API地址', 102),
('ai_model', 'gpt-3.5-turbo', 'text', 'ai', 'AI模型名称', 103),
('ai_max_tokens', '1000', 'number', 'ai', '最大Token数', 104)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 11. 存储配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('storage_provider', 'local', 'text', 'storage', '存储方式(local/oss/cos)', 110),
('storage_oss_endpoint', '', 'text', 'storage', 'OSS Endpoint', 111),
('storage_oss_bucket', '', 'text', 'storage', 'OSS Bucket名称', 112),
('storage_oss_access_key', '', 'text', 'storage', 'OSS AccessKey', 113),
('storage_oss_access_secret', '', 'password', 'storage', 'OSS AccessSecret', 114),
('storage_oss_domain', '', 'text', 'storage', 'OSS自定义域名', 115),
('storage_local_path', '/www/wwwroot/mht-edu/uploads', 'text', 'storage', '本地存储路径', 116),
('storage_max_size', '10', 'number', 'storage', '最大上传大小(MB)', 117),
('storage_allowed_types', 'jpg,jpeg,png,gif,pdf,doc,docx', 'text', 'storage', '允许的文件类型', 118)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 12. 小程序配置
-- =====================================================
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `description`, `sort_order`) VALUES
('mp_privacy_policy', '', 'text', 'mp', '隐私政策链接', 120),
('mp_user_agreement', '', 'text', 'mp', '用户协议链接', 121),
('mp_share_title', '棉花糖教育 - 找好老师，上棉花糖', 'text', 'mp', '默认分享标题', 122),
('mp_share_image', '', 'text', 'mp', '默认分享图片URL', 123),
('mp_service_message_template', '', 'text', 'mp', '服务通知模板ID', 124)
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =====================================================
-- 完成
-- =====================================================
SELECT '✅ 站点配置初始化完成！' AS message;
SELECT config_group, COUNT(*) as count FROM site_config GROUP BY config_group;
