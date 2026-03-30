#!/bin/bash
# 棉花糖教育平台 - 一键部署脚本
# 用于将完整项目部署到服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="${SERVER_IP:-119.91.193.179}"
SERVER_USER="${SERVER_USER:-root}"
DEPLOY_DIR="${DEPLOY_DIR:-/www/wwwroot/mht-edu}"
DB_NAME="${DB_NAME:-mht_edu}"
DB_USER="${DB_USER:-mht_edu}"
DB_PASS="${DB_PASS:-mht2026edu}"
BACKEND_PORT="${BACKEND_PORT:-3002}"
DOMAIN="${DOMAIN:-wx.dajiaopei.com}"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}棉花糖教育平台 - 一键部署脚本${NC}"
echo -e "${BLUE}======================================${NC}"

# 检查本地代码是否已编译
echo -e "\n${YELLOW}[1/7] 检查编译状态...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}正在编译前端...${NC}"
    pnpm build:web
fi

if [ ! -d "server/dist" ]; then
    echo -e "${YELLOW}正在编译后端...${NC}"
    cd server && pnpm build && cd ..
fi

# 创建临时打包目录
echo -e "\n${YELLOW}[2/7] 创建部署包...${NC}"
PACKAGE_DIR="mht-edu-deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$PACKAGE_DIR"

# 复制文件
echo -e "${YELLOW}复制后端文件...${NC}"
cp -r server/dist "$PACKAGE_DIR/server/"
cp -r server/node_modules "$PACKAGE_DIR/server/" 2>/dev/null || true
cp server/package.json "$PACKAGE_DIR/server/"
cp server/.env.example "$PACKAGE_DIR/server/"

echo -e "${YELLOW}复制前端文件...${NC}"
mkdir -p "$PACKAGE_DIR/web"
cp -r dist/* "$PACKAGE_DIR/web/"

echo -e "${YELLOW}复制管理后台...${NC}"
mkdir -p "$PACKAGE_DIR/admin"
cp deploy_package/admin/* "$PACKAGE_DIR/admin/"

echo -e "${YELLOW}复制数据库脚本...${NC}"
mkdir -p "$PACKAGE_DIR/database"
cp deploy/database/*.sql "$PACKAGE_DIR/database/" 2>/dev/null || true

# 创建配置文件
echo -e "${YELLOW}创建配置文件...${NC}"
cat > "$PACKAGE_DIR/server/.env" << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS

# JWT配置
JWT_SECRET=mht-edu-jwt-secret-key-$(date +%s)

# 服务器配置
PORT=$BACKEND_PORT
NODE_ENV=production

# 域名配置
PROJECT_DOMAIN=https://$DOMAIN
EOF

# 创建PM2配置
cat > "$PACKAGE_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'mht-edu-server',
    script: 'dist/main.js',
    cwd: '/www/wwwroot/mht-edu/server',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_NAME: '$DB_NAME',
      DB_USER: '$DB_USER',
      DB_PASS: '$DB_PASS',
    },
    error_file: '/www/wwwlogs/mht-edu-server-error.log',
    out_file: '/www/wwwlogs/mht-edu-server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
EOF

# 创建部署脚本
cat > "$PACKAGE_DIR/deploy.sh" << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "======================================"
echo "开始部署棉花糖教育平台..."
echo "======================================"

# 停止旧服务
pm2 stop mht-edu-server 2>/dev/null || true

# 备份旧版本
if [ -d "/www/wwwroot/mht-edu/server" ]; then
    mv /www/wwwroot/mht-edu/server /www/wwwroot/mht-edu/server.bak.$(date +%Y%m%d%H%M%S) || true
fi

# 复制新文件
cp -r server /www/wwwroot/mht-edu/
cp -r web/* /www/wwwroot/mht-edu/web/ 2>/dev/null || mkdir -p /www/wwwroot/mht-edu/web && cp -r web/* /www/wwwroot/mht-edu/web/
cp -r admin /www/wwwroot/mht-edu/

# 安装依赖
cd /www/wwwroot/mht-edu/server
pnpm install --prod 2>/dev/null || npm install --prod

# 运行数据库迁移
echo "检查数据库表..."
mysql -u $DB_USER -p'$DB_PASS' $DB_NAME << 'SQL'
-- 创建短信验证码表
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expire_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile (mobile),
    INDEX idx_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 添加短信配置
INSERT IGNORE INTO site_config (config_key, config_value, status) VALUES
('sms_enabled', '0', 1),
('sms_access_key_id', '', 1),
('sms_access_key_secret', '', 1),
('sms_sign_name', '', 1),
('sms_template_code', '', 1);
SQL

# 启动服务
pm2 start /www/wwwroot/mht-edu/ecosystem.config.js
pm2 save

echo "======================================"
echo "部署完成！"
echo "======================================"
echo "后端服务: http://localhost:$BACKEND_PORT"
echo "管理后台: https://$DOMAIN/admin/"
echo "前端首页: https://$DOMAIN/"
DEPLOY_EOF

chmod +x "$PACKAGE_DIR/deploy.sh"

# 打包
echo -e "\n${YELLOW}[3/7] 打包部署文件...${NC}"
tar -czf "$PACKAGE_DIR.tar.gz" "$PACKAGE_DIR"
rm -rf "$PACKAGE_DIR"

echo -e "${GREEN}部署包已创建: $PACKAGE_DIR.tar.gz${NC}"

# 上传到服务器
echo -e "\n${YELLOW}[4/7] 上传到服务器...${NC}"
if command -v scp &> /dev/null; then
    scp "$PACKAGE_DIR.tar.gz" $SERVER_USER@$SERVER_IP:/tmp/
    echo -e "${GREEN}上传完成${NC}"
else
    echo -e "${YELLOW}请手动上传 $PACKAGE_DIR.tar.gz 到服务器 /tmp/ 目录${NC}"
fi

# 在服务器上执行部署
echo -e "\n${YELLOW}[5/7] 在服务器上解压...${NC}"
ssh $SERVER_USER@$SERVER_IP << REMOTE_EOF
set -e

# 创建目录
mkdir -p $DEPLOY_DIR
mkdir -p /www/wwwlogs

# 解压
cd /tmp
tar -xzf $PACKAGE_DIR.tar.gz
cd $PACKAGE_DIR

# 确保目录存在
mkdir -p $DEPLOY_DIR/server
mkdir -p $DEPLOY_DIR/web
mkdir -p $DEPLOY_DIR/admin

echo "解压完成"
REMOTE_EOF

echo -e "\n${YELLOW}[6/7] 执行部署脚本...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'REMOTE_EOF'
set -e

cd /tmp/mht-edu-deploy-*

# 设置数据库密码环境变量
export DB_USER='mht_edu'
export DB_PASS='mht2026edu'
export DB_NAME='mht_edu'
export BACKEND_PORT='3002'

# 停止旧服务
pm2 stop mht-edu-server 2>/dev/null || true

# 备份旧版本
if [ -d "/www/wwwroot/mht-edu/server/dist" ]; then
    echo "备份旧版本..."
    mv /www/wwwroot/mht-edu/server/dist /www/wwwroot/mht-edu/server/dist.bak.$(date +%Y%m%d%H%M%S) 2>/dev/null || true
fi

# 复制新文件
echo "复制服务器文件..."
cp -r server/dist /www/wwwroot/mht-edu/server/
cp server/package.json /www/wwwroot/mht-edu/server/
cp server/.env /www/wwwroot/mht-edu/server/
cp -r server/node_modules /www/wwwroot/mht-edu/server/ 2>/dev/null || true

echo "复制前端文件..."
mkdir -p /www/wwwroot/mht-edu/web
cp -r web/* /www/wwwroot/mht-edu/web/

echo "复制管理后台..."
cp -r admin /www/wwwroot/mht-edu/

# 安装依赖
echo "安装后端依赖..."
cd /www/wwwroot/mht-edu/server
pnpm install --prod 2>/dev/null || npm install --prod --legacy-peer-deps

# 运行数据库迁移
echo "检查数据库表..."
mysql -u mht_edu -p'mht2026edu' mht_edu << 'SQL' 2>/dev/null || true
-- 创建短信验证码表
CREATE TABLE IF NOT EXISTS sms_verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expire_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mobile (mobile),
    INDEX idx_expire (expire_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 添加短信配置
INSERT IGNORE INTO site_config (config_key, config_value, status, created_at, updated_at) VALUES
('sms_enabled', '0', 1, NOW(), NOW()),
('sms_access_key_id', '', 1, NOW(), NOW()),
('sms_access_key_secret', '', 1, NOW(), NOW()),
('sms_sign_name', '', 1, NOW(), NOW()),
('sms_template_code', '', 1, NOW(), NOW());
SQL

# 复制PM2配置
cp /www/wwwroot/mht-edu/ecosystem.config.js /www/wwwroot/mht-edu/ecosystem.config.js.bak 2>/dev/null || true
cat > /www/wwwroot/mht-edu/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'mht-edu-server',
    script: 'dist/main.js',
    cwd: '/www/wwwroot/mht-edu/server',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_NAME: 'mht_edu',
      DB_USER: 'mht_edu',
      DB_PASS: 'mht2026edu',
    },
    error_file: '/www/wwwlogs/mht-edu-server-error.log',
    out_file: '/www/wwwlogs/mht-edu-server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
PM2EOF

# 重启服务
echo "重启后端服务..."
pm2 restart mht-edu-server 2>/dev/null || pm2 start /www/wwwroot/mht-edu/ecosystem.config.js
pm2 save

echo "部署完成！"
REMOTE_EOF

# 清理本地临时文件
echo -e "\n${YELLOW}[7/7] 清理临时文件...${NC}"
rm -f "$PACKAGE_DIR.tar.gz"

echo -e "\n${GREEN}======================================"
echo -e "${GREEN}部署成功！${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e ""
echo -e "访问地址:"
echo -e "  ${BLUE}前端首页: https://$DOMAIN/${NC}"
echo -e "  ${BLUE}管理后台: https://$DOMAIN/admin/${NC}"
echo -e "  ${BLUE}API接口: https://$DOMAIN/api/${NC}"
echo -e ""
echo -e "管理员账号:"
echo -e "  ${YELLOW}用户名: admin${NC}"
echo -e "  ${YELLOW}密码: admin123${NC}"
echo -e ""
echo -e "后端服务状态:"
ssh $SERVER_USER@$SERVER_IP "pm2 status mht-edu-server"
