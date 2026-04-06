# 代码同步指南

## 需要同步的文件

### 1. 后端API代码
- **本地路径**: `server/src/modules/admin/admin.controller.ts`
- **服务器路径**: `/www/wwwroot/mht-edu/server/src/modules/admin/admin.controller.ts`

### 2. PC后台前端
- **本地路径**: `deploy_package/admin/admin.js`
- **服务器路径**: `/www/wwwroot/mht-edu/admin/admin.js`

## 同步步骤

### 方法一：手动上传

```bash
# 1. 登录服务器
ssh root@119.91.193.179

# 2. 备份原文件
cp /www/wwwroot/mht-edu/server/src/modules/admin/admin.controller.ts /www/wwwroot/mht-edu/server/src/modules/admin/admin.controller.ts.bak
cp /www/wwwroot/mht-edu/admin/admin.js /www/wwwroot/mht-edu/admin/admin.js.bak

# 3. 在本地执行上传（需要本地终端有ssh）
scp server/src/modules/admin/admin.controller.ts root@119.91.193.179:/www/wwwroot/mht-edu/server/src/modules/admin/
scp deploy_package/admin/admin.js root@119.91.193.179:/www/wwwroot/mht-edu/admin/
```

### 方法二：宝塔面板上传

1. 登录宝塔面板
2. 进入文件管理
3. 导航到对应目录
4. 上传文件

### 方法三：使用FTP工具

使用 FileZilla 或其他 FTP 工具连接服务器，上传文件。

## 同步后操作

```bash
# SSH 登录服务器后执行

# 1. 进入项目目录
cd /www/wwwroot/mht-edu

# 2. 重新编译后端
cd server
pnpm build
# 或
npm run build

# 3. 重启后端服务
pm2 restart mht-edu-server

# 4. 检查服务状态
pm2 status

# 5. 查看日志确认无报错
pm2 logs mht-edu-server --lines 50
```

## 验证

### 验证后端API

```bash
# 测试获取微信支付配置接口
curl http://localhost:3000/api/admin/payment/wechat

# 应返回
# {"appId":"","mchId":"","apiV2Key":"","apiV3Key":"","serialNo":"","privateKey":"","notifyUrl":""}
```

### 验证PC后台

1. 访问 https://wx.dajiaopei.com/admin/
2. 登录后点击左侧菜单「支付配置」
3. 确认页面显示新的微信支付配置表单

## 文件变更说明

### 后端 (admin.controller.ts)
- 新增 GET `/api/admin/payment/wechat` 获取微信支付配置
- 新增 POST `/api/admin/payment/wechat` 保存微信支付配置  
- 新增 POST `/api/admin/payment/wechat/upload-key` 上传私钥文件

### 前端 (admin.js)
- 重新设计微信支付配置页面
- 支持 APIv2/APIv3 密钥配置
- 支持私钥文件上传
- 添加安全提示

## 服务器信息

- **IP**: 119.91.193.179
- **密码**: mht@2026
- **PC后台**: /www/wwwroot/mht-edu/admin/
- **后端服务**: /www/wwwroot/mht-edu/server/
