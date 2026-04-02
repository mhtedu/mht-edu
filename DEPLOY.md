# 部署指南

## 部署前检查清单

### 必须配置项

1. **微信小程序配置**
   - [ ] 修改 `project.config.json` 中的 `appid` 为您的小程序 AppID
   - [ ] 配置 `server/.env` 中的 `WECHAT_APPID` 和 `WECHAT_SECRET`

2. **数据库配置**
   - [ ] 确认 MySQL 服务已启动
   - [ ] 配置 `server/.env` 中的数据库连接信息
   - [ ] 执行 `curl -X POST http://localhost:3002/api/admin/create-tables` 创建数据表

3. **微信支付配置**（如需支付功能）
   - [ ] 配置 `server/.env` 中的 `WECHAT_MCH_ID`（商户号）
   - [ ] 配置 `WECHAT_PAY_KEY`（API 密钥）
   - [ ] 配置 `WECHAT_NOTIFY_URL`（支付回调地址）

4. **JWT 安全配置**
   - [ ] 修改 `server/.env` 中的 `JWT_SECRET` 为随机字符串

### 可选配置项

- [ ] 配置短信服务（用于验证码和通知）
- [ ] 配置对象存储（用于图片上传）
- [ ] 配置域名和 SSL 证书

## 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- MySQL >= 5.7
- Nginx (可选，用于反向代理)

## 部署步骤

### 1. 服务器准备

```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 安装 pnpm
npm install -g pnpm

# 安装 PM2 (进程管理)
npm install -g pm2
```

### 2. 项目部署

```bash
# 克隆项目到服务器
cd /www/wwwroot
git clone <项目地址> mht-edu
cd mht-edu

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 3. 配置环境变量

复制并修改服务器端环境配置：

```bash
# 修改 server/.env 文件
# 配置数据库连接、微信小程序信息等
```

关键配置项：
- `DB_HOST`: 数据库地址
- `DB_PORT`: 数据库端口
- `DB_USERNAME`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_DATABASE`: 数据库名称
- `WECHAT_APPID`: 微信小程序 AppID
- `WECHAT_SECRET`: 微信小程序 Secret
- `WECHAT_MCH_ID`: 微信支付商户号
- `WECHAT_PAY_KEY`: 微信支付 API 密钥

### 4. 初始化数据库

```bash
# 创建必要的数据库表
curl -X POST http://localhost:3002/api/admin/create-tables

# 初始化广告数据
curl -X POST http://localhost:3002/api/admin/clean-ads
```

### 5. 使用 PM2 启动服务

```bash
# 启动后端服务
cd /www/wwwroot/mht-edu/server
pm2 start dist/main.js --name mht-edu-api

# 查看服务状态
pm2 status

# 查看日志
pm2 logs mht-edu-api
```

### 6. Nginx 配置 (推荐)

```nginx
# /etc/nginx/sites-available/mht-edu.conf
server {
    listen 80;
    server_name mt.dajiaopei.com;

    # H5 前端
    location / {
        root /www/wwwroot/mht-edu/dist-web;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件访问
    location /uploads {
        alias /www/wwwroot/mht-edu/uploads;
        expires 30d;
    }
}
```

### 7. SSL 配置 (推荐)

```bash
# 使用 Let's Encrypt
certbot --nginx -d mt.dajiaopei.com
```

## 小程序部署

### 1. 修改配置

修改 `project.config.json` 中的 AppID：

```json
{
  "miniprogramRoot": "dist-weapp/",
  "appid": "你的小程序AppID"
}
```

### 2. 上传代码

```bash
# 构建小程序
pnpm build:weapp

# 使用微信开发者工具上传
# 或使用 miniprogram-ci 自动上传
```

## 常见问题

### 1. 数据库连接失败

检查：
- 数据库服务是否启动
- 防火墙是否开放 3306 端口
- 用户名密码是否正确
- 数据库是否已创建

### 2. 微信登录失败

检查：
- 小程序 AppID 和 Secret 是否正确
- 服务器 IP 是否在微信后台白名单中

### 3. 支付失败

检查：
- 商户号和 API 密钥是否正确
- 回调地址是否可访问
- 是否配置了支付目录

## 监控与日志

```bash
# PM2 监控
pm2 monit

# 查看实时日志
pm2 logs mht-edu-api --lines 100

# 日志文件位置
/www/wwwroot/mht-edu/logs/
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新安装依赖（如有更新）
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart mht-edu-api
```
