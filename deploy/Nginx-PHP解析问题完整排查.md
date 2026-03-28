# Nginx PHP 解析问题完整排查指南

## 问题现象

网站访问时下载文件而不是显示页面，即使配置了 PHP 解析仍然无效。

---

## 🔍 排查步骤

### 1. 检查 enable-php-xx.conf 文件

```bash
# 查看文件是否存在
ls -la /www/server/panel/vhost/nginx/enable-php-74.conf

# 查看文件内容
cat /www/server/panel/vhost/nginx/enable-php-74.conf
```

**如果文件不存在，创建它：**

```bash
cat > /www/server/panel/vhost/nginx/enable-php-74.conf << 'EOF'
location ~ [^/]\.php(/|$)
{
    try_files $uri =404;
    fastcgi_pass  unix:/tmp/php-cgi-74.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    set $real_script_name $fastcgi_script_name;
    if ($fastcgi_script_name ~ "^(.+?\.php)(/.+)$") {
        set $real_script_name $1;
        set $path_info $2;
    }
    fastcgi_param SCRIPT_FILENAME $document_root$real_script_name;
    fastcgi_param SCRIPT_NAME $real_script_name;
    fastcgi_param PATH_INFO $path_info;
}
EOF
```

**其他 PHP 版本的配置：**

- PHP 7.2: `enable-php-72.conf` + `php-cgi-72.sock`
- PHP 7.3: `enable-php-73.conf` + `php-cgi-73.sock`
- PHP 7.4: `enable-php-74.conf` + `php-cgi-74.sock`
- PHP 8.0: `enable-php-80.conf` + `php-cgi-80.sock`
- PHP 8.1: `enable-php-81.conf` + `php-cgi-81.sock`

---

### 2. 检查 PHP-FPM 运行状态

```bash
# 检查 PHP 进程
ps aux | grep php-fpm | grep -v grep

# 检查 socket 文件
ls -la /tmp/php-cgi-*.sock

# 启动 PHP-FPM
/etc/init.d/php-fpm-74 start

# 查看 PHP-FPM 状态
/etc/init.d/php-fpm-74 status

# 重启 PHP-FPM
/etc/init.d/php-fpm-74 restart
```

---

### 3. 测试 Nginx 配置

```bash
# 测试配置语法
/www/server/nginx/sbin/nginx -t

# 如果有错误，查看详细信息
/www/server/nginx/sbin/nginx -t 2>&1

# 重载配置
/etc/init.d/nginx reload

# 重启 Nginx
/etc/init.d/nginx restart
```

---

### 4. 查看错误日志

```bash
# Nginx 错误日志
tail -100 /www/wwwlogs/nginx_error.log

# 网站错误日志
tail -100 /www/wwwlogs/你的域名.error.log

# PHP-FPM 错误日志
tail -100 /www/server/php/74/var/log/php-fpm.log

# 宝塔面板错误日志
tail -100 /www/server/panel/logs/error.log
```

---

### 5. 检查网站目录和文件

```bash
# 检查网站目录
ls -la /www/wwwroot/你的域名/

# 检查 index.php
cat /www/wwwroot/你的域名/index.php

# 检查目录权限
stat /www/wwwroot/你的域名/

# 修复权限
chown -R www:www /www/wwwroot/你的域名/
chmod -R 755 /www/wwwroot/你的域名/
```

---

### 6. 测试 PHP 解析

创建测试文件：

```bash
echo "<?php phpinfo(); ?>" > /www/wwwroot/你的域名/test.php
```

访问 `http://你的域名/test.php`

- **如果看到 PHP 信息页面** → PHP 解析正常
- **如果下载文件** → PHP 解析有问题
- **如果 502 错误** → PHP-FPM 未运行或 socket 错误

---

## 🚨 常见错误及解决

### 错误 1: No such file or directory

```
connect() to unix:/tmp/php-cgi-74.sock failed (2: No such file or directory)
```

**原因：** PHP-FPM 未启动或 socket 文件不存在

**解决：**
```bash
# 启动 PHP-FPM
/etc/init.d/php-fpm-74 start

# 检查 socket
ls -la /tmp/php-cgi-*.sock

# 如果还是没有，检查 PHP-FPM 配置
cat /www/server/php/74/etc/php-fpm.conf | grep listen
```

---

### 错误 2: Permission denied

```
connect() to unix:/tmp/php-cgi-74.sock failed (13: Permission denied)
```

**原因：** 权限问题

**解决：**
```bash
# 修改 socket 文件权限
chmod 666 /tmp/php-cgi-74.sock

# 或修改 PHP-FPM 配置
# /www/server/php/74/etc/php-fpm.conf
# listen.mode = 0666
```

---

### 错误 3: Primary script unknown

```
Primary script unknown
```

**原因：** SCRIPT_FILENAME 路径错误

**解决：**
```bash
# 检查 enable-php-xx.conf 中的路径配置
cat /www/server/panel/vhost/nginx/enable-php-74.conf

# 确保 fastcgi_param SCRIPT_FILENAME 正确
fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
```

---

### 错误 4: File not found

**原因：** 网站根目录配置错误或文件不存在

**解决：**
```bash
# 检查网站配置中的 root
cat /www/server/panel/vhost/nginx/你的域名.conf | grep root

# 检查目录是否存在
ls -la /www/wwwroot/你的域名/

# 检查 index.php 是否存在
ls -la /www/wwwroot/你的域名/index.php
```

---

## 📋 一键排查脚本

```bash
#!/bin/bash
# Nginx + PHP 排查脚本

echo "============================================"
echo "1. 检查 enable-php-74.conf 文件"
echo "============================================"
if [ -f "/www/server/panel/vhost/nginx/enable-php-74.conf" ]; then
    echo "✅ 文件存在"
    cat /www/server/panel/vhost/nginx/enable-php-74.conf
else
    echo "❌ 文件不存在"
fi

echo ""
echo "============================================"
echo "2. 检查 PHP-FPM 运行状态"
echo "============================================"
if ps aux | grep -v grep | grep php-fpm-74 > /dev/null; then
    echo "✅ PHP-FPM 正在运行"
else
    echo "❌ PHP-FPM 未运行"
    echo "尝试启动..."
    /etc/init.d/php-fpm-74 start
fi

echo ""
echo "============================================"
echo "3. 检查 socket 文件"
echo "============================================"
ls -la /tmp/php-cgi-*.sock 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 没有找到 socket 文件"
fi

echo ""
echo "============================================"
echo "4. 测试 Nginx 配置"
echo "============================================"
/www/server/nginx/sbin/nginx -t

echo ""
echo "============================================"
echo "5. 检查网站目录"
echo "============================================"
ls -la /www/wwwroot/wx.weizhiyunduan.com/ 2>/dev/null | head -10
if [ $? -ne 0 ]; then
    echo "❌ 网站目录不存在"
fi

echo ""
echo "============================================"
echo "6. 最近错误日志"
echo "============================================"
echo "--- Nginx 错误 ---"
tail -5 /www/wwwlogs/nginx_error.log 2>/dev/null
echo ""
echo "--- 网站错误 ---"
tail -5 /www/wwwlogs/wx.weizhiyunduan.com.error.log 2>/dev/null
```

---

## 💡 快速修复流程

如果不确定问题，按顺序执行：

```bash
# 1. 启动 PHP-FPM
/etc/init.d/php-fpm-74 start

# 2. 创建 PHP 解析配置（如果不存在）
if [ ! -f "/www/server/panel/vhost/nginx/enable-php-74.conf" ]; then
cat > /www/server/panel/vhost/nginx/enable-php-74.conf << 'EOF'
location ~ [^/]\.php(/|$)
{
    try_files $uri =404;
    fastcgi_pass  unix:/tmp/php-cgi-74.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    set $real_script_name $fastcgi_script_name;
    if ($fastcgi_script_name ~ "^(.+?\.php)(/.+)$") {
        set $real_script_name $1;
        set $path_info $2;
    }
    fastcgi_param SCRIPT_FILENAME $document_root$real_script_name;
    fastcgi_param SCRIPT_NAME $real_script_name;
    fastcgi_param PATH_INFO $path_info;
}
EOF
fi

# 3. 测试并重启 Nginx
/www/server/nginx/sbin/nginx -t && /etc/init.d/nginx restart

# 4. 创建测试文件
echo "<?php phpinfo(); ?>" > /www/wwwroot/wx.weizhiyunduan.com/test.php

echo "修复完成，请访问 http://wx.weizhiyunduan.com/test.php 测试"
```
