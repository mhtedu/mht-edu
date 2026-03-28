#!/bin/bash
# 管理后台更新脚本 - 直接在服务器执行

cd /www/wwwroot/mht-edu/dist

# 1. 更新 login.html 密码提示
sed -i 's/admin \/ admin123/admin \/ password/g' login.html
echo "✅ login.html 已更新"

# 2. 备份 admin.js
cp admin.js admin.js.bak.$(date +%Y%m%d%H%M%S)

# 3. 更新 admin.js - 替换 renderPage 函数，添加新页面路由
sed -i '/case '\''orders'\'':$/,/break;$/a\            case '\''elite-class'\'':\n                await renderEliteClass();\n                break;\n            case '\''membership'\'':\n                await renderMembership();\n                break;\n            case '\''activities'\'':\n                await renderActivities();\n                break;\n            case '\''products'\'':\n                await renderProducts();\n                break;\n            case '\''banners'\'':\n                await renderBanners();\n                break;\n            case '\''commissions'\'':\n                await renderCommissions();\n                break;\n            case '\''withdrawals'\'':\n                await renderWithdrawals();\n                break;\n            case '\''agents'\'':\n                await renderAgents();\n                break;' admin.js

echo "✅ admin.js 路由已更新"

# 4. 追加新页面函数代码
cat >> admin.js << 'ADMINCODE'

// ========== 牛师班管理页面 ==========
async function renderEliteClass() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>牛师班列表</h3><button class="btn btn-primary">+ 创建牛师班</button></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>班级名称</th><th>授课教师</th><th>科目</th><th>报名人数</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><strong>高考数学冲刺班</strong></td><td>李老师</td><td>数学</td><td>15/20</td><td><span class="badge badge-success">进行中</span></td><td>2024-01-10</td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>2</td><td><strong>英语口语提升班</strong></td><td>王老师</td><td>英语</td><td>8/15</td><td><span class="badge badge-warning">报名中</span></td><td>2024-01-12</td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>3</td><td><strong>物理竞赛预备班</strong></td><td>张老师</td><td>物理</td><td>12/12</td><td><span class="badge badge-info">已满员</span></td><td>2024-01-08</td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 会员套餐管理页面 ==========
async function renderMembership() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>会员套餐配置</h3><button class="btn btn-primary">+ 添加套餐</button></div>
            <div class="card-body">
                <div class="membership-grid">
                    <div class="membership-card"><div class="membership-header"><h4>月度会员</h4><div class="membership-price">¥99/月</div></div><ul class="membership-features"><li>✓ 查看教师联系方式</li><li>✓ 发布需求无限次</li><li>✓ 参与活动优惠</li></ul><div class="membership-stats"><span>购买人数: 256人</span></div><div class="membership-actions"><button class="btn btn-sm btn-text">编辑</button></div></div>
                    <div class="membership-card popular"><div class="membership-badge">最受欢迎</div><div class="membership-header"><h4>季度会员</h4><div class="membership-price">¥259/季</div><div class="membership-save">节省¥38</div></div><ul class="membership-features"><li>✓ 查看教师联系方式</li><li>✓ 发布需求无限次</li><li>✓ 参与活动优惠</li><li>✓ 专属客服支持</li></ul><div class="membership-stats"><span>购买人数: 512人</span></div><div class="membership-actions"><button class="btn btn-sm btn-text">编辑</button></div></div>
                    <div class="membership-card"><div class="membership-header"><h4>年度会员</h4><div class="membership-price">¥799/年</div><div class="membership-save">节省¥389</div></div><ul class="membership-features"><li>✓ 查看教师联系方式</li><li>✓ 发布需求无限次</li><li>✓ 参与活动优惠</li><li>✓ 专属客服支持</li><li>✓ 优先推荐</li><li>✓ 年度报告</li></ul><div class="membership-stats"><span>购买人数: 128人</span></div><div class="membership-actions"><button class="btn btn-sm btn-text">编辑</button></div></div>
                </div>
            </div>
        </div>
        <style>.membership-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}.membership-card{border:1px solid #e5e7eb;border-radius:12px;padding:24px;position:relative}.membership-card.popular{border-color:#3b82f6;box-shadow:0 4px 12px rgba(59,130,246,0.2)}.membership-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#3b82f6;color:white;padding:4px 16px;border-radius:20px;font-size:12px}.membership-header h4{margin:0 0 8px 0;font-size:18px}.membership-price{font-size:28px;font-weight:bold;color:#3b82f6}.membership-save{color:#10b981;font-size:12px;margin-top:4px}.membership-features{list-style:none;padding:0;margin:16px 0}.membership-features li{padding:8px 0;border-bottom:1px solid #f3f4f6}.membership-stats{color:#6b7280;font-size:14px;margin-bottom:16px}</style>`;
}

// ========== 活动管理页面 ==========
async function renderActivities() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="tabs"><button class="tab-btn active">全部活动</button><button class="tab-btn">进行中</button><button class="tab-btn">已结束</button></div>
        <div class="card">
            <div class="card-header"><h3>活动列表</h3><button class="btn btn-primary">+ 创建活动</button></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>活动名称</th><th>类型</th><th>参与人数</th><th>开始时间</th><th>结束时间</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><strong>春季招生特惠</strong></td><td><span class="badge badge-info">线上</span></td><td>156人</td><td>2024-03-01</td><td>2024-03-31</td><td><span class="badge badge-success">进行中</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>2</td><td><strong>名师见面会</strong></td><td><span class="badge badge-warning">线下</span></td><td>45/100人</td><td>2024-03-15</td><td>2024-03-15</td><td><span class="badge badge-warning">报名中</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>3</td><td><strong>寒假课程促销</strong></td><td><span class="badge badge-info">线上</span></td><td>328人</td><td>2024-01-15</td><td>2024-02-15</td><td><span class="badge badge-default">已结束</span></td><td><button class="btn btn-sm btn-text">查看</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 商品管理页面 ==========
async function renderProducts() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="tabs"><button class="tab-btn active">全部商品</button><button class="tab-btn">上架中</button><button class="tab-btn">已下架</button></div>
        <div class="card">
            <div class="card-header"><h3>商品列表</h3><button class="btn btn-primary">+ 添加商品</button></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>商品名称</th><th>类型</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><strong>初中数学必刷题集</strong></td><td>实物商品</td><td>¥59.00</td><td>156</td><td>89</td><td><span class="badge badge-success">上架中</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button><button class="btn btn-sm btn-danger">下架</button></td></tr>
                        <tr><td>2</td><td><strong>英语语法精讲视频</strong></td><td>虚拟商品</td><td>¥199.00</td><td>∞</td><td>234</td><td><span class="badge badge-success">上架中</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button><button class="btn btn-sm btn-danger">下架</button></td></tr>
                        <tr><td>3</td><td><strong>学霸笔记合集</strong></td><td>虚拟商品</td><td>¥29.00</td><td>∞</td><td>567</td><td><span class="badge badge-default">已下架</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-success">上架</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 广告位管理页面 ==========
async function renderBanners() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>广告位配置</h3><button class="btn btn-primary">+ 添加广告</button></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>广告图片</th><th>广告标题</th><th>位置</th><th>点击次数</th><th>状态</th><th>排序</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td><td><strong>春季招生特惠</strong></td><td>首页轮播</td><td>1,234</td><td><span class="badge badge-success">展示中</span></td><td>1</td><td><button class="btn btn-sm btn-text">编辑</button><button class="btn btn-sm btn-danger">删除</button></td></tr>
                        <tr><td>2</td><td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td><td><strong>名师一对一</strong></td><td>首页轮播</td><td>856</td><td><span class="badge badge-success">展示中</span></td><td>2</td><td><button class="btn btn-sm btn-text">编辑</button><button class="btn btn-sm btn-danger">删除</button></td></tr>
                        <tr><td>3</td><td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td><td><strong>会员专享优惠</strong></td><td>我的页面</td><td>432</td><td><span class="badge badge-success">展示中</span></td><td>1</td><td><button class="btn btn-sm btn-text">编辑</button><button class="btn btn-sm btn-danger">删除</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 分佣管理页面 ==========
async function renderCommissions() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px">
            <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-content"><div class="stat-value">¥12,345</div><div class="stat-label">总分佣金额</div></div></div>
            <div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-content"><div class="stat-value">¥2,580</div><div class="stat-label">待结算</div></div></div>
            <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-content"><div class="stat-value">¥9,765</div><div class="stat-label">已结算</div></div></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>分佣记录</h3></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>推荐人</th><th>被推荐人</th><th>订单金额</th><th>佣金比例</th><th>佣金金额</th><th>状态</th><th>时间</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td>张老师</td><td>李家长</td><td>¥199.00</td><td>10%</td><td><strong>¥19.90</strong></td><td><span class="badge badge-success">已结算</span></td><td>2024-01-15</td></tr>
                        <tr><td>2</td><td>王老师</td><td>赵家长</td><td>¥299.00</td><td>10%</td><td><strong>¥29.90</strong></td><td><span class="badge badge-warning">待结算</span></td><td>2024-01-14</td></tr>
                        <tr><td>3</td><td>李老师</td><td>孙家长</td><td>¥799.00</td><td>10%</td><td><strong>¥79.90</strong></td><td><span class="badge badge-success">已结算</span></td><td>2024-01-13</td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 提现审核页面 ==========
async function renderWithdrawals() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="tabs"><button class="tab-btn active">全部申请</button><button class="tab-btn">待审核 (3)</button><button class="tab-btn">已通过</button><button class="tab-btn">已拒绝</button></div>
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>申请人</th><th>提现金额</th><th>账户信息</th><th>申请时间</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><div class="user-info"><span class="user-name">张老师</span><span class="user-phone">138****1234</span></div></td><td><strong>¥580.00</strong></td><td>微信支付</td><td>2024-01-15 10:30</td><td><span class="badge badge-warning">待审核</span></td><td><button class="btn btn-sm btn-success">通过</button><button class="btn btn-sm btn-danger">拒绝</button></td></tr>
                        <tr><td>2</td><td><div class="user-info"><span class="user-name">王机构</span><span class="user-phone">139****5678</span></div></td><td><strong>¥1,200.00</strong></td><td>银行卡: ****6789</td><td>2024-01-14 16:20</td><td><span class="badge badge-warning">待审核</span></td><td><button class="btn btn-sm btn-success">通过</button><button class="btn btn-sm btn-danger">拒绝</button></td></tr>
                        <tr><td>3</td><td><div class="user-info"><span class="user-name">李老师</span><span class="user-phone">137****9012</span></div></td><td><strong>¥350.00</strong></td><td>支付宝</td><td>2024-01-13 09:15</td><td><span class="badge badge-success">已通过</span></td><td><button class="btn btn-sm btn-text">查看</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}

// ========== 代理商管理页面 ==========
async function renderAgents() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="tabs"><button class="tab-btn active">全部代理</button><button class="tab-btn">待审核 (2)</button><button class="tab-btn">已授权</button></div>
        <div class="card">
            <div class="card-header"><h3>城市代理列表</h3><button class="btn btn-primary">+ 添加代理</button></div>
            <div class="card-body">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>代理商</th><th>代理城市</th><th>联系方式</th><th>下级用户</th><th>累计佣金</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td><strong>北京总代</strong></td><td>北京市</td><td>张总 / 138****1234</td><td>156人</td><td>¥12,580</td><td><span class="badge badge-success">已授权</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>2</td><td><strong>上海分代</strong></td><td>上海市</td><td>李经理 / 139****5678</td><td>89人</td><td>¥8,960</td><td><span class="badge badge-success">已授权</span></td><td><button class="btn btn-sm btn-text">查看</button><button class="btn btn-sm btn-text">编辑</button></td></tr>
                        <tr><td>3</td><td><strong>广州代理</strong></td><td>广州市</td><td>王主管 / 137****9012</td><td>0人</td><td>¥0</td><td><span class="badge badge-warning">待审核</span></td><td><button class="btn btn-sm btn-success">通过</button><button class="btn btn-sm btn-danger">拒绝</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;
}
ADMINCODE

echo "✅ admin.js 新页面函数已添加"
echo ""
echo "=========================================="
echo "🎉 更新完成！请刷新浏览器测试"
echo "=========================================="
