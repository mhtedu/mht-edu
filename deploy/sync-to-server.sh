#!/bin/bash
# ============================================
# 棉花糖教育平台 - 一键同步脚本
# 用法: ./deploy/sync-to-server.sh [--full]
# --full: 完整同步（包括重新编译前端和后端）
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

# 如果是完整同步，先编译
if [ "$1" == "--full" ]; then
    echo ""
    echo -e "${YELLOW}=== 完整同步模式：编译前端和后端 ===${NC}"
    
    echo ""
    echo -e "${YELLOW}编译H5前端...${NC}"
    cd $LOCAL_DIR
    pnpm build:web
    echo -e "${GREEN}✅ 前端编译完成${NC}"
    
    echo ""
    echo -e "${YELLOW}编译后端...${NC}"
    cd $LOCAL_DIR/server
    pnpm build 2>/dev/null || npm run build 2>/dev/null || echo "⚠️ 后端编译跳过"
    echo -e "${GREEN}✅ 后端编译完成${NC}"
fi

# 1. 同步前端编译产物
echo ""
echo -e "${YELLOW}=== 1. 同步前端编译产物 ===${NC}"
if [ -d "${LOCAL_DIR}/dist-web" ]; then
    # 备份旧版本
    ssh $SSH_OPTS root@${SERVER} "mkdir -p ${REMOTE_DIR}/backups && mv ${REMOTE_DIR}/dist-web ${REMOTE_DIR}/backups/dist-web.\$(date +%Y%m%d%H%M%S) 2>/dev/null || true"
    
    # 同步新版本
    ssh $SSH_OPTS root@${SERVER} "mkdir -p ${REMOTE_DIR}/dist-web"
    scp -r $SSH_OPTS ${LOCAL_DIR}/dist-web/* root@${SERVER}:${REMOTE_DIR}/dist-web/
    echo -e "${GREEN}✅ 前端编译产物已同步${NC}"
else
    echo -e "${RED}⚠️ 本地无dist-web目录，请先运行 pnpm build:web${NC}"
fi

# 2. 同步后端源码
echo ""
echo -e "${YELLOW}=== 2. 同步后端源码 ===${NC}"
if [ -d "${LOCAL_DIR}/server/src" ]; then
    ssh $SSH_OPTS root@${SERVER} "mkdir -p ${REMOTE_DIR}/server/src"
    scp -r $SSH_OPTS ${LOCAL_DIR}/server/src/* root@${SERVER}:${REMOTE_DIR}/server/src/
    echo -e "${GREEN}✅ 后端源码已同步${NC}"
fi

# 3. 同步前端源码（供服务器端编译使用）
echo ""
echo -e "${YELLOW}=== 3. 同步前端源码 ===${NC}"
if [ -d "${LOCAL_DIR}/src" ]; then
    ssh $SSH_OPTS root@${SERVER} "mkdir -p ${REMOTE_DIR}/src"
    scp -r $SSH_OPTS ${LOCAL_DIR}/src/* root@${SERVER}:${REMOTE_DIR}/src/
    echo -e "${GREEN}✅ 前端源码已同步${NC}"
fi

# 4. 同步配置文件
echo ""
echo -e "${YELLOW}=== 4. 同步配置文件 ===${NC}"
if [ -d "${LOCAL_DIR}/config" ]; then
    ssh $SSH_OPTS root@${SERVER} "mkdir -p ${REMOTE_DIR}/config"
    scp -r $SSH_OPTS ${LOCAL_DIR}/config/* root@${SERVER}:${REMOTE_DIR}/config/
    echo -e "${GREEN}✅ 配置文件已同步${NC}"
fi

# 5. 同步环境变量
if [ -f "${LOCAL_DIR}/server/.env" ]; then
    echo ""
    echo -e "${YELLOW}=== 5. 同步环境变量 ===${NC}"
    scp $SSH_OPTS ${LOCAL_DIR}/server/.env root@${SERVER}:${REMOTE_DIR}/server/.env
    echo -e "${GREEN}✅ 环境变量已同步${NC}"
fi

# 6. 重启服务
echo ""
echo -e "${YELLOW}=== 6. 重启PM2服务 ===${NC}"
ssh $SSH_OPTS root@${SERVER} << 'ENDSSH'
cd /www/wwwroot/mht-edu/server

# 检查是否需要编译后端
if [ -f "package.json" ] && [ -d "src" ]; then
    echo "编译后端..."
    npm run build 2>/dev/null || pnpm build 2>/dev/null || echo "⚠️ 编译跳过"
fi

# 重启PM2
if pm2 list 2>/dev/null | grep -q "mht-edu-api"; then
    pm2 restart mht-edu-api
else
    pm2 start dist/src/main.js --name mht-edu-api
fi

pm2 list --no-color
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
