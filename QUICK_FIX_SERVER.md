# 快速修复：服务器后端API字段缺失

## 问题
线上 `/api/teacher-profile/nearby` 接口返回的数据缺少 `id`, `name`, `avatar` 字段

## 修复方法

### 方法1：直接修改服务器上的文件（推荐）

SSH到服务器，执行以下命令：

```bash
# 1. 查看当前 getNearbyTeachers 函数的返回结构
grep -A 20 "getNearbyTeachers" /www/wwwroot/mht-edu/server/src/modules/teacher-profile/teacher-profile.service.ts | head -25

# 2. 用 sed 修复（或者手动编辑）
# 找到类似这样的代码：
#   return {
#     subjects: subjects,
#     hourly_rate: ...
#   };
# 改为：
#   return {
#     id: teacher.id,
#     name: teacher.real_name || teacher.name,
#     avatar: teacher.avatar,
#     subjects: subjects,
#     hourly_rate: ...
#   };

# 3. 编辑文件
vi /www/wwwroot/mht-edu/server/src/modules/teacher-profile/teacher-profile.service.ts
# 找到约第119-132行，修改 return 对象添加 id, name, avatar 字段

# 4. 构建
cd /www/wwwroot/mht-edu/server && npm run build

# 5. 重启
pm2 restart all
```

### 方法2：对比文件差异后手动同步

```bash
# 查看沙箱中的正确代码（当前会话）
# 第119-132行显示需要修改的位置

# 在服务器上编辑对应文件
vi /www/wwwroot/mht-edu/server/src/modules/teacher-profile/teacher-profile.service.ts
```

## 修复后的返回格式

正确的API响应应该是：
```json
{
  "list": [
    {
      "id": 1,
      "name": "张三",
      "avatar": "https://...",
      "subjects": ["数学"],
      "hourly_rate": 200,
      "rating": 4.9,
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

## 验证修复

```bash
curl "https://wx.dajiaopei.com/api/teacher-profile/nearby?page=1&pageSize=2"
```

应该能看到 `id`, `name`, `avatar` 字段。
