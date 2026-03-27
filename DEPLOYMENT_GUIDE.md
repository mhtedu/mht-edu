# 棉花糖教育成长平台 - 配置、测试与部署指南

## 一、环境配置

### 1.1 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# 数据库配置（Supabase自动注入）
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 微信支付配置（可选）
WECHAT_PAY_MCHID=your_mch_id
WECHAT_PAY_KEY=your_pay_key
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payment/callback

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 业务配置
PROJECT_DOMAIN=https://your-domain.com
```

### 1.2 微信小程序配置

1. **注册微信小程序**
   - 访问 [微信公众平台](https://mp.weixin.qq.com/)
   - 注册小程序账号，获取 AppID 和 AppSecret

2. **配置服务器域名**
   - 登录微信公众平台 → 开发 → 开发管理 → 开发设置
   - 配置服务器域名：
     - request 合法域名：`https://your-domain.com`
     - uploadFile 合法域名：`https://your-domain.com`
     - downloadFile 合法域名：`https://your-domain.com`

3. **配置业务域名**（H5端需要）
   - 添加业务域名并上传校验文件到服务器根目录

4. **修改项目配置**
   ```typescript
   // project.config.json
   {
     "appid": "your_wechat_appid",
     "projectname": "棉花糖教育",
     ...
   }
   ```

### 1.3 数据库配置

数据库已通过 Supabase 自动配置，无需额外操作。如需查看表结构：

```bash
# 查看数据库模型
cat server/src/storage/database/shared/schema.ts

# 同步数据库模型（如有修改）
coze-coding-ai db upgrade
```

---

## 二、本地开发测试

### 2.1 启动开发服务

```bash
# 安装依赖
pnpm install

# 启动开发服务（同时启动前端和后端）
pnpm dev

# 或单独启动
pnpm dev:web      # 仅前端 (http://localhost:5000)
pnpm dev:weapp    # 仅小程序编译
pnpm dev:server   # 仅后端 (http://localhost:3000)
```

### 2.2 API 接口测试

使用 curl 或 Postman 测试后端接口：

#### 创建用户
```bash
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{
    "openid": "test_openid_001",
    "nickname": "测试用户",
    "avatar": "https://example.com/avatar.jpg",
    "role": 0,
    "mobile": "13800138000"
  }'
```

#### 获取用户信息
```bash
curl -X GET http://localhost:3000/api/user/1
```

#### 更新用户位置
```bash
curl -X POST http://localhost:3000/api/user/1/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": "39.9042",
    "longitude": "116.4074",
    "city_code": "110000"
  }'
```

#### 发布需求
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "parent_id": 1,
    "subject": "数学",
    "hourly_rate": "150.00",
    "student_gender": 1,
    "student_grade": "初二",
    "address": "北京市朝阳区望京SOHO",
    "latitude": "39.9950",
    "longitude": "116.4730",
    "description": "需要辅导初二数学，每周2次课"
  }'
```

#### 获取订单列表
```bash
# 家长订单列表
curl -X GET "http://localhost:3000/api/orders/parent?parentId=1&page=1&pageSize=10"

# 教师可抢订单列表
curl -X GET "http://localhost:3000/api/orders/teacher?latitude=39.9950&longitude=116.4730&page=1&pageSize=10"
```

#### 抢单
```bash
curl -X POST http://localhost:3000/api/orders/1/grab \
  -H "Content-Type: application/json" \
  -d '{
    "teacher_id": 2
  }'
```

#### 解锁联系方式
```bash
curl -X GET "http://localhost:3000/api/orders/1/contact?userId=2"
```

### 2.3 前端页面测试

1. **H5 端测试**
   - 访问 http://localhost:5000
   - 使用浏览器开发者工具切换移动端模式
   - 测试各页面功能

2. **小程序测试**
   - 打开微信开发者工具
   - 导入项目：选择 `dist-weapp` 目录
   - 配置 AppID
   - 编译预览

### 2.4 数据库测试

```bash
# 查询所有用户
curl -X GET http://localhost:3000/api/user/teachers/list

# 或使用 Supabase 控制台直接查询
# 登录 Supabase Dashboard → Table Editor
```

---

## 三、生产环境部署

### 3.1 服务器准备

推荐配置：
- **服务器**: 阿里云 ECS / 腾讯云 CVM
- **系统**: Alibaba Cloud Linux 3.2104 LTS / CentOS 7+
- **配置**: 2核4G 起
- **带宽**: 3Mbps 起

### 3.2 环境安装

```bash
# 1. 安装 Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 2. 安装 pnpm
npm install -g pnpm

# 3. 安装 PM2（进程管理）
npm install -g pm2

# 4. 安装 Nginx
sudo yum install -y nginx

# 5. 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.3 构建项目

```bash
# 克隆代码
git clone your-repo-url
cd your-project

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 构建后会生成：
# - dist-web/     H5前端代码
# - dist-weapp/   小程序代码
# - dist/         后端代码
```

### 3.4 后端部署

#### 方式一：PM2 部署（推荐）

```bash
# 创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mianhuatang-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# 启动服务
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

#### 方式二：Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY dist ./dist
COPY .env.local ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```bash
# 构建镜像
docker build -t mianhuatang-api .

# 运行容器
docker run -d \
  --name mianhuatang-api \
  -p 3000:3000 \
  --restart always \
  mianhuatang-api
```

### 3.5 前端部署

#### Nginx 配置

```nginx
# /etc/nginx/conf.d/mianhuatang.conf
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL 证书（使用 Let's Encrypt 免费）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # H5 前端
    root /var/www/mianhuatang/dist-web;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 创建网站目录
sudo mkdir -p /var/www/mianhuatang

# 复制前端代码
sudo cp -r dist-web /var/www/mianhuatang/

# 设置权限
sudo chown -R nginx:nginx /var/www/mianhuatang

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload
```

### 3.6 SSL 证书配置

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
0 3 * * * /usr/bin/certbot renew --quiet
```

### 3.7 小程序上传

```bash
# 1. 在微信开发者工具中打开 dist-weapp 目录

# 2. 配置 project.config.json
{
  "appid": "your_appid",
  "projectname": "棉花糖教育"
}

# 3. 上传代码
# 微信开发者工具 → 上传 → 填写版本号和备注

# 4. 提交审核
# 登录微信公众平台 → 版本管理 → 提交审核

# 5. 发布上线
# 审核通过后 → 全量发布
```

---

## 四、监控与运维

### 4.1 日志管理

```bash
# PM2 日志
pm2 logs mianhuatang-api

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 应用日志（如已配置）
tail -f /var/www/mianhuatang/logs/app.log
```

### 4.2 性能监控

```bash
# PM2 监控面板
pm2 monit

# 或使用 PM2 Plus（免费版）
pm2 link <secret_key> <public_key>
```

### 4.3 数据库备份

```bash
# Supabase 自动备份
# 登录 Supabase Dashboard → Database → Backups

# 手动导出
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### 4.4 常见问题

#### 问题1：接口返回 404
```bash
# 检查后端服务是否启动
pm2 status

# 检查端口是否监听
netstat -tlnp | grep 3000

# 查看 Nginx 配置是否正确
sudo nginx -t
```

#### 问题2：小程序请求失败
```bash
# 检查服务器域名配置
# 微信公众平台 → 开发 → 服务器域名

# 检查 HTTPS 证书
curl -I https://your-domain.com/api/hello
```

#### 问题3：构建失败
```bash
# 清除缓存重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 清除构建缓存
rm -rf dist dist-web dist-weapp
pnpm build
```

---

## 五、CI/CD 自动化部署（可选）

### 5.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/mianhuatang
            git pull
            pnpm install
            pnpm build
            pm2 restart mianhuatang-api
```

---

## 六、快速启动清单

### 本地开发
```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务
# 访问 http://localhost:5000
```

### 生产部署
```bash
# 服务器端
pnpm build                          # 构建
pm2 start ecosystem.config.js       # 启动后端
sudo nginx -s reload                # 重载前端

# 小程序
# 微信开发者工具导入 dist-weapp → 上传 → 审核 → 发布
```

---

如有疑问，请查看项目文档或联系开发团队。
