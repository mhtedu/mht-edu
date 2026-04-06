# GitHub 仓库设置指南

## 步骤1：创建GitHub仓库

1. 打开 https://github.com 并登录
2. 点击右上角 "+" → "New repository"
3. 填写：
   - Repository name: `mht-edu`
   - Description: `棉花糖教育平台`
   - Private 或 Public 均可
4. 点击 "Create repository"

## 步骤2：本地连接GitHub

在本地电脑打开 Git Bash 或 PowerShell：

```powershell
# 1. 进入项目目录
cd D:\mht-edu

# 2. 添加远程仓库（把下面的 URL 换成你创建的仓库地址）
git remote add origin https://github.com/你的用户名/mht-edu.git

# 3. 推送代码到GitHub
git push -u origin main
```

## 步骤3：日常开发流程

```powershell
# 每天开始工作时
git pull origin main

# 开发中频繁保存
git add .
git commit -m "feat: 新增xxx功能"
git push origin main

# 沙箱同步
cd /workspace/projects
git pull origin main
pnpm dev
```
