# 本地运行指南

## 方法一：本地运行项目

### 1. 获取代码

如果您已将代码推送到 Git 仓库：
```bash
git clone your-repo-url
cd your-project
```

如果没有 Git 仓库，可以：
- 在 Coze 平台导出项目代码
- 或手动复制项目文件

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：
```bash
# Supabase 数据库（平台自动注入，本地需手动配置）
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 微信小程序
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序AppSecret
```

### 4. 启动开发服务
```bash
pnpm dev
```

### 5. 访问
- 前端：http://localhost:5000
- 后端：http://localhost:3000

---

## 方法二：导出项目代码

在 Coze 平台：
1. 点击项目右上角的 "导出" 或 "下载"
2. 下载完整项目压缩包
3. 解压到本地
4. 按上述步骤运行

---

## 方法三：在平台预览

1. 右侧预览区 → 点击 "配置"
2. 填写微信开放平台 AppID
3. 授权成功后会显示预览二维码
4. 扫码预览小程序
