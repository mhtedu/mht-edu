#!/bin/bash
# 棉花糖教育平台 - 服务器部署脚本
# 适用于宝塔面板环境

set -e

# ==================== 配置区 ====================
PROJECT_NAME="mht-edu"
PROJECT_DIR="/www/wwwroot/mht-edu"
DOMAIN="mt.dajiaopei.com"
DB_NAME="mht_edu"
DB_USER="mht_edu"
DB_PASS="mht@2026"
SERVER_PORT=3002

# ==================== 颜色输出 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==================== 检查root权限 ====================
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root权限运行此脚本"
    exit 1
fi

# ==================== 创建项目目录 ====================
log_info "创建项目目录..."
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/dist
mkdir -p $PROJECT_DIR/server
mkdir -p $PROJECT_DIR/logs

# ==================== 安装依赖 ====================
log_info "检查Node.js环境..."
if ! command -v node &> /dev/null; then
    log_error "Node.js未安装，请先安装Node.js"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js版本过低，需要18+"
    exit 1
fi

log_info "Node.js版本: $(node -v)"

# ==================== 创建数据库 ====================
log_info "检查数据库..."
if command -v mysql &> /dev/null; then
    mysql -u root -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    mysql -u root -p"$DB_PASS" -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';" 2>/dev/null || true
    mysql -u root -p"$DB_PASS" -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';" 2>/dev/null || true
    mysql -u root -p"$DB_PASS" -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    log_info "数据库配置完成"
fi

# ==================== 创建PM2配置 ====================
log_info "创建PM2配置..."
cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mht-edu-api',
    script: './server/dist/src/main.js',
    cwd: '/www/wwwroot/mht-edu',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USER: 'mht_edu',
      DB_PASSWORD: 'mht@2026',
      DB_DATABASE: 'mht_edu',
      JWT_SECRET: 'mht-edu-jwt-secret-key-2024',
      PROJECT_DOMAIN: 'https://mt.dajiaopei.com'
    }
  }]
};
EOF

# ==================== 创建环境变量文件 ====================
log_info "创建环境变量文件..."
cat > $PROJECT_DIR/server/.env << EOF
NODE_ENV=production
PORT=$SERVER_PORT
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_DATABASE=$DB_NAME
JWT_SECRET=mht-edu-jwt-secret-key-2024
PROJECT_DOMAIN=https://$DOMAIN
EOF

# ==================== 创建Nginx配置 ====================
log_info "创建Nginx配置..."
cat > /www/server/panel/vhost/nginx/$DOMAIN.conf << 'EOF'
server {
    listen 80;
    server_name mt.dajiaopei.com;
    
    root /www/wwwroot/mht-edu/dist;
    index index.html index.htm;

    # 日志
    access_log /www/wwwlogs/mht-edu.access.log;
    error_log /www/wwwlogs/mht-edu.error.log;

    # API代理
    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 管理后台SPA路由
    location /admin {
        alias /www/wwwroot/mht-edu/dist;
        try_files $uri $uri/ /admin.html;
    }

    # 登录页
    location /login {
        alias /www/wwwroot/mht-edu/dist;
        try_files $uri $uri/ /login.html;
    }

    # 静态文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # H5前端
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 测试Nginx配置
log_info "测试Nginx配置..."
if nginx -t 2>/dev/null; then
    log_info "Nginx配置正确"
else
    log_warn "Nginx配置可能有问题，请检查"
fi

# ==================== 输出部署指南 ====================
echo ""
echo "=========================================="
log_info "服务器基础配置完成！"
echo "=========================================="
echo ""
echo "接下来的步骤："
echo ""
echo "1. 上传项目文件到服务器:"
echo "   scp -r dist/* root@mt.dajiaopei.com:$PROJECT_DIR/dist/"
echo "   scp -r server/dist/* root@mt.dajiaopei.com:$PROJECT_DIR/server/dist/"
echo ""
echo "2. 安装后端依赖并启动服务:"
echo "   cd $PROJECT_DIR/server"
echo "   pnpm install --prod"
echo "   pm2 start $PROJECT_DIR/ecosystem.config.js"
echo ""
echo "3. 重载Nginx:"
echo "   nginx -s reload"
echo ""
echo "4. 检查服务状态:"
echo "   pm2 list"
echo "   curl http://localhost:$SERVER_PORT/api/health"
echo ""
