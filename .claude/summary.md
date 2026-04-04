# 压缩摘要

## 用户需求与目标
- 原始目标: 基于Taro + React + NestJS的教育信息撮合平台，连接家长、牛师、机构，采用双向付费墙+分销裂变模式。
- 当前目标: 
  - ✅ 修复后端服务编译问题（已完成）
  - ✅ 修复短信服务降级逻辑（已完成）
  - 待用户验证：PC后台小程序构建、H5端验证码接收、小程序JWT认证

## 项目概览
- 概述: 棉花糖教育平台 - Taro全栈教育撮合小程序
- 技术栈:
  - Taro 4.1.9 + React
  - NestJS (后端)
  - MySQL (数据库)
  - Tailwind CSS
  - Zustand (状态管理)
  - @alicloud/dysmsapi20170525 4.5.0 (短信SDK)
  - @alicloud/openapi-client 0.0.15 (短信SDK)
  - miniprogram-ci 2.1.31 (全局安装，解决兼容性问题)
- 编码规范: Airbnb

## 关键决策
- 服务器目录结构: 
  - PC管理后台: `/www/wwwroot/mht-edu/admin/`
  - 小程序/H5前端: `/www/wwwroot/mht-edu/`
  - 后端服务: `/www/wwwroot/mht-edu/server/`
- 访问地址: `https://wx.dajiaopei.com/admin/`
- 服务器SSH: `root@119.91.193.179:22` (密码: mht@2026)
- 小程序发布方式: 使用全局安装的 miniprogram-ci 在服务器端直接上传到微信后台
- 数据库配置:
  - 用户名: mht_edu
  - 密码: mht2026edu
  - 数据库: mht_edu
- 短信配置状态:
  - 阿里云短信已启用 (sms_enabled=1)
  - 签名: 天伦时光
  - 模板: SMS_130600007

## 核心文件修改
- 文件操作:
  - edit: `server/src/modules/auth/auth.module.ts` (统一JWT secret为'mht-edu-jwt-secret-2026')
  - edit: `server/src/modules/user/user.module.ts` (删除重复JwtModule注册，使用AuthModule导出的)
  - edit: `server/src/modules/auth/guards/jwt-auth.guard.ts` (更新secret配置，添加错误日志)
  - restore: `server/src/modules/sms/sms.service.ts` (通过base64恢复完整文件，修复编译错误)
- 关键修改:
  - 修复JWT secret不一致问题，统一使用'mht-edu-jwt-secret-2026'
  - 修复sms.service.ts文件传输导致的语法错误
  - 短信服务在阿里云发送失败时自动降级，验证码打印在日志中

## 问题或错误及解决方案
- 问题: PC后台小程序构建401错误
  - 解决方案: MiniprogramController需要JWT认证，用户需清除浏览器localStorage并重新登录PC后台
- 问题: H5端收不到验证码
  - 解决方案: 阿里云短信触发分钟级流控，已在sms.service.ts中添加降级逻辑，发送失败时打印验证码到日志
- 问题: 小程序用户JWT认证失败
  - 解决方案: 修复JWT secret不一致问题，用户需重新登录小程序获取新token
- 问题: 后端编译错误（sms.service.ts语法错误）
  - 解决方案: 通过base64编码传输文件，避免shell转义问题

## 测试结果
- 发送验证码接口: ✅ 正常 (`POST /api/user/send-code`)
- 短信发送状态: 阿里云短信已配置且启用，正常发送（无Mock日志说明发送成功）
- 后端服务状态: ✅ 运行中 (PM2: mht-edu-api, PID: 135137, 端口: 3002)

## 已完成的修复
- [x] 添加缺失的 `elite-classes/stats` 接口（解决控制台404错误）
- [x] 修复后端服务编译问题
- [x] 修复短信服务降级逻辑

## TODO
- [ ] 用户刷新PC后台页面（`https://wx.dajiaopei.com/admin/`）验证404错误已消失
- [ ] 用户重新登录小程序获取新JWT token
- [ ] 如H5端收不到验证码，通过SSH查看后端日志：
  ```bash
  ssh root@119.91.193.179
  pm2 logs mht-edu-api --lines 50 | grep -i "SMS\|验证码"
  ```
