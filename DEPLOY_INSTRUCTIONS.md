# 后端代码同步到服务器

## 步骤1：下载沙箱代码

在沙箱环境中导出代码（你需要在本地执行这个步骤）：

```bash
# 方式A：如果有文件下载功能
# 直接下载 /workspace/projects/server/ 和 /workspace/projects/deploy_package/server/ 目录

# 方式B：查看关键差异文件
# 线上后端缺少 teacher-profile/nearby 接口的完整字段返回
```

## 步骤2：SSH到服务器部署

```bash
# 登录服务器
ssh root@119.91.193.179

# 备份
cp -r /www/wwwroot/mht-edu/server /www/wwwroot/mht-edu/server.bak.$(date +%Y%m%d)

# 上传代码后，解压覆盖
# cd /www/wwwroot/mht-edu/server

# 安装依赖
cd /www/wwwroot/mht-edu/server
npm install

# 构建
npm run build

# 重启
pm2 restart all

# 验证
curl "https://wx.dajiaopei.com/api/teacher-profile/nearby?page=1&pageSize=2"
```

## 关键修改说明

修复的问题：`/api/teacher-profile/nearby` 接口返回的数据缺少 `id`, `name`, `avatar` 字段

修改的文件：
- `server/src/modules/teacher-profile/teacher-profile.service.ts` 第119-132行
