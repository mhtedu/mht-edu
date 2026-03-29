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
    └── database/       → /www/wwwroot/mht-edu/server/database/

## 部署步骤

### 1. 宝塔面板设置（重要！）
网站设置 → 网站目录 → 运行目录改为 `/` → 保存

### 2. 上传解压
上传压缩包到 /www/wwwroot/mht-edu/
cd /www/wwwroot/mht-edu
tar -xzvf mht-edu-deploy-*.tar.gz

### 3. 导入数据库
宝塔面板 → 数据库 → mht_edu → 管理 → phpMyAdmin
按顺序导入 server/database/ 下的 SQL 文件

### 4. 创建环境变量
cd /www/wwwroot/mht-edu/server
echo "SERVER_PORT=3002" > .env
echo "PORT=3002" >> .env
echo "NODE_ENV=production" >> .env

### 5. 重启服务
pm2 restart mht-edu

## 访问地址
- 前端：https://mt.dajiaopei.com
- 后台：https://mt.dajiaopei.com/admin/
- API：https://mt.dajiaopei.com/api/health

## 默认管理员
用户名：admin
密码：password
