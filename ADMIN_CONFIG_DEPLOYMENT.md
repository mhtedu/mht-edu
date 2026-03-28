# 管理后台配置功能部署指南

## 第一步：导入配置表

请在phpMyAdmin中执行以下SQL：

```sql
-- 在mht_edu数据库中执行
USE mht_edu;

-- 站点配置表
DROP TABLE IF EXISTS `site_config`;
CREATE TABLE `site_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `config_type` VARCHAR(20) DEFAULT 'text' COMMENT '配置类型: text/number/boolean/json/image',
    `config_group` VARCHAR(50) DEFAULT 'basic' COMMENT '配置分组: basic/wechat/payment/sms',
    `label` VARCHAR(100) COMMENT '配置名称',
    `description` VARCHAR(255) COMMENT '配置说明',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_config_key` (`config_key`),
    INDEX `idx_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点配置表';

-- 默认配置数据
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `label`, `description`, `sort_order`) VALUES
-- 基础配置
('site_name', '棉花糖教育平台', 'text', 'basic', '站点名称', '网站/小程序名称', 1),
('site_domain', 'https://mt.dajiaopei.com', 'text', 'basic', '网站域名', '不带尾部斜杠', 2),
('site_logo', '', 'image', 'basic', '站点Logo', '建议尺寸: 200x60', 3),
('site_description', '专业的教育信息撮合平台', 'text', 'basic', '站点描述', '用于SEO和分享', 4),
('contact_phone', '', 'text', 'basic', '客服电话', '对外展示的联系电话', 5),
('contact_wechat', '', 'text', 'basic', '客服微信', '对外展示的微信号', 6),

-- 微信小程序配置
('wechat_appid', '', 'text', 'wechat', '小程序AppID', '微信小程序AppID', 10),
('wechat_secret', '', 'text', 'wechat', '小程序Secret', '微信小程序Secret', 11),

-- 微信支付配置
('wechat_mch_id', '', 'text', 'payment', '商户号', '微信支付商户号', 20),
('wechat_pay_key', '', 'text', 'payment', '支付密钥', '微信支付API密钥(32位)', 21),
('wechat_pay_cert', '', 'text', 'payment', '支付证书', 'apiclient_cert.pem内容', 22),
('wechat_pay_key_pem', '', 'text', 'payment', '支付证书私钥', 'apiclient_key.pem内容', 23),

-- 分佣配置
('commission_rate_platform', '5', 'number', 'basic', '平台分佣比例(%)', '平台从课时费中抽取的比例', 30),
('commission_rate_referrer', '10', 'number', 'basic', '推荐人分佣比例(%)', '推荐人从课时费中抽取的比例', 31),

-- 会员配置
('super_member_invite_count', '10', 'number', 'basic', '超级会员邀请人数', '邀请多少人可解锁超级会员', 40);
```

## 第二步：更新服务器代码

```bash
# 进入项目目录
cd /www/wwwroot/mht-edu/server

# 创建新的模块文件（手动上传或使用以下命令）

# 重新编译
pnpm build

# 重启服务
pm2 restart mht-edu-api

# 测试接口
curl http://localhost:3002/api/admin/config/public/site
```

## 第三步：访问管理后台

在小程序中访问管理后台页面，路径：`/pages/admin-config/index`

## API接口说明

| 接口 | 方法 | 权限 | 说明 |
|------|------|------|------|
| /api/admin/config/public/site | GET | 无需登录 | 获取公开站点配置 |
| /api/admin/config | GET | 管理员 | 获取所有配置 |
| /api/admin/config/group/:group | GET | 管理员 | 按分组获取配置 |
| /api/admin/config/update | POST | 管理员 | 更新单个配置 |
| /api/admin/config/batch-update | POST | 管理员 | 批量更新配置 |

## 管理员权限说明

- 用户ID = 1 的用户默认为管理员
- 角色 role = 3 的用户为管理员
