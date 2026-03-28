# 棉花糖教育平台 - 宝塔面板部署手册

## 📋 部署概览

- **服务器目录**：`/www/wwwroot/mht-edu`
- **数据库名**：`mht_edu`
- **数据库用户**：`mht_edu`
- **数据库密码**：`mht@2026`
- **后端端口**：3000
- **前端端口**：5000（H5）

---

## 📦 最新文件清单

### 1. 数据库文件
**文件路径**：`server/database/mht_edu_complete.sql`
**包含内容**：
- ✅ 23张数据表（完整业务表结构）
- ✅ 演示数据（18个用户、9个教师档案、5个牛师班等）
- ✅ 分销关系锁定功能
- ✅ 超级会员功能
- ✅ 牛师班功能

### 2. 后端代码
**文件路径**：`server/`
**技术栈**：NestJS + TypeScript + MySQL
**关键功能**：
- 分销锁定服务（ReferralLockService）
- 牛师班管理接口
- 超级会员接口
- 用户认证与权限

### 3. 前端构建产物
| 平台 | 目录 | 用途 |
|------|------|------|
| 微信小程序 | `dist-weapp/` | 微信小程序代码包 |
| H5版本 | `dist-web/` | 移动端网页 |
| 字节小程序 | `dist-tt/` | 抖音/今日头条小程序 |

### 4. 环境配置文件
**后端配置**：`server/.env`（需要创建）
**前端配置**：`src/network/index.ts`（需修改域名）

---

## 🚀 宝塔面板部署步骤

### 第一步：准备数据库

#### 1.1 登录宝塔面板
访问：`http://你的服务器IP:8888`

#### 1.2 删除旧数据库（如需要）
```
【数据库】→ 找到 mht_edu → 点击【删除】→ 勾选"删除数据库用户"
```

#### 1.3 创建新数据库
```
【数据库】→ 点击【添加数据库】
- 数据库名：mht_edu
- 用户名：mht_edu
- 密码：mht@2026
- 访问权限：本地服务器
- 字符集：utf8mb4
```

#### 1.4 导入数据库
**方式一：使用phpMyAdmin**
```
1. 【数据库】→ 点击 mht_edu 后的【管理】
2. 进入phpMyAdmin
3. 点击顶部【导入】
4. 选择文件：server/database/mht_edu_complete.sql
5. 点击底部【执行】
```

**方式二：使用命令行（SSH）**
```bash
# 上传SQL文件到服务器
cd /www/wwwroot/mht-edu
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql

# 验证导入结果
mysql -u mht_edu -p'mht@2026' -e "USE mht_edu; SHOW TABLES;"
```

#### 1.5 验证数据库
```sql
-- 查看表数量（应为23张）
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'mht_edu';

-- 查看用户数量（应18个）
SELECT COUNT(*) FROM users;

-- 查看分销锁定记录（应9条）
SELECT * FROM referral_locks;
```

---

### 第二步：部署后端服务

#### 2.1 上传后端代码
```bash
# 方式一：宝塔文件管理器
【文件】→ 进入 /www/wwwroot/mht-edu → 上传 server 目录

# 方式二：使用Git
cd /www/wwwroot/mht-edu
git clone <仓库地址> temp
cp -r temp/server ./
rm -rf temp
```

#### 2.2 安装Node.js环境
```
【软件商店】→ 搜索【PM2管理器】→ 点击【安装】
（会自动安装Node.js和npm）
```

#### 2.3 安装pnpm
```bash
# 通过SSH终端
npm install -g pnpm

# 验证安装
pnpm -v
```

#### 2.4 创建环境配置文件
在宝塔文件管理器中，创建文件 `/www/wwwroot/mht-edu/server/.env`：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu

# JWT密钥（请修改为复杂字符串）
JWT_SECRET=mht-edu-jwt-secret-2025

# 微信小程序配置（请替换为实际值）
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 服务端口
PORT=3000
NODE_ENV=production

# 域名配置
API_DOMAIN=https://你的域名.com
```

#### 2.5 安装依赖并构建
```bash
cd /www/wwwroot/mht-edu/server

# 安装依赖
pnpm install

# 构建生产版本
pnpm build
```

#### 2.6 使用PM2启动服务
```bash
# 进入后端目录
cd /www/wwwroot/mht-edu/server

# 使用PM2启动
pm2 start dist/main.js --name mht-edu-api

# 查看运行状态
pm2 status

# 查看日志
pm2 logs mht-edu-api

# 设置开机自启
pm2 save
pm2 startup
```

#### 2.7 验证后端服务
```bash
# 测试接口
curl http://localhost:3000/api/hello

# 应返回：
# {"message":"Hello World!"}
```

---

### 第三步：部署前端应用

#### 3.1 上传前端代码
```bash
# 上传整个项目到服务器
/www/wwwroot/mht-edu/
```

#### 3.2 修改API域名
编辑文件 `/www/wwwroot/mht-edu/src/network/index.ts`：

```typescript
// 将本地地址改为实际域名
const PROJECT_DOMAIN = 'https://你的域名.com'

// 或者根据环境自动判断
const PROJECT_DOMAIN = process.env.NODE_ENV === 'production' 
  ? 'https://你的域名.com'
  : 'http://localhost:3000'
```

#### 3.3 安装依赖并构建
```bash
cd /www/wwwroot/mht-edu

# 安装依赖
pnpm install

# 构建H5版本
pnpm build:web

# 构建微信小程序版本
pnpm build:weapp

# 构建全部
pnpm build
```

---

### 第四步：配置Nginx（H5版本）

#### 4.1 添加网站
```
【网站】→ 点击【添加站点】
- 域名：你的域名.com
- 根目录：/www/wwwroot/mht-edu/dist-web
- PHP版本：纯静态
```

#### 4.2 配置Nginx反向代理
点击网站后的【设置】→【配置文件】，在 `server` 块中添加：

```nginx
# 后端API反向代理
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}

# H5前端
location / {
    root /www/wwwroot/mht-edu/dist-web;
    try_files $uri $uri/ /index.html;
}
```

#### 4.3 重启Nginx
```
【软件商店】→【Nginx】→ 点击【重载配置】
```

---

### 第五步：部署微信小程序

#### 5.1 下载微信开发者工具
https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

#### 5.2 导入项目
```
1. 打开微信开发者工具
2. 点击【导入项目】
3. 目录选择：/www/wwwroot/mht-edu/dist-weapp
4. AppID：填写你的微信小程序AppID
5. 点击【导入】
```

#### 5.3 修改配置
在 `project.config.json` 中配置：
```json
{
  "appid": "你的微信小程序AppID",
  "projectname": "mht-edu"
}
```

#### 5.4 上传代码
```
1. 点击右上角【上传】
2. 填写版本号：1.0.0
3. 填写项目备注：棉花糖教育平台v1.0.0
4. 点击【上传】
```

#### 5.5 提交审核
```
1. 登录微信公众平台：mp.weixin.qq.com
2. 【管理】→【版本管理】
3. 找到开发版本，点击【提交审核】
4. 填写审核信息并提交
```

---

## 🔧 高级配置

### 配置SSL证书（HTTPS）

#### 方式一：Let's Encrypt免费证书
```
【网站】→ 点击你的域名 →【SSL】→【Let's Encrypt】
- 勾选域名
- 点击【申请】
```

#### 方式二：自定义证书
```
【网站】→ 点击你的域名 →【SSL】→【其他证书】
- 粘贴证书内容（.pem/.crt）
- 粘贴密钥内容（.key）
- 点击【保存】
```

#### 强制HTTPS
在Nginx配置中添加：
```nginx
# 强制跳转HTTPS
if ($scheme = http) {
    return 301 https://$host$request_uri;
}
```

---

### 配置数据库定时备份

```
【计划任务】→ 点击【添加任务】
- 任务类型：备份数据库
- 任务名称：mht-edu每日备份
- 执行周期：每天 02:00
- 备份到：本地 + 远程备份（推荐）
- 保留份数：7
```

---

### 配置日志监控

```bash
# 查看后端实时日志
pm2 logs mht-edu-api --lines 100

# 查看Nginx访问日志
tail -f /www/wwwlogs/你的域名.log

# 查看Nginx错误日志
tail -f /www/wwwlogs/你的域名.error.log
```

---

## 📊 性能优化建议

### 1. 开启OPcache（PHP）
```
【软件商店】→【PHP】→【设置】→【安装扩展】→ 安装 opcache
```

### 2. 开启Gzip压缩
在Nginx配置中添加：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1024;
```

### 3. 配置CDN加速
```
将 dist-web/static/ 目录上传到CDN
修改前端代码中的静态资源路径
```

### 4. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_referral_locks_user ON referral_locks(user_id);
CREATE INDEX idx_elite_class_teacher ON elite_classes(teacher_id);

-- 定期优化表
OPTIMIZE TABLE users;
OPTIMIZE TABLE referral_locks;
OPTIMIZE TABLE elite_classes;
```

---

## 🔐 安全配置

### 1. 修改默认端口
```
【安全】→ 添加放行端口：3000, 5000
【安全】→ 删除不必要的端口
```

### 2. 配置防火墙
```bash
# 只允许本地访问数据库
iptables -A INPUT -p tcp --dport 3306 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -j DROP
```

### 3. 定期更新系统
```bash
# 更新系统软件包
yum update -y  # CentOS
apt update && apt upgrade -y  # Ubuntu
```

---

## 📝 维护命令速查

### PM2相关
```bash
# 查看进程状态
pm2 status

# 重启服务
pm2 restart mht-edu-api

# 停止服务
pm2 stop mht-edu-api

# 查看日志
pm2 logs mht-edu-api

# 监控面板
pm2 monit
```

### 数据库相关
```bash
# 备份数据库
mysqldump -u mht_edu -p'mht@2026' mht_edu > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u mht_edu -p'mht@2026' mht_edu < backup_20250113.sql

# 查看数据库大小
mysql -u mht_edu -p'mht@2026' -e "
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'mht_edu'
GROUP BY table_schema;
"
```

### Nginx相关
```bash
# 测试配置
nginx -t

# 重载配置
nginx -s reload

# 查看Nginx进程
ps aux | grep nginx
```

---

## 🐛 故障排查

### 问题1：后端服务无法启动
```bash
# 检查端口占用
netstat -tunlp | grep 3000

# 检查PM2日志
pm2 logs mht-edu-api --err

# 检查数据库连接
mysql -u mht_edu -p'mht@2026' -h localhost mht_edu
```

### 问题2：数据库连接失败
```bash
# 检查MySQL状态
systemctl status mysqld

# 检查用户权限
mysql -u root -p -e "
SELECT user, host FROM mysql.user WHERE user='mht_edu';
"

# 授权（如果权限不足）
GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost';
FLUSH PRIVILEGES;
```

### 问题3：前端页面无法访问
```bash
# 检查Nginx配置
nginx -t

# 检查文件权限
ls -la /www/wwwroot/mht-edu/dist-web/

# 修复权限
chown -R www:www /www/wwwroot/mht-edu/
```

### 问题4：分销关系没有锁定
```sql
-- 检查锁定记录
SELECT * FROM referral_locks WHERE user_id = 用户ID;

-- 检查用户邀请关系
SELECT id, nickname, inviter_id FROM users WHERE id = 用户ID;

-- 手动添加锁定（测试用）
INSERT INTO referral_locks (user_id, locker_id, lock_type, created_at)
VALUES (用户ID, 推荐人ID, 'manual', NOW());
```

---

## 📞 技术支持

如遇到部署问题，请提供以下信息：
1. 宝塔面板截图（软件列表）
2. PM2日志（`pm2 logs mht-edu-api`）
3. Nginx错误日志（`/www/wwwlogs/你的域名.error.log`）
4. 数据库版本（`mysql -V`）

---

**部署完成后，请访问以下地址验证：**
- H5版本：`https://你的域名.com`
- 后端API：`https://你的域名.com/api/hello`
- 管理后台：`https://你的域名.com/pages/admin/index`

**演示账号：**
- 教师账号：手机号 `13800000100`，密码任意
- 家长账号：手机号 `13800000200`，密码任意
