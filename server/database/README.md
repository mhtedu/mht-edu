# 数据库文件说明

## 完整导入文件（推荐）

### mht_edu_complete.sql
**一站式导入**：包含所有表结构 + 演示数据

```bash
mysql -u root -p < mht_edu_complete.sql
```

包含内容：
- 23张数据表（完整业务表结构）
- 演示数据（用户、教师、牛师班、订单、活动等）
- 分销锁定演示数据

---

## 历史文件（已废弃）

以下文件已整合到 `mht_edu_complete.sql`，无需单独导入：

- `init.sql` - 基础表结构
- `share-tables.sql` - 分享相关表
- `demo-data.sql` - 旧版演示数据
- `elite-class.sql` - 牛师班表结构

---

## 数据库配置

```env
数据库名：mht_edu
用户名：mht_edu
密码：mht@2026
字符集：utf8mb4
```

---

## 导入后验证

```sql
-- 查看表数量（应为23张）
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'mht_edu';

-- 查看演示数据
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS teacher_count FROM teacher_profiles;
SELECT COUNT(*) AS elite_class_count FROM elite_classes;
SELECT COUNT(*) AS referral_lock_count FROM referral_locks;
```
