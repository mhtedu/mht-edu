-- 站点配置表
CREATE TABLE IF NOT EXISTS `site_config` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `config_type` VARCHAR(50) DEFAULT 'text' COMMENT '配置类型: text/json/rich_text',
  `description` VARCHAR(255) COMMENT '配置描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 1-正常 0-禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置表';

-- 插入默认配置
INSERT INTO `site_config` (`config_key`, `config_value`, `description`) VALUES
('siteName', '棉花糖教育平台', '站点名称'),
('siteDomain', 'mt.dajiaopei.com', '站点域名'),
('servicePhone', '400-123-4567', '客服电话'),
('serviceEmail', 'service@mht-edu.com', '客服邮箱'),
('siteDescription', '基于LBS的教育信息撮合平台', '站点描述'),
('copyright', '© 2024 棉花糖教育平台', '版权信息')
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
