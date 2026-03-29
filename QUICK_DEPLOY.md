# 棉花糖教育平台 - 快速部署指南

## 当前状态

| 项目 | 状态 |
|------|------|
| 数据库 | ✅ 已导入（42张表） |
| 数据库用户 | ✅ mht_edu / mht2026edu |
| 部署包 | ✅ mht-edu-deploy-20260329_110827.tar.gz |

---

## 一、下载部署包

从沙箱环境下载：
```
mht-edu-deploy-20260329_110827.tar.gz
```

---

## 二、上传到服务器

```bash
# 创建目录
mkdir -p /www/wwwroot/mht-edu

# 解压（假设您上传到了 /root/ 目录）
cd /www/wwwroot/mht-edu
tar -xzf /root/mht-edu-deploy-20260329_110827.tar.gz --strip-components=1
```

---

## 三、配置后端

```bash
# 检查配置
cat /www/wwwroot/mht-edu/server/.env

# 如需修改微信配置
vi /www/wwwroot/mht-edu/server/.env
```

配置说明：
- 数据库已配置为 `mht_edu / mht2026edu`
- 微信 AppID 和支付配置需要填写真实信息

---

## 四、启动服务

```bash
cd /www/wwwroot/mht-edu/server

# 安装依赖（如果 node_modules 不完整）
npm install --production

# 使用 PM2 启动
pm2 start dist/main.js --name mht-edu-server

# 查看状态
pm2 status

# 查看日志
pm2 logs mht-edu-server
```

---

## 五、配置 Nginx

在宝塔面板中：

1. 网站 → 添加站点
2. 域名：`mt.dajiaopei.com`
3. 根目录：`/www/wwwroot/mht-edu`
4. 点击站点 → 反向代理 → 添加反向代理：
   - 目标URL：`http://127.0.0.1:3002`
   - 发送域名：`$host`

---

## 六、验证部署

```bash
# 测试后端 API
curl http://localhost:3002/api/health

# 测试数据库连接
mysql -u mht_edu -pmht2026edu -e "SELECT COUNT(*) as user_count FROM mht_edu.users;"
```

---

## 目录结构

```
/www/wwwroot/mht-edu/
├── server/              # NestJS 后端
│   ├── dist/            # 编译产物
│   ├── node_modules/    # 依赖
│   ├── package.json
│   └── .env             # 配置文件
├── admin/               # PC 管理后台
├── index.html           # 小程序 H5 入口
├── js/
├── css/
└── static/
```

---

## 默认账号

| 类型 | 用户名 | 密码 |
|------|--------|------|
| 管理后台 | admin | admin123 |

**⚠️ 登录后立即修改密码！**

---

## 端口说明

| 服务 | 端口 |
|------|------|
| 后端 API | 3002 |
| MySQL | 3306 |
| HTTP | 80 |
| HTTPS | 443 |

---

## 常见问题

### Q: 启动报错 "Cannot find module"
```bash
cd /www/wwwroot/mht-edu/server
npm install --production
```

### Q: 数据库连接失败
检查 .env 配置是否正确：
```bash
cat /www/wwwroot/mht-edu/server/.env
```

### Q: 端口被占用
```bash
# 查看端口占用
lsof -i:3002
# 杀死进程
kill -9 <PID>
```
