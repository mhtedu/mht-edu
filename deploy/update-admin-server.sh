#!/bin/bash
# 在服务器上直接执行此脚本更新管理后台

# 创建临时目录
mkdir -p /tmp/admin_update

# 下载更新的admin.js（这里需要您手动上传或使用curl从可访问的URL下载）
# 或者直接使用以下方式创建文件

# 备份原文件
cp /www/wwwroot/mht-edu/admin/admin.js /www/wwwroot/mht-edu/admin/admin.js.bak.$(date +%Y%m%d%H%M%S)

echo "=== 管理后台更新脚本 ==="
echo "请执行以下步骤："
echo "1. 在本地查看 mht-edu-final-*/admin/admin.js 文件内容"
echo "2. 复制完整内容"
echo "3. 在服务器上创建新文件: vi /www/wwwroot/mht-edu/admin/admin.js"
echo "4. 粘贴内容并保存"
echo ""
echo "或者使用宝塔面板的文件编辑功能直接更新"
