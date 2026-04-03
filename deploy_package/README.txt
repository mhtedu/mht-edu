================================
棉花糖教育平台 - 部署包
================================

版本: 2026-04-04
构建时间: $(date '+%Y-%m-%d %H:%M:%S')

【最近更新】
1. 修复 H5 端字体过大问题
   - 使用 requestAnimationFrame 覆盖 Taro 默认字体脚本
   - 字体计算公式: fontSize = 16 * screenWidth / 375

2. 修复牛师详情页空值问题
   - 修复 teacher.real_name 空值导致的显示问题
   - 为所有可能为空的字段添加默认值

3. 商品管理功能增强
   - 支持虚拟销量
   - 支持实物/虚拟发货
   - 支持两级佣金配置
   - 支持富文本详情

4. 数据库表结构更新
   - products 表新增字段: virtual_sales, delivery_type, delivery_info, commission_1_rate, commission_2_rate, detail_content, video_url
   - 新增 product_orders 表
   - 新增 product_order_logs 表

【部署说明】
1. H5 版本: 直接部署 index.html, js/, css/ 目录
2. 小程序版本: 使用 dist-weapp/ 目录上传到微信开发者工具
3. 后端服务: 在 server/ 目录执行 npm install && npm run start:prod

【环境要求】
- Node.js 18+
- MySQL 5.7+
- 内存: 512MB+
