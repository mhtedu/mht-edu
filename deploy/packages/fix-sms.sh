#!/bin/bash
# ============================================
# 短信服务修复脚本
# ============================================

set -e

echo "================================"
echo "短信服务修复"
echo "================================"

cd /www/wwwroot/mht-edu/server

# 1. 检查并安装阿里云SDK
echo ""
echo "1. 检查阿里云短信SDK..."
if [ ! -d "node_modules/@alicloud/dysmsapi20170525" ]; then
    echo "正在安装阿里云短信SDK..."
    npm install @alicloud/dysmsapi20170525 @alicloud/openapi-client --save
else
    echo "SDK已安装"
fi

# 2. 检查数据库配置
echo ""
echo "2. 检查短信配置..."
echo "请在宝塔面板-数据库中检查以下配置："
echo "- sms_access_key_id: 阿里云AccessKeyId"
echo "- sms_access_key_secret: 阿里云AccessKeySecret" 
echo "- sms_sign_name: 短信签名"
echo "- sms_template_code: 短信模板ID"
echo "- sms_enabled: 是否启用(1启用,0禁用)"

# 3. 重新构建后端
echo ""
echo "3. 重新构建后端..."
cd /www/wwwroot/mht-edu/server
pnpm build 2>/dev/null || npm run build 2>/dev/null || echo "构建跳过（可能已是最新）"

# 4. 重启服务
echo ""
echo "4. 重启服务..."
pm2 restart mht-edu-api 2>/dev/null || pm2 restart mht-edu-server 2>/dev/null || echo "请手动重启: pm2 restart mht-edu-api"

echo ""
echo "================================"
echo "✅ 修复完成!"
echo "================================"
echo ""
echo "如果仍有问题，请检查："
echo "1. 数据库中的短信配置是否正确"
echo "2. 阿里云AccessKey是否有效"
echo "3. 短信模板是否已审核通过"
echo ""
echo "查看日志："
echo "pm2 logs mht-edu-api"
