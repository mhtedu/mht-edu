# TabBar 修改部署说明

## 修改内容
将 H5 底部 TabBar 的"商城"改为"活动"

**修改文件**: `src/app.config.ts`

**修改前**:
```typescript
{
  pagePath: 'pages/mall/index',
  text: '商城',
  iconPath: './assets/tabbar/mall.png',
  selectedIconPath: './assets/tabbar/mall-active.png',
}
```

**修改后**:
```typescript
{
  pagePath: 'pages/activities/index',
  text: '活动',
  iconPath: './assets/tabbar/square.png',
  selectedIconPath: './assets/tabbar/square-active.png',
}
```

## 部署包位置
```
/workspace/projects/deploy/packages/mht-edu-dist-web-20260404_184550.tar.gz
```

## 服务器目录结构（重要！）
```
/www/wwwroot/mht-edu/
├── dist-web/              # H5 前端文件（正确目录）
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── static/
├── admin/                 # 管理后台
│   └── dist/
├── server/                # 后端服务
└── uploads/               # 上传文件
```

## 部署方式

### 方式1：宝塔面板上传（推荐）

1. 下载部署包 `mht-edu-dist-web-20260404_184550.tar.gz`

2. 登录宝塔面板

3. 进入 文件 → `/www/wwwroot/mht-edu/`

4. 备份现有 dist-web 目录：
   ```bash
   mv dist-web dist-web-backup-$(date +%Y%m%d%H%M%S)
   ```

5. 上传部署包到 `/www/wwwroot/mht-edu/`

6. 在宝塔终端执行：
   ```bash
   cd /www/wwwroot/mht-edu
   tar -xzvf mht-edu-dist-web-20260404_184550.tar.gz
   ```

7. 验证文件：
   ```bash
   ls -la dist-web/
   ```

### 方式2：SSH 命令上传

```bash
# 本地执行（需要SSH密码或密钥）
scp /workspace/projects/deploy/packages/mht-edu-dist-web-20260404_184550.tar.gz root@119.91.193.179:/www/wwwroot/mht-edu/

# SSH 登录服务器
ssh root@119.91.193.179

# 进入目录
cd /www/wwwroot/mht-edu

# 备份旧版本
mv dist-web dist-web-backup-$(date +%Y%m%d%H%M%S)

# 解压新版本
tar -xzvf mht-edu-dist-web-20260404_184550.tar.gz

# 验证
ls -la dist-web/
```

### 方式3：在服务器上重新构建

如果服务器上有源代码：

```bash
# SSH 登录服务器
ssh root@119.91.193.179

# 进入项目目录
cd /www/wwwroot/mht-edu

# 更新源代码（如果是 Git 仓库）
# git pull

# 或者手动修改 app.config.ts
# 将商城改为活动

# 重新构建
pnpm build:web

# 或者
npm run build:web
```

## 验证部署

访问 https://wx.dajiaopei.com 检查底部 TabBar

应该显示：
- 首页
- 活动（而不是商城）
- 消息
- 我的

## 回滚（如有问题）

```bash
cd /www/wwwroot/mht-edu
rm -rf dist-web
mv dist-web-backup-XXXXXXXXXX dist-web
```

## 注意事项

1. **目录位置**: 必须部署到 `/www/wwwroot/mht-edu/dist-web/`，不是 `/www/wwwroot/mht-edu/dist/`

2. **备份**: 部署前务必备份现有目录

3. **清理缓存**: 部署后建议清理浏览器缓存或使用无痕模式访问

4. **CDN缓存**: 如果使用了CDN，需要刷新缓存
