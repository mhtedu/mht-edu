========================================
棉花糖教育平台 - 部署说明
========================================

## 目录结构（解压后直接覆盖到 /www/wwwroot/mht-edu/）

mht-edu-deploy/
├── index.html          → /www/wwwroot/mht-edu/index.html
├── js/                 → /www/wwwroot/mht-edu/js/
├── css/                → /www/wwwroot/mht-edu/css/
├── static/             → /www/wwwroot/mht-edu/static/
├── admin/              → /www/wwwroot/mht-edu/admin/
└── server/
    ├── dist/           → /www/wwwroot/mht-edu/server/dist/
    ├── database/       → /www/wwwroot/mht-edu/server/database/
    └── .env            → /www/wwwroot/mht-edu/server/.env

## 部署步骤

### 1. 宝塔面板设置（重要！）
网站设置 → 网站目录 → 运行目录改为 `/` → 保存

### 2. 上传解压
上传压缩包到 /www/wwwroot/mht-edu/
cd /www/wwwroot/mht-edu
tar -xzvf mht-edu-deploy-*.tar.gz

### 3. 导入数据库
宝塔面板 → 数据库 → mht_edu → 管理 → phpMyAdmin
按顺序导入 server/database/ 下的 SQL 文件：
  1. mht_edu_complete.sql（表结构+基础数据）
  2. site_config_complete.sql（系统配置数据）

### 4. 配置环境变量
cd /www/wwwroot/mht-edu/server
修改 .env 文件中的数据库密码和JWT密钥

### 5. 重启服务
pm2 restart mht-edu

### 6. 配置微信小程序（重要！）
登录管理后台 → 系统配置 → 填写以下配置：

【微信小程序】
- wechat_appid: 小程序AppID
- wechat_secret: 小程序Secret

【微信支付】
- wechat_pay_mch_id: 商户号
- wechat_pay_api_key: API密钥(V2)
- wechat_pay_notify_url: 支付回调地址

【短信配置】
- sms_access_key_id: 阿里云AccessKey
- sms_access_key_secret: 阿里云Secret
- sms_sign_name: 短信签名

## 访问地址
- 前端：https://mt.dajiaopei.com
- 后台：https://mt.dajiaopei.com/admin/
- API：https://mt.dajiaopei.com/api/health

## 默认管理员
用户名：admin
密码：password
⚠️ 登录后请立即修改密码！
