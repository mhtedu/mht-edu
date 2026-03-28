# 棉花糖教育平台 - 部署文件说明

## 📦 最新部署包内容

### 文件结构
```
mianhuatang-final-deploy.tar.gz
├── dist-web/                    # H5前端文件（上传到网站根目录）
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── assets/
├── database/                    # 数据库初始化脚本
│   └── site_config.sql         # 站点配置表
└── docs/                        # 部署文档
    └── COMMERCIAL_DEPLOYMENT_COMPLETE.md
```

---

## 🚀 快速部署步骤

### 第一步：上传前端文件

1. 解压 `mianhuatang-final-deploy.tar.gz`
2. 将 `dist-web` 目录下的**所有文件**上传到：
   ```
   /www/wwwroot/mt.dajiaopei.com/
   ```

### 第二步：导入数据库配置

如果还没导入，在phpMyAdmin执行 `database/site_config.sql` 中的SQL语句。

### 第三步：确认反向代理配置

在宝塔面板【网站】→【设置】→【反向代理】中确认：
- 代理名称：`api`
- 目标URL：`http://127.0.0.1:3002`
- 发送域名：`$host`

### 第四步：确认后端服务运行

```bash
pm2 status
```

如果未运行：
```bash
cd /www/wwwroot/mht-edu-server
pm2 start npm --name "mht-edu-api" -- run start:prod
pm2 save
```

### 第五步：访问验证

- 前端页面：https://mt.dajiaopei.com
- 管理后台：https://mt.dajiaopei.com/#/pages/admin/index
- API接口：https://mt.dajiaopei.com/api/hello

---

## 📋 管理后台功能

完整的PC端管理后台包含15个模块：

1. 数据概览 - 用户/订单/营收统计
2. 用户管理 - 家长/教师/机构管理
3. 教师管理 - 认证审核
4. 机构管理 - 入驻审核
5. 订单管理 - 订单状态管理
6. 牛师班管理 - 班级管理
7. 会员套餐 - 套餐配置
8. 活动管理 - 活动创建
9. 商品管理 - 商品管理
10. 广告位管理 - Banner配置
11. 分佣管理 - 分佣结算
12. 提现审核 - 提现审核
13. 代理商管理 - 代理商管理
14. 系统配置 - 站点信息
15. 支付配置 - 支付配置

---

## ✅ 部署完成标志

- [ ] 前端页面正常访问
- [ ] 管理后台可以打开
- [ ] SSL证书有效
- [ ] API接口正常响应
- [ ] 后端服务稳定运行

---

## 📞 技术支持

如遇问题，请检查：
1. 浏览器控制台错误（F12）
2. PM2日志：`pm2 logs mht-edu-api`
3. Nginx错误日志：`/www/wwwlogs/mt.dajiaopei.com.error.log`
