========================================
棉花糖教育平台 - 部署说明
========================================

## 目录结构说明

解压后直接覆盖到 /www/wwwroot/mht-edu/ 目录

mht-edu-deploy/
├── index.html           → /www/wwwroot/mht-edu/dist/index.html
├── js/                  → /www/wwwroot/mht-edu/dist/js/
├── css/                 → /www/wwwroot/mht-edu/dist/css/
├── static/              → /www/wwwroot/mht-edu/dist/static/
├── admin/               → /www/wwwroot/mht-edu/dist/admin/
│   ├── admin.html
│   ├── admin.css
│   ├── admin.js
│   └── login.html
└── server/
    ├── dist/            → /www/wwwroot/mht-edu/server/dist/
    └── database/        → /www/wwwroot/mht-edu/server/database/
        ├── mht_edu_complete.sql    # 完整数据库结构
        ├── site_config_complete.sql # 站点配置表
        ├── admin_system.sql        # 管理员系统表
        └── mock_data.sql           # 模拟数据

## 部署步骤

### 步骤1：解压覆盖
cd /www/wwwroot/mht-edu
tar -xzvf mht-edu-deploy-*.tar.gz

### 步骤2：导入数据库
登录宝塔面板 → 数据库 → mht_edu → 管理 → phpMyAdmin

按顺序导入：
1. mht_edu_complete.sql (如果是新数据库)
2. site_config_complete.sql
3. admin_system.sql
4. mock_data.sql (可选)

### 步骤3：创建环境变量
cd /www/wwwroot/mht-edu/server
cat > .env << 'ENVEOF'
SERVER_PORT=3002
PORT=3002
NODE_ENV=production
ENVEOF

### 步骤4：重启服务
pm2 restart mht-edu

## 访问地址
- 前端：https://mt.dajiaopei.com
- 后台：https://mt.dajiaopei.com/admin/
- API：https://mt.dajiaopei.com/api/health

## 默认管理员
- 用户名：admin
- 密码：password

⚠️ 首次登录后请立即修改密码！
