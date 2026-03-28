# Nginx 升级后网站下载文件问题修复

## ⚠️ 问题现象

访问网站时，浏览器自动下载一个叫"下载"的文件，而不是显示网页内容。

---

## 🔍 问题原因

**核心原因：** Nginx 没有正确解析 PHP 文件

具体可能：
1. PHP 解析配置丢失或错误
2. PHP-FPM 服务未运行
3. fastcgi_pass 路径错误
4. include fastcgi_params 语句缺失

---

## 🔧 修复方案

### 方案一：重新生成网站配置（最简单）

**宝塔面板操作：**

1. 网站 → 找到问题网站 → 设置
2. 点击 "配置文件" → 复制备份
3. 删除网站（保留文件和数据库）
4. 重新添加网站
5. 恢复配置

---

### 方案二：手动修复配置

#### 步骤 1：查看当前配置

```bash
cat /www/server/panel/vhost/nginx/你的域名.conf
```

#### 步骤 2：检查是否包含 PHP 解析

**正确的配置应该包含：**

```nginx
location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-74.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

#### 步骤 3：检查 PHP 版本

```bash
# 查看安装的 PHP 版本
ls /www/server/php/

# 常见版本：php56, php70, php71, php72, php73, php74, php80, php81
```

#### 步骤 4：确认 PHP-FPM 运行状态

```bash
# 查看 PHP 进程
ps aux | grep php-fpm

# 查看 PHP socket 文件
ls -la /tmp/php-cgi-*.sock

# 启动 PHP-FPM（如果没有运行）
/etc/init.d/php-fpm-74 start  # 根据你的 PHP 版本
```

#### 步骤 5：修复配置

编辑配置文件：

```bash
nano /www/server/panel/vhost/nginx/你的域名.conf
```

在 `server {}` 块内的 `location / {}` 之后添加：

```nginx
# PHP 解析（根据你的 PHP 版本选择）

# PHP 7.4
location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-74.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}

# PHP 8.0
location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-80.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}

# PHP 8.1
location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-81.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

**保存后测试并重启：**

```bash
# 测试配置
/www/server/nginx/sbin/nginx -t

# 重启 Nginx
/etc/init.d/nginx restart
```

---

## 📋 完整示例配置

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    index index.php index.html index.htm default.php default.htm default.html;
    root /www/wwwroot/example.com;
    
    # 禁止访问的文件或目录
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.svn|\.project|LICENSE|README.md) {
        return 404;
    }
    
    # 静态文件
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|js|css)$ {
        expires 30d;
        access_log off;
    }
    
    # PHP 解析（重要！）
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-74.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # 伪静态（如果是 WordPress）
    location / {
        if (!-e $request_filename) {
            rewrite ^(.*)$ /index.php?s=$1 last;
            break;
        }
    }
    
    access_log /www/wwwlogs/example.com.log;
    error_log /www/wwwlogs/example.com.error.log;
}
```

---

## 🔍 排查命令

```bash
# 1. 查看网站配置
cat /www/server/panel/vhost/nginx/你的域名.conf

# 2. 检查 PHP 版本
ls /www/server/php/

# 3. 检查 PHP-FPM 运行状态
ps aux | grep php-fpm

# 4. 检查 PHP socket 文件
ls -la /tmp/php-cgi-*.sock

# 5. 启动 PHP-FPM
/etc/init.d/php-fpm-74 start  # 根据版本

# 6. 测试 Nginx 配置
/www/server/nginx/sbin/nginx -t

# 7. 重启 Nginx
/etc/init.d/nginx restart

# 8. 查看 Nginx 错误日志
tail -50 /www/wwwlogs/nginx_error.log
```

---

## 💡 常见问题

### Q: 如何确定网站使用的 PHP 版本？

**宝塔面板查看：**
1. 网站 → 设置 → PHP版本
2. 或者在 "软件商店" 查看已安装的 PHP

**命令行查看：**
```bash
# 查看网站目录下的 .user.ini 文件
cat /www/wwwroot/你的域名/.user.ini | grep PHP

# 或查看 phpinfo
curl http://你的域名/phpinfo.php
```

### Q: PHP-FPM socket 文件不存在？

**原因：** PHP-FPM 未启动或配置错误

**解决：**
```bash
# 启动 PHP-FPM
/etc/init.d/php-fpm-74 start

# 如果启动失败，查看错误
cat /www/server/php/74/var/log/php-fpm.log
```

### Q: 使用 TCP 方式而不是 socket？

有些配置使用 TCP 方式连接：

```nginx
location ~ \.php$ {
    fastcgi_pass 127.0.0.1:9000;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

**检查端口：**
```bash
netstat -tlnp | grep 9000
```

---

## 📞 还是不行？

**请提供以下信息：**

```bash
# 执行这些命令，把输出发给我
cat /www/server/panel/vhost/nginx/你的域名.conf
ls /www/server/php/
ps aux | grep php-fpm
ls -la /tmp/php-cgi-*.sock
/www/server/nginx/sbin/nginx -t
```

我会帮你精准定位问题！
