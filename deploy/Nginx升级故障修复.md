# Nginx 升级故障修复指南

## ⚠️ 升级影响说明

**重要提醒：**

1. **升级过程中服务会短暂中断** - 所有网站会暂时无法访问（通常1-3分钟）
2. **升级失败后网站持续无法访问** - 需要立即修复
3. **配置文件通常不会丢失** - 宝塔面板会保留网站配置

---

## 🚨 紧急检查（网站打不开时立即执行）

### 1. 检查Nginx进程

```bash
# 查看Nginx是否在运行
ps aux | grep nginx | grep -v grep

# 如果有输出，说明Nginx在运行
# 如果没有任何输出，说明Nginx已停止
```

### 2. 检查端口监听

```bash
# 检查80和443端口
netstat -tlnp | grep -E ':80|:443'
```

### 3. 测试配置文件

```bash
/www/server/nginx/sbin/nginx -t
```

---

## 🔧 常见错误修复

### 错误1: ssl on 指令已废弃（1.25+版本）

**错误信息：**
```
nginx: [emerg] invalid parameter "ssl on" in /www/server/panel/vhost/nginx/xxx.conf:10
```

**修复方法：**

```bash
# 方法1：自动注释掉所有 ssl on 配置
sed -i 's/^\(\s*ssl on\)/\t# \1/' /www/server/panel/vhost/nginx/*.conf

# 方法2：手动查找并编辑
grep -rn "ssl on" /www/server/panel/vhost/nginx/
# 找到对应文件，注释掉或删除 "ssl on;" 这行
```

**原因：** Nginx 1.25+ 版本中，`ssl on` 指令已被移除，改为在 listen 指令中指定：
```nginx
# 旧写法（已废弃）
listen 443;
ssl on;

# 新写法
listen 443 ssl;
```

---

### 错误2: 配置文件语法错误

**检查语法：**
```bash
/www/server/nginx/sbin/nginx -t
```

**如果提示某个文件有错误：**
```bash
# 查看具体文件内容
cat /www/server/panel/vhost/nginx/错误文件名.conf

# 编辑修复
nano /www/server/panel/vhost/nginx/错误文件名.conf
```

---

### 错误3: 端口被占用

**错误信息：**
```
nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
```

**修复方法：**
```bash
# 查看占用80端口的进程
netstat -tlnp | grep :80

# 如果是其他进程占用，先停止它
kill -9 进程PID

# 如果是旧的Nginx进程
pkill -9 nginx
/etc/init.d/nginx start
```

---

### 错误4: 缺少模块或库

**错误信息：**
```
nginx: error while loading shared libraries: xxx.so
```

**修复方法：**
```bash
# 查找缺少的库
ldd /www/server/nginx/sbin/nginx

# 如果缺少库，重新安装Nginx
# 在宝塔面板 -> 软件商店 -> Nginx -> 卸载 -> 重新安装
```

---

## 📦 回滚到旧版本

如果新版本无法修复，可以回滚：

### 方法1: 宝塔面板回滚

1. 宝塔面板 -> 软件商店
2. 找到 Nginx -> 设置
3. 切换版本 -> 选择旧版本

### 方法2: 命令行回滚（需要备份）

```bash
# 查看备份（如果有）
ls -la /www/backup/

# 恢复旧版本配置
cp -r /www/backup/nginx/conf/* /www/server/nginx/conf/
```

---

## ✅ 正确的升级流程（推荐）

### 升级前准备

```bash
# 1. 备份Nginx配置
tar -czf /www/backup/nginx-conf-$(date +%Y%m%d).tar.gz \
  /www/server/nginx/conf \
  /www/server/panel/vhost

# 2. 备份数据库
mysqldump -u root -p --all-databases > /www/backup/all-db-$(date +%Y%m%d).sql

# 3. 记录当前版本
nginx -v
```

### 选择低峰期升级

- 建议在凌晨或访问量最低时升级
- 升级过程大约需要1-3分钟
- 升级期间网站会短暂无法访问

### 升级后验证

```bash
# 1. 测试配置
/www/server/nginx/sbin/nginx -t

# 2. 启动Nginx
/etc/init.d/nginx start

# 3. 检查状态
ps aux | grep nginx

# 4. 测试网站访问
curl -I http://localhost
```

---

## 🆘 完全无法启动的终极方案

如果以上方法都无效：

```bash
# 1. 备份网站配置
cp -r /www/server/panel/vhost/nginx /root/nginx_backup
cp -r /www/server/panel/vhost/cert /root/cert_backup

# 2. 卸载Nginx
/etc/init.d/nginx stop
rm -rf /www/server/nginx

# 3. 在宝塔面板重新安装
# 软件商店 -> 运行环境 -> Nginx -> 安装

# 4. 恢复网站配置
cp -r /root/nginx_backup/* /www/server/panel/vhost/nginx/
cp -r /root/cert_backup/* /www/server/panel/vhost/cert/

# 5. 重启Nginx
/etc/init.d/nginx start
```

---

## 📞 获取帮助

如果无法自行解决，可以：

1. **宝塔论坛**: https://www.bt.cn/bbs
2. **宝塔官方QQ群**: 搜索"宝塔面板"
3. **阿里云工单**: 如果服务器在阿里云

---

## 🔍 诊断命令汇总

```bash
# 检查Nginx状态
ps aux | grep nginx
/etc/init.d/nginx status

# 检查端口
netstat -tlnp | grep -E ':80|:443'

# 测试配置
/www/server/nginx/sbin/nginx -t

# 查看错误日志
tail -100 /www/wwwlogs/nginx_error.log

# 查看Nginx版本
nginx -v

# 查看已加载模块
nginx -V 2>&1 | tr ' ' '\n'

# 强制重启
pkill -9 nginx
/etc/init.d/nginx start

# 启动所有服务
/etc/init.d/nginx start && /etc/init.d/mysqld start && /etc/init.d/php-fpm-74 start
```

---

## 💡 常见问题解答

### Q: 升级会删除我的网站吗？

**A: 不会。** 宝塔面板的网站配置存储在 `/www/server/panel/vhost/nginx/` 目录，升级Nginx不会删除这些配置。

### Q: 升级后所有网站都打不开怎么办？

**A: 按以下顺序检查：**
1. 执行 `ps aux | grep nginx` 查看Nginx是否运行
2. 执行 `/www/server/nginx/sbin/nginx -t` 测试配置
3. 根据错误提示修复配置文件
4. 重启Nginx

### Q: 能否跳过升级？

**A: 可以。** 如果当前版本稳定且无安全漏洞，可以不升级。但建议定期更新以获得安全修复。

### Q: 升级失败后如何回滚？

**A:**
1. 宝塔面板 -> 软件商店 -> Nginx -> 设置 -> 版本管理
2. 选择旧版本进行切换
3. 如果没有版本管理选项，需要卸载重装旧版本
