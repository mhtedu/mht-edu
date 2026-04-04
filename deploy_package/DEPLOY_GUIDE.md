# 部署指南

## 服务器目录结构
```
/www/wwwroot/mht-edu/          # 站点目录（H5前端直接在这里）
├── index.html                 # H5入口
├── js/                        # H5 JS文件
├── css/                       # H5 CSS文件
├── admin/                     # 管理后台
├── dist-weapp/                # 小程序代码
├── server/                    # 后端执行目录
│   ├── dist/                  # 后端编译产物
│   └── src/                   # 后端源码
└── mht-edu-sync-*.tar.gz      # 同步包（上传后删除）
```

## 部署步骤

### 方式一：下载同步包后上传（推荐）

1. **下载同步包**
   - 文件路径：`/workspace/projects/deploy_package/mht-edu-sync-20260404_083105.tar.gz`
   - 文件大小：约 2.5MB

2. **上传到服务器**
   ```bash
   # 使用宝塔面板文件管理器上传
   # 或使用 scp 命令：
   scp mht-edu-sync-20260404_083105.tar.gz root@119.91.193.179:/www/wwwroot/mht-edu/
   ```

3. **在服务器执行更新**
   ```bash
   cd /www/wwwroot/mht-edu
   
   # 解压
   tar -xzf mht-edu-sync-20260404_083105.tar.gz
   
   # 执行更新脚本
   cd mht-edu-sync
   bash update.sh
   
   # 清理
   cd ..
   rm -rf mht-edu-sync mht-edu-sync-*.tar.gz
   ```

### 方式二：手动更新（如果脚本失败）

```bash
cd /www/wwwroot/mht-edu

# 备份
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp index.html "$BACKUP_DIR/" 2>/dev/null || true
cp -r js "$BACKUP_DIR/" 2>/dev/null || true
cp -r server/dist "$BACKUP_DIR/server_dist" 2>/dev/null || true

# 解压同步包
tar -xzf mht-edu-sync-20260404_083105.tar.gz

# 同步前端（直接在顶层目录）
cp mht-edu-sync/index.html .
cp -r mht-edu-sync/js/* js/
cp -r mht-edu-sync/css/* css/
cp -r mht-edu-sync/admin/* admin/

# 同步小程序
cp -r mht-edu-sync/dist-weapp/* dist-weapp/

# 同步后端
cp -r mht-edu-sync/server/dist/* server/dist/

# 清理
rm -rf mht-edu-sync mht-edu-sync-*.tar.gz

# 重启后端服务
cd server
pm2 restart mht-edu-server
```

## 本次更新内容

1. **H5 字体修复**
   - 文件：`index.html`
   - 修改：根字体计算公式从 `32 * screenWidth / 750` 改为 `16 * screenWidth / 375`
   - 效果：限制字体大小在 12-16px 范围内

2. **牛师详情页空值修复**
   - 文件：`js/*.js`（多个页面）
   - 修复：`teacher.name?.charAt(0) || '师'`
   - 修复：`teacher.real_name?.charAt(0) || teacher.nickname?.charAt(0) || '师'`
   - 修复：其他多处空值检查

3. **后端商品订单管理**
   - 文件：`server/dist/src/modules/admin/admin.controller.js`
   - 新增：商品订单管理接口

## 验证更新结果

1. **验证 H5 字体**
   - 访问：https://wx.dajiaopei.com/
   - 检查：字体大小是否正常（不过大）

2. **验证牛师详情**
   - 访问：https://wx.dajiaopei.com/ -> 点击牛师 -> 查看详情
   - 检查：页面是否正常加载，无白屏

3. **验证后端服务**
   ```bash
   curl https://wx.dajiaopei.com/api/hello
   ```

## 数据库更新（如需要）

如果服务器数据库表结构不是最新，请执行：

```bash
cd /www/wwwroot/mht-edu/server
npx sequelize-cli db:migrate
```

或手动执行 SQL：

```sql
-- 检查 products 表字段
SHOW COLUMNS FROM products;

-- 如果缺少字段，执行：
ALTER TABLE products ADD COLUMN virtual_sales INT DEFAULT 0;
ALTER TABLE products ADD COLUMN commission_1_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN commission_2_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN delivery_info TEXT;
ALTER TABLE products ADD COLUMN detail_content TEXT;
ALTER TABLE products ADD COLUMN video_url VARCHAR(500);

-- 检查订单表是否存在
SHOW TABLES LIKE 'product_orders';
```

## 常见问题

### Q: 更新后 H5 页面空白
A: 清除浏览器缓存，或使用无痕模式访问

### Q: 后端服务启动失败
A: 检查日志：
```bash
pm2 logs mht-edu-server
```

### Q: 数据库连接失败
A: 检查 `.env` 配置：
```bash
cat /www/wwwroot/mht-edu/server/.env | grep DB_
```
