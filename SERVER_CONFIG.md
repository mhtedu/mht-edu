# 棉花糖教育平台 - 服务器配置记录

> ⚠️ **重要**：此文件记录服务器配置，请勿删除。每次修改服务器配置后请同步更新。

## 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器IP | 119.91.193.179 |
| SSH端口 | 22 |
| 宝塔面板 | http://119.91.193.179:8888/tencentcloud |
| 宝塔用户 | 02aec246 |
| 宝塔密码 | 779363371f3c |

---

## 目录结构（本地与服务器一致）

### 本地目录
```
/workspace/projects/              # 项目根目录
├── src/                         # 前端源码 (253个文件)
├── server/                      # 后端服务
│   ├── src/                     # 后端源码 (138个文件)
│   └── .env                     # 后端环境配置
├── config/                      # Taro构建配置
├── dist-web/                    # H5编译产物
├── admin/                       # 管理后台
├── .env.local                   # 本地开发环境变量
├── .env.production              # 生产环境变量
└── deploy/                      # 部署脚本
    └── sync-to-server.sh        # 一键同步脚本
```

### 服务器目录
```
/www/wwwroot/mht-edu/            # 项目根目录（与本地结构一致）
├── src/                         # 前端源码
├── server/                      # 后端服务
│   ├── src/                     # 后端源码
│   ├── dist/                    # 后端编译产物
│   └── .env                     # 后端环境配置
├── config/                      # Taro构建配置
├── dist-web/                    # H5编译产物
├── admin/dist/                  # 管理后台编译产物
├── .env.production              # 生产环境变量
└── SERVER_CONFIG.md             # 本配置文件副本
```

---

## 环境变量配置

| 文件 | 用途 | PROJECT_DOMAIN |
|------|------|----------------|
| `.env.local` | 本地开发 | `http://localhost:3000` |
| `.env.production` | 生产环境 | `https://wx.dajiaopei.com` |
| `server/.env` | 后端配置 | 数据库连接等 |

### server/.env 内容
```env
NODE_ENV=production
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=mht_edu
DB_PASSWORD=mht2026edu
DB_DATABASE=mht_edu
JWT_SECRET=mht-edu-jwt-secret-2026-change-this-in-production
UPLOAD_DIR=/www/wwwroot/mht-edu/uploads
LOG_DIR=/www/wwwroot/mht-edu/logs
```

> ⚠️ **注意**：`DB_HOST` 必须为 `127.0.0.1`，因为 MySQL 用户权限是 `mht_edu@localhost`

---

## 服务配置

| 服务 | 端口 | 状态 |
|------|------|------|
| Nginx | 80, 443 | 运行中 |
| Node.js API | 3002 | PM2管理 |
| MySQL | 3306 | 运行中 |

---

## 一键同步命令

### 完整同步（推荐）
```bash
./deploy/sync-to-server.sh --full
```

### 手动同步步骤
```bash
# 1. 同步前端源码
scp -i ~/.ssh/server_key -r /workspace/projects/src/* root@119.91.193.179:/www/wwwroot/mht-edu/src/

# 2. 同步后端源码
scp -i ~/.ssh/server_key -r /workspace/projects/server/src/* root@119.91.193.179:/www/wwwroot/mht-edu/server/src/

# 3. 同步配置文件
scp -i ~/.ssh/server_key -r /workspace/projects/config/* root@119.91.193.179:/www/wwwroot/mht-edu/config/
scp -i ~/.ssh/server_key /workspace/projects/.env.production root@119.91.193.179:/www/wwwroot/mht-edu/.env.production
scp -i ~/.ssh/server_key /workspace/projects/server/.env root@119.91.193.179:/www/wwwroot/mht-edu/server/.env

# 4. 同步前端编译产物
scp -i ~/.ssh/server_key -r /workspace/projects/dist-web/* root@119.91.193.179:/www/wwwroot/mht-edu/dist-web/

# 5. 重启后端服务
ssh -i ~/.ssh/server_key root@119.91.193.179 "pm2 restart mht-edu-api"
```

---

## 访问地址

| 服务 | URL |
|------|-----|
| H5首页 | https://wx.dajiaopei.com/ |
| 商城 | https://wx.dajiaopei.com/#/pages/mall/index |
| 活动中心 | https://wx.dajiaopei.com/#/pages/activities/index |
| 管理后台 | https://wx.dajiaopei.com/admin/ |
| API接口 | https://wx.dajiaopei.com/api/hello |

---

## 开发流程

1. **本地开发**
   ```bash
   pnpm dev           # 启动开发环境
   pnpm build:web     # 构建H5前端（生产环境）
   pnpm validate      # 代码检查
   ```

2. **同步到服务器**
   ```bash
   ./deploy/sync-to-server.sh --full
   ```

3. **验证线上服务**
   ```bash
   curl https://wx.dajiaopei.com/api/hello
   ```

---

## Nginx配置

路径: `/www/server/panel/vhost/nginx/wx.dajiaopei.com.conf`

关键配置：
- H5前端: `root /www/wwwroot/mht-edu/dist-web;`
- 管理后台: `alias /www/wwwroot/mht-edu/admin/dist;`
- API代理: `proxy_pass http://127.0.0.1:3002;`
