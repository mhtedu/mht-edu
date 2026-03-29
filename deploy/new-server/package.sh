#!/bin/bash
# ===================================
# 棉花糖教育平台 - 部署包生成脚本
# ===================================

set -e

# 配置
PACKAGE_NAME="mht-edu-deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="deploy/packages"
WORKSPACE="/workspace/projects"

echo "===================================="
echo "  开始生成部署包"
echo "===================================="

# 创建输出目录
mkdir -p "$OUTPUT_DIR"
mkdir -p "/tmp/$PACKAGE_NAME"

echo "[1/7] 复制H5前端文件..."
cp -r "$WORKSPACE/dist-web" "/tmp/$PACKAGE_NAME/"

echo "[2/7] 复制小程序前端文件..."
cp -r "$WORKSPACE/dist-weapp" "/tmp/$PACKAGE_NAME/dist"

echo "[3/7] 复制后端文件..."
mkdir -p "/tmp/$PACKAGE_NAME/server"
cp -r "$WORKSPACE/server/dist" "/tmp/$PACKAGE_NAME/server/"
cp -r "$WORKSPACE/server/node_modules" "/tmp/$PACKAGE_NAME/server/" 2>/dev/null || echo "  跳过node_modules（将在服务器安装）"
cp "$WORKSPACE/server/package.json" "/tmp/$PACKAGE_NAME/server/"
cp "$WORKSPACE/server/package-lock.json" "/tmp/$PACKAGE_NAME/server/" 2>/dev/null || true

echo "[4/7] 复制PC管理后台..."
cp -r "$WORKSPACE/deploy_package/admin" "/tmp/$PACKAGE_NAME/"

echo "[5/7] 复制数据库文件..."
mkdir -p "/tmp/$PACKAGE_NAME/database"
cp "$WORKSPACE/server/database/mht_edu_all_in_one.sql" "/tmp/$PACKAGE_NAME/database/"

echo "[6/7] 复制配置文件..."
cp "$WORKSPACE/deploy/new-server/deploy.sh" "/tmp/$PACKAGE_NAME/"
cp "$WORKSPACE/deploy/new-server/nginx.conf.example" "/tmp/$PACKAGE_NAME/"
cp "$WORKSPACE/deploy/new-server/.env.example" "/tmp/$PACKAGE_NAME/"
cp "$WORKSPACE/deploy/new-server/ecosystem.config.js" "/tmp/$PACKAGE_NAME/"
cp "$WORKSPACE/deploy/new-server/README.md" "/tmp/$PACKAGE_NAME/"
cp "$WORKSPACE/deploy/new-server/完整部署指南.md" "/tmp/$PACKAGE_NAME/"

# 设置脚本权限
chmod +x "/tmp/$PACKAGE_NAME/deploy.sh"

echo "[7/7] 打包压缩..."
cd /tmp
tar -czf "$OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}.tar.gz" "$PACKAGE_NAME"

# 清理临时文件
rm -rf "/tmp/$PACKAGE_NAME"

# 计算文件大小
SIZE=$(du -h "$OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}.tar.gz" | cut -f1)

echo ""
echo "===================================="
echo "  部署包生成完成!"
echo "===================================="
echo ""
echo "文件名: ${PACKAGE_NAME}-${TIMESTAMP}.tar.gz"
echo "大小: $SIZE"
echo "路径: $OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}.tar.gz"
echo ""
echo "上传到服务器:"
echo "  scp $OUTPUT_DIR/${PACKAGE_NAME}-${TIMESTAMP}.tar.gz root@119.91.193.179:/www/wwwroot/"
echo ""
