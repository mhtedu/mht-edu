# 棉花糖教育平台 - 管理后台

## 概述

这是一个完整的PC端Web管理后台系统，独立于Taro框架，专为PC浏览器优化。

## 访问地址

- **管理后台**: https://mt.dajiaopei.com/admin.html
- **登录页面**: https://mt.dajiaopei.com/login.html

## 默认管理员账号

- **用户名**: admin
- **密码**: admin123

⚠️ **重要**: 首次登录后请立即修改密码！

## 功能模块

### 已完成功能

1. **数据概览** - 平台数据统计和待办事项
2. **用户管理** - 用户列表、查询、状态管理
3. **教师管理** - 教师认证审核、信息管理
4. **机构管理** - 机构入驻审核、信息管理
5. **订单管理** - 订单列表、状态查询
6. **系统配置** - 站点基本信息配置
7. **支付配置** - 微信支付参数配置
8. **管理员管理** - 管理员账号管理
9. **角色权限** - 角色和权限配置

### 开发中功能

10. 牛师班管理
11. 会员套餐
12. 活动管理
13. 商品管理
14. 广告位管理
15. 分佣管理
16. 提现审核
17. 代理商管理

## 技术架构

### 前端

- **技术栈**: HTML5 + CSS3 + Vanilla JavaScript
- **样式框架**: 自定义CSS（类似Tailwind风格）
- **UI组件**: 自定义组件库
- **特点**: 
  - 纯静态文件，无需编译
  - 响应式设计，适配不同屏幕
  - 模块化代码结构

### 后端

- **框架**: NestJS + TypeScript
- **认证**: JWT + Passport
- **权限**: RBAC（基于角色的访问控制）
- **数据库**: MySQL

## 权限系统

### 角色列表

1. **超级管理员** - 拥有所有权限
2. **运营管理员** - 用户、教师、机构管理
3. **客服管理员** - 客户服务、投诉处理
4. **财务管理** - 订单、提现、分佣管理
5. **内容管理** - 活动、商品、广告管理

### 权限定义

系统定义了53个细粒度权限，涵盖所有模块的增删改查操作：

- `dashboard:view` - 数据概览查看
- `user:view/create/edit/delete` - 用户管理权限
- `teacher:view/create/edit/delete` - 教师管理权限
- ...等

## 数据库表结构

### 管理员相关表

```sql
-- 管理员表
admin_user (id, username, password, real_name, email, phone, role_id, status)

-- 角色表
admin_role (id, role_name, role_code, description, permissions, status)

-- 权限表
admin_permission (id, permission_name, permission_code, module, description, status)

-- 操作日志表
admin_operation_log (id, admin_id, module, action, description, ip, created_at)

-- 登录日志表
admin_login_log (id, admin_id, ip, user_agent, login_status, created_at)
```

### 站点配置表

```sql
-- 站点配置表
site_config (id, config_key, config_value, config_type, description, status)
```

## 部署说明

### 1. 导入数据库表

```bash
# 导入管理员系统表
mysql -u root -p mht_edu < server/database/admin_system.sql

# 导入站点配置表
mysql -u root -p mht_edu < server/database/site_config.sql

# 初始化管理员密码
mysql -u root -p mht_edu < server/database/init_admin_password.sql
```

### 2. 文件部署

将以下文件部署到生产环境：

```bash
# 部署管理后台文件
cp public/login.html /www/wwwroot/mht-edu/dist/
cp public/admin.html /www/wwwroot/mht-edu/dist/
cp public/admin.css /www/wwwroot/mht-edu/dist/
cp public/admin.js /www/wwwroot/mht-edu/dist/
```

### 3. Nginx配置

确保Nginx配置正确处理这些文件：

```nginx
# 管理后台
location ~ ^/(admin|login)\.html$ {
    root /www/wwwroot/mht-edu/dist;
    try_files $uri =404;
}

# 管理后台静态资源
location ~ ^/(admin|login)\.(css|js)$ {
    root /www/wwwroot/mht-edu/dist;
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

### 4. 后端服务

确保后端服务运行在3002端口，并正确配置JWT密钥：

```bash
# 在服务器上运行
cd /www/wwwroot/mht-edu
pnpm start:server
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改admin账号密码
2. **定期更换密码**: 建议每3个月更换一次密码
3. **最小权限原则**: 为不同角色分配最小必要权限
4. **日志审计**: 定期检查操作日志和登录日志
5. **HTTPS**: 确保生产环境使用HTTPS
6. **IP白名单**: 如有需要，可配置管理后台IP白名单

## 常见问题

### Q: 忘记管理员密码怎么办？

A: 执行以下SQL重置密码为 `admin123`：

```sql
UPDATE admin_user 
SET password = '$2b$10$rQZ9Z8xG6M4N5K2L7J8V3O5N4M3L2K1J8H7G6F5D4S3A2B1C0D9E8F7'
WHERE username = 'admin';
```

### Q: 如何添加新管理员？

A: 登录管理后台，进入"管理员管理"页面，点击"添加管理员"按钮。

### Q: 如何修改角色权限？

A: 登录管理后台，进入"角色权限"页面，点击对应角色的"编辑权限"按钮。

### Q: 登录后显示"没有权限"怎么办？

A: 检查用户角色是否正确分配，以及角色是否有对应的权限。

## 技术支持

如有问题，请联系技术团队。

---

**版本**: v1.0.0  
**更新日期**: 2024-01-16
