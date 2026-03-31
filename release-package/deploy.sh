#!/bin/bash
# 棉花糖教育平台 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e

SITE_DIR="/www/wwwroot/mht-edu"
BACKUP_DIR="/www/wwwroot/mht-edu-backup-$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "  棉花糖教育平台 - 部署脚本"
echo "=========================================="

# 1. 备份
echo ""
echo "[1/5] 备份现有文件..."
cp -r $SITE_DIR $BACKUP_DIR
echo "备份完成: $BACKUP_DIR"

# 2. 更新后端服务
echo ""
echo "[2/5] 更新后端服务..."
rm -rf $SITE_DIR/server/dist
cp -r server-dist $SITE_DIR/server/dist
cp package.json $SITE_DIR/server/package.json
echo "后端服务更新完成"

# 3. 更新管理后台
echo ""
echo "[3/5] 更新管理后台..."
rm -rf $SITE_DIR/admin
cp -r admin $SITE_DIR/admin
echo "管理后台更新完成"

# 4. 安装依赖
echo ""
echo "[4/5] 安装依赖..."
cd $SITE_DIR/server
pnpm install --prod
echo "依赖安装完成"

# 5. 重启服务
echo ""
echo "[5/5] 重启服务..."
pm2 restart mht-edu-server

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  前端H5: https://wx.dajiaopei.com/dist-web/"
echo "  管理后台: https://wx.dajiaopei.com/admin/"
echo ""
echo "短信配置:"
echo "  1. 登录管理后台 (admin / admin123)"
echo "  2. 进入「短信配置」菜单"
echo "  3. 填写阿里云配置并启用"
echo ""
