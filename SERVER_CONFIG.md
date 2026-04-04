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

## 目录结构

### 服务器目录（统一）
```
/www/wwwroot/mht-edu/          # 项目根目录
├── dist-web/                  # H5前端编译产物
├── dist/                      # 小程序编译产物
├── admin/dist/                # 管理后台编译产物
├── server/                    # 后端服务
│   ├── dist/                  # 后端编译产物
│   ├── src/                   # 后端源码
│   └── .env                   # 环境配置
├── src/                       # 前端源码
├── config/                    # Taro配置
└── node_modules/              # 依赖
```

### 本地目录
```
/workspace/projects/           # 项目根目录（与服务器结构一致）
```

## 服务配置

| 服务 | 端口 | 状态 |
|------|------|------|
| Nginx | 80, 443 | 运行中 |
| Node.js API | 3002 | PM2管理 |
| MySQL | 3306 | 运行中 |

## 数据库配置

| 项目 | 值 |
|------|-----|
| 数据库地址 | 127.0.0.1:3306（服务器本地连接） |
| 数据库名 | mht_edu |
| 用户名 | mht_edu |
| 密码 | mht2026edu |

> ⚠️ 注意：服务器上的 `.env` 文件中 `DB_HOST` 必须设置为 `127.0.0.1`，因为 MySQL 用户权限是 `mht_edu@localhost`

### ⚠️ MySQL密码设置（首次部署必做）

1. 登录宝塔面板：http://119.91.193.179:8888/tencentcloud
2. 进入【数据库】菜单
3. 点击【添加数据库】，创建数据库 `mht_edu`
4. 设置用户名 `mht_edu`，密码 `mht2026edu`
5. 或者修改现有用户的密码为 `mht2026edu`
6. 重启PM2服务：`ssh root@服务器 "pm2 restart mht-edu-api"`

## 域名配置

| 域名 | 指向 | SSL |
|------|------|-----|
| wx.dajiaopei.com | 服务器IP | 需配置 |

## Nginx配置文件
路径: `/www/server/panel/vhost/nginx/wx.dajiaopei.com.conf`

## 一键同步命令

### 快速同步（推荐）
```bash
# 在项目根目录执行
./deploy/sync-to-server.sh
```

### 手动同步

#### 同步前端代码
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  -e "ssh -i ~/.ssh/server_key" \
  /workspace/projects/src/ root@119.91.193.179:/www/wwwroot/mht-edu/src/
```

#### 同步后端代码
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  -e "ssh -i ~/.ssh/server_key" \
  /workspace/projects/server/src/ root@119.91.193.179:/www/wwwroot/mht-edu/server/src/
```

#### 同步并重启后端
```bash
rsync -avz --exclude 'node_modules' \
  -e "ssh -i ~/.ssh/server_key" \
  /workspace/projects/server/ root@119.91.193.179:/www/wwwroot/mht-edu/server/
ssh -i ~/.ssh/server_key root@119.91.193.179 "cd /www/wwwroot/mht-edu/server && npm run build && pm2 restart mht-edu-api"
```

## 访问地址

| 服务 | URL |
|------|-----|
| H5前端 | https://wx.dajiaopei.com/ |
| 管理后台 | https://wx.dajiaopei.com/admin/ |
| API接口 | https://wx.dajiaopei.com/api/ |

## 开发流程

### 本地开发 → 测试 → 部署

1. **本地开发**
   ```bash
   pnpm dev           # 启动开发环境（前端5000端口 + 后端3000端口）
   pnpm build         # 构建所有产物
   pnpm validate      # 代码检查
   ```

2. **本地测试**
   - 访问 http://localhost:5000 测试H5前端
   - 访问 http://localhost:3000/api/hello 测试后端API

3. **同步到服务器**
   ```bash
   ./deploy/sync-to-server.sh    # 一键同步
   ```

4. **验证线上服务**
   ```bash
   curl https://wx.dajiaopei.com/api/hello
   ```
