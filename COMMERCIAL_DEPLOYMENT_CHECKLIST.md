# 棉花糖教育平台 - 商用部署检查清单

## 检查日期: 2026-04-03

---

## 一、系统状态检查 ✅

### 1.1 服务运行状态
- [x] 前端服务 (端口 5000): 运行正常
- [x] 后端服务 (端口 3000): 运行正常
- [x] 健康检查接口: `/api/health` 响应正常

### 1.2 数据库连接
- [x] 远程 MySQL 服务器 (119.91.193.179): 连接正常
- [x] 数据库: mht_edu
- [x] 数据统计:
  - 用户总数: 365 (家长: 251, 教师: 114)
  - 教师档案: 123 (已认证: 114)
  - 订单数据: 128 条
  - 活动数据: 8 条

---

## 二、前端页面检查 ✅

### 2.1 页面路由配置
已配置 62 个页面，涵盖所有业务功能:

**TabBar 页面 (4个)**
- [x] 首页 (pages/index/index)
- [x] 商城 (pages/mall/index)
- [x] 消息 (pages/message/index)
- [x] 我的 (pages/profile/index)

**核心功能页面**
- [x] 登录/注册
- [x] 教师列表/详情
- [x] 订单发布/管理/详情
- [x] 活动列表/详情/管理
- [x] 牛师班列表/详情/管理
- [x] 会员开通
- [x] 收益中心
- [x] 分销中心
- [x] 资源管理
- [x] 管理后台

### 2.2 构建产物
- [x] H5 构建 (dist-web/): 完成
- [x] 微信小程序构建 (dist-weapp/): 完成

---

## 三、后端接口检查 ✅

### 3.1 核心接口验证

| 接口 | 状态 | 说明 |
|------|------|------|
| `/api/health` | ✅ | 健康检查 |
| `/api/user/info` | ✅ | 用户信息 |
| `/api/user/teachers/list` | ✅ | 教师列表 |
| `/api/user/membership/plans` | ✅ | 会员套餐 |
| `/api/user/invite` | ✅ | 邀请信息 |
| `/api/order/nearby` | ✅ | 附近订单 |
| `/api/order/:id` | ✅ | 订单详情 |
| `/api/teacher-profile/nearby` | ✅ | 附近教师 |
| `/api/teacher-profile/:id` | ✅ | 教师详情 |
| `/api/activities/list` | ✅ | 活动列表 |
| `/api/activities/:id` | ✅ | 活动详情 |
| `/api/config/ads/home_top` | ✅ | 广告配置 |
| `/api/admin/stats` | ✅ | 管理后台统计 |
| `/api/admin/users` | ✅ | 用户管理 |
| `/api/admin/teachers` | ✅ | 教师管理 |
| `/api/admin/orders` | ✅ | 订单管理 |

### 3.2 已修复的问题

1. **教师列表 subjects 字段解析错误**
   - 问题: subjects 字段为 JSON 数组时，调用 split() 报错
   - 修复: 添加类型检查，支持 JSON 数组和字符串两种格式

2. **会员套餐接口 SQL 错误**
   - 问题: 数据库表缺少 role 列导致查询失败
   - 修复: 改用代码过滤，并添加默认套餐返回

3. **邀请信息接口表不存在**
   - 问题: distributions 表不存在
   - 修复: 改用 commissions 表查询收益

---

## 四、各角色端功能检查 ✅

### 4.1 家长端
- [x] 首页: 牛师推荐、活动展示、订单发布入口
- [x] 教师列表: LBS定位、筛选、详情查看
- [x] 发布需求: 科目、年级、预算、时间
- [x] 订单管理: 状态跟踪、评价
- [x] 会员开通: 月卡/季卡/年卡
- [x] 收藏管理: 教师收藏

### 4.2 牛师端
- [x] 工作台: 抢单、学员、收益概览
- [x] 抢单大厅: 附近订单、筛选
- [x] 学员管理: 学员列表、进度
- [x] 收益中心: 收益统计、提现
- [x] 牛师班管理: 创建、管理学生

### 4.3 机构端
- [x] 机构管理: 基本信息设置
- [x] 课程管理: 发布、编辑
- [x] 牛师管理: 邀请、管理
- [x] 活动管理: 创建、报名管理
- [x] 学员管理: 学员列表

### 4.4 管理后台
- [x] 数据统计: 用户、订单、收益
- [x] 用户管理: 列表、搜索、状态
- [x] 教师管理: 认证审核
- [x] 订单管理: 状态、分配
- [x] 活动管理: 创建、编辑
- [x] 配置管理: 广告、会员套餐

---

## 五、部署包检查 ✅

### 5.1 目录结构
```
deploy_package/
├── index.html          # H5入口
├── js/                 # JS资源
├── css/                # CSS资源
├── static/             # 静态资源
├── admin/              # PC管理后台
│   ├── admin.html
│   ├── admin.css
│   └── admin.js
├── dist-weapp/         # 微信小程序
└── server/             # 后端服务
    ├── dist/           # 编译后代码
    ├── database/       # 数据库脚本
    └── .env            # 环境变量模板
```

### 5.2 验证状态
- [x] H5前端文件完整
- [x] 小程序文件完整
- [x] 后端编译文件完整
- [x] 管理后台文件完整
- [x] 数据库脚本完整

---

## 六、部署前准备清单

### 6.1 服务器配置
- [ ] 域名解析: wx.dajiaopei.com
- [ ] SSL证书: 配置 HTTPS
- [ ] Nginx: 反向代理配置
- [ ] Node.js: v18+ 环境
- [ ] PM2: 进程管理

### 6.2 环境变量配置（仅需配置以下内容）
```env
# 数据库配置
DB_HOST=119.91.193.179
DB_PORT=3306
DB_USERNAME=mht_edu
DB_PASSWORD=[你的密码]
DB_DATABASE=mht_edu

# JWT密钥 (请修改)
JWT_SECRET=mht-edu-jwt-secret-2026-change-this
```

### 6.3 管理后台配置（部署后在后台填写）
部署完成后，登录管理后台配置以下内容：

**路径**: 管理后台 → 系统配置

| 配置分组 | 配置项 | 说明 |
|---------|-------|------|
| **微信小程序** | wechat_appid | 小程序AppID |
| | wechat_secret | 小程序Secret |
| **微信支付** | wechat_pay_mch_id | 商户号 |
| | wechat_pay_api_key | API密钥(V2) |
| | wechat_pay_api_v3_key | APIv3密钥 |
| | wechat_pay_serial_no | 证书序列号 |
| | wechat_pay_private_key | 商户私钥 |
| | wechat_pay_notify_url | 支付回调地址 |
| **短信配置** | sms_access_key_id | 阿里云AccessKey |
| | sms_access_key_secret | 阿里云Secret |
| | sms_sign_name | 短信签名 |
| | sms_template_code_login | 登录验证码模板ID |
| **地图配置** | map_key | 腾讯地图Key |
| | map_secret_key | 地图Secret |

### 6.4 微信小程序配置
- [ ] 服务器域名: `https://wx.dajiaopei.com`
- [ ] 业务域名配置
- [ ] 上传代码并提交审核

---

## 七、部署步骤

1. **上传部署包**
   ```bash
   scp -r deploy_package/* root@119.91.193.179:/www/wwwroot/mht-edu/
   ```

2. **导入数据库** (如未导入)
   ```bash
   mysql -u mht_edu -p mht_edu < /www/wwwroot/mht-edu/server/database/mht_edu_complete.sql
   ```

3. **配置环境变量**
   ```bash
   cd /www/wwwroot/mht-edu/server
   nano .env
   ```

4. **安装依赖并启动**
   ```bash
   pnpm install --production
   pm2 start ecosystem.config.js
   ```

5. **配置Nginx**
   - 参考: `deploy/new-server/完整部署指南.md`

---

## 八、部署后验证

- [ ] 访问 H5: https://wx.dajiaopei.com
- [ ] 访问管理后台: https://wx.dajiaopei.com/admin/
- [ ] API健康检查: https://wx.dajiaopei.com/api/health
- [ ] 小程序扫码测试

---

## 检查完成时间: 2026-04-03
## 系统状态: 就绪，可部署
