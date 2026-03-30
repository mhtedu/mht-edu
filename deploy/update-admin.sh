#!/bin/bash
# 快速更新管理后台脚本
# 仅更新 admin 文件夹，不重新部署整个项目

set -e

SERVER_IP="${SERVER_IP:-119.91.193.179}"
SERVER_USER="${SERVER_USER:-root}"

echo "更新管理后台..."

# 上传admin文件
scp -r deploy_package/admin/* $SERVER_USER@$SERVER_IP:/www/wwwroot/mht-edu/admin/

echo "管理后台更新完成！"
echo "访问: https://wx.dajiaopei.com/admin/"
