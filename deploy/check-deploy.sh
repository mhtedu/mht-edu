#!/bin/bash

# 棉花糖教育平台 - 部署状态检查脚本
# 在服务器上运行此脚本检查部署状态

echo "=========================================="
echo "  棉花糖教育平台 - 部署状态检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
PASS=0
FAIL=0

# 检查函数
check_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# 1. 检查Node.js
echo ">>> 检查 Node.js 环境"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js 已安装: $NODE_VERSION"
else
    check_fail "Node.js 未安装"
fi

# 2. 检查NPM
echo ""
echo ">>> 检查 NPM"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "NPM 已安装: $NPM_VERSION"
else
    check_fail "NPM 未安装"
fi

# 3. 检查PM2
echo ""
echo ">>> 检查 PM2"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    check_pass "PM2 已安装: $PM2_VERSION"
    
    # 检查服务状态
    if pm2 list | grep -q "mht-edu-api"; then
        if pm2 list | grep "mht-edu-api" | grep -q "online"; then
            check_pass "后端服务运行中"
        else
            check_fail "后端服务未运行"
        fi
    else
        check_warn "后端服务未配置"
    fi
else
    check_fail "PM2 未安装"
fi

# 4. 检查MySQL
echo ""
echo ">>> 检查 MySQL"
if command -v mysql &> /dev/null; then
    check_pass "MySQL 客户端已安装"
    
    # 检查数据库是否存在
    if mysql -u root -e "USE mht_edu;" 2>/dev/null; then
        check_pass "数据库 mht_edu 存在"
    else
        check_fail "数据库 mht_edu 不存在"
    fi
else
    check_fail "MySQL 未安装"
fi

# 5. 检查Nginx
echo ""
echo ">>> 检查 Nginx"
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    check_pass "Nginx 已安装: $NGINX_VERSION"
    
    # 检查Nginx配置
    if nginx -t 2>/dev/null; then
        check_pass "Nginx 配置正确"
    else
        check_fail "Nginx 配置有误"
    fi
else
    check_fail "Nginx 未安装"
fi

# 6. 检查项目文件
echo ""
echo ">>> 检查项目文件"
if [ -d "/www/wwwroot/mht-edu" ]; then
    check_pass "项目目录存在"
    
    if [ -d "/www/wwwroot/mht-edu/server" ]; then
        check_pass "后端目录存在"
    else
        check_fail "后端目录不存在"
    fi
    
    if [ -d "/www/wwwroot/mht-edu/dist-web" ]; then
        check_pass "前端目录存在"
    else
        check_fail "前端目录不存在"
    fi
else
    check_fail "项目目录不存在"
fi

# 7. 检查后端API
echo ""
echo ">>> 检查后端 API"
if curl -s http://localhost:3000/api/hello > /dev/null 2>&1; then
    check_pass "后端 API 响应正常"
else
    check_fail "后端 API 无响应"
fi

# 8. 检查端口
echo ""
echo ">>> 检查端口"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    check_pass "端口 3000 已监听"
else
    check_fail "端口 3000 未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ":80"; then
    check_pass "端口 80 已监听"
else
    check_fail "端口 80 未监听"
fi

# 总结
echo ""
echo "=========================================="
echo "  检查完成"
echo "=========================================="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}所有检查通过！部署正常！${NC}"
else
    echo ""
    echo -e "${YELLOW}请检查上述失败项并修复${NC}"
fi
