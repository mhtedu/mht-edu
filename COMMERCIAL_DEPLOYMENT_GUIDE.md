# 棉花糖教育平台 - 商用上线部署指南

## 📋 目录

1. [准备工作](#1-准备工作)
2. [后端生产环境配置](#2-后端生产环境配置)
3. [Nginx反向代理配置](#3-nginx反向代理配置)
4. [前端H5部署](#4-前端h5部署)
5. [微信小程序部署](#5-微信小程序部署)
6. [安全加固](#6-安全加固)
7. [监控与维护](#7-监控与维护)

---

## 1. 准备工作

### 1.1 必需资源

| 资源 | 说明 | 状态 |
|------|------|------|
| 域名 | 如：`mht-edu.com` | ⬜ 准备 |
| SSL证书 | HTTPS加密 | ⬜ 准备 |
| 微信小程序AppID | 小程序上线必需 | ⬜ 准备 |
| 微信支付商户号 | 支付功能必需 | ⬜ 准备 |
| 服务器 | 已有 | ✅ 完成 |

### 1.2 域名解析

在域名服务商处添加DNS解析：

```
类型: A
主机记录: api
记录值: 您的服务器IP
TTL: 600

类型: A
主机记录: @
记录值: 您的服务器IP
TTL: 600

类型: A
主机记录: www
记录值: 您的服务器IP
TTL: 600
```

---

## 2. 后端生产环境配置

### 2.1 更新环境变量

```bash
# 编辑.env文件
cd /www/wwwroot/mht-edu/server
nano .env
```

修改以下配置：

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_user
DB_PASSWORD=您的数据库密码
DB_NAME=mht_edu

# WeChat Mini Program
WECHAT_APPID=您的微信小程序AppID
WECHAT_SECRET=您的微信小程序Secret

# WeChat Pay
WECHAT_MCH_ID=您的商户号
WECHAT_PAY_KEY=您的支付密钥
WECHAT_NOTIFY_URL=https://您的域名/api/payment/notify/wechat

# JWT
JWT_SECRET=随机生成的32位密钥
JWT_EXPIRES_IN=7d

# Server
PORT=3002
NODE_ENV=production

# Frontend URL (用于CORS)
FRONTEND_URL=https://您的域名
```

### 2.2 创建生产数据库用户

```bash
mysql -u root -p
```

```sql
-- 创建专用数据库用户
CREATE USER 'mht_user'@'localhost' IDENTIFIED BY '您的安全密码';

-- 授权
GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 2.3 PM2生产配置

```bash
# 创建PM2配置文件
cd /www/wwwroot/mht-edu/server
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'mht-edu-api',
    script: 'dist/main.js',
    args: '-p 3002',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/mht-edu/error.log',
    out_file: '/var/log/mht-edu/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

```bash
# 创建日志目录
mkdir -p /var/log/mht-edu

# 使用配置文件启动
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 3. Nginx反向代理配置

### 3.1 安装SSL证书

在宝塔面板中：
1. 网站 → 添加站点
2. 输入域名（如 `mht-edu.com`）
3. 点击SSL → Let's Encrypt → 申请免费证书

### 3.2 配置Nginx

在宝塔面板中：
1. 网站 → 点击域名 → 配置文件

替换为以下配置：

```nginx
# HTTP重定向到HTTPS
server {
    listen 80;
    server_name 您的域名 www.您的域名;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name 您的域名 www.您的域名;
    
    # SSL证书
    ssl_certificate /www/server/panel/vhost/cert/您的域名/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/您的域名/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 前端H5
    root /www/wwwroot/mht-edu/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理
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
        
        # 文件上传大小限制
        client_max_body_size 50m;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 日志
    access_log /www/wwwlogs/mht-edu.access.log;
    error_log /www/wwwlogs/mht-edu.error.log;
}
```

---

## 4. 前端H5部署

### 4.1 修改前端配置

在本地开发环境修改：

```typescript
// src/config/index.ts
export const config = {
  apiUrl: 'https://您的域名/api',
  // ...
};
```

### 4.2 编译H5版本

```bash
# 在本地开发环境
pnpm build:web
```

### 4.3 上传到服务器

将 `dist/` 目录上传到服务器：
```bash
# 本地执行
scp -r dist/* root@您的服务器IP:/www/wwwroot/mht-edu/dist/
```

或通过宝塔面板文件管理上传。

---

## 5. 微信小程序部署

### 5.1 修改小程序配置

```typescript
// src/config/index.ts
export const config = {
  apiUrl: 'https://您的域名/api',
  appId: '您的微信小程序AppID',
  // ...
};
```

### 5.2 编译小程序版本

```bash
# 在本地开发环境
pnpm build:weapp
```

### 5.3 上传到微信开发者工具

1. 打开微信开发者工具
2. 导入项目：选择 `dist-weapp` 目录
3. 填写AppID
4. 点击上传
5. 在微信公众平台提交审核

### 5.4 配置服务器域名

在微信公众平台：
1. 开发 → 开发管理 → 开发设置 → 服务器域名
2. 添加：
   - request合法域名：`https://您的域名`
   - uploadFile合法域名：`https://您的域名`
   - downloadFile合法域名：`https://您的域名`

---

## 6. 安全加固

### 6.1 防火墙配置

在宝塔面板中：
1. 安全 → 防火墙
2. 只开放必要端口：
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 3306 (MySQL，仅限本地)

### 6.2 数据库安全

```bash
# 禁止root远程登录
mysql -u root -p
```

```sql
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

### 6.3 修改SSH端口

在宝塔面板中：
1. 安全 → SSH端口
2. 改为非22端口（如22222）

### 6.4 启用HTTPS强加密

已在Nginx配置中设置TLS 1.2/1.3。

---

## 7. 监控与维护

### 7.1 设置日志轮转

```bash
# 创建日志轮转配置
nano /etc/logrotate.d/mht-edu
```

```
/var/log/mht-edu/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

### 7.2 设置数据库备份

在宝塔面板中：
1. 计划任务 → 添加任务
2. 任务类型：备份数据库
3. 执行周期：每天
4. 保留份数：7

### 7.3 监控告警

使用宝塔面板的监控功能：
1. 监控 → 开启监控
2. 设置告警阈值

### 7.4 常用维护命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs mht-edu-api

# 重启服务
pm2 restart mht-edu-api

# 查看Nginx状态
systemctl status nginx

# 重启Nginx
systemctl restart nginx

# 查看数据库状态
systemctl status mysql
```

---

## ✅ 上线检查清单

### 后端

- [ ] 数据库用户创建完成
- [ ] 环境变量配置正确
- [ ] PM2服务运行正常
- [ ] API接口测试通过

### 前端

- [ ] H5版本编译并上传
- [ ] 小程序版本编译并上传
- [ ] 微信公众平台域名配置完成

### 网络

- [ ] 域名解析生效
- [ ] SSL证书安装成功
- [ ] Nginx反向代理配置正确
- [ ] HTTPS访问正常

### 安全

- [ ] 防火墙规则配置
- [ ] SSH端口修改
- [ ] 数据库安全加固
- [ ] 日志轮转配置

### 运维

- [ ] 数据库备份设置
- [ ] 监控告警配置
- [ ] 文档整理完成

---

## 📞 技术支持

如遇到问题，请提供：
1. 错误日志：`pm2 logs mht-edu-api --err`
2. Nginx日志：`/www/wwwlogs/mht-edu.error.log`
3. 数据库日志：`/var/log/mysql/error.log`

---

**祝您上线顺利！** 🎉
