#!/bin/bash
# 同步代码到服务器脚本
# 使用方法: bash sync-to-server.sh

SERVER="root@47.115.230.248"
REMOTE_PATH="/www/wwwroot/mht-edu"
LOCAL_PATH="/workspace/projects"

echo "=== 开始同步代码到服务器 ==="

# 同步修改的文件
echo "同步 admin 页面..."
scp "${LOCAL_PATH}/src/pages/admin/index.tsx" "${SERVER}:${REMOTE_PATH}/src/pages/admin/index.tsx"

# 检查同步是否成功
if [ $? -eq 0 ]; then
    echo "✅ 文件同步成功"
    
    echo ""
    echo "=== 在服务器上执行以下命令 ==="
    echo "cd ${REMOTE_PATH}"
    echo "pnpm install"
    echo "pnpm build:web"
    echo "pm2 restart mht-edu-server"
else
    echo "❌ 同步失败，请检查 SSH 连接"
fi
