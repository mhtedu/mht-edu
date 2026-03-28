#!/bin/bash

# 棉花糖教育平台 - 更新部署脚本
# 使用方式: bash update.sh

set -e

PROJECT_DIR="/www/wwwroot/mht-edu"
SERVER_DIR="$PROJECT_DIR/server"

echo "=========================================="
echo "  棉花糖教育平台 - 更新部署"
echo "=========================================="
echo ""

# 检查是否有参数
UPDATE_BACKEND=false
UPDATE_FRONTEND=false

if [ "$1" = "backend" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
    UPDATE_BACKEND=true
fi

if [ "$1" = "frontend" ] || [ "$1" = "all" ] || [ -z "$1" ]; then
    UPDATE_FRONTEND=true
fi

# 更新后端
if [ "$UPDATE_BACKEND" = true ]; then
    echo ">>> 更新后端代码..."
    cd $SERVER_DIR
    
    echo "    - 安装依赖..."
    npm install --production
    
    echo "    - 编译代码..."
    npm run build
    
    echo "    - 重启服务..."
    pm2 restart mht-edu-api
    
    echo "✅ 后端更新完成"
fi

# 更新前端
if [ "$UPDATE_FRONTEND" = true ]; then
    echo ">>> 更新前端代码..."
    # 前端是静态文件，直接替换即可
    # 如果需要重新打包，请确保源码存在
    if [ -f "$PROJECT_DIR/package.json" ]; then
        echo "    - 重新打包前端..."
        cd $PROJECT_DIR
        npm run build:web
    else
        echo "    - 前端静态文件已更新"
    fi
    
    echo "✅ 前端更新完成"
fi

echo ""
echo "=========================================="
echo "  更新完成！"
echo "=========================================="
echo ""
echo "验证部署："
echo "  - 访问网站: http://你的域名"
echo "  - 测试API: curl http://localhost:3000/api/hello"
echo ""
echo "查看日志："
echo "  - 后端日志: pm2 logs mht-edu-api"
echo ""
