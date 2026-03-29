#!/bin/bash
# ============================================
# 棉花糖教育平台 - 远程服务器部署脚本
# ============================================

echo "============================================"
echo "棉花糖教育平台 - 数据库初始化"
echo "============================================"

# 配置数据库连接信息（请根据实际情况修改）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-mht_edu}"

# SQL 文件路径
SQL_FILE="./database/mht_edu_production.sql"

# 检查 SQL 文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: SQL 文件不存在: $SQL_FILE"
    exit 1
fi

echo ""
echo "📋 数据库配置信息："
echo "   主机: $DB_HOST:$DB_PORT"
echo "   数据库: $DB_NAME"
echo "   用户: $DB_USER"
echo ""

# 执行 SQL 文件
echo "🚀 开始导入数据库..."
echo ""

mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "✅ 数据库导入成功！"
    echo "============================================"
    echo ""
    echo "📋 默认管理员账号信息："
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo ""
    echo "⚠️  请登录后立即修改默认密码！"
    echo ""
else
    echo ""
    echo "============================================"
    echo "❌ 数据库导入失败！"
    echo "============================================"
    echo ""
    echo "请检查："
    echo "1. MySQL 服务是否正常运行"
    echo "2. 数据库连接信息是否正确"
    echo "3. 用户是否有足够的权限"
    echo ""
    exit 1
fi
