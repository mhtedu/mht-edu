# 服务器部署完整指南

## 问题诊断

当前问题：访问 `mt.dajiaopei.com/admin/` 页面空白转圈

**根本原因**：服务器上项目目录 `/www/wwwroot/mht-edu/` 不存在，需要重新部署

---

## 快速修复步骤

### 第一步：在宝塔面板创建项目目录

SSH登录服务器，执行：

```bash
# 创建项目目录
mkdir -p /www/wwwroot/mht-edu/dist
mkdir -p /www/wwwroot/mht-edu/server/dist
mkdir -p /www/wwwroot/mht-edu/logs

# 设置权限
chmod -R 755 /www/wwwroot/mht-edu
```

### 第二步：上传静态文件到服务器

**方法1：使用宝塔面板文件管理器**
1. 打开宝塔面板 → 文件
2. 导航到 `/www/wwwroot/mht-edu/dist/`
3. 上传以下文件（从本项目的 `public/` 目录）：
   - admin.html
   - admin.css
   - admin.js
   - login.html

**方法2：使用SCP命令**
```bash
# 在本地项目目录执行
scp public/admin.html root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/
scp public/admin.css root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/
scp public/admin.js root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/
scp public/login.html root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/
```

### 第三步：上传后端代码

需要将编译后的后端代码上传到服务器：

```bash
# 在本地项目目录执行
# 1. 先编译后端
cd server
pnpm build

# 2. 上传到服务器
scp -r dist/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/server/dist/
scp package.json root@mt.dajiaopei.com:/www/wwwroot/mht-edu/server/
scp pnpm-lock.yaml root@mt.dajiaopei.com:/www/wwwroot/mht-edu/server/
```

### 第四步：创建环境配置

在服务器上创建 `/www/wwwroot/mht-edu/server/.env` 文件：

```bash
cat > /www/wwwroot/mht-edu/server/.env << 'EOF'
NODE_ENV=production
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu
JWT_SECRET=mht-edu-jwt-secret-key-2024
PROJECT_DOMAIN=https://mt.dajiaopei.com
EOF
```

### 第五步：安装后端依赖并启动

```bash
# 进入服务器项目目录
cd /www/wwwroot/mht-edu/server

# 安装生产依赖
pnpm install --prod

# 使用PM2启动服务
pm2 start dist/src/main.js --name mht-edu-api

# 或者使用ecosystem配置
pm2 start /www/wwwroot/mht-edu/ecosystem.config.js
```

### 第六步：配置Nginx

创建或更新Nginx配置：

```bash
cat > /www/server/panel/vhost/nginx/mt.dajiaopei.com.conf << 'EOF'
server {
    listen 80;
    server_name mt.dajiaopei.com;
    
    root /www/wwwroot/mht-edu/dist;
    index index.html index.htm;

    # 日志
    access_log /www/wwwlogs/mht-edu.access.log;
    error_log /www/wwwlogs/mht-edu.error.log;

    # API代理 - 转发到后端3002端口
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

    # 管理后台 - 直接返回admin.html
    location = /admin {
        alias /www/wwwroot/mht-edu/dist;
        try_files /admin.html =404;
    }
    
    location = /admin/ {
        alias /www/wwwroot/mht-edu/dist;
        try_files /admin.html =404;
    }
    
    location /admin/ {
        alias /www/wwwroot/mht-edu/dist/;
        try_files $uri /admin.html;
    }

    # 登录页
    location = /login {
        alias /www/wwwroot/mht-edu/dist;
        try_files /login.html =404;
    }

    # 静态文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1d;
        add_header Cache-Control "public";
    }

    # 默认
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 测试配置
nginx -t

# 重载Nginx
nginx -s reload
```

### 第七步：验证部署

```bash
# 检查文件是否存在
ls -la /www/wwwroot/mht-edu/dist/

# 检查后端服务
pm2 list
curl http://localhost:3002/api/health

# 检查外网访问
curl -I https://mt.dajiaopei.com/admin/
curl -I https://mt.dajiaopei.com/api/health
```

---

## 完整的一键部署命令

如果你有SSH访问权限，可以直接在服务器上执行以下命令：

```bash
#!/bin/bash
# 一键修复部署脚本

# 1. 创建目录
mkdir -p /www/wwwroot/mht-edu/{dist,server/dist,logs}

# 2. 创建PM2配置
cat > /www/wwwroot/mht-edu/ecosystem.config.js << 'EOFPM2'
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

# 3. 创建环境变量
cat > /www/wwwroot/mht-edu/server/.env << 'EOFENV'
NODE_ENV=production
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu
JWT_SECRET=mht-edu-jwt-secret-key-2024
PROJECT_DOMAIN=https://mt.dajiaopei.com
EOFENV

# 4. 创建Nginx配置
cat > /www/server/panel/vhost/nginx/mt.dajiaopei.com.conf << 'EOFNGINX'
server {
    listen 80;
    server_name mt.dajiaopei.com;
    
    root /www/wwwroot/mht-edu/dist;
    index index.html index.htm;

    access_log /www/wwwlogs/mht-edu.access.log;
    error_log /www/wwwlogs/mht-edu.error.log;

    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location = /admin {
        try_files /admin.html =404;
    }
    
    location = /admin/ {
        try_files /admin.html =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1d;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOFNGINX

# 5. 重载Nginx
nginx -t && nginx -s reload

echo "基础配置完成！请上传项目文件"
```

---

## 需要上传的文件清单

### 前端静态文件 (上传到 /www/wwwroot/mht-edu/dist/)
- [ ] admin.html
- [ ] admin.css
- [ ] admin.js
- [ ] login.html
- [ ] index.html (如果有H5前端)
- [ ] assets/ (如果有资源文件)

### 后端编译文件 (上传到 /www/wwwroot/mht-edu/server/dist/)
- [ ] dist/src/main.js
- [ ] dist/src/modules/**/*
- [ ] dist/src/common/**/*
- [ ] package.json
- [ ] pnpm-lock.yaml

---

## 常见问题排查

### 问题1：页面空白
**检查**：
```bash
# 检查文件是否存在
ls -la /www/wwwroot/mht-edu/dist/admin.html
# 检查Nginx配置
nginx -t
# 查看Nginx错误日志
tail -50 /www/wwwlogs/mht-edu.error.log
```

### 问题2：API 502 Bad Gateway
**检查**：
```bash
# 检查后端进程是否运行
pm2 list
# 检查端口是否监听
ss -tuln | grep 3002
# 检查后端日志
pm2 logs mht-edu-api --lines 50
```

### 问题3：数据库连接失败
**检查**：
```bash
# 测试数据库连接
mysql -u mht_edu -p'mht@2026' mht_edu -e "SELECT 1"
# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES LIKE 'mht_edu'"
```

### 问题4：登录失败
**检查**：
```bash
# 检查admin_user表是否存在
mysql -u mht_edu -p'mht@2026' mht_edu -e "SELECT * FROM admin_user LIMIT 5"
# 检查API响应
curl -X POST http://localhost:3002/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 联系支持

如果以上步骤无法解决问题，请提供：
1. Nginx错误日志：`tail -100 /www/wwwlogs/mht-edu.error.log`
2. PM2日志：`pm2 logs mht-edu-api --lines 100`
3. 文件目录结构：`ls -laR /www/wwwroot/mht-edu/`
