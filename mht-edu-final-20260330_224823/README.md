# 棉花糖教育平台部署包

## 目录结构
- `server/` - 后端服务代码
- `web/` - 前端静态文件
- `admin/` - 管理后台
- `database/` - 数据库脚本

## 部署步骤

### 1. 上传文件
```bash
scp -r server web admin database ecosystem.config.js root@119.91.193.179:/www/wwwroot/mht-edu/
```

### 2. 安装依赖
```bash
cd /www/wwwroot/mht-edu/server
pnpm install --prod
```

### 3. 运行数据库迁移
```bash
mysql -u mht_edu -p'mht2026edu' mht_edu < database/migrate.sql
```

### 4. 重启服务
```bash
pm2 restart mht-edu-server || pm2 start /www/wwwroot/mht-edu/ecosystem.config.js
pm2 save
```

## 访问地址
- 前端: https://wx.dajiaopei.com/
- 管理后台: https://wx.dajiaopei.com/admin/
- API: https://wx.dajiaopei.com/api/

## 管理员账号
- 用户名: admin
- 密码: admin123
