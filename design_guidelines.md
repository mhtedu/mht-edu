# 棉花糖教育成长平台 - 设计指南

## 品牌定位

**应用定位**：基于 LBS 的家教信息撮合平台
**设计风格**：简洁、专业、信任感
**目标用户**：家长、个体教师、教育机构、城市代理

## 配色方案

### 主色板

| 用途 | Tailwind 类名 | 色值 | 说明 |
|------|--------------|------|------|
| 主色调 | `bg-blue-600` | #2563EB | 品牌主色，用于按钮、链接、重要信息 |
| 主色调浅 | `bg-blue-50` | #EFF6FF | 背景色、卡片背景 |
| 主色调深 | `bg-blue-700` | #1D4ED8 | 按钮悬停态 |
| 辅助色 | `bg-orange-500` | #F97316 | 强调色、价格、优惠信息 |
| 成功色 | `bg-green-500` | #22C55E | 成功状态、会员标识 |
| 警告色 | `bg-yellow-500` | #EAB308 | 警告提示 |

### 中性色

| 用途 | Tailwind 类名 | 色值 | 说明 |
|------|--------------|------|------|
| 标题文字 | `text-gray-900` | #111827 | 一级标题 |
| 正文文字 | `text-gray-700` | #374151 | 正文内容 |
| 辅助文字 | `text-gray-500` | #6B7280 | 次要信息、说明文字 |
| 占位文字 | `text-gray-400` | #9CA3AF | 输入框占位符 |
| 分割线 | `border-gray-200` | #E5E7EB | 边框、分割线 |
| 背景色 | `bg-gray-50` | #F9FAFB | 页面背景 |
| 白色背景 | `bg-white` | #FFFFFF | 卡片背景 |

### 语义色

| 状态 | Tailwind 类名 | 说明 |
|------|--------------|------|
| 待处理 | `text-gray-500` | 订单待抢单 |
| 处理中 | `text-blue-600` | 已匹配、沟通中 |
| 成功 | `text-green-600` | 已完成、已签约 |
| 失败 | `text-red-600` | 已解除、已拒绝 |

## 字体规范

### 字号层级

| 层级 | Tailwind 类名 | 用途 |
|------|--------------|------|
| H1 | `text-2xl font-bold` | 页面主标题 |
| H2 | `text-xl font-semibold` | 模块标题 |
| H3 | `text-lg font-semibold` | 卡片标题 |
| Body | `text-base` | 正文内容 |
| Caption | `text-sm` | 说明文字、辅助信息 |
| Small | `text-xs` | 时间戳、标签 |

## 间距系统

### 页面边距

- 页面左右边距：`px-4` (16px)
- 页面上下边距：`py-4` (16px)

### 组件间距

- 卡片间距：`gap-4` (16px)
- 列表项间距：`gap-3` (12px)
- 元素间距：`gap-2` (8px)

### 卡片内边距

- 大卡片：`p-6` (24px)
- 中卡片：`p-4` (16px)
- 小卡片：`p-3` (12px)

## 组件使用原则

### 组件选型约束

**优先使用 `@/components/ui/*` 中的通用 UI 组件**：

- **按钮**：所有按钮统一使用 `@/components/ui/button` 的 `Button` 组件
- **输入框**：所有输入框统一使用 `@/components/ui/input` 的 `Input` 组件
- **选择器**：下拉选择使用 `@/components/ui/select` 的 `Select` 组件
- **卡片**：信息卡片使用 `@/components/ui/card` 的 `Card` 组件
- **标签**：状态标签使用 `@/components/ui/badge` 的 `Badge` 组件
- **标签页**：内容切换使用 `@/components/ui/tabs` 的 `Tabs` 组件
- **对话框**：弹窗确认使用 `@/components/ui/dialog` 的 `Dialog` 组件
- **提示**：操作反馈使用 `@/components/ui/toast` 的 `Toast` 组件
- **加载**：加载状态使用 `@/components/ui/skeleton` 的 `Skeleton` 组件

### 容器样式

- 卡片圆角：`rounded-xl` (12px)
- 按钮圆角：`rounded-lg` (8px)
- 输入框圆角：`rounded-lg` (8px)
- 卡片阴影：`shadow-sm`

### 页面组件选型流程

1. **拆分 UI 单元**：创建或重写页面前，先分析页面需要哪些 UI 单元
2. **映射到组件库**：将每个 UI 单元映射到 `src/components/ui` 中已有组件
3. **优先复用**：只有组件库未覆盖的原生能力，才使用 `@tarojs/components`

## 导航结构

### TabBar 配置

**底部导航栏（4个主要页面）**：

1. **首页** - 展示订单/教师列表，LBS 定位
2. **消息** - 聊天消息、系统通知
3. **订单** - 我的订单列表
4. **我的** - 个人中心、会员、分销

### 页面路由

| 页面路径 | 页面名称 | 说明 |
|---------|---------|------|
| `/pages/index/index` | 首页 | 订单/教师列表 |
| `/pages/message/index` | 消息 | 消息中心 |
| `/pages/orders/index` | 订单 | 订单管理 |
| `/pages/profile/index` | 我的 | 个人中心 |
| `/pages/login/index` | 登录 | 微信登录 |
| `/pages/order-detail/index` | 订单详情 | 订单详细信息 |
| `/pages/teacher-detail/index` | 教师详情 | 教师详细信息 |
| `/pages/publish/index` | 发布需求 | 家长发布需求 |
| `/pages/membership/index` | 会员中心 | 会员套餐购买 |
| `/pages/distribution/index` | 分销中心 | 邀请好友、佣金明细 |

## 空状态与加载态

### 空状态

- 使用友好的插图或图标
- 提供明确的操作引导
- 文案简洁明了

### 加载态

- 列表加载使用骨架屏（Skeleton）
- 按钮加载禁用并显示 loading 状态
- 页面加载使用全屏加载提示

## 小程序约束

### 包体积优化

- 图片资源使用 CDN 链接
- 避免引入大型第三方库
- 合理使用分包加载

### 性能优化

- 列表使用虚拟滚动
- 图片懒加载
- 避免频繁的 setData

### 交互设计

- 点击反馈及时
- 加载状态清晰
- 错误提示友好
