#!/bin/bash
# ===================================
# 棉花糖教育平台 - 一键更新脚本
# ===================================
# 在服务器执行: curl -fsSL URL | bash
# 或下载后执行: bash update.sh

set -e

echo "================================"
echo "棉花糖教育平台 - 一键更新"
echo "================================"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

BASE_DIR="/www/wwwroot/mht-edu"

# 进入项目目录
cd "$BASE_DIR"

# 备份当前版本
echo "1. 备份当前版本..."
BACKUP_DIR="$BASE_DIR/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
[ -d "dist" ] && cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
[ -d "dist-weapp" ] && cp -r dist-weapp "$BACKUP_DIR/" 2>/dev/null || true
[ -d "server/dist" ] && cp -r server/dist "$BACKUP_DIR/server_dist" 2>/dev/null || true
echo "   ✅ 备份完成: $BACKUP_DIR"

# 检查更新包
SYNC_PACKAGE=$(ls -t mht-edu-sync-*.tar.gz 2>/dev/null | head -1)
if [ -z "$SYNC_PACKAGE" ]; then
    echo "❌ 未找到更新包 mht-edu-sync-*.tar.gz"
    echo "   请先上传更新包到 $BASE_DIR/"
    exit 1
fi

echo "2. 找到更新包: $SYNC_PACKAGE"
echo "   开始解压..."
tar -xzf "$SYNC_PACKAGE"

# 同步文件
echo "3. 同步文件..."

# 前端文件直接到站点根目录
if [ -d "mht-edu-sync/dist" ]; then
    # 确保目录存在
    mkdir -p dist/js dist/css dist/admin
    # 复制文件
    [ -f "mht-edu-sync/dist/index.html" ] && cp mht-edu-sync/dist/index.html dist/
    [ -d "mht-edu-sync/dist/js" ] && cp -r mht-edu-sync/dist/js/* dist/js/
    [ -d "mht-edu-sync/dist/css" ] && cp -r mht-edu-sync/dist/css/* dist/css/
    [ -d "mht-edu-sync/dist/admin" ] && cp -r mht-edu-sync/dist/admin/* dist/admin/
    echo "   ✅ 前端文件同步完成"
fi

# 小程序文件
if [ -d "mht-edu-sync/dist-weapp" ]; then
    mkdir -p dist-weapp
    cp -r mht-edu-sync/dist-weapp/* dist-weapp/
    echo "   ✅ 小程序文件同步完成"
fi

# 后端文件
if [ -d "mht-edu-sync/server" ]; then
    mkdir -p server/dist server/src
    [ -d "mht-edu-sync/server/dist" ] && cp -r mht-edu-sync/server/dist/* server/dist/
    [ -d "mht-edu-sync/server/src" ] && cp -r mht-edu-sync/server/src/* server/src/
    echo "   ✅ 后端文件同步完成"
fi

# 清理临时文件
rm -rf mht-edu-sync
echo "   ✅ 清理完成"

# 重启后端服务
echo "4. 重启后端服务..."
cd "$BASE_DIR/server"
if pm2 list | grep -q "mht-edu-server"; then
    pm2 restart mht-edu-server
else
    pm2 start dist/src/main.js --name mht-edu-server
fi
echo "   ✅ 后端服务重启完成"

# 验证服务
echo "5. 验证服务..."
sleep 3
if curl -s "http://localhost:3002/api/hello" > /dev/null 2>&1; then
    echo "   ✅ API 服务正常"
else
    echo "   ⚠️ API 服务响应异常，请检查日志"
fi

echo ""
echo "================================"
echo "✅ 更新完成！"
echo "================================"
echo ""
echo "访问地址:"
echo "  H5: https://wx.dajiaopei.com/"
echo "  管理后台: https://wx.dajiaopei.com/admin/"
echo ""
echo "本次更新内容:"
echo "  - 修复 H5 端字体过大问题"
echo "  - 修复牛师详情页空值问题"
echo "  - 增强商品管理功能"
echo ""
