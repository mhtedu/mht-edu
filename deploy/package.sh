#!/bin/bash
# 打包部署文件

echo "正在创建部署包..."

# 创建临时目录
DEPLOY_DIR="deploy_package_$(date +%Y%m%d_%H%M%S)"
mkdir -p $DEPLOY_DIR/dist
mkdir -p $DEPLOY_DIR/server_dist

# 复制前端静态文件
cp public/admin.html $DEPLOY_DIR/dist/
cp public/admin.css $DEPLOY_DIR/dist/
cp public/admin.js $DEPLOY_DIR/dist/
cp public/login.html $DEPLOY_DIR/dist/

# 复制后端编译文件
cp -r server/dist/* $DEPLOY_DIR/server_dist/

# 复制配置文件
cp deploy/server-deploy.sh $DEPLOY_DIR/
cp SERVER_DEPLOY_GUIDE.md $DEPLOY_DIR/

# 复制package.json
cp server/package.json $DEPLOY_DIR/server_dist/

# 创建压缩包
tar -czvf ${DEPLOY_DIR}.tar.gz $DEPLOY_DIR

echo "部署包已创建: ${DEPLOY_DIR}.tar.gz"
echo "请将此文件上传到服务器并解压部署"
