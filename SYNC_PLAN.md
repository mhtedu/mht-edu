# 代码同步解决方案

## 现状问题

- 沙箱代码：/workspace/projects/
- 服务器代码：/www/wwwroot/mht-edu/
- 两边独立，没有同步

## 解决方案：选择一个"主环境"

### 选择A：以沙箱为主（推荐）

```
沙箱 (主环境)
    ↓  git push
GitHub 仓库
    ↓  自动同步
服务器 (自动更新)
```

**操作步骤**：

1. 在沙箱初始化 git 并推送到 GitHub
2. 服务器配置自动拉取
3. 以后只改沙箱，服务器自动同步

### 选择B：以服务器为主

```
服务器 (主环境)
    ↓  git push
GitHub 仓库
    ↓  自动同步
沙箱 (自动更新)
```

---

## 推荐流程（以沙箱为主）

### 第一步：清理服务器代码（一次性操作）

```bash
# SSH 到服务器
ssh root@119.91.193.179

# 备份现有代码
cp -r /www/wwwroot/mht-edu /www/wwwroot/mht-edu.bak

# 让服务器从 git 拉取代码
cd /www/wwwroot/mht-edu
git init  # 如果没有git
git remote add origin https://github.com/你的用户名/mht-edu.git
git pull origin main
```

### 第二步：以后开发流程

```
沙箱改代码
    ↓
git add . && git commit -m "xxx"
    ↓
git push origin main
    ↓
服务器自动 git pull 更新
```

---

## 关键原则

| 规则 | 说明 |
|------|------|
| 只在一个地方改代码 | 沙箱改完 push，服务器自动拉 |
| 禁止在服务器直接改代码 | 否则会跟 git 冲突 |
| 每次改代码前先 pull | 确保拿到最新版本 |

---

## 冲突解决

如果服务器代码跟沙箱不一样怎么办？

```bash
# 在服务器执行
cd /www/wwwroot/mht-edu
git fetch --all
git reset --hard origin/main  # 强制用沙箱版本覆盖
pm2 restart all
```

---

## 如果你继续在沙箱开发

那我帮你做：
1. 把沙箱代码推送到 GitHub
2. 配置服务器自动部署
3. 以后只有沙箱改代码，服务器自动同步

**你只需要做一件事**：告诉我要不要这样做？
