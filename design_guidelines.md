# 棉花糖教育成长平台 - 设计指南

## 1. 品牌定位

- **应用定位**：基于 LBS 的教育信息撮合平台，连接家长、教师、教育机构
- **设计风格**：专业、可信赖、温暖、便捷
- **目标用户**：K12 家长、个体教师、教育培训机构
- **主色调**：蓝色系 (#2563EB)，传达专业与信任

## 2. 配色方案

### 主色板

| 名称 | 色值 | Tailwind 类名 | 用途 |
|------|------|---------------|------|
| Primary | #2563EB | `bg-blue-600` `text-blue-600` | 主按钮、链接、强调 |
| Primary Dark | #1D4ED8 | `bg-blue-700` | 按钮悬停态 |
| Primary Light | #DBEAFE | `bg-blue-100` | 浅色背景、标签 |

### 中性色

| 名称 | 色值 | Tailwind 类名 | 用途 |
|------|------|---------------|------|
| Gray 900 | #111827 | `text-gray-900` | 标题文字 |
| Gray 700 | #374151 | `text-gray-700` | 正文文字 |
| Gray 500 | #6B7280 | `text-gray-500` | 次要文字 |
| Gray 300 | #D1D5DB | `border-gray-300` | 边框 |
| Gray 100 | #F3F4F6 | `bg-gray-100` | 页面背景 |
| Gray 50 | #F9FAFB | `bg-gray-50` | 卡片背景 |

### 语义色

| 名称 | 色值 | Tailwind 类名 | 用途 |
|------|------|---------------|------|
| Success | #10B981 | `bg-green-500` `text-green-500` | 成功状态 |
| Warning | #F59E0B | `bg-amber-500` `text-amber-500` | 警告状态 |
| Error | #EF4444 | `bg-red-500` `text-red-500` | 错误状态 |

## 3. 字体规范

| 层级 | Tailwind 类名 | 字号 | 用途 |
|------|---------------|------|------|
| H1 | `text-2xl font-bold` | 24px | 页面标题 |
| H2 | `text-xl font-semibold` | 20px | 区块标题 |
| H3 | `text-lg font-semibold` | 18px | 卡片标题 |
| Body | `text-base` | 16px | 正文内容 |
| Caption | `text-sm text-gray-500` | 14px | 辅助说明 |

## 4. 间距系统

| 类型 | Tailwind 类名 | 值 | 用途 |
|------|---------------|-----|------|
| 页面边距 | `px-4` | 16px | 页面左右内边距 |
| 卡片内边距 | `p-4` | 16px | 卡片内部间距 |
| 列表间距 | `gap-3` | 12px | 列表项间距 |
| 区块间距 | `mb-6` | 24px | 内容区块分隔 |

## 5. 组件使用原则

### 组件选型约束

所有通用 UI 组件（按钮、输入框、弹窗、Tabs、Toast、Card、Badge 等）**必须优先使用 `@/components/ui/*`**，禁止用 `View/Text` 手搓通用组件。

### 页面组件映射

创建页面前，先拆分 UI 单元并映射到组件库：

- **按钮/操作入口** → `@/components/ui/button`
- **输入框/搜索框** → `@/components/ui/input` 或 `@/components/ui/input-group`
- **多行输入** → `@/components/ui/textarea`
- **卡片容器** → `@/components/ui/card`
- **标签/状态** → `@/components/ui/badge`
- **分段切换** → `@/components/ui/tabs`
- **弹窗/确认** → `@/components/ui/dialog` 或 `@/components/ui/alert-dialog`
- **底部抽屉** → `@/components/ui/drawer`
- **轻提示** → `@/components/ui/toast`
- **下拉选择** → `@/components/ui/select`
- **开关切换** → `@/components/ui/switch`
- **列表分隔** → `@/components/ui/separator`

### 容器样式

- **页面容器**：`min-h-screen bg-gray-100`
- **卡片容器**：`bg-white rounded-xl shadow-sm p-4`
- **分组容器**：`bg-gray-50 rounded-lg p-3`

## 6. 导航结构

### TabBar 页面

| 页面 | 路径 | 文字 |
|------|------|------|
| 首页 | `pages/index/index` | 首页 |
| 找老师 | `pages/teacher/list` | 找老师 |
| 找机构 | `pages/org/list` | 找机构 |
| 消息 | `pages/message/index` | 消息 |
| 我的 | `pages/profile/index` | 我的 |

### 页面跳转规范

- TabBar 页面跳转：使用 `Taro.switchTab()`
- 普通页面跳转：使用 `Taro.navigateTo()`
- 返回上一页：使用 `Taro.navigateBack()`

## 7. 小程序约束

### 包体积限制

- 主包体积 ≤ 2MB
- 总包体积 ≤ 20MB
- 图片资源必须使用 TOS 对象存储，禁止打包到项目中

### 性能优化

- 使用图片懒加载：`<Image lazyLoad />`
- 长列表使用虚拟列表：`<VirtualList />`
- 非核心功能使用分包加载

### 域名配置

- 生产环境需在小程序后台配置合法域名
- 本地开发需在微信开发者工具开启「不校验合法域名」

## 8. 状态展示

### 空状态

使用 `@/components/ui/card` 包裹，显示图标 + 文案 + 操作按钮：

```tsx
<Card className="flex flex-col items-center justify-center py-12">
  <Search size={48} color="#9CA3AF" />
  <Text className="block mt-4 text-gray-500">暂无数据</Text>
  <Button variant="link" className="mt-2">刷新试试</Button>
</Card>
```

### 加载态

使用 `@/components/ui/skeleton`：

```tsx
<Skeleton className="h-20 w-full rounded-lg" />
<Skeleton className="h-20 w-full rounded-lg mt-3" />
```
