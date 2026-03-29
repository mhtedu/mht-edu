# 棉花糖教育平台 - 部署包说明

## 📦 部署包内容

```
mht-edu-deploy/
├── dist-web/              # H5前端（已构建）
├── dist/                  # 小程序前端（已构建）
├── server/                # 后端服务
│   ├── dist/              # 编译后的代码
│   ├── node_modules/      # 依赖包
│   ├── .env.example       # 环境变量示例
│   ├── ecosystem.config.js # PM2配置
│   └── package.json
├── admin/                 # PC管理后台
│   ├── admin.html
│   ├── admin.css
│   ├── admin.js
│   └── login.html
├── database/              # 数据库文件
│   └── mht_edu_all_in_one.sql
├── deploy.sh              # 一键部署脚本
├── nginx.conf.example     # Nginx配置示例
├── .env.example           # 环境变量示例
└── 完整部署指南.md        # 详细文档
```

## 🚀 快速开始

### 方式1: 一键部署（推荐）

```bash
# 1. 上传部署包到服务器
scp mht-edu-deploy.tar.gz root@119.91.193.179:/www/wwwroot/

# 2. 解压
cd /www/wwwroot
tar -xzf mht-edu-deploy.tar.gz
mv mht-edu-deploy mht-edu

# 3. 运行部署脚本
cd mht-edu
chmod +x deploy.sh
./deploy.sh
```

### 方式2: 手动部署

详见 `完整部署指南.md`

## ⚙️ 配置清单

部署前需要配置以下内容：

### 1. 数据库配置
```bash
# 创建数据库（宝塔面板 - 数据库）
数据库名: mht_edu
用户名: mht_edu
密码: [设置强密码]
```

### 2. 环境变量
```bash
# 编辑 server/.env
cp server/.env.example server/.env
nano server/.env

# 必填项:
- DB_PASSWORD (数据库密码)
- WECHAT_APPID (小程序AppID)
- WECHAT_SECRET (小程序Secret)
- JWT_SECRET (建议修改为随机字符串)
```

### 3. Nginx配置
```bash
# 宝塔面板 - 网站 - 设置 - 配置文件
# 复制 nginx.conf.example 内容到配置文件中
```

### 4. SSL证书
```bash
# 宝塔面板 - 网站 - SSL - Let's Encrypt
# 申请免费SSL证书
```

## 📝 默认账户

```
PC管理后台:
地址: https://wx.dajiaopei.com/admin/
用户名: admin
密码: admin123

⚠️ 登录后请立即修改密码！
```

## ✅ 验证部署

```bash
# 1. 检查服务状态
pm2 list

# 2. 测试API
curl https://wx.dajiaopei.com/api/health

# 3. 访问前端
浏览器打开 https://wx.dajiaopei.com

# 4. 访问管理后台
浏览器打开 https://wx.dajiaopei.com/admin/
```

## 🔧 常见问题

### Q1: API返回502
```bash
# 检查后端服务
pm2 logs mht-edu-server

# 重启服务
pm2 restart mht-edu-server
```

### Q2: 数据库连接失败
```bash
# 检查数据库配置
cat server/.env | grep DB_

# 测试数据库连接
mysql -u mht_edu -p mht_edu
```

### Q3: 前端页面空白
```bash
# 检查Nginx配置
nginx -t

# 检查前端文件
ls -la /www/wwwroot/mht-edu/dist-web/

# 重载Nginx
nginx -s reload
```

## 📞 技术支持

- 项目文档: 完整部署指南.md
- 问题反馈: 项目Issues

---

**部署完成后请务必:**
1. ✅ 修改管理员密码
2. ✅ 配置微信小程序域名
3. ✅ 配置SSL证书
4. ✅ 设置定期备份
5. ✅ 检查所有功能是否正常
