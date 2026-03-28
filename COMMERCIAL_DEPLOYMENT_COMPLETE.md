# 棉花糖教育平台 - 商用上线完整指南

## 📋 部署清单

### 1. 域名与SSL
- ✅ 域名：mt.dajiaopei.com
- ✅ SSL证书已申请
- 🔲 需要在宝塔面板配置SSL证书

### 2. 数据库配置
- ✅ MySQL数据库已创建
- 🔲 需要导入站点配置表

### 3. 后端服务
- ✅ 后端服务已部署
- ✅ 运行端口：3002
- 🔲 需要配置PM2守护进程

### 4. 前端部署
- ✅ H5版本已编译
- 🔲 需要上传到服务器
- 🔲 需要配置Nginx

---

## 一、数据库导入（必须先执行）

### 1.1 登录宝塔面板
访问：`http://你的服务器IP:8888`

### 1.2 进入phpMyAdmin
1. 点击左侧菜单【数据库】
2. 点击【phpMyAdmin】
3. 选择你的数据库（通常是 `mht_edu` 或类似名称）

### 1.3 导入配置表
**复制以下SQL并执行：**

```sql
-- 站点配置表
CREATE TABLE `site_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值',
    `config_type` VARCHAR(20) DEFAULT 'text' COMMENT '配置类型',
    `config_group` VARCHAR(50) DEFAULT 'basic' COMMENT '配置分组',
    `label` VARCHAR(100) COMMENT '配置名称',
    `description` VARCHAR(255) COMMENT '配置说明',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_config_key` (`config_key`),
    INDEX `idx_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站点配置表';

-- 默认配置数据
INSERT INTO `site_config` (`config_key`, `config_value`, `config_type`, `config_group`, `label`, `description`, `sort_order`) VALUES
('site_name', '棉花糖教育平台', 'text', 'basic', '站点名称', '网站/小程序名称', 1),
('site_domain', 'https://mt.dajiaopei.com', 'text', 'basic', '网站域名', '不带尾部斜杠', 2),
('site_logo', '', 'image', 'basic', '站点Logo', '建议尺寸: 200x60', 3),
('site_description', '专业的教育信息撮合平台', 'text', 'basic', '站点描述', '用于SEO和分享', 4),
('contact_phone', '', 'text', 'basic', '客服电话', '对外展示的联系电话', 5),
('contact_wechat', '', 'text', 'basic', '客服微信', '对外展示的微信号', 6),
('icp_number', '', 'text', 'basic', 'ICP备案号', '网站ICP备案号', 7),
('wechat_appid', '', 'text', 'wechat', '小程序AppID', '微信小程序AppID', 10),
('wechat_secret', '', 'text', 'wechat', '小程序Secret', '微信小程序Secret', 11),
('wechat_mch_id', '', 'text', 'payment', '商户号', '微信支付商户号', 20),
('wechat_pay_key', '', 'text', 'payment', '支付密钥', '微信支付API密钥(32位)', 21),
('commission_rate_platform', '5', 'number', 'basic', '平台分佣比例(%)', '平台从课时费中抽取的比例', 30),
('commission_rate_referrer', '10', 'number', 'basic', '推荐人分佣比例(%)', '推荐人从课时费中抽取的比例', 31),
('super_member_invite_count', '10', 'number', 'basic', '超级会员邀请人数', '邀请多少人可解锁超级会员', 40);
```

---

## 二、Nginx配置

### 2.1 在宝塔面板配置站点

1. 点击左侧【网站】
2. 点击【添加站点】
3. 填写信息：
   - 域名：`mt.dajiaopei.com`
   - 根目录：`/www/wwwroot/mt.dajiaopei.com`
   - PHP版本：纯静态

### 2.2 配置SSL证书

1. 点击站点名称，选择【SSL】
2. 选择【Let's Encrypt】
3. 勾选域名，点击【申请】
4. 申请成功后，开启【强制HTTPS】

### 2.3 配置Nginx反向代理

点击站点名称，选择【配置文件】，替换为以下内容：

```nginx
# 将HTTP重定向到HTTPS
server {
    listen 80;
    server_name mt.dajiaopei.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name mt.dajiaopei.com;
    
    # SSL证书配置
    ssl_certificate /www/server/panel/vhost/cert/mt.dajiaopei.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/mt.dajiaopei.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 根目录（H5前端）
    root /www/wwwroot/mt.dajiaopei.com;
    index index.html index.htm;
    
    # 客户端上传大小限制
    client_max_body_size 50M;
    
    # H5前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理到后端
    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 日志
    access_log /www/wwwlogs/mt.dajiaopei.com.log;
    error_log /www/wwwlogs/mt.dajiaopei.com.error.log;
}
```

保存后，点击【重载配置】。

---

## 三、文件上传

### 3.1 上传H5前端文件

**方式一：通过宝塔文件管理器**
1. 点击左侧【文件】
2. 进入目录：`/www/wwwroot/mt.dajiaopei.com`
3. 删除默认文件
4. 上传本地 `dist-web` 目录下的所有文件

**方式二：通过FTP/SFTP**
- 主机：你的服务器IP
- 端口：22
- 用户名：root
- 密码：服务器密码
- 远程目录：`/www/wwwroot/mt.dajiaopei.com`

### 3.2 上传后端文件（如果未上传）

后端文件应该已经在上传的压缩包中。如果没有：

1. 将 `server` 目录上传到 `/www/wwwroot/mht-edu-server`
2. 进入后端目录，安装依赖：
```bash
cd /www/wwwroot/mht-edu-server
npm install --production
```

---

## 四、后端服务配置

### 4.1 配置PM2守护进程

在宝塔面板：
1. 点击左侧【软件商店】
2. 搜索并安装【PM2管理器】

### 4.2 启动后端服务

通过SSH终端执行：

```bash
# 进入后端目录
cd /www/wwwroot/mht-edu-server

# 使用PM2启动服务
pm2 start npm --name "mht-edu-api" -- run start:prod

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 4.3 查看服务状态

```bash
pm2 status
pm2 logs mht-edu-api
```

---

## 五、管理后台访问

### 5.1 访问地址

管理后台已集成在前端H5版本中，访问地址：

```
https://mt.dajiaopei.com/#/pages/admin/index
```

### 5.2 管理后台功能

完整的PC端管理后台包含以下模块：

1. **数据概览** - 用户统计、订单统计、营收统计、分佣统计
2. **用户管理** - 家长、教师、机构列表，支持搜索、筛选、状态管理
3. **教师管理** - 教师列表、认证审核、资质查看
4. **机构管理** - 机构列表、入驻审核
5. **订单管理** - 订单列表、状态筛选、详情查看
6. **牛师班管理** - 牛师班列表、创建管理
7. **会员套餐** - 套餐配置、价格设置
8. **活动管理** - 活动列表、创建管理
9. **商品管理** - 商品列表、库存管理
10. **广告位管理** - Banner配置、排序管理
11. **分佣管理** - 分佣记录、批量结算
12. **提现审核** - 提现申请审核
13. **代理商管理** - 代理商列表、佣金配置
14. **系统配置** - 站点名称、Logo、客服信息、ICP备案
15. **支付配置** - 微信小程序配置、支付配置

### 5.3 初始登录

管理后台目前没有登录验证，建议后续添加：
- 管理员账号表
- JWT Token验证
- 权限管理

---

## 六、微信小程序配置

### 6.1 登录微信公众平台

访问：https://mp.weixin.qq.com

### 6.2 配置服务器域名

1. 左侧菜单：开发 -> 开发管理 -> 开发设置
2. 找到【服务器域名】
3. 配置以下域名：

**request合法域名：**
```
https://mt.dajiaopei.com
```

**uploadFile合法域名：**
```
https://mt.dajiaopei.com
```

**downloadFile合法域名：**
```
https://mt.dajiaopei.com
```

### 6.3 配置业务域名（可选）

如果需要在小程序中打开H5页面：

1. 下载校验文件
2. 上传到网站根目录
3. 添加业务域名：`https://mt.dajiaopei.com`

---

## 七、验证部署

### 7.1 检查前端访问

访问：`https://mt.dajiaopei.com`

预期结果：
- 页面正常加载
- 显示棉花糖教育平台首页
- SSL证书有效（浏览器显示锁图标）

### 7.2 检查API接口

访问：`https://mt.dajiaopei.com/api/hello`

预期结果：
- 返回JSON数据
- 或返回404（如果该接口不存在，这是正常的）

### 7.3 检查管理后台

访问：`https://mt.dajiaopei.com/#/pages/admin/index`

预期结果：
- 显示管理后台左侧菜单
- 数据概览正常显示
- 各个模块可以切换

### 7.4 检查后端服务

通过SSH执行：
```bash
pm2 status
curl http://localhost:3002/api/hello
```

预期结果：
- PM2显示服务状态为 `online`
- curl命令返回数据

---

## 八、常见问题

### 8.1 页面空白

**原因：** 路由配置问题或文件未上传完整

**解决：**
1. 检查Nginx配置中的 `try_files` 是否正确
2. 确认所有文件已上传
3. 查看浏览器控制台错误信息

### 8.2 API请求失败

**原因：** 后端服务未启动或端口错误

**解决：**
1. 检查PM2服务状态：`pm2 status`
2. 检查端口：`netstat -tunlp | grep 3002`
3. 查看日志：`pm2 logs mht-edu-api`

### 8.3 数据库连接失败

**原因：** 数据库配置错误

**解决：**
1. 检查 `.env` 文件中的数据库配置
2. 确认数据库已创建
3. 确认配置表已导入

### 8.4 SSL证书问题

**原因：** 证书未正确配置

**解决：**
1. 在宝塔面板重新申请SSL证书
2. 确认证书路径正确
3. 重载Nginx配置

---

## 九、后续优化建议

### 9.1 安全加固
- [ ] 添加管理后台登录验证
- [ ] 配置IP白名单
- [ ] 启用防火墙规则
- [ ] 定期备份数据库

### 9.2 性能优化
- [ ] 启用Gzip压缩
- [ ] 配置CDN加速
- [ ] 优化数据库索引
- [ ] 启用Redis缓存

### 9.3 功能完善
- [ ] 完善管理后台权限系统
- [ ] 添加操作日志记录
- [ ] 配置邮件/短信通知
- [ ] 集成监控告警系统

---

## 十、联系支持

如遇到问题，请提供以下信息：
1. 错误截图
2. 浏览器控制台错误
3. PM2日志（`pm2 logs`）
4. Nginx错误日志（`/www/wwwlogs/mt.dajiaopei.com.error.log`）

---

**部署完成标志：**
- ✅ 前端H5正常访问
- ✅ 管理后台正常显示
- ✅ API接口正常响应
- ✅ SSL证书有效
- ✅ 后端服务稳定运行
