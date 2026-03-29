#!/bin/bash

# =====================================================
# 棉花糖教育平台 - 清晰结构的部署包生成脚本
# =====================================================

echo "🚀 开始生成部署包..."

PROJECT_DIR="/workspace/projects"
DEPLOY_DIR="${PROJECT_DIR}/deploy_package"
DATE=$(date +%Y%m%d_%H%M%S)

# 清理旧的部署包
rm -rf ${DEPLOY_DIR}
mkdir -p ${DEPLOY_DIR}

echo "📦 创建清晰的目录结构..."

# === 前端文件 (对应服务器的 dist/) ===
echo "  📁 复制前端文件..."
cp -r ${PROJECT_DIR}/dist-web/* ${DEPLOY_DIR}/

# === 管理后台文件 (对应服务器的 dist/admin/) ===
echo "  📁 复制管理后台文件..."
mkdir -p ${DEPLOY_DIR}/admin
cp ${PROJECT_DIR}/public/admin.html ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/admin.css ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/admin.js ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/login.html ${DEPLOY_DIR}/admin/

# === 后端编译文件 (对应服务器的 server/dist/) ===
echo "  📁 复制后端编译文件..."
mkdir -p ${DEPLOY_DIR}/server/dist
cp -r ${PROJECT_DIR}/server/dist/* ${DEPLOY_DIR}/server/dist/

# === 数据库脚本 (对应服务器的 server/database/) ===
echo "  📁 复制数据库脚本..."
mkdir -p ${DEPLOY_DIR}/server/database
cp ${PROJECT_DIR}/server/database/mht_edu_complete.sql ${DEPLOY_DIR}/server/database/
cp ${PROJECT_DIR}/server/database/site_config_complete.sql ${DEPLOY_DIR}/server/database/
cp ${PROJECT_DIR}/server/database/admin_system.sql ${DEPLOY_DIR}/server/database/
cp ${PROJECT_DIR}/server/database/mock_data.sql ${DEPLOY_DIR}/server/database/

# === 生成部署说明 ===
cat > ${DEPLOY_DIR}/README.txt << 'EOF'
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
EOF

echo "📦 打包..."
cd ${PROJECT_DIR}
tar -czvf mht-edu-deploy-${DATE}.tar.gz -C ${DEPLOY_DIR} .

echo ""
echo "✅ 部署包生成完成！"
echo ""
echo "📁 文件位置："
echo "   ${PROJECT_DIR}/mht-edu-deploy-${DATE}.tar.gz"
echo ""
echo "📋 目录结构："
echo ""
echo "mht-edu-deploy/"
echo "├── index.html, js/, css/, static/  (前端文件)"
echo "├── admin/                          (管理后台)"
echo "│   ├── admin.html, login.html"
echo "│   └── admin.css, admin.js"
echo "└── server/"
echo "    ├── dist/                       (后端编译文件)"
echo "    └── database/                   (数据库脚本)"
echo "        ├── mht_edu_complete.sql"
echo "        ├── site_config_complete.sql"
echo "        ├── admin_system.sql"
echo "        └── mock_data.sql"
