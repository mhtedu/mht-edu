#!/bin/bash
# 服务器端快速部署脚本 - 在服务器上执行
# 使用方法: bash quick-deploy.sh

set -e

echo "=========================================="
echo "棉花糖教育平台 - 快速部署脚本"
echo "=========================================="

# 配置
PROJECT_DIR="/www/wwwroot/mht-edu"
DOMAIN="mt.dajiaopei.com"
DB_USER="mht_edu"
DB_PASS="mht@2026"
DB_NAME="mht_edu"
SERVER_PORT=3002

# 1. 创建目录
echo "[1/6] 创建项目目录..."
mkdir -p $PROJECT_DIR/dist
mkdir -p $PROJECT_DIR/server/dist
mkdir -p $PROJECT_DIR/logs

# 2. 创建环境变量
echo "[2/6] 创建环境变量..."
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

# 3. 创建PM2配置
echo "[3/6] 创建PM2配置..."
cat > $PROJECT_DIR/ecosystem.config.js << 'EOFPM2'
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
EOFPM2

# 4. 配置Nginx
echo "[4/6] 配置Nginx..."
cat > /www/server/panel/vhost/nginx/$DOMAIN.conf << 'EOFNGINX'
server {
    listen 80;
    server_name mt.dajiaopei.com;
    
    root /www/wwwroot/mht-edu/dist;
    index index.html index.htm;

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
    }

    # 管理后台
    location = /admin {
        try_files /admin.html =404;
    }
    
    location = /admin/ {
        try_files /admin.html =404;
    }
    
    location ~* ^/admin/.* {
        try_files $uri /admin.html;
    }

    # 登录页
    location = /login {
        try_files /login.html =404;
    }

    # 静态文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    # 默认
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOFNGINX

# 5. 测试并重载Nginx
echo "[5/6] 测试并重载Nginx..."
if nginx -t 2>/dev/null; then
    nginx -s reload
    echo "Nginx配置已更新"
else
    echo "警告: Nginx配置测试失败，请检查"
fi

# 6. 检查服务状态
echo "[6/6] 检查服务状态..."
echo ""
echo "=========================================="
echo "✅ 基础配置完成！"
echo "=========================================="
echo ""
echo "接下来需要上传项目文件："
echo ""
echo "1. 上传前端静态文件到 $PROJECT_DIR/dist/"
echo "   需要的文件: admin.html, admin.css, admin.js, login.html"
echo ""
echo "2. 上传后端编译文件到 $PROJECT_DIR/server/dist/"
echo "   需要的目录: dist/src/*, package.json"
echo ""
echo "3. 安装依赖并启动服务:"
echo "   cd $PROJECT_DIR/server"
echo "   pnpm install --prod"
echo "   pm2 start $PROJECT_DIR/ecosystem.config.js"
echo ""
echo "4. 验证部署:"
echo "   curl http://localhost:3002/api/health"
echo "   curl -I https://$DOMAIN/admin/"
echo ""
