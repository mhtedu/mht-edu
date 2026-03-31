# 棉花糖教育平台 - 更新包

## 本次更新内容

1. **短信服务修复**
   - 更新阿里云短信SDK为 `@alicloud/dysmsapi20170525`
   - 修复短信发送API调用方式

2. **管理后台**
   - 新增短信配置页面
   - 支持配置阿里云AccessKey、签名、模板

## 部署步骤

```bash
# 1. 上传整个 release-package 目录到服务器 /root/

# 2. 进入目录执行部署脚本
cd /root/release-package
bash deploy.sh
```

## 手动部署（如果脚本失败）

```bash
# 备份
cp -r /www/wwwroot/mht-edu /www/wwwroot/mht-edu.bak

# 更新后端
rm -rf /www/wwwroot/mht-edu/server/dist
cp -r server-dist /www/wwwroot/mht-edu/server/dist
cp package.json /www/wwwroot/mht-edu/server/

# 更新管理后台
rm -rf /www/wwwroot/mht-edu/admin
cp -r admin /www/wwwroot/mht-edu/

# 安装依赖
cd /www/wwwroot/mht-edu/server
pnpm install

# 重启服务
pm2 restart mht-edu-server
```

## 注意事项

- **dist-web 目录不会更新**，保留现有H5前端
- 部署前会自动备份到 `/www/wwwroot/mht-edu-backup-时间戳`
