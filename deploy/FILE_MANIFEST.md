# 棉花糖教育平台 - 完整文件清单

## 📦 部署包下载路径

**打包文件**: `/workspace/projects/mht-edu-deploy-20260329_085154.tar.gz`

---

## 📋 文件映射表

### 1. 前端H5文件（上传到 `/www/wwwroot/mht-edu/dist/`）

| 本地路径 | 服务器路径 | 说明 |
|---------|-----------|------|
| `dist-web/index.html` | `/www/wwwroot/mht-edu/dist/index.html` | 入口文件 |
| `dist-web/js/*` | `/www/wwwroot/mht-edu/dist/js/` | 编译后的JS文件 |
| `dist-web/css/*` | `/www/wwwroot/mht-edu/dist/css/` | 编译后的CSS文件 |
| `dist-web/static/*` | `/www/wwwroot/mht-edu/dist/static/` | 静态资源（图片等） |

### 2. 管理后台文件（上传到 `/www/wwwroot/mht-edu/dist/admin/`）

| 本地路径 | 服务器路径 | 说明 |
|---------|-----------|------|
| `admin/login.html` | `/www/wwwroot/mht-edu/dist/admin/login.html` | 登录页面 |
| `admin/admin.html` | `/www/wwwroot/mht-edu/dist/admin/admin.html` | 后台首页 |
| `admin/admin.css` | `/www/wwwroot/mht-edu/dist/admin/admin.css` | 后台样式 |
| `admin/admin.js` | `/www/wwwroot/mht-edu/dist/admin/admin.js` | 后台逻辑 |

### 3. 后端文件（上传到 `/www/wwwroot/mht-edu/server/dist/`）

| 本地路径 | 服务器路径 | 说明 |
|---------|-----------|------|
| `server_dist/*` | `/www/wwwroot/mht-edu/server/dist/` | 后端编译文件 |

### 4. 数据库脚本（在phpMyAdmin中执行）

| 文件名 | 执行顺序 | 说明 |
|-------|---------|------|
| `database/mht_edu_complete.sql` | 1 | 完整数据库结构（首次部署） |
| `database/site_config_complete.sql` | 2 | 站点配置表（必须执行） |
| `database/admin_system.sql` | 3 | 管理员系统表 |
| `database/mock_data.sql` | 4 | 模拟数据（可选） |

---

## 🚀 部署步骤

### 方法一：使用打包文件（推荐）

```bash
# 1. 上传打包文件
scp /workspace/projects/mht-edu-deploy-20260329_085154.tar.gz root@mt.dajiaopei.com:/tmp/

# 2. SSH登录服务器
ssh root@mt.dajiaopei.com

# 3. 解压文件
cd /www/wwwroot/mht-edu
tar -xzvf /tmp/mht-edu-deploy-20260329_085154.tar.gz

# 4. 移动管理后台文件
mv dist-web/* dist/
mv admin/* dist/admin/
mv server_dist/* server/dist/

# 5. 重启服务
pm2 restart mht-edu
```

### 方法二：单独上传文件

```bash
# 前端文件
scp -r dist-web/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/

# 管理后台
ssh root@mt.dajiaopei.com "mkdir -p /www/wwwroot/mht-edu/dist/admin"
scp admin/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/admin/

# 后端文件
scp -r server_dist/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/server/dist/
```

---

## 🗄️ 数据库部署

### 步骤1：登录宝塔面板

访问：`https://你的宝塔面板地址`

### 步骤2：进入phpMyAdmin

数据库 → 找到 `mht_edu` → 点击【管理】

### 步骤3：执行SQL脚本

1. 点击顶部【导入】标签
2. 选择SQL文件
3. 按顺序执行：
   - `mht_edu_complete.sql`（如果是新数据库）
   - `site_config_complete.sql`（配置表，必须）
   - `admin_system.sql`（管理员表）
   - `mock_data.sql`（模拟数据，可选）

---

## ⚙️ 配置项说明

### 后端服务配置

后端服务运行在 **3002端口**，主要配置文件：

- `server/dist/main.js` - 入口文件
- `server/.env` - 环境变量（数据库连接等）

### 管理后台配置

登录管理后台后，可在【系统配置】中修改以下参数：

#### 微信小程序配置
| 配置项 | 说明 | 示例 |
|-------|------|------|
| `wechat_appid` | 小程序AppID | wx1234567890 |
| `wechat_secret` | 小程序AppSecret | abc123... |

#### 微信支付配置
| 配置项 | 说明 | 示例 |
|-------|------|------|
| `wechat_pay_mch_id` | 商户号 | 1234567890 |
| `wechat_pay_api_key` | API密钥(V2) | 32位密钥 |
| `wechat_pay_api_v3_key` | APIv3密钥 | 32位密钥 |

#### 短信配置（阿里云）
| 配置项 | 说明 | 示例 |
|-------|------|------|
| `sms_access_key_id` | AccessKeyId | LTAI... |
| `sms_access_key_secret` | AccessKeySecret | abc123... |
| `sms_sign_name` | 短信签名 | 棉花糖教育 |

#### 地图配置（腾讯地图）
| 配置项 | 说明 | 示例 |
|-------|------|------|
| `map_key` | 地图API Key | ABCD-1234... |
| `map_secret_key` | 地图Secret Key | abc123... |

---

## 🔐 默认管理员账号

- **登录地址**: https://mt.dajiaopei.com/admin/login.html
- **用户名**: admin
- **密码**: password

⚠️ **首次登录后请立即修改密码！**

---

## 📱 访问地址

| 服务 | 地址 |
|------|------|
| 前端H5 | https://mt.dajiaopei.com |
| 管理后台 | https://mt.dajiaopei.com/admin/ |
| 后端API | https://mt.dajiaopei.com/api/ |
| 健康检查 | https://mt.dajiaopei.com/api/health |

---

## 🛠️ 常用命令

```bash
# 查看后端服务状态
pm2 status mht-edu

# 查看日志
pm2 logs mht-edu

# 重启服务
pm2 restart mht-edu

# 查看端口占用
netstat -tlnp | grep 3002
```

---

## 📝 更新记录

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2024-03-29 | v1.0.0 | 完整站点配置系统，支持12个配置分组 |
| 2024-03-29 | v1.0.0 | 城市API适配，前端定位功能 |
| 2024-03-29 | v1.0.0 | 独立PC管理后台，权限管理系统 |
