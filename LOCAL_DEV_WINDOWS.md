# Windows 本地开发环境搭建

## 1. 安装必要软件（只需做一次）

### 1.1 安装 Node.js 18+
下载地址：https://nodejs.org/
选择 Windows Installer (.msi) 64位版本

验证安装：
```powershell
node -v  # 应该显示 v18.x.x
npm -v
```

### 1.2 安装 pnpm
```powershell
npm install -g pnpm
```

### 1.3 安装 Git
下载地址：https://git-scm.com/download/win

## 2. 获取代码

### 方式A：如果有Git仓库
```powershell
git clone <你的仓库地址> D:\mht-edu
cd D:\mht-edu
```

### 方式B：手动下载代码
在沙箱里把代码打包，从沙箱下载到本地

## 3. 安装项目依赖

```powershell
cd D:\mht-edu
pnpm install
```

## 4. 配置环境变量

创建 `.env` 文件：
```powershell
cd D:\mht-edu
copy .env.example .env
```

编辑 `.env`，配置数据库连接：
```
DATABASE_URL=mysql://用户名:密码@服务器IP:3306/数据库名
JWT_SECRET=你的jwt密钥
# 其他配置...
```

## 5. 启动开发

### 同时启动前端 + 后端
```powershell
pnpm dev
```

### 或者分开启动

终端1 - 后端API：
```powershell
cd server
npm run start:dev
```

终端2 - 前端H5：
```powershell
pnpm dev:h5
```

终端3 - PC后台（如果独立）：
```powershell
pnpm dev:admin
```

## 6. 访问地址

| 服务 | 地址 |
|------|------|
| H5前端 | http://localhost:5000 |
| PC后台 | http://localhost:5000/admin |
| 后端API | http://localhost:3000 |
| API文档 | http://localhost:3000/api |

## 7. 开发工作流

```
┌─────────────────────────────────────────────┐
│  Windows 电脑                               │
│                                             │
│  浏览器1: http://localhost:5000 (H5前端)   │
│  浏览器2: http://localhost:5000/admin (后台) │
│                                             │
│  修改代码 → 自动热更新 → 刷新浏览器看效果   │
│                                             │
│  git push → 沙箱 git pull → 服务器 git pull │
└─────────────────────────────────────────────┘
```

## 8. 常见问题

### Q: pnpm install 很慢
```powershell
# 使用淘宝镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### Q: 端口被占用
```powershell
# 换端口
PORT=5001 pnpm dev
```

### Q: 数据库连接失败
检查 `.env` 中的数据库配置，确保服务器允许远程连接

## 9. 推荐的IDE

- **VS Code** (免费，推荐)：https://code.visualstudio.com/
- 安装插件：ESLint, Prettier, TypeScript Vue Support

## 10. 快速检查清单

```powershell
# 1. 检查环境
node -v
npm -v
pnpm -v
git -v

# 2. 进入项目目录
cd D:\mht-edu

# 3. 安装依赖
pnpm install

# 4. 启动
pnpm dev

# 5. 打开浏览器
# http://localhost:5000
```
