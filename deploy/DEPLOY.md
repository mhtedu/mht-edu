# 棉花糖教育平台部署指南

## 一、服务器环境准备

### 1.1 检查 Node.js 版本
```bash
node -v  # 需要 v18.x
npm -v
```

### 1.2 安装 PM2
```bash
npm install -g pm2
pm2 --version
```

### 1.3 安装 Nginx
```bash
# Alibaba Cloud Linux 3
yum install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 1.4 安装 MySQL 8.0
```bash
# 如果未安装
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld

# 安全配置
mysql_secure_installation
```

---

## 二、数据库配置

### 2.1 创建数据库和用户
```bash
mysql -u root -p
```

```sql
-- 创建数据库
CREATE DATABASE mianhuatang_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'mianhuatang'@'localhost' IDENTIFIED BY '你的强密码';

-- 授权
GRANT ALL PRIVILEGES ON mianhuatang_edu.* TO 'mianhuatang'@'localhost';
FLUSH PRIVILEGES;

-- 验证
SHOW DATABASES;
EXIT;
```

### 2.2 导入数据库结构
```bash
mysql -u mianhuatang -p mianhuatang_edu < deploy/database/schema.sql
```

---

## 三、项目部署

### 3.1 创建部署目录
```bash
mkdir -p /var/www/mianhuatang
cd /var/www/mianhuatang
```

### 3.2 上传项目文件
将以下目录上传到服务器：
- `dist-web/` - H5 前端构建产物
- `dist-weapp/` - 小程序构建产物
- `server/` - 后端服务（包含 dist 目录）

### 3.3 配置环境变量
```bash
cp deploy/.env.example .env
vi .env
```

修改以下配置：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=mianhuatang
DB_PASSWORD=你的数据库密码
DB_NAME=mianhuatang_edu

# JWT 密钥
JWT_SECRET=你的随机密钥

# 微信小程序配置
WX_APPID=wx46c4d031889bdb3e
WX_SECRET=你的小程序Secret

# 服务端口
PORT=3000
NODE_ENV=production
```

### 3.4 安装后端依赖
```bash
cd /var/www/mianhuatang/server
npm install --production
```

---

## 四、PM2 配置

### 4.1 启动服务
```bash
cd /var/www/mianhuatang
pm2 start deploy/pm2.config.js
```

### 4.2 常用命令
```bash
pm2 list                    # 查看进程列表
pm2 logs mianhuatang-api    # 查看日志
pm2 restart mianhuatang-api # 重启服务
pm2 stop mianhuatang-api    # 停止服务
pm2 save                    # 保存进程列表
pm2 startup                 # 设置开机自启
```

---

## 五、Nginx 配置

### 5.1 创建配置文件
```bash
vi /etc/nginx/conf.d/mianhuatang.conf
```

粘贴 `deploy/nginx.conf` 的内容，修改域名。

### 5.2 测试并重载
```bash
nginx -t
nginx -s reload
```

---

## 六、HTTPS 配置

### 6.1 安装 Certbot
```bash
yum install -y certbot python3-certbot-nginx
```

### 6.2 申请证书
```bash
# 替换 your-domain.com 为你的域名
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.3 自动续期
```bash
# 测试续期
certbot renew --dry-run

# 添加定时任务
crontab -e
```

添加以下内容：
```
0 3 * * * certbot renew --quiet
```

---

## 七、防火墙配置

```bash
# 开放端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp  # 仅开发环境使用
firewall-cmd --reload

# 查看开放的端口
firewall-cmd --list-ports
```

---

## 八、验证部署

### 8.1 检查服务状态
```bash
# 检查后端服务
curl http://localhost:3000/api

# 检查 Nginx
curl http://localhost
```

### 8.2 访问测试
- H5 前端：https://your-domain.com
- 后端 API：https://your-domain.com/api

---

## 九、常见问题

### Q1: PM2 启动失败
```bash
# 查看详细日志
pm2 logs mianhuatang-api --lines 100

# 检查端口占用
netstat -tunlp | grep 3000
```

### Q2: 数据库连接失败
```bash
# 测试数据库连接
mysql -u mianhuatang -p -h localhost mianhuatang_edu

# 检查 MySQL 服务
systemctl status mysqld
```

### Q3: Nginx 502 错误
```bash
# 检查后端服务是否运行
pm2 list

# 检查 SELinux
getenforce
# 如果是 Enforcing，临时关闭
setenforce 0
# 永久关闭
vi /etc/selinux/config
# 设置 SELINUX=disabled
```

---

## 十、日常运维

### 更新部署
```bash
cd /var/www/mianhuatang

# 1. 备份
tar -czf backup_$(date +%Y%m%d).tar.gz server dist-web

# 2. 上传新文件后
cd server
npm install --production
pm2 restart mianhuatang-api
```

### 查看日志
```bash
# 后端日志
pm2 logs mianhuatang-api

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 监控告警
```bash
# 安装 PM2 监控模块
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```
