# 服务器部署指南

## 方式1：手动部署（推荐用于调试）

### 1. 在本地/服务器上克隆仓库
```bash
git clone <your-repo-url> /tmp/mht-edu-deploy
cd /tmp/mht-edu-deploy
git checkout main
```

### 2. 同步后端代码到服务器
```bash
# 备份现有代码
cp -r /www/wwwroot/mht-edu/server /www/wwwroot/mht-edu/server.bak.$(date +%Y%m%d)

# 复制新代码
cp -r /tmp/mht-edu-deploy/server/* /www/wwwroot/mht-edu/server/
cp -r /tmp/mht-edu-deploy/deploy_package/server/* /www/wwwroot/mht-edu/server/
```

### 3. 安装依赖并构建
```bash
cd /www/wwwroot/mht-edu/server
npm install
npm run build
```

### 4. 重启服务
```bash
pm2 restart all
# 或
pm2 restart nest-server
```

## 方式2：Git Pull（如果服务器已有git仓库）

```bash
cd /www/wwwroot/mht-edu/server
git pull origin main
npm run build
pm2 restart all
```

## 验证部署

```bash
# 测试API
curl "https://wx.dajiaopei.com/api/teacher-profile/nearby?page=1&pageSize=2"

# 查看日志
pm2 logs --lines 50
```

## 回滚

```bash
pm2 restart all
# 如果失败
cp -r /www/wwwroot/mht-edu/server.bak.$(date +%Y%m%d)/* /www/wwwroot/mht-edu/server/
npm run build
pm2 restart all
```
