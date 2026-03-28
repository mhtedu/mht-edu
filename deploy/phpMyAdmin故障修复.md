# 宝塔面板 phpMyAdmin 无法连接解决方案

## 错误信息
```
HTTPConnectionPool(host='127.0.0.1', port=888): Max retries exceeded
Connection refused
```

## 原因
宝塔面板的phpMyAdmin服务未启动，或PHP环境异常。

---

## 解决方案

### 方案一：重启宝塔面板（推荐先试）

```bash
bt restart
```

---

### 方案二：启动PHP服务

```bash
# 查看已安装的PHP版本
ls /www/server/php

# 根据显示的版本启动，例如 php74 或 php80
/etc/init.d/php-fpm-74 start

# 或重启
/etc/init.d/php-fpm-74 restart
```

---

### 方案三：检查面板服务

```bash
# 查看状态
bt status

# 启动面板
bt start
```

---

### 方案四：命令行操作数据库

如果phpMyAdmin一直不行，用命令行：

```bash
# 1. 登录MySQL
mysql -u root -p
# 输入MySQL root密码

# 2. 创建数据库
CREATE DATABASE mht_edu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. 创建用户
CREATE USER 'mht_edu'@'localhost' IDENTIFIED BY '你的密码';

# 4. 授权
GRANT ALL PRIVILEGES ON mht_edu.* TO 'mht_edu'@'localhost';
FLUSH PRIVILEGES;

# 5. 退出MySQL
exit

# 6. 导入SQL文件
cd /www/wwwroot/mht-edu/database
mysql -u mht_edu -p mht_edu < init.sql
mysql -u mht_edu -p mht_edu < demo-data.sql
mysql -u mht_edu -p mht_edu < share-tables.sql
```

---

### 方案五：重装phpMyAdmin

1. 宝塔面板 → 【软件商店】→ 搜索【phpMyAdmin】
2. 点击【卸载】
3. 重新【安装】

---

## 一键修复命令

```bash
bt restart
/etc/init.d/php-fpm-74 restart 2>/dev/null || /etc/init.d/php-fpm-80 restart 2>/dev/null || /etc/init.d/php-fpm-81 restart 2>/dev/null
```
