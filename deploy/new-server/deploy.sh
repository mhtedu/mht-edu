#!/bin/bash
# ===================================
# 棉花糖教育平台 - 一键部署脚本
# ===================================
# 适用于: 宝塔面板环境
# 作者: Coze AI
# 日期: 2026-03-29

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="棉花糖教育平台"
PROJECT_DIR="/www/wwwroot/mht-edu"
SERVER_DIR="$PROJECT_DIR/server"
DB_NAME="mht_edu"
DB_USER="mht_edu"
SERVER_PORT=3002

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "未安装Node.js，请先在宝塔面板安装PM2管理器"
        exit 1
    fi
    
    # 检查pm2
    if ! command -v pm2 &> /dev/null; then
        log_error "未安装PM2，请先在宝塔面板安装PM2管理器"
        exit 1
    fi
    
    # 检查MySQL
    if ! command -v mysql &> /dev/null; then
        log_error "未安装MySQL，请先在宝塔面板安装MySQL"
        exit 1
    fi
    
    log_info "依赖检查通过"
}

# 创建目录
create_directories() {
    log_info "创建项目目录..."
    
    mkdir -p "$PROJECT_DIR"
    mkdir -p "$PROJECT_DIR/dist-web"
    mkdir -p "$PROJECT_DIR/server"
    mkdir -p "$PROJECT_DIR/admin"
    mkdir -p "$PROJECT_DIR/database"
    mkdir -p /www/wwwlogs
    
    log_info "目录创建完成"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."
    
    if [ ! -f "$SERVER_DIR/.env" ]; then
        log_warn "未找到.env文件，请手动配置"
        log_warn "复制 .env.example 为 .env 并修改配置"
        return 1
    fi
    
    log_info "环境变量配置完成"
}

# 安装后端依赖
install_dependencies() {
    log_info "安装后端依赖..."
    
    cd "$SERVER_DIR"
    
    if [ -f "package.json" ]; then
        pnpm install --production || npm install --production
        log_info "依赖安装完成"
    else
        log_error "未找到package.json"
        exit 1
    fi
}

# 导入数据库
import_database() {
    log_info "导入数据库..."
    
    local sql_file="$PROJECT_DIR/database/mht_edu_all_in_one.sql"
    
    if [ ! -f "$sql_file" ]; then
        log_error "未找到SQL文件: $sql_file"
        return 1
    fi
    
    log_warn "请输入数据库密码:"
    mysql -u "$DB_USER" -p "$DB_NAME" < "$sql_file"
    
    if [ $? -eq 0 ]; then
        log_info "数据库导入成功"
    else
        log_error "数据库导入失败"
        return 1
    fi
}

# 启动服务
start_service() {
    log_info "启动后端服务..."
    
    cd "$SERVER_DIR"
    
    # 停止旧服务
    pm2 delete mht-edu-server 2>/dev/null || true
    
    # 启动新服务
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start dist/src/main.js --name mht-edu-server
    fi
    
    # 保存PM2配置
    pm2 save
    
    log_info "服务启动成功"
}

# 配置Nginx
setup_nginx() {
    log_info "配置Nginx..."
    
    local nginx_conf="/www/server/panel/vhost/nginx/wx.dajiaopei.com.conf"
    
    if [ -f "nginx.conf.example" ]; then
        log_warn "请手动将 nginx.conf.example 内容复制到宝塔面板网站配置中"
    fi
    
    # 测试Nginx配置
    nginx -t
    
    # 重载Nginx
    nginx -s reload
    
    log_info "Nginx配置完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 检查服务状态
    if pm2 list | grep -q "mht-edu-server.*online"; then
        log_info "✓ 后端服务运行正常"
    else
        log_error "✗ 后端服务异常"
        return 1
    fi
    
    # 测试API
    if curl -s "http://localhost:$SERVER_PORT/api/health" | grep -q "ok"; then
        log_info "✓ API接口正常"
    else
        log_error "✗ API接口异常"
        return 1
    fi
    
    # 检查前端文件
    if [ -f "$PROJECT_DIR/dist-web/index.html" ]; then
        log_info "✓ 前端文件存在"
    else
        log_error "✗ 前端文件缺失"
        return 1
    fi
    
    log_info "部署验证完成"
}

# 显示结果
show_result() {
    echo ""
    echo "===================================="
    echo "  $PROJECT_NAME 部署完成"
    echo "===================================="
    echo ""
    echo "访问地址:"
    echo "  前端: https://wx.dajiaopei.com"
    echo "  API:  https://wx.dajiaopei.com/api"
    echo "  后台: https://wx.dajiaopei.com/admin/"
    echo ""
    echo "默认管理员账户:"
    echo "  用户名: admin"
    echo "  密码: admin123"
    echo "  ⚠️  请登录后立即修改密码!"
    echo ""
    echo "查看服务状态:"
    echo "  pm2 list"
    echo "  pm2 logs mht-edu-server"
    echo ""
    echo "===================================="
}

# 主流程
main() {
    echo ""
    echo "===================================="
    echo "  $PROJECT_NAME 一键部署脚本"
    echo "===================================="
    echo ""
    
    check_root
    check_dependencies
    create_directories
    
    # 询问用户
    read -p "是否已上传部署文件到 $PROJECT_DIR? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "请先上传部署文件"
        exit 1
    fi
    
    setup_env
    install_dependencies
    
    read -p "是否导入数据库? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        import_database
    fi
    
    start_service
    setup_nginx
    verify_deployment
    show_result
}

# 执行主流程
main "$@"
