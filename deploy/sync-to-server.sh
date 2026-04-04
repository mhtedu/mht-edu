#!/bin/bash
# ===================================
# 棉花糖教育平台 - 同步到服务器脚本
# ===================================
# 将本地 deploy_package 同步到服务器正确目录

set -e

SERVER_IP="${SERVER_IP:-119.91.193.179}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_BASE="/www/wwwroot/mht-edu"

echo "================================"
echo "棉花糖教育平台 - 服务器同步"
echo "================================"
echo "服务器: $SERVER_USER@$SERVER_IP"
echo "目标目录: $SERVER_BASE"
echo ""

# 检查 SSH 连接
echo "检查 SSH 连接..."
ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'SSH 连接成功'" || {
    echo "错误: 无法连接到服务器，请检查 SSH 配置"
    exit 1
}

echo ""
echo "开始同步文件..."
echo ""

# 1. 同步前端 H5 文件到 dist/
echo "1. 同步前端 H5 文件..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_BASE/dist/js $SERVER_BASE/dist/css"
scp deploy_package/index.html $SERVER_USER@$SERVER_IP:$SERVER_BASE/dist/
scp -r deploy_package/js/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/dist/js/
scp -r deploy_package/css/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/dist/css/
echo "   ✅ 前端 H5 同步完成"

# 2. 同步管理后台到 dist/admin/
echo "2. 同步管理后台..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_BASE/dist/admin"
scp -r deploy_package/admin/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/dist/admin/
echo "   ✅ 管理后台同步完成"

# 3. 同步小程序到 dist-weapp/
echo "3. 同步小程序文件..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_BASE/dist-weapp"
scp -r deploy_package/dist-weapp/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/dist-weapp/
echo "   ✅ 小程序同步完成"

# 4. 同步后端编译文件到 server/dist/
echo "4. 同步后端编译文件..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_BASE/server/dist"
scp -r deploy_package/server/dist/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/server/dist/
echo "   ✅ 后端编译文件同步完成"

# 5. 同步后端源代码到 server/src/ (可选，用于服务器编译)
echo "5. 同步后端源代码..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_BASE/server/src"
scp -r deploy_package/server/src/* $SERVER_USER@$SERVER_IP:$SERVER_BASE/server/src/
echo "   ✅ 后端源代码同步完成"

# 6. 重启后端服务
echo "6. 重启后端服务..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_BASE/server && pm2 restart mht-edu-server || pm2 start dist/src/main.js --name mht-edu-server"
echo "   ✅ 后端服务重启完成"

echo ""
echo "================================"
echo "同步完成！"
echo "================================"
echo ""
echo "访问地址:"
echo "  H5: https://wx.dajiaopei.com/"
echo "  管理后台: https://wx.dajiaopei.com/admin/"
echo ""
