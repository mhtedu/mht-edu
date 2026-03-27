# 棉花糖教育平台 - 服务器部署包

## 📦 部署包内容

```
mianhuatang-deploy/
├── dist-web/              # H5 前端构建产物
├── server/                # 后端服务
│   ├── dist/              # 后端构建产物
│   ├── package.json       # 依赖配置
│   └── node_modules/      # 依赖包（可选，服务器上安装）
├── deploy/                # 部署配置
│   ├── .env.example       # 环境变量模板
│   ├── pm2.config.js      # PM2 配置
│   ├── nginx.conf         # Nginx 配置
│   ├── deploy.sh          # 自动部署脚本
│   └── database/
│       └── schema.sql     # 数据库结构
└── README.md              # 本文件
```

## 🚀 快速部署

### 1. 打包上传

在本地执行：
```bash
# 构建项目
pnpm build

# 打包部署文件
tar -czf mianhuatang-deploy.tar.gz \
    dist-web \
    server/dist \
    server/package.json \
    server/package-lock.json \
    deploy
```

上传到服务器：
```bash
scp mianhuatang-deploy.tar.gz root@your-server-ip:/root/
```

### 2. 服务器解压

```bash
ssh root@your-server-ip

# 创建目录
mkdir -p /var/www/mianhuatang

# 解压
cd /var/www/mianhuatang
tar -xzf /root/mianhuatang-deploy.tar.gz
```

### 3. 初始化数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE mianhuatang_edu DEFAULT CHARACTER SET utf8mb4;
CREATE USER 'mianhuatang'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON mianhuatang_edu.* TO 'mianhuatang'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 导入数据结构
mysql -u mianhuatang -p mianhuatang_edu < deploy/database/schema.sql
```

### 4. 配置环境变量

```bash
cp deploy/.env.example .env
vi .env
```

修改以下内容：
```env
DB_PASSWORD=你的数据库密码
JWT_SECRET=随机32位字符串
WX_SECRET=微信小程序Secret
```

### 5. 安装依赖并启动

```bash
# 进入后端目录
cd /var/www/mianhuatang/server

# 安装依赖
npm install --production

# 启动服务
cd /var/www/mianhuatang
pm2 start deploy/pm2.config.js
pm2 save
pm2 startup
```

### 6. 配置 Nginx

```bash
# 复制配置（先修改域名）
sed 's/your-domain.com/你的域名/g' deploy/nginx.conf > /etc/nginx/conf.d/mianhuatang.conf

# 测试配置
nginx -t

# 重载
nginx -s reload
```

### 7. 配置 HTTPS

```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d 你的域名 -d www.你的域名

# 设置自动续期
crontab -e
# 添加: 0 3 * * * certbot renew --quiet
```

## ✅ 验证部署

```bash
# 检查后端
curl http://localhost:3000/api

# 检查前端
curl http://localhost

# 查看日志
pm2 logs mianhuatang-api
```

## 🔧 常用命令

```bash
# 服务管理
pm2 list                      # 查看进程
pm2 logs mianhuatang-api      # 查看日志
pm2 restart mianhuatang-api   # 重启服务
pm2 stop mianhuatang-api      # 停止服务

# Nginx
nginx -t                      # 测试配置
nginx -s reload               # 重载配置

# 数据库备份
mysqldump -u mianhuatang -p mianhuatang_edu > backup_$(date +%Y%m%d).sql
```

## 🆘 常见问题

### Q: 服务启动失败？
```bash
# 查看详细日志
pm2 logs mianhuatang-api --lines 100

# 检查端口占用
netstat -tunlp | grep 3000
```

### Q: 数据库连接失败？
```bash
# 测试连接
mysql -u mianhuatang -p -h localhost mianhuatang_edu

# 检查 .env 配置
cat /var/www/mianhuatang/.env
```

### Q: 502 错误？
```bash
# 检查后端是否运行
pm2 list

# 检查 SELinux
getenforce
# 如需关闭: setenforce 0
```
