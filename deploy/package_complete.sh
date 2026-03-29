#!/bin/bash

# =====================================================
# 棉花糖教育平台 - 完整部署包生成脚本
# 生成所有需要上传到服务器的文件
# =====================================================

echo "🚀 开始生成部署包..."

# 设置工作目录
PROJECT_DIR="/workspace/projects"
DEPLOY_DIR="${PROJECT_DIR}/deploy_package"
DATE=$(date +%Y%m%d_%H%M%S)

# 清理旧的部署包
rm -rf ${DEPLOY_DIR}
mkdir -p ${DEPLOY_DIR}

echo "📦 复制前端编译文件..."
# 前端H5编译文件
cp -r ${PROJECT_DIR}/dist-web ${DEPLOY_DIR}/
echo "  ✅ dist-web/"

echo "📦 复制管理后台文件..."
# 管理后台文件
mkdir -p ${DEPLOY_DIR}/admin
cp ${PROJECT_DIR}/public/admin.html ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/admin.css ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/admin.js ${DEPLOY_DIR}/admin/
cp ${PROJECT_DIR}/public/login.html ${DEPLOY_DIR}/admin/
echo "  ✅ admin/"

echo "📦 复制后端编译文件..."
# 后端编译文件
cp -r ${PROJECT_DIR}/server/dist ${DEPLOY_DIR}/server_dist
echo "  ✅ server_dist/"

echo "📦 复制数据库脚本..."
# 数据库脚本
mkdir -p ${DEPLOY_DIR}/database
cp ${PROJECT_DIR}/server/database/site_config_complete.sql ${DEPLOY_DIR}/database/
cp ${PROJECT_DIR}/server/database/mock_data.sql ${DEPLOY_DIR}/database/
cp ${PROJECT_DIR}/server/database/admin_system.sql ${DEPLOY_DIR}/database/
cp ${PROJECT_DIR}/server/database/mht_edu_complete.sql ${DEPLOY_DIR}/database/
echo "  ✅ database/"

echo "📦 复制源代码（供参考）..."
# 前端源码（可选）
mkdir -p ${DEPLOY_DIR}/src
cp -r ${PROJECT_DIR}/src/pages ${DEPLOY_DIR}/src/
cp -r ${PROJECT_DIR}/src/components ${DEPLOY_DIR}/src/
echo "  ✅ src/"

echo "📄 生成部署说明..."
cat > ${DEPLOY_DIR}/DEPLOY_GUIDE.md << 'EOF'
# 棉花糖教育平台 - 部署指南

## 文件清单

```
deploy_package/
├── dist-web/              # 前端H5编译文件 → 上传到 /www/wwwroot/mht-edu/dist/
├── admin/                 # 管理后台文件 → 上传到 /www/wwwroot/mht-edu/dist/
│   ├── admin.html
│   ├── admin.css
│   ├── admin.js
│   └── login.html
├── server_dist/           # 后端编译文件 → 上传到 /www/wwwroot/mht-edu/server/dist/
├── database/              # 数据库脚本 → 在phpMyAdmin中执行
│   ├── site_config_complete.sql  # 配置表（首次部署）
│   ├── mock_data.sql             # 模拟数据
│   ├── admin_system.sql          # 管理员系统
│   └── mht_edu_complete.sql      # 完整数据库结构
├── src/                   # 源代码（供参考）
└── DEPLOY_GUIDE.md        # 本文件
```

## 部署步骤

### 步骤1：上传文件

```bash
# 上传前端文件
scp -r dist-web/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/

# 上传管理后台文件
scp admin/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/dist/

# 上传后端文件
scp -r server_dist/* root@mt.dajiaopei.com:/www/wwwroot/mht-edu/server/dist/
```

### 步骤2：导入数据库

1. 登录宝塔面板 → 数据库 → 点击 mht_edu 的【管理】
2. 进入 phpMyAdmin
3. 按顺序执行以下SQL文件：
   - `mht_edu_complete.sql`（如果是新数据库）
   - `site_config_complete.sql`（配置表）
   - `admin_system.sql`（管理员表）
   - `mock_data.sql`（模拟数据）

### 步骤3：配置参数

在管理后台修改以下配置：
- 系统配置 → 微信小程序AppID/AppSecret
- 支付配置 → 微信支付商户号/密钥
- 短信配置 → 阿里云短信配置
- 地图配置 → 腾讯地图Key

### 步骤4：重启服务

```bash
# SSH登录服务器
pm2 restart mht-edu
```

## 访问地址

- 前端H5：https://mt.dajiaopei.com
- 管理后台：https://mt.dajiaopei.com/admin/
- 后端API：https://mt.dajiaopei.com/api/

## 默认管理员账号

- 用户名：admin
- 密码：password

⚠️ 请在首次登录后立即修改密码！

## 配置项说明

### 微信小程序配置
- wechat_appid: 小程序AppID
- wechat_secret: 小程序AppSecret

### 微信支付配置
- wechat_pay_mch_id: 商户号
- wechat_pay_api_key: API密钥(V2)
- wechat_pay_api_v3_key: APIv3密钥

### 短信配置（阿里云）
- sms_access_key_id: AccessKeyId
- sms_access_key_secret: AccessKeySecret
- sms_sign_name: 短信签名

### 地图配置（腾讯地图）
- map_key: 地图API Key
- map_secret_key: 地图Secret Key

## 技术支持

如有问题，请联系开发团队。
EOF

echo "📦 打包部署文件..."
cd ${PROJECT_DIR}
tar -czvf mht-edu-deploy-${DATE}.tar.gz -C ${DEPLOY_DIR} .

echo ""
echo "✅ 部署包生成完成！"
echo ""
echo "📁 文件位置："
echo "   ${PROJECT_DIR}/mht-edu-deploy-${DATE}.tar.gz"
echo ""
echo "📋 部署目录内容："
ls -la ${DEPLOY_DIR}/

echo ""
echo "🌐 上传命令："
echo "   scp mht-edu-deploy-${DATE}.tar.gz root@mt.dajiaopei.com:/tmp/"
echo "   # SSH登录后解压："
echo "   cd /www/wwwroot/mht-edu && tar -xzvf /tmp/mht-edu-deploy-${DATE}.tar.gz"
