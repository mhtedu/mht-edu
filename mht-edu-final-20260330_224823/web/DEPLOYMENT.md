# 棉花糖教育平台 - 部署指南

## 部署概述

本指南将帮助您将棉花糖教育平台完整部署到生产环境。

## 部署信息

- **域名**: mt.dajiaopei.com
- **站点目录**: /www/wwwroot/mht-edu
- **执行目录**: /www/wwwroot/mht-edu/dist
- **后端端口**: 3002

## 一、数据库部署

### 1. 导入数据库表

登录MySQL数据库，执行以下SQL文件：

```bash
# 进入MySQL
mysql -u root -p

# 切换到数据库
USE mht_edu;

# 导入管理员系统表
source /www/wwwroot/mht-edu/server/database/admin_system.sql;

# 导入站点配置表
source /www/wwwroot/mht-edu/server/database/site_config.sql;

# 初始化管理员密码
source /www/wwwroot/mht-edu/server/database/init_admin_password.sql;
```

### 2. 验证数据库表

```sql
-- 检查管理员表
SELECT * FROM admin_user;

-- 检查角色表
SELECT * FROM admin_role;

-- 检查权限表
SELECT COUNT(*) FROM admin_permission;

-- 检查站点配置表
SELECT * FROM site_config;
```

## 二、文件部署

### 1. 上传项目文件

将以下目录上传到服务器：

```bash
# 项目根目录
/www/wwwroot/mht-edu/
├── dist-web/          # 前端构建文件
├── server/            # 后端代码
├── public/            # 静态资源
└── package.json       # 依赖配置
```

### 2. 安装依赖

```bash
cd /www/wwwroot/mht-edu
pnpm install
```

### 3. 复制管理后台文件

```bash
# 确保管理后台文件在dist目录
cp /www/wwwroot/mht-edu/public/login.html /www/wwwroot/mht-edu/dist-web/
cp /www/wwwroot/mht-edu/public/admin.html /www/wwwroot/mht-edu/dist-web/
cp /www/wwwroot/mht-edu/public/admin.css /www/wwwroot/mht-edu/dist-web/
cp /www/wwwroot/mht-edu/public/admin.js /www/wwwroot/mht-edu/dist-web/
```

## 三、环境配置

### 1. 创建环境变量文件

创建 `/www/wwwroot/mht-edu/.env.production`：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=mht_edu

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 服务配置
PORT=3002
NODE_ENV=production

# 域名配置
PROJECT_DOMAIN=https://mt.dajiaopei.com
```

### 2. 修改JWT密钥

⚠️ **重要**: 请修改JWT_SECRET为一个复杂的随机字符串！

```bash
# 生成随机密钥
openssl rand -base64 32

# 或使用Node.js生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 四、Nginx配置

### 1. 修改Nginx配置

编辑 `/www/server/panel/vhost/nginx/mt.dajiaopei.com.conf`：

```nginx
server {
    listen 80;
    server_name mt.dajiaopei.com;
    
    # 强制HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mt.dajiaopei.com;
    
    # SSL证书配置（宝塔面板自动配置）
    ssl_certificate /www/server/panel/vhost/cert/mt.dajiaopei.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/mt.dajiaopei.com/privkey.pem;
    
    # 网站根目录
    root /www/wwwroot/mht-edu/dist-web;
    index index.html;
    
    # H5前端
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 管理后台
    location ~ ^/(admin|login)\.html$ {
        try_files $uri =404;
    }
    
    # 管理后台静态资源
    location ~ ^/(admin|login)\.(css|js)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 后端API
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
    
    # 日志
    access_log /www/wwwlogs/mt.dajiaopei.com.log;
    error_log /www/wwwlogs/mt.dajiaopei.com.error.log;
}
```

### 2. 重启Nginx

```bash
nginx -t
nginx -s reload
```

## 五、后端服务配置

### 1. 使用PM2管理进程

```bash
# 安装PM2（如果未安装）
npm install -g pm2

# 创建PM2配置文件
cat > /www/wwwroot/mht-edu/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mht-edu-api',
    script: 'node_modules/.bin/nest',
    args: 'start',
    cwd: '/www/wwwroot/mht-edu/server',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    }
  }]
};
EOF

# 启动服务
cd /www/wwwroot/mht-edu
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 2. 手动启动（不使用PM2）

```bash
cd /www/wwwroot/mht-edu/server
NODE_ENV=production PORT=3002 nohup pnpm start > /var/log/mht-edu.log 2>&1 &
```

## 六、验证部署

### 1. 检查服务状态

```bash
# 检查后端服务
curl http://localhost:3002/api/hello

# 检查进程
pm2 status

# 检查端口
netstat -tlnp | grep 3002
```

### 2. 访问测试

- **H5前端**: https://mt.dajiaopei.com
- **管理后台**: https://mt.dajiaopei.com/admin.html
- **登录页面**: https://mt.dajiaopei.com/login.html

### 3. 登录测试

使用默认管理员账号登录：

- 用户名: `admin`
- 密码: `admin123`

⚠️ **重要**: 登录后立即修改密码！

## 七、安全加固

### 1. 修改默认密码

```bash
# 登录MySQL
mysql -u root -p mht_edu

# 修改管理员密码（使用bcrypt生成新密码hash）
-- 先在管理后台修改，或使用以下SQL
UPDATE admin_user SET password = '新的bcrypt密码hash' WHERE username = 'admin';
```

### 2. 配置防火墙

```bash
# 只允许本地访问后端端口
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="127.0.0.1" port protocol="tcp" port="3002" accept'
firewall-cmd --reload
```

### 3. 配置SSL证书

确保SSL证书已正确配置，并且强制HTTPS跳转。

### 4. 定期备份

```bash
# 创建备份脚本
cat > /www/wwwroot/mht-edu/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/www/backup/mht-edu"

mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u root -p你的密码 mht_edu > $BACKUP_DIR/db_$DATE.sql

# 备份文件
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /www/wwwroot/mht-edu/dist-web

# 删除30天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /www/wwwroot/mht-edu/backup.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加以下行
0 2 * * * /www/wwwroot/mht-edu/backup.sh >> /var/log/mht-edu-backup.log 2>&1
```

## 八、常见问题

### Q: 后端服务启动失败？

检查：
1. 数据库连接是否正常
2. 端口3002是否被占用
3. 环境变量是否正确配置
4. 日志文件: `/www/wwwlogs/mht-edu-api.log`

### Q: 管理后台无法登录？

检查：
1. 数据库中admin_user表是否存在
2. 密码是否已初始化
3. 后端API是否正常响应
4. 浏览器控制台是否有错误

### Q: H5前端访问空白？

检查：
1. dist-web目录是否有index.html
2. Nginx配置是否正确
3. 静态资源路径是否正确

### Q: API请求404？

检查：
1. 后端服务是否启动
2. Nginx反向代理配置是否正确
3. 后端路由是否注册

## 九、监控与维护

### 1. 日志查看

```bash
# 查看后端日志
pm2 logs mht-edu-api

# 查看Nginx访问日志
tail -f /www/wwwlogs/mt.dajiaopei.com.log

# 查看Nginx错误日志
tail -f /www/wwwlogs/mt.dajiaopei.com.error.log
```

### 2. 性能监控

```bash
# PM2监控
pm2 monit

# 系统资源
htop
```

### 3. 更新部署

```bash
# 拉取最新代码
cd /www/wwwroot/mht-edu
git pull

# 安装依赖
pnpm install

# 构建前端
pnpm build:web

# 重启后端
pm2 restart mht-edu-api

# 清理Nginx缓存
nginx -s reload
```

## 十、联系支持

如有部署问题，请联系技术团队。

---

**部署日期**: 2024-01-16  
**文档版本**: v1.0.0
