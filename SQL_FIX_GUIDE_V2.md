# 🔧 SQL主键冲突问题已修复

## ❌ 原问题
```
#1068 - Multiple primary key defined
错误表：activity_registrations
```

**原因**：`activity_registrations` 表的主键被定义了两次
```sql
-- 错误的定义（第261行）
`id` INT AUTO_INCREMENT PRIMARY KEY,  ← 第一次定义

-- 后续定义（第270行）
PRIMARY KEY (`id`),  ← 第二次定义，导致冲突
```

---

## ✅ 已修复

**修复前**：
```sql
`id` INT AUTO_INCREMENT PRIMARY KEY,
```

**修复后**：
```sql
`id` INT AUTO_INCREMENT,
```

现在只在第270行保留 `PRIMARY KEY (`id`)`，避免了重复定义。

---

## 📥 请重新下载修复后的SQL文件

### 方式一：完整部署包（推荐）
```
/workspace/projects/mht-edu-deploy-final.tar.gz (716KB)
```

### 方式二：单独SQL文件
```
/workspace/projects/server/database/mht_edu_complete.sql
```

---

## 🚀 服务器端操作步骤

### 方案一：使用宝塔面板导入（最简单）

#### 1. 删除旧数据库
```
1. 登录宝塔面板：http://你的IP:8888
2. 点击左侧【数据库】
3. 找到 mht_edu 数据库
4. 点击右侧【删除】按钮
5. 勾选"删除数据库用户"
6. 确认删除
```

#### 2. 创建新数据库
```
1. 点击【添加数据库】
   - 数据库名：mht_edu
   - 用户名：mht_edu
   - 密码：mht@2026
   - 字符集：utf8mb4
2. 点击【提交】
```

#### 3. 上传并导入SQL文件
```
1. 使用宝塔文件管理器，上传新的 SQL 文件到：
   /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql

2. 点击数据库 mht_edu 后的【管理】→ 进入 phpMyAdmin

3. 点击顶部【导入】标签

4. 点击【选择文件】

5. 选择：/www/wwwroot/mht-edu/server/database/mht_edu_complete.sql

6. 点击底部【执行】按钮

7. 等待导入完成（约1-2秒）
```

#### 4. 验证导入成功
```
在 phpMyAdmin 中：
1. 点击左侧 mht_edu 数据库
2. 应该看到 23 张表
3. 点击 users 表，应该有 18 条记录
4. 点击 referral_locks 表，应该有 9 条记录
```

---

### 方案二：命令行导入

```bash
# 1. 进入项目目录
cd /www/wwwroot/mht-edu

# 2. 上传新的SQL文件（使用宝塔文件管理器或rz命令）

# 3. 验证文件
ls -lh server/database/mht_edu_complete.sql
# 应显示约 44KB

# 4. 删除并重建数据库
mysql -u root -p'你的root密码' << 'EOF'
DROP DATABASE IF EXISTS mht_edu;
CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost' IDENTIFIED BY 'mht@2026';
FLUSH PRIVILEGES;
EOF

# 5. 导入SQL文件
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql

# 6. 验证导入
mysql -u mht_edu -p'mht@2026' -e "
USE mht_edu;
SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='mht_edu';
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS teachers FROM teacher_profiles;
SELECT COUNT(*) AS locks FROM referral_locks;
SELECT COUNT(*) AS elite_classes FROM elite_classes;
"
```

**期望结果**：
```
tables: 23
users: 18
teachers: 9
locks: 9
elite_classes: 5
```

---

## 📊 验证清单

### ✅ 数据库验证
```bash
# 表数量（应为23）
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='mht_edu';"

# 用户数量（应为18）
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.users;"

# 教师档案（应为9）
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.teacher_profiles;"

# 分销锁定（应为9）
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.referral_locks;"

# 牛师班（应为5）
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.elite_classes;"
```

### ✅ 表结构验证
```bash
# 检查关键表是否存在
mysql -u mht_edu -p'mht@2026' -e "
USE mht_edu;
SHOW TABLES LIKE 'users';
SHOW TABLES LIKE 'teacher_profiles';
SHOW TABLES LIKE 'referral_locks';
SHOW TABLES LIKE 'elite_classes';
SHOW TABLES LIKE 'activity_registrations';
"
```

---

## 🎯 导入成功后下一步

### 1. 配置后端环境
```bash
cd /www/wwwroot/mht-edu/server

# 创建 .env 文件
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
```

### 2. 安装依赖并构建
```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 3. 启动服务
```bash
# 使用 PM2 启动
pm2 start dist/main.js --name mht-edu-api

# 查看状态
pm2 status

# 设置开机自启
pm2 save
pm2 startup
```

### 4. 验证服务
```bash
# 测试API
curl http://localhost:3000/api/hello
# 应返回：{"message":"Hello World!"}

# 测试数据库连接
curl http://localhost:3000/api/elite-class/list
# 应返回：牛师班列表JSON
```

---

## 🔍 故障排查

### 如果导入仍然失败

#### 1. 检查SQL文件完整性
```bash
# 检查文件大小（应约44KB）
ls -lh /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql

# 检查文件行数（应约709行）
wc -l /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql

# 检查文件开头和结尾
head -5 /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql
tail -5 /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql
```

#### 2. 查看详细错误
```bash
# 在phpMyAdmin中导入时，查看错误信息
# 或在命令行中查看
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql 2>&1 | head -20
```

#### 3. 检查MySQL版本
```bash
mysql --version
# 需要 MySQL 5.7+ 或 MySQL 8.0+
```

---

## 📞 需要帮助？

如果导入仍有问题，请提供：
1. 完整的错误信息截图
2. MySQL版本：`mysql --version`
3. SQL文件大小：`ls -lh server/database/mht_edu_complete.sql`
4. SQL文件行数：`wc -l server/database/mht_edu_complete.sql`

我会立即帮您解决！

---

## 📝 修复历史

### 第一次修复（2025-01-13）
- 问题：JSON字段函数索引语法错误
- 修复：移除 `INDEX idx_subjects ((CAST(...)))`

### 第二次修复（2025-01-13）
- 问题：`activity_registrations` 表主键重复定义
- 修复：删除字段定义中的 PRIMARY KEY，保留独立的 PRIMARY KEY (`id`)

### 当前版本
- 文件：mht-edu-deploy-final.tar.gz (716KB)
- SQL：mht_edu_complete.sql (44KB, 709行)
- 状态：✅ 所有问题已修复，可正常导入
