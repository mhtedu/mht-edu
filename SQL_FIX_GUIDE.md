# 🚨 SQL语法错误已修复

## ❌ 原问题
```
ERROR 1064 (42000) at line 64: You have an error in your SQL syntax
错误位置: INDEX `idx_subjects` ((CAST(`subjects` AS CHAR(500))),
```

**原因**：函数索引语法错误（多了左括号）

## ✅ 已修复
**修复前**：
```sql
INDEX `idx_subjects` ((CAST(`subjects` AS CHAR(500))),
```

**修复后**：
```sql
-- 已移除该索引（JSON字段函数索引在MySQL 8.0前不支持）
INDEX `idx_rating` (`rating`),
```

---

## 📥 请重新下载修复后的SQL文件

### 文件路径
```
/workspace/projects/server/database/mht_edu_complete.sql
```

### 或下载完整部署包
```
/workspace/projects/mht-edu-deploy-fixed.tar.gz (715KB)
```

---

## 🔧 服务器端修复步骤

### 方案一：重新上传SQL文件（推荐）

```bash
# 1. 删除旧的SQL文件
cd /wwwroot/mht-edu
rm -f server/database/mht_edu_complete.sql

# 2. 上传新的SQL文件
# 使用宝塔文件管理器上传新的 mht_edu_complete.sql 到：
# /wwwroot/mht-edu/server/database/

# 3. 清空数据库并重新导入
mysql -u root -p -e "DROP DATABASE IF EXISTS mht_edu;"
mysql -u root -p -e "CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost';"
mysql -u mht_edu -p'mht@2026' mht_edu < /wwwroot/mht-edu/server/database/mht_edu_complete.sql

# 4. 验证导入结果
mysql -u mht_edu -p'mht@2026' -e "
USE mht_edu;
SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='mht_edu';
SELECT COUNT(*) AS users FROM users;
"
```

**期望结果**：
```
tables: 23
users: 18
```

---

### 方案二：直接修改服务器上的SQL文件

```bash
# 1. 编辑SQL文件
cd /wwwroot/mht-edu
vi server/database/mht_edu_complete.sql

# 2. 找到第92行，删除有问题的索引行
# 将：
#     INDEX `idx_subjects` ((CAST(`subjects` AS CHAR(500))),
#     INDEX `idx_rating` (`rating`),
# 改为：
#     INDEX `idx_rating` (`rating`),

# 3. 保存退出后重新导入
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql
```

---

## 🎯 完整部署流程（从修复后开始）

```bash
# 1. 确认在正确目录
cd /wwwroot/mht-edu

# 2. 清空并重建数据库
mysql -u root -p << 'EOF'
DROP DATABASE IF EXISTS mht_edu;
CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost' IDENTIFIED BY 'mht@2026';
FLUSH PRIVILEGES;
EOF

# 3. 导入修复后的SQL文件
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql

# 4. 验证数据库
mysql -u mht_edu -p'mht@2026' -e "
USE mht_edu;
SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='mht_edu';
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS teachers FROM teacher_profiles;
SELECT COUNT(*) AS locks FROM referral_locks;
"

# 期望结果：
# tables: 23
# users: 18
# teachers: 9
# locks: 9

# 5. 启动后端服务（如果还没启动）
cd /wwwroot/mht-edu/server

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

# 安装依赖并构建
pnpm install
pnpm build

# 启动服务
pm2 start dist/main.js --name mht-edu-api
pm2 save

# 6. 验证服务
pm2 status
curl http://localhost:3000/api/hello
```

---

## 📊 验证清单

### ✅ 数据库验证
```bash
# 表数量应该是23
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='mht_edu';"

# 用户数量应该是18
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.users;"

# 分销锁定记录应该是9
mysql -u mht_edu -p'mht@2026' -e "SELECT COUNT(*) FROM mht_edu.referral_locks;"
```

### ✅ 服务验证
```bash
# PM2状态应该是online
pm2 status | grep mht-edu-api

# API测试应该返回Hello World
curl http://localhost:3000/api/hello
```

---

## 📞 如有问题

如果导入仍然失败，请提供：
1. 错误信息截图
2. MySQL版本：`mysql --version`
3. 当前SQL文件行数：`wc -l /wwwroot/mht-edu/server/database/mht_edu_complete.sql`

我会继续帮您排查！
