# 更新说明 - 2024-03-31

## 本次更新内容

### 1. 短信功能修复
- **后端短信服务** (`server/dist/src/modules/sms/`)
  - 更新阿里云短信SDK为 `@alicloud/dysmsapi20170525`
  - 修复短信发送API调用方式
  - 添加开发模式（关闭时验证码默认123456）

- **管理后台短信配置** (`admin/admin.js`)
  - 新增短信配置页面（renderSms函数）
  - 支持配置 AccessKey ID/Secret、签名、模板CODE
  - 支持启用/禁用短信功能
  - 支持测试短信发送

### 2. 新增依赖
`server/package.json` 添加：
```json
"@alicloud/dysmsapi20170525": "^3.0.0",
"@alicloud/openapi-client": "^0.4.0",
"@alicloud/tea-util": "^1.4.7"
```

### 3. 模块注册
`server/dist/src/app.module.js` 已注册 `SmsModule`

---

## 部署步骤

### 1. 备份现有文件（重要！）
```bash
# 备份整个站点
cp -r /www/wwwroot/mht-edu /www/wwwroot/mht-edu.bak.$(date +%Y%m%d)
```

### 2. 上传新文件
将 `deploy_package` 目录内容上传到服务器 `/www/wwwroot/mht-edu/`

### 3. 安装新依赖
```bash
cd /www/wwwroot/mht-edu/server
pnpm install
```

### 4. 重启后端服务
```bash
pm2 restart mht-edu-server
# 或
systemctl restart mht-edu
```

### 5. 配置短信参数
1. 访问管理后台：`https://wx.dajiaopei.com/admin/`
2. 使用 admin / admin123 登录
3. 进入「系统配置」→「短信配置」
4. 填写阿里云短信配置：
   - AccessKey ID
   - AccessKey Secret
   - 短信签名（如：天伦时光）
   - 模板CODE（如：SMS_xxxxxxx）
5. 点击「启用」并保存

### 6. 测试短信发送
在短信配置页面输入测试手机号，点击「发送测试短信」

---

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `server/dist/src/modules/sms/*` | 新增 | 短信服务模块 |
| `server/dist/src/app.module.js` | 更新 | 注册SmsModule |
| `server/package.json` | 更新 | 添加阿里云SDK依赖 |
| `admin/admin.js` | 已包含 | 短信配置页面（无需修改） |

---

## 数据库要求

确保数据库存在 `sms_verification_codes` 表：
```sql
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expire_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 开发模式说明

当短信功能「禁用」时：
- 系统不调用阿里云API
- 验证码固定为 `123456`
- 适用于开发测试环境

当短信功能「启用」时：
- 调用阿里云短信API
- 生成随机6位验证码
- 验证码5分钟内有效
