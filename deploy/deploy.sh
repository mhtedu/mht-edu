#!/bin/bash

# ===========================================
# 棉花糖教育平台 - 自动部署脚本
# ===========================================
# 使用方法: chmod +x deploy.sh && ./deploy.sh
# ===========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="mianhuatang"
DEPLOY_DIR="/var/www/mianhuatang"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/log/mianhuatang/deploy.log"

# 打印带颜色的信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 创建必要的目录
create_dirs() {
    info "创建必要的目录..."
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $DEPLOY_DIR/logs
    mkdir -p $DEPLOY_DIR/uploads
    mkdir -p /var/log/mianhuatang
    mkdir -p /var/www/certbot
}

# 备份当前版本
backup() {
    if [ -d "$DEPLOY_DIR/server/dist" ]; then
        info "备份当前版本..."
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf $BACKUP_FILE -C $DEPLOY_DIR server dist-web 2>/dev/null || true
        info "备份已保存到: $BACKUP_FILE"
    fi
}

# 安装依赖
install_deps() {
    info "安装后端依赖..."
    cd $DEPLOY_DIR/server
    
    if [ -f "package-lock.json" ]; then
        npm ci --production
    else
        npm install --production
    fi
}

# 构建项目
build() {
    info "构建后端项目..."
    cd $DEPLOY_DIR/server
    npm run build
    
    info "检查构建产物..."
    if [ ! -d "dist" ]; then
        error "构建失败: dist 目录不存在"
    fi
    
    info "构建完成!"
}

# 配置环境变量
setup_env() {
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        warn ".env 文件不存在，请手动配置"
        warn "cp $DEPLOY_DIR/deploy/.env.example $DEPLOY_DIR/.env"
        warn "然后编辑 .env 文件填写实际配置"
        exit 1
    fi
    info "环境变量配置已就绪"
}

# 启动服务
start_service() {
    info "启动服务..."
    cd $DEPLOY_DIR
    
    # 检查 PM2 是否已安装
    if ! command -v pm2 &> /dev/null; then
        error "PM2 未安装，请运行: npm install -g pm2"
    fi
    
    # 停止旧进程（如果存在）
    pm2 delete mianhuatang-api 2>/dev/null || true
    
    # 启动新进程
    pm2 start deploy/pm2.config.js
    
    # 保存 PM2 配置
    pm2 save
    
    info "服务已启动!"
    pm2 list
}

# 配置 Nginx
setup_nginx() {
    info "配置 Nginx..."
    
    if [ -f "/etc/nginx/conf.d/mianhuatang.conf" ]; then
        warn "Nginx 配置已存在，跳过"
        return
    fi
    
    if [ ! -f "$DEPLOY_DIR/deploy/nginx.conf" ]; then
        warn "Nginx 配置文件不存在，请手动配置"
        return
    fi
    
    # 提示用户输入域名
    read -p "请输入你的域名 (例如: example.com): " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        warn "未输入域名，跳过 Nginx 配置"
        return
    fi
    
    # 替换域名
    sed "s/your-domain.com/$DOMAIN/g" $DEPLOY_DIR/deploy/nginx.conf > /etc/nginx/conf.d/mianhuatang.conf
    
    # 测试配置
    nginx -t
    
    # 重载 Nginx
    nginx -s reload
    
    info "Nginx 配置完成!"
}

# 配置 SSL
setup_ssl() {
    info "配置 SSL 证书..."
    
    read -p "是否现在申请 SSL 证书? (y/n): " CONFIRM
    
    if [ "$CONFIRM" != "y" ]; then
        warn "跳过 SSL 配置，稍后可手动运行:"
        warn "certbot --nginx -d your-domain.com"
        return
    fi
    
    read -p "请输入你的域名: " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        warn "未输入域名，跳过 SSL 配置"
        return
    fi
    
    # 检查 Certbot
    if ! command -v certbot &> /dev/null; then
        info "安装 Certbot..."
        yum install -y certbot python3-certbot-nginx
    fi
    
    # 申请证书
    certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    info "SSL 证书配置完成!"
}

# 验证部署
verify() {
    info "验证部署..."
    
    # 检查后端服务
    sleep 3
    
    if curl -s http://localhost:3000/api > /dev/null; then
        info "✓ 后端服务正常运行"
    else
        warn "✗ 后端服务可能有问题，请检查日志"
    fi
    
    # 检查 Nginx
    if curl -s http://localhost > /dev/null; then
        info "✓ Nginx 正常运行"
    else
        warn "✗ Nginx 可能有问题"
    fi
    
    info "部署完成!"
    info "访问地址: https://your-domain.com"
}

# 主流程
main() {
    echo "==========================================="
    echo "  棉花糖教育平台 - 自动部署脚本"
    echo "==========================================="
    echo ""
    
    create_dirs
    backup
    setup_env
    install_deps
    build
    start_service
    
    read -p "是否配置 Nginx? (y/n): " SETUP_NGINX
    if [ "$SETUP_NGINX" = "y" ]; then
        setup_nginx
        setup_ssl
    fi
    
    verify
    
    echo ""
    echo "==========================================="
    echo "  部署完成!"
    echo "==========================================="
    echo ""
    echo "常用命令:"
    echo "  查看日志: pm2 logs mianhuatang-api"
    echo "  重启服务: pm2 restart mianhuatang-api"
    echo "  查看状态: pm2 list"
    echo ""
}

# 执行主流程
main
