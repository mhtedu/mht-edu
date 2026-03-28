# 文件下载清单

## 📦 已打包文件（推荐下载）

### 1. 完整部署包（714KB）
```
/workspace/projects/mht-edu-deploy-full.tar.gz
```
**包含内容**：
- ✅ 数据库文件：mht_edu_complete.sql
- ✅ 后端源码：server/src/
- ✅ 后端配置：package.json, tsconfig.json, nest-cli.json
- ✅ 微信小程序：dist-weapp/
- ✅ 字节小程序：dist-tt/
- ✅ 备用构建：dist/
- ✅ 部署文档：BAOTA_DEPLOYMENT_GUIDE.md, QUICK_DEPLOY_CHECKLIST.md

---

## 📂 单独下载文件（可选）

### 1️⃣ 数据库文件（必传）
```
/workspace/projects/server/database/mht_edu_complete.sql
```
- **大小**：44KB
- **用途**：数据库初始化
- **包含**：23张表 + 演示数据

### 2️⃣ 后端代码（必传）
```
/workspace/projects/server/src/
/workspace/projects/server/package.json
/workspace/projects/server/tsconfig.json
/workspace/projects/server/nest-cli.json
```

### 3️⃣ 微信小程序代码包
```
/workspace/projects/dist-weapp/
```
- **大小**：1.6MB
- **用途**：上传到微信开发者工具

### 4️⃣ 字节小程序代码包
```
/workspace/projects/dist-tt/
```
- **大小**：1.5MB
- **用途**：上传到抖音开发者工具

### 5️⃣ 部署文档
```
/workspace/projects/BAOTA_DEPLOYMENT_GUIDE.md
/workspace/projects/QUICK_DEPLOY_CHECKLIST.md
```

---

## ⚠️ H5版本说明

当前 `dist-web/` 目录为空，如需H5版本，请在服务器上重新构建：

```bash
# 在服务器上执行
cd /www/wwwroot/mht-edu
pnpm install
pnpm build:web
```

构建产物会输出到 `dist-web/` 目录。

---

## 📥 下载后操作

### 1. 解压文件
```bash
tar -xzf mht-edu-deploy-full.tar.gz
```

### 2. 上传到服务器
```bash
# 使用scp上传
scp -r server/ dist-weapp/ dist-tt/ root@你的IP:/www/wwwroot/mht-edu/

# 或使用宝塔文件管理器上传
```

### 3. 导入数据库
```bash
mysql -u mht_edu -p'mht@2026' mht_edu < server/database/mht_edu_complete.sql
```

### 4. 启动服务
```bash
cd /www/wwwroot/mht-edu/server
pnpm install
pnpm build
pm2 start dist/main.js --name mht-edu-api
```

---

## 🔍 验证文件完整性

下载后，请验证文件完整性：

### 检查数据库文件
```bash
ls -lh server/database/mht_edu_complete.sql
# 应显示约44KB
```

### 检查后端代码
```bash
ls server/src/modules/referral-lock/referral-lock.service.ts
# 应显示文件存在
```

### 检查小程序代码
```bash
ls dist-weapp/app.js
# 应显示文件存在
```

---

## 📞 如需帮助

如果下载或部署遇到问题，请提供：
1. 文件下载是否完整
2. 解压是否成功
3. 上传到服务器的错误信息
