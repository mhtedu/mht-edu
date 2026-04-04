#!/bin/bash
# ===================================
# 服务器端更新脚本
# ===================================
# 在服务器 /www/wwwroot/mht-edu/ 目录执行此脚本
# 用法: curl -fsSL https://your-domain/update.sh | bash

set -e

echo "================================"
echo "棉花糖教育平台 - 服务器更新"
echo "================================"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

BASE_DIR="/www/wwwroot/mht-edu"
DIST_DIR="$BASE_DIR/dist"
SERVER_DIR="$BASE_DIR/server"

# 备份当前版本
echo "1. 备份当前版本..."
BACKUP_DIR="$BASE_DIR/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r "$DIST_DIR" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$SERVER_DIR/dist" "$BACKUP_DIR/server_dist" 2>/dev/null || true
echo "   ✅ 备份完成: $BACKUP_DIR"

# 检查是否有更新包
if [ -f "$BASE_DIR/mht-edu-sync-*.tar.gz" ]; then
    echo "2. 发现更新包，开始解压..."
    cd "$BASE_DIR"
    tar -xzvf mht-edu-sync-*.tar.gz
    
    # 移动文件到正确位置
    echo "3. 同步文件..."
    
    # 同步前端到 dist/
    if [ -d "mht-edu-sync/dist" ]; then
        cp -r mht-edu-sync/dist/* "$DIST_DIR/"
        echo "   ✅ 前端文件同步完成"
    fi
    
    # 同步管理后台到 dist/admin/
    if [ -d "mht-edu-sync/dist/admin" ]; then
        mkdir -p "$DIST_DIR/admin"
        cp -r mht-edu-sync/dist/admin/* "$DIST_DIR/admin/"
        echo "   ✅ 管理后台同步完成"
    fi
    
    # 同步小程序到 dist-weapp/
    if [ -d "mht-edu-sync/dist-weapp" ]; then
        mkdir -p "$BASE_DIR/dist-weapp"
        cp -r mht-edu-sync/dist-weapp/* "$BASE_DIR/dist-weapp/"
        echo "   ✅ 小程序文件同步完成"
    fi
    
    # 同步后端到 server/dist/
    if [ -d "mht-edu-sync/server/dist" ]; then
        cp -r mht-edu-sync/server/dist/* "$SERVER_DIR/dist/"
        echo "   ✅ 后端编译文件同步完成"
    fi
    
    # 同步后端源代码
    if [ -d "mht-edu-sync/server/src" ]; then
        cp -r mht-edu-sync/server/src/* "$SERVER_DIR/src/"
        echo "   ✅ 后端源代码同步完成"
    fi
    
    # 清理临时文件
    rm -rf mht-edu-sync
    echo "   ✅ 清理完成"
else
    echo "2. 未发现更新包，跳过文件同步"
    echo "   请先上传 mht-edu-sync-*.tar.gz 到 $BASE_DIR/"
fi

# 重启后端服务
echo "4. 重启后端服务..."
cd "$SERVER_DIR"
pm2 restart mht-edu-server 2>/dev/null || pm2 start dist/src/main.js --name mht-edu-server
echo "   ✅ 后端服务重启完成"

# 验证服务
echo "5. 验证服务..."
sleep 2
if curl -s "http://localhost:3002/api/hello" > /dev/null 2>&1; then
    echo "   ✅ API 服务正常"
else
    echo "   ⚠️ API 服务可能需要检查"
fi

echo ""
echo "================================"
echo "更新完成！"
echo "================================"
echo ""
echo "访问地址:"
echo "  H5: https://wx.dajiaopei.com/"
echo "  管理后台: https://wx.dajiaopei.com/admin/"
echo ""
