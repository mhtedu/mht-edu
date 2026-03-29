# 棉花糖教育平台 - 数据库部署指南

## 📋 目录结构

```
deploy_package/server/database/
├── mht_edu_production.sql    # 生产环境完整SQL文件（推荐使用）
├── init_database.sh          # Linux/Mac 自动化部署脚本
└── README_DEPLOY.md          # 本文档
```

## 🚀 快速部署（推荐）

### 方法一：使用自动化脚本（Linux/Mac）

```bash
# 1. 进入 database 目录
cd deploy_package/server/database

# 2. 设置数据库连接信息
export DB_HOST=your_mysql_host
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=mht_edu

# 3. 执行部署脚本
chmod +x init_database.sh
./init_database.sh
```

### 方法二：手动执行 SQL（所有平台）

```bash
# 方式 1: 使用 mysql 命令行
mysql -h your_host -P 3306 -u root -p < mht_edu_production.sql

# 方式 2: 先登录 MySQL，再执行 source 命令
mysql -h your_host -P 3306 -u root -p
mysql> source /path/to/mht_edu_production.sql
```

### 方法三：使用 MySQL 客户端工具

1. 打开 Navicat / MySQL Workbench / phpMyAdmin
2. 连接到目标 MySQL 服务器
3. 选择或创建数据库 `mht_edu`
4. 执行 `mht_edu_production.sql` 文件

## ⚠️ 重要说明

### 1. 外键约束

**本 SQL 文件不包含外键约束**，原因：
- 避免导入时的外键冲突错误
- 避免数据类型不匹配问题（INT vs INT UNSIGNED）
- 通过应用层保证数据一致性
- 更适合生产环境的灵活部署

### 2. 数据类型统一

所有 ID 字段统一使用 `INT`（不使用 `INT UNSIGNED`），避免：
- 类型不匹配导致的外键创建失败
- 跨表关联时的隐式类型转换问题

### 3. 如果已存在数据

SQL 文件会：
- 先删除所有表（`DROP TABLE IF EXISTS`）
- 再创建新表
- 最后插入演示数据

**⚠️ 生产环境请务必备份数据！**

## 📊 表结构概览

| 序号 | 表名 | 说明 |
|------|------|------|
| 1 | users | 用户表（家长/教师/机构）|
| 2 | teacher_profiles | 教师资料表 |
| 3 | organizations | 机构表 |
| 4 | orders | 订单表 |
| 5 | conversations | 会话表 |
| 6 | messages | 消息表 |
| 7 | activities | 活动表 |
| 8 | activity_signups | 活动报名表 |
| 9 | product_categories | 产品分类表 |
| 10 | products | 产品表 |
| 11 | earnings | 收益表 |
| 12 | withdrawals | 提现表 |
| 13 | elite_classes | 牛师班表 |
| 14 | elite_class_students | 牛师班学生表 |
| 15 | elite_class_lessons | 牛师班课时表 |
| 16 | elite_class_student_lessons | 牛师班学生课时消耗表 |
| 17 | teacher_moments | 教师动态表 |
| 18 | order_reviews | 订单评价表 |
| 19 | payments | 支付记录表 |
| 20 | referral_locks | 推荐锁定表 |
| 21 | share_records | 分享记录表 |
| 22 | message_reminders | 消息提醒表 |
| 23 | notifications | 通知表 |
| 24 | order_close_history | 订单关闭历史表 |
| 25 | memberships | 会员套餐表 |
| 26 | super_memberships | 超级会员套餐表 |
| 27 | cities | 城市表 |
| 28 | admin_role | 管理员角色表 |
| 29 | admin_user | 管理员用户表 |
| 30 | admin_operation_log | 管理员操作日志表 |
| 31 | site_config | 站点配置表 |

## 🔐 默认管理员账号

导入成功后，可使用以下账号登录管理后台：

```
用户名: admin
密码: admin123
```

**⚠️ 生产环境请立即修改默认密码！**

## 🔧 后端配置

确保 `server/.env` 文件中的数据库配置正确：

```env
# Database
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mht_edu

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

## 🐛 常见问题

### Q1: 导入时报错 "Unknown database 'mht_edu'"

**解决方案**：SQL 文件已包含 `CREATE DATABASE IF NOT EXISTS`，无需手动创建。如果仍有问题，请先创建数据库：

```sql
CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q2: 导入时报错 "Access denied for user"

**解决方案**：检查数据库用户权限，确保用户有以下权限：
- CREATE（创建表）
- DROP（删除表）
- INSERT（插入数据）
- ALTER（修改表结构）

### Q3: 部分表导入成功，部分失败

**解决方案**：
1. 检查 MySQL 版本是否 >= 5.7
2. 检查字符集配置（推荐使用 utf8mb4）
3. 查看 MySQL 错误日志

### Q4: 登录管理后台提示"用户名或密码错误"

**解决方案**：
1. 确认 SQL 文件已完整导入
2. 检查 `admin_user` 表中是否有数据：

```sql
SELECT * FROM admin_user WHERE username = 'admin';
```

3. 如果密码哈希不正确，可以重置：

```sql
-- 重置密码为 admin123
UPDATE admin_user 
SET password = '$2b$10$l5yw7zkS19pyB/PD//iOEuWCvWegtY0Ch9S/bccrEYe5EcrxUGBA6' 
WHERE username = 'admin';
```

## 📞 技术支持

如有问题，请检查：
1. MySQL 服务状态
2. 数据库连接配置
3. 用户权限
4. 磁盘空间

---

**最后更新**: 2025-01-29
**版本**: v2.0.0
