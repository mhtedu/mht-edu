# 棉花糖教育平台 - 部署指南

## 版本信息
- 版本号：v1.0.0
- 更新日期：2025-01-13
- 主要功能：牛师班、分销锁定、超级会员

---

## 一、数据库部署

### 1.1 数据库配置信息
```
数据库名：mht_edu
字符集：utf8mb4
排序规则：utf8mb4_unicode_ci
用户名：mht_edu
密码：mht@2026
```

### 1.2 导入数据库
```bash
# 方式一：MySQL命令行
mysql -u root -p < server/database/mht_edu_complete.sql

# 方式二：宝塔面板
1. 登录宝塔面板
2. 进入【数据库】菜单
3. 点击【phpMyAdmin】
4. 选择或创建数据库 mht_edu
5. 点击【导入】选择 mht_edu_complete.sql
```

### 1.3 数据库包含内容
- **23张数据表**（完整业务表结构）
- **演示数据**（可立即体验功能）
  - 18个用户（教师9个、家长5个、机构2个、管理员1个）
  - 9个教师档案
  - 5个牛师班
  - 5个订单需求
  - 3个活动
  - 9条分销锁定记录

---

## 二、后端部署

### 2.1 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL >= 8.0

### 2.2 安装依赖
```bash
cd server
pnpm install
```

### 2.3 环境变量配置
创建 `server/.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=mht_edu
DB_PASSWORD=mht@2026
DB_DATABASE=mht_edu

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 服务端口
PORT=3000
```

### 2.4 启动服务
```bash
# 开发环境
pnpm start:dev

# 生产环境
pnpm build
pnpm start:prod
```

---

## 三、前端部署

### 3.1 安装依赖
```bash
pnpm install
```

### 3.2 配置域名
修改 `src/network/index.ts` 中的 `PROJECT_DOMAIN`：
```typescript
const PROJECT_DOMAIN = 'https://your-domain.com'
```

### 3.3 编译构建
```bash
# H5版本
pnpm build:web

# 微信小程序版本
pnpm build:weapp

# 编译全部
pnpm build
```

### 3.4 微信小程序上传
1. 打开微信开发者工具
2. 导入项目（选择 dist-weapp 目录）
3. 配置 AppID
4. 上传代码并提交审核

---

## 四、核心功能说明

### 4.1 分销关系锁定（核心机制）

**规则**：第一次点击即锁定，永久有效，不可覆盖

**锁定场景**：
| 场景 | 锁定类型 | 说明 |
|------|---------|------|
| 教师主页分享 | teacher_profile | 访问教师主页即锁定 |
| 订单分享 | order | 查看订单详情即锁定 |
| 活动分享 | activity | 报名活动即锁定 |
| 牛师班分享 | elite_class | 报名牛师班即锁定 |
| 邀请链接 | invite_link | 注册时填写邀请码 |
| 二维码扫描 | qrcode | 扫描个人二维码 |

**数据库表**：
- `referral_locks`：分销关系锁定表
- `referral_lock_logs`：锁定日志表

**API接口**：
- `POST /api/referral/lock` - 锁定分销关系
- `POST /api/referral/lock-by-share-code` - 通过分享码锁定
- `POST /api/referral/lock-by-invite-code` - 通过邀请码锁定
- `GET /api/referral/is-locked` - 检查是否已锁定
- `GET /api/referral/invite-stats` - 获取邀请统计

### 4.2 超级会员

**获取方式**：
1. 付费购买（月度¥99/季度¥269/年度¥999）
2. 邀请达标（邀请10名教师 或 10名家长）

**权限**：
- 创建牛师班
- 优先展示
- 专属客服
- 免费发布需求

### 4.3 牛师班

**创建条件**：
- 仅超级会员可创建

**课时分成**：
- 教师：85%
- 平台：5%
- 推荐人：10%（通过分享链接报名）

**状态流转**：
```
招生中(0) → 进行中(1) → 已结束(2)
         ↘ 已取消(3)
```

---

## 五、API接口清单

### 5.1 分销锁定
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/referral/lock | 锁定分销关系 |
| POST | /api/referral/lock-by-share-code | 通过分享码锁定 |
| POST | /api/referral/lock-by-invite-code | 通过邀请码锁定 |
| GET | /api/referral/is-locked | 检查是否已锁定 |
| GET | /api/referral/my-locker | 获取我的推荐人 |
| GET | /api/referral/invite-stats | 获取邀请统计 |
| GET | /api/referral/my-invite-code | 获取我的邀请码 |

### 5.2 牛师班
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/elite-class/list | 牛师班列表 |
| GET | /api/elite-class/detail/:id | 牛师班详情 |
| POST | /api/elite-class/create | 创建牛师班 |
| POST | /api/elite-class/enroll | 报名试课 |
| POST | /api/elite-class/confirm-enrollment | 确认报名 |
| POST | /api/elite-class/update-progress | 更新课时进度 |
| GET | /api/elite-class/teacher-classes | 教师的牛师班列表 |
| GET | /api/elite-class/students/:classId | 报名学生列表 |
| POST | /api/elite-class/close | 结束牛师班 |
| GET | /api/elite-class/check-super-member | 检查超级会员 |

---

## 六、演示账号

### 教师账号（超级会员）
| ID | 昵称 | 手机号 | 特点 |
|----|------|--------|------|
| 100 | 张老师 | 13800000100 | 超级会员，已邀请2名教师、2名家长 |
| 106 | 赵老师 | 13800000106 | 超级会员，奥数教练 |
| 108 | 孙老师 | 13800000108 | 超级会员，高校教师 |

### 家长账号
| ID | 昵称 | 手机号 | 推荐人 |
|----|------|--------|--------|
| 200 | 家长张先生 | 13800000200 | 张老师(100) |
| 201 | 家长李女士 | 13800000201 | 张老师(100) |
| 204 | 家长陈先生 | 13800000204 | 赵老师(106) |

---

## 七、常见问题

### Q1: 导入数据库报错？
A: 确保MySQL版本 >= 8.0，字符集为 utf8mb4

### Q2: 分销关系没有锁定？
A: 检查 `referral_locks` 表是否有记录，确认前端传了 `share_code` 或 `referrer_id`

### Q3: 创建牛师班提示需要超级会员？
A: 检查 `super_memberships` 表中是否有该用户的记录，或 `users.is_super_member = 1`

### Q4: 邀请统计不准确？
A: 执行以下SQL更新统计：
```sql
UPDATE super_memberships sm
SET invite_teacher_count = (
  SELECT COUNT(*) FROM users WHERE inviter_id = sm.user_id AND role = 1
),
invite_parent_count = (
  SELECT COUNT(*) FROM users WHERE inviter_id = sm.user_id AND role = 0
);
```

---

## 八、技术支持

如有问题，请联系技术团队。
