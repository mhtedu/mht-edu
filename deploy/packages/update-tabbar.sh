#!/bin/bash
# ============================================
# TabBar 更新脚本 - 将商城改为活动
# 在服务器上执行: bash update-tabbar.sh
# ============================================

set -e

# 目标文件
APP_CONFIG="/www/wwwroot/mht-edu/src/app.config.ts"

echo "================================"
echo "TabBar 更新 - 商城改为活动"
echo "================================"

# 检查文件是否存在
if [ ! -f "$APP_CONFIG" ]; then
    echo "错误: 找不到文件 $APP_CONFIG"
    exit 1
fi

# 备份原文件
BACKUP_FILE="${APP_CONFIG}.backup.$(date +%Y%m%d%H%M%S)"
cp "$APP_CONFIG" "$BACKUP_FILE"
echo "已备份到: $BACKUP_FILE"

# 修改 TabBar 配置
sed -i "s|pagePath: 'pages/mall/index'|pagePath: 'pages/activities/index'|g" "$APP_CONFIG"
sed -i "s|text: '商城'|text: '活动'|g" "$APP_CONFIG"
sed -i "s|iconPath: './assets/tabbar/mall.png'|iconPath: './assets/tabbar/square.png'|g" "$APP_CONFIG"
sed -i "s|selectedIconPath: './assets/tabbar/mall-active.png'|selectedIconPath: './assets/tabbar/square-active.png'|g" "$APP_CONFIG"

echo "已修改配置文件"

# 重新构建前端
echo ""
echo "开始重新构建 H5 前端..."
cd /www/wwwroot/mht-edu

# 检查是否有 pnpm
if command -v pnpm &> /dev/null; then
    pnpm build:web
elif command -v npm &> /dev/null; then
    npm run build:web
else
    echo "错误: 未找到 pnpm 或 npm"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 更新完成!"
echo "================================"
echo "请访问 https://wx.dajiaopei.com 查看效果"
echo "如果需要回滚，执行: cp $BACKUP_FILE $APP_CONFIG && pnpm build:web"
