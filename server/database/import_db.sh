#!/bin/bash
# ============================================
# 棉花糖教育平台 - 数据库一键导入脚本
# MySQL密码: mht2026edu
# ============================================

set -e

# 数据库配置
DB_HOST="localhost"
DB_USER="root"
DB_PASS="mht2026edu"
DB_NAME="mht_edu"
SQL_FILE="/www/wwwroot/mht-edu/server/database/mht_edu_all_in_one.sql"

echo "============================================"
echo "🚀 开始导入棉花糖教育平台数据库"
echo "============================================"
echo ""

# 检查SQL文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: SQL文件不存在: $SQL_FILE"
    exit 1
fi

echo "📁 SQL文件: $SQL_FILE"
echo "🗄️  数据库: $DB_NAME"
echo ""

# 测试MySQL连接
echo "🔍 测试数据库连接..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT VERSION();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ 数据库连接失败，请检查密码是否正确"
    exit 1
fi
echo "✅ 数据库连接成功"
echo ""

# 导入数据库
echo "⏳ 正在导入数据库，请稍候..."
echo ""

mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" < "$SQL_FILE"

echo ""
echo "============================================"
echo "✅ 数据库导入完成！"
echo "============================================"
echo ""
echo "📋 管理员账号："
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "⚠️  请登录后立即修改默认密码！"
echo "============================================"
