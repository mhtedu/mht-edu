# 数据库初始化 - 绕过 phpMyAdmin 限制

## ⚠️ 问题说明

宝塔面板的 phpMyAdmin 出于安全考虑，禁用了以下操作：
- DROP DATABASE
- TRUNCATE TABLE  
- DELETE（某些情况下）

---

## 🚀 方案一：SSH 命令行操作（推荐）

### 步骤 1：SSH 连接服务器

```bash
ssh root@你的服务器IP
```

### 步骤 2：获取 MySQL 密码

```bash
# 方法1：查看宝塔面板密码
cat /www/server/panel/default.pl | grep mysql

# 方法2：在宝塔面板查看
# 宝塔面板 → 软件商店 → MySQL → 设置 → root 密码
```

### 步骤 3：登录 MySQL

```bash
mysql -u root -p
# 输入密码
```

### 步骤 4：执行清空操作

```sql
USE mht_edu;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM agent_stats;
DELETE FROM distribution_records;
DELETE FROM messages;
DELETE FROM reviews;
DELETE FROM orders;
DELETE FROM demands;
DELETE FROM activities;
DELETE FROM courses;
DELETE FROM products;
DELETE FROM teacher_profiles;
DELETE FROM institution_profiles;
DELETE FROM memberships;
DELETE FROM users;

SET FOREIGN_KEY_CHECKS = 1;

exit;
```

### 步骤 5：重新导入数据

```bash
# 找到 init.sql 文件路径
find /www -name "init.sql" 2>/dev/null

# 导入数据
mysql -u root -p mht_edu < /www/wwwroot/你的项目路径/database/init.sql
```

---

## 🔄 方案二：创建新数据库

### SSH 执行：

```bash
# 登录 MySQL
mysql -u root -p

# 创建新数据库
CREATE DATABASE mht_edu_v2 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

# 导入数据到新数据库
mysql -u root -p mht_edu_v2 < /www/wwwroot/你的项目路径/database/init.sql
```

### 修改项目配置：

编辑项目的 `.env` 文件：

```bash
nano /www/wwwroot/你的项目路径/.env
```

修改为：

```
DB_DATABASE=mht_edu_v2
```

---

## 🎯 方案三：宝塔面板数据库管理

### 步骤：

1. 宝塔面板 → 数据库
2. 找到 `mht_edu` 数据库
3. 点击右侧 "删除" 按钮
4. 确认删除
5. 点击 "添加数据库"
   - 数据库名：mht_edu
   - 用户名：mht_edu
   - 密码：自己设置
6. 点击 "管理" 进入 phpMyAdmin
7. 导入 init.sql

---

## 📋 一键执行脚本

```bash
#!/bin/bash
# 数据库初始化脚本

# 配置
DB_NAME="mht_edu"
DB_USER="mht_edu"
DB_PASS="你的密码"
INIT_SQL="/www/wwwroot/mht-edu/database/init.sql"

# 获取 MySQL root 密码
MYSQL_ROOT_PASS=$(cat /www/server/panel/data/default.db 2>/dev/null | grep -o 'mysql_root_password.*' | cut -d"'" -f4)

echo "开始初始化数据库..."

# 删除旧数据库并重建
mysql -u root -p${MYSQL_ROOT_PASS} -e "
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SET FOREIGN_KEY_CHECKS = 1;
"

# 导入数据
if [ -f "$INIT_SQL" ]; then
    echo "导入初始数据..."
    mysql -u root -p${MYSQL_ROOT_PASS} ${DB_NAME} < ${INIT_SQL}
    echo "✅ 数据库初始化完成！"
else
    echo "❌ 找不到 init.sql 文件: $INIT_SQL"
fi
```

---

## 🔍 常见问题

### Q: 忘记 MySQL root 密码？

```bash
# 宝塔面板查看
cat /www/server/panel/data/default.db | grep mysql

# 或者在宝塔面板 → 软件商店 → MySQL → 设置 → root 密码
```

### Q: init.sql 文件在哪里？

```bash
# 查找文件
find /www -name "init.sql" 2>/dev/null

# 或者在项目根目录的 database 文件夹
```

### Q: 无法 SSH 连接？

1. 检查阿里云安全组是否开放 22 端口
2. 在阿里云控制台使用 "远程连接"
3. 使用宝塔面板的 "终端" 功能

---

## ✅ 验证数据库初始化成功

```bash
mysql -u mht_edu -p mht_edu

# 执行
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM memberships;

# 应该能看到表和数据
```
