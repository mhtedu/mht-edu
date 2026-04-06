# 自动部署到服务器指南

## 方式1：GitHub Actions 自动部署（推荐）

### 原理
```
本地 git push 
    ↓
GitHub 收到代码
    ↓
自动触发 Actions
    ↓
SSH 连接服务器
    ↓
执行 git pull + npm build + pm2 restart
```

### 步骤

#### 1. 创建 GitHub 仓库（如果还没创建）
- 打开 https://github.com/new
- 仓库名：`mht-edu`
- 不要勾选 README

#### 2. 在 GitHub 设置密钥
进入仓库 → Settings → Secrets → Actions → New repository secret：

| Secret 名称 | 值 |
|-------------|-----|
| SERVER_HOST | `119.91.193.179` |
| SERVER_USER | `root` |
| SERVER_PASSWORD | `mht@2026` |

#### 3. 服务器初始化 git 仓库
SSH 到服务器执行：
```bash
# 创建 bare 仓库
mkdir -p /www/wwwroot/mht-edu-git
cd /www/wwwroot/mht-edu-git
git init --bare

# 创建 post-receive hook（自动部署脚本）
cat > hooks/post-receive << 'HOOK'
#!/bin/bash
GIT_DIR=/www/wwwroot/mht-edu-git
WORK_TREE=/www/wwwroot/mht-edu

while read oldrev newrev branch; do
  if [ "$branch" = "refs/heads/main" ]; then
    echo "Deploying..."
    git --work-tree=$WORK_TREE --git-dir=$GIT_DIR checkout -f main
    cd $WORK_TREE/server
    npm install
    npm run build
    pm2 restart all
    echo "Deployed!"
  fi
done
HOOK

chmod +x hooks/post-receive
```

#### 4. 本地添加远程仓库并推送
```bash
cd D:\mht-edu
git remote add origin https://github.com/你的用户名/mht-edu.git
git push -u origin main
```

### 从今往后

```
本地改代码
  ↓
git add . && git commit -m "xxx"
  ↓
git push origin main
  ↓
自动部署到服务器（1-2分钟）
  ↓
打开 wx.dajiaopei.com 查看效果
```

---

## 方式2：本地直连服务器部署

如果你不想用 GitHub，可以用这个：

### 服务器设置
```bash
# 在服务器创建 git bare 仓库
ssh root@119.91.193.179
mkdir -p /opt/mht-edu.git
cd /opt/mht-edu.git
git init --bare
```

### 本地推送
```bash
cd D:\mht-edu
git remote add production root@119.91.193.179:/opt/mht-edu.git
git push production main
```

---

## 方式3：手动部署脚本（临时用）

如果你只想先试试，创建一个一键部署脚本：

```bash
# deploy.bat (Windows)
@echo off
echo Building project...
cd D:\mht-edu
git add . && git commit -m "%1"
git push origin main
echo Done!
```
