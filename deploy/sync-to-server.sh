#!/bin/bash
# ============================================
# 棉花糖教育平台 - 一键同步脚本
# 用法: ./deploy/sync-to-server.sh [--full]
# --full: 完整同步（包括admin管理后台）
# ============================================

set -e

SERVER="119.91.193.179"
REMOTE_DIR="/www/wwwroot/mht-edu"
LOCAL_DIR="/workspace/projects"
SSH_KEY="$HOME/.ssh/server_key"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}棉花糖教育平台 - 同步到服务器${NC}"
echo -e "${GREEN}================================${NC}"

# 检查SSH密钥
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}错误: SSH密钥不存在: $SSH_KEY${NC}"
    exit 1
fi

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# 测试连接
echo ""
echo -e "${YELLOW}测试服务器连接...${NC}"
if ! ssh $SSH_OPTS root@${SERVER} "echo '连接成功'" > /dev/null 2>&1; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 服务器连接正常${NC}"

# 1. 同步前端源码
echo ""
echo -e "${YELLOW}=== 1. 同步前端源码 ===${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist*' \
  -e "ssh $SSH_OPTS" \
  ${LOCAL_DIR}/src/ root@${SERVER}:${REMOTE_DIR}/src/
echo -e "${GREEN}✅ 前端源码已同步${NC}"

# 2. 同步后端源码
echo ""
echo -e "${YELLOW}=== 2. 同步后端源码 ===${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  -e "ssh $SSH_OPTS" \
  ${LOCAL_DIR}/server/src/ root@${SERVER}:${REMOTE_DIR}/server/src/
echo -e "${GREEN}✅ 后端源码已同步${NC}"

# 3. 同步配置文件
echo ""
echo -e "${YELLOW}=== 3. 同步配置文件 ===${NC}"
rsync -avz -e "ssh $SSH_OPTS" \
  ${LOCAL_DIR}/config/ root@${SERVER}:${REMOTE_DIR}/config/
echo -e "${GREEN}✅ 配置文件已同步${NC}"

# 4. 同步环境变量（如果本地有更新）
if [ -f "${LOCAL_DIR}/server/.env" ]; then
    echo ""
    echo -e "${YELLOW}=== 4. 同步环境变量 ===${NC}"
    rsync -avz -e "ssh $SSH_OPTS" \
      ${LOCAL_DIR}/server/.env root@${SERVER}:${REMOTE_DIR}/server/.env
    echo -e "${GREEN}✅ 环境变量已同步${NC}"
fi

# 5. 完整同步（可选：包括admin管理后台）
if [ "$1" == "--full" ]; then
    echo ""
    echo -e "${YELLOW}=== 5. 同步管理后台 ===${NC}"
    rsync -avz --exclude 'node_modules' --exclude '.git' \
      -e "ssh $SSH_OPTS" \
      ${LOCAL_DIR}/admin/ root@${SERVER}:${REMOTE_DIR}/admin/
    echo -e "${GREEN}✅ 管理后台已同步${NC}"
fi

# 6. 在服务器上构建并重启
echo ""
echo -e "${YELLOW}=== 6. 构建并重启服务 ===${NC}"
ssh $SSH_OPTS root@${SERVER} << 'ENDSSH'
cd /www/wwwroot/mht-edu

# 构建后端
echo "构建后端..."
cd server
if [ -f "package.json" ]; then
    npm run build 2>/dev/null || pnpm build 2>/dev/null || echo "⚠️ 构建命令不存在，使用已有产物"
fi

# 重启PM2
echo "重启PM2服务..."
if pm2 list | grep -q "mht-edu-api"; then
    pm2 restart mht-edu-api
else
    pm2 start dist/src/main.js --name mht-edu-api
fi

# 检查状态
pm2 list --no-color

# 测试API
echo ""
echo "测试API..."
sleep 2
curl -s http://127.0.0.1:3002/api/hello
ENDSSH

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "访问地址:"
echo "  H5前端:   https://wx.dajiaopei.com/"
echo "  管理后台: https://wx.dajiaopei.com/admin/"
echo "  API接口:  https://wx.dajiaopei.com/api/hello"
echo ""
echo "查看日志: ssh -i ~/.ssh/server_key root@${SERVER} 'pm2 logs mht-edu-api'"
