# 🚀 快速部署清单

## 📦 最新关键文件（必须上传）

### 1️⃣ 数据库文件（必传）
```
server/database/mht_edu_complete.sql
```
- **大小**：约 30KB
- **包含**：23张表 + 演示数据
- **用途**：数据库初始化

### 2️⃣ 后端代码（必传）
```
server/ （整个目录）
```
- **技术**：NestJS + TypeScript
- **端口**：3000
- **用途**：API服务

### 3️⃣ 前端构建产物（三选一或全部）
```
dist-weapp/  → 微信小程序代码包
dist-web/    → H5移动端网页
dist-tt/     → 字节跳动小程序
```

---

## ⚡ 5分钟快速部署

### 方式一：宝塔面板上传（推荐新手）

#### Step 1：上传文件
```
1. 登录宝塔面板：http://你的IP:8888
2. 【文件】→ 进入 /www/wwwroot/mht-edu
3. 删除旧文件（如有）
4. 上传以下文件/目录：
   ✅ server/
   ✅ dist-web/（H5版本）
   ✅ dist-weapp/（小程序版本）
```

#### Step 2：重建数据库
```
1. 【数据库】→ 删除旧库 mht_edu
2. 【数据库】→ 添加数据库
   - 数据库名：mht_edu
   - 用户名：mht_edu
   - 密码：mht@2026
3. 点击 mht_edu 后的【管理】→【导入】
4. 选择文件：/www/wwwroot/mht-edu/server/database/mht_edu_complete.sql
5. 点击【执行】
```

#### Step 3：启动后端
```bash
# SSH登录服务器
ssh root@你的IP

# 进入项目目录
cd /www/wwwroot/mht-edu/server

# 创建环境配置
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu
JWT_SECRET=mht-edu-jwt-secret-2025
PORT=3000
NODE_ENV=production
EOF

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 启动服务
pm2 start dist/main.js --name mht-edu-api
pm2 save
```

#### Step 4：配置网站
```
1. 【网站】→ 添加站点
   - 域名：你的域名.com
   - 根目录：/www/wwwroot/mht-edu/dist-web
   
2. 点击域名后的【设置】→【配置文件】，添加：
   location /api {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
   }
   
3. 【软件商店】→【Nginx】→ 重载配置
```

#### Step 5：验证部署
```bash
# 测试后端API
curl http://你的域名.com/api/hello

# 测试数据库
curl http://你的域名.com/api/elite-class/list
```

---

### 方式二：命令行快速部署

```bash
# 1. 进入项目目录
cd /www/wwwroot/mht-edu

# 2. 清空旧文件
rm -rf server dist-web dist-weapp dist-tt

# 3. 上传新文件（使用scp或宝塔文件管理器）
# 本地执行：
scp -r server/ root@你的IP:/www/wwwroot/mht-edu/
scp -r dist-web/ root@你的IP:/www/wwwroot/mht-edu/

# 4. 重建数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS mht_edu;"
mysql -u root -p -e "CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4;"
mysql -u root -p -e "CREATE USER 'mht_edu'@'localhost' IDENTIFIED BY 'mht@2026';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost';"
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql

# 5. 启动后端
cd server
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu
JWT_SECRET=mht-edu-jwt-secret-2025
PORT=3000
EOF

pnpm install && pnpm build
pm2 restart mht-edu-api || pm2 start dist/main.js --name mht-edu-api
pm2 save
```

---

## 📱 微信小程序部署

### 方式一：使用微信开发者工具
```
1. 下载微信开发者工具：
   https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   
2. 导入项目：
   - 目录：选择 dist-weapp 文件夹
   - AppID：填写你的小程序AppID
   
3. 上传代码：
   - 点击右上角【上传】
   - 版本号：1.0.0
   - 备注：棉花糖教育平台
   
4. 提交审核：
   - 登录 mp.weixin.qq.com
   - 【版本管理】→【提交审核】
```

### 方式二：直接上传代码包
```
1. 压缩 dist-weapp 目录为 zip
2. 登录微信公众平台：mp.weixin.qq.com
3. 【管理】→【版本管理】→【开发版本】
4. 点击【上传代码】→ 选择 zip 文件
```

---

## 🔍 部署验证清单

### ✅ 后端验证
```bash
# 1. 检查PM2进程
pm2 status | grep mht-edu-api
# 应显示：online

# 2. 测试API
curl http://localhost:3000/api/hello
# 应返回：{"message":"Hello World!"}

# 3. 测试数据库
curl http://localhost:3000/api/elite-class/list
# 应返回：牛师班列表JSON
```

### ✅ 数据库验证
```bash
# 1. 检查表数量
mysql -u mht_edu -p'mht@2026' -e "
SELECT COUNT(*) AS tables_count 
FROM information_schema.tables 
WHERE table_schema = 'mht_edu';
"
# 应返回：23

# 2. 检查用户数据
mysql -u mht_edu -p'mht@2026' -e "
SELECT COUNT(*) AS users_count FROM mht_edu.users;
"
# 应返回：18

# 3. 检查分销锁定
mysql -u mht_edu -p'mht@2026' -e "
SELECT COUNT(*) AS locks_count FROM mht_edu.referral_locks;
"
# 应返回：9
```

### ✅ 前端验证
```bash
# 1. H5访问测试
curl -I https://你的域名.com
# 应返回：HTTP/1.1 200 OK

# 2. 微信小程序
# 在开发者工具中预览，扫码测试
```

---

## 🛠️ 常见问题快速修复

### Q: 后端启动失败？
```bash
# 检查端口占用
lsof -i:3000

# 杀掉占用进程
kill -9 $(lsof -t -i:3000)

# 重启服务
pm2 restart mht-edu-api
```

### Q: 数据库连接失败？
```bash
# 检查MySQL状态
systemctl status mysqld

# 重启MySQL
systemctl restart mysqld

# 测试连接
mysql -u mht_edu -p'mht@2026' -h localhost mht_edu
```

### Q: 前端页面空白？
```bash
# 检查Nginx配置
nginx -t

# 重载Nginx
nginx -s reload

# 检查文件权限
chown -R www:www /www/wwwroot/mht-edu/dist-web
```

---

## 📞 紧急联系方式

如遇到无法解决的问题，请提供：
1. PM2日志：`pm2 logs mht-edu-api --lines 50`
2. Nginx日志：`tail -100 /www/wwwlogs/你的域名.error.log`
3. 数据库状态：`systemctl status mysqld`

---

## 🎯 下一步

部署成功后，建议：
1. ✅ 配置SSL证书（HTTPS）
2. ✅ 设置数据库定时备份
3. ✅ 配置监控告警
4. ✅ 提交微信小程序审核
5. ✅ 测试分销锁定功能

详细配置请查看：`BAOTA_DEPLOYMENT_GUIDE.md`
