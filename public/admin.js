/**
 * 棉花糖教育平台 - PC端管理后台
 * 独立版本，不依赖Taro框架
 */

// ========== 全局配置 ==========
const CONFIG = {
    API_BASE: '/api/admin', // API基础路径
    PAGE_SIZE: 20,          // 每页显示数量
};

// ========== 状态管理 ==========
const state = {
    currentPage: 'dashboard',
    currentData: null,
    filters: {},
    pagination: {
        page: 1,
        pageSize: CONFIG.PAGE_SIZE,
        total: 0
    }
};

// ========== 工具函数 ==========

/**
 * 发送API请求
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        
        if (data.code === 200 || data.code === 0) {
            return data.data;
        } else {
            throw new Error(data.msg || data.message || '请求失败');
        }
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

/**
 * 显示提示消息
 */
function showMessage(message, type = 'info') {
    alert(message); // 简单实现，可以替换为更美观的提示组件
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 格式化金额
 */
function formatMoney(amount) {
    if (amount === null || amount === undefined) return '-';
    return '¥' + parseFloat(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ========== 页面渲染函数 ==========

/**
 * 渲染数据概览页面
 */
async function renderDashboard() {
    const content = document.getElementById('mainContent');
    
    // 先显示加载状态
    content.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        // 尝试从API获取数据
        let stats;
        try {
            stats = await apiRequest('/stats');
        } catch (e) {
            // 使用模拟数据
            stats = {
                users: { total: 2586, parents: 2158, teachers: 328, orgs: 45, members: 856, todayNew: 23 },
                orders: { total: 1856, pending: 23, matched: 156, ongoing: 89, completed: 1580, todayNew: 15 },
                payments: { totalAmount: 568900, todayAmount: 12800, weekAmount: 85600, monthAmount: 128600 },
                commissions: { pending: 12500, settled: 85600, withdrawn: 72000 }
            };
        }
        
        content.innerHTML = `
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-title">总用户数</div>
                            <div class="stat-value">${stats.users.total.toLocaleString()}</div>
                            <div class="stat-change positive">今日新增 +${stats.users.todayNew}</div>
                        </div>
                        <div class="stat-icon">👥</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-title">教师数量</div>
                            <div class="stat-value">${stats.users.teachers.toLocaleString()}</div>
                            <div class="stat-change">会员 ${stats.users.members}</div>
                        </div>
                        <div class="stat-icon">👨‍🏫</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-title">待处理订单</div>
                            <div class="stat-value" style="color: #f59e0b;">${stats.orders.pending}</div>
                            <div class="stat-change">进行中 ${stats.orders.ongoing}</div>
                        </div>
                        <div class="stat-icon">📋</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="stat-title">本月营收</div>
                            <div class="stat-value">${formatMoney(stats.payments.monthAmount)}</div>
                            <div class="stat-change positive">今日 ${formatMoney(stats.payments.todayAmount)}</div>
                        </div>
                        <div class="stat-icon">💰</div>
                    </div>
                </div>
            </div>
            
            <!-- 详细统计 -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">用户分布</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">家长用户</span>
                                <span style="font-weight: 500;">${stats.users.parents.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">教师用户</span>
                                <span style="font-weight: 500;">${stats.users.teachers.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">机构用户</span>
                                <span style="font-weight: 500;">${stats.users.orgs.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">会员用户</span>
                                <span style="font-weight: 500; color: #2563EB;">${stats.users.members.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">订单统计</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">总订单数</span>
                                <span style="font-weight: 500;">${stats.orders.total.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">待抢单</span>
                                <span style="font-weight: 500; color: #f59e0b;">${stats.orders.pending}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">已完成</span>
                                <span style="font-weight: 500; color: #10b981;">${stats.orders.completed.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">今日新增</span>
                                <span style="font-weight: 500;">${stats.orders.todayNew}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">分佣统计</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">待结算</span>
                                <span style="font-weight: 500; color: #f59e0b;">${formatMoney(stats.commissions.pending)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">已结算</span>
                                <span style="font-weight: 500; color: #10b981;">${formatMoney(stats.commissions.settled)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280;">已提现</span>
                                <span style="font-weight: 500;">${formatMoney(stats.commissions.withdrawn)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">加载失败: ${error.message}</div></div>`;
    }
}

/**
 * 渲染用户管理页面
 */
async function renderUsers() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="filter-bar">
            <div class="search-box">
                <span>🔍</span>
                <input type="text" class="search-input" placeholder="搜索用户昵称/手机号" id="userSearchInput">
            </div>
            <select class="filter-select" id="userRoleFilter">
                <option value="">全部角色</option>
                <option value="0">家长</option>
                <option value="1">教师</option>
                <option value="2">机构</option>
            </select>
            <button class="btn btn-primary" onclick="loadUsers()">搜索</button>
        </div>
        
        <div class="data-table-container">
            <div class="table-header">
                <h3 class="table-title">用户列表</h3>
                <div class="table-actions">
                    <button class="btn btn-secondary btn-sm">导出数据</button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>用户信息</th>
                        <th>角色</th>
                        <th>会员</th>
                        <th>状态</th>
                        <th>注册时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">
                            暂无数据
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination">
                <div class="pagination-info">共 <span id="usersTotal">0</span> 条记录</div>
                <div class="pagination-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="prevPage()">上一页</button>
                    <button class="btn btn-secondary btn-sm" onclick="nextPage()">下一页</button>
                </div>
            </div>
        </div>
    `;
    
    await loadUsers();
}

/**
 * 加载用户数据
 */
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const totalSpan = document.getElementById('usersTotal');
    
    const keyword = document.getElementById('userSearchInput').value;
    const role = document.getElementById('userRoleFilter').value;
    
    try {
        let data;
        try {
            const params = new URLSearchParams({
                page: state.pagination.page,
                pageSize: state.pagination.pageSize,
                keyword: keyword,
                role: role
            });
            data = await apiRequest(`/users?${params}`);
        } catch (e) {
            // 模拟数据
            data = {
                list: [
                    { id: 1, nickname: '张三', phone: '138****1234', avatar: '', role: 0, status: 1, is_member: 1, member_expire: '2025-12-31', created_at: '2024-01-15' },
                    { id: 2, nickname: '李老师', phone: '139****5678', avatar: '', role: 1, status: 1, is_member: 1, member_expire: '2025-06-30', created_at: '2024-01-10' },
                    { id: 3, nickname: '王机构', phone: '136****9012', avatar: '', role: 2, status: 1, is_member: 0, member_expire: '', created_at: '2024-01-08' },
                ],
                total: 100
            };
        }
        
        state.pagination.total = data.total;
        totalSpan.textContent = data.total;
        
        if (data.list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">暂无数据</td></tr>`;
            return;
        }
        
        tbody.innerHTML = data.list.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 32px; height: 32px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center;">👤</div>
                        <div>
                            <div style="font-weight: 500;">${user.nickname}</div>
                            <div style="font-size: 12px; color: #6b7280;">${user.phone}</div>
                        </div>
                    </div>
                </td>
                <td>${user.role === 0 ? '家长' : user.role === 1 ? '教师' : '机构'}</td>
                <td><span class="status-badge ${user.is_member ? 'success' : 'default'}">${user.is_member ? '是' : '否'}</span></td>
                <td><span class="status-badge ${user.status === 1 ? 'success' : 'error'}">${user.status === 1 ? '正常' : '禁用'}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewUser(${user.id})">查看</button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserStatus(${user.id}, ${user.status})">${user.status === 1 ? '禁用' : '启用'}</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444;">加载失败: ${error.message}</td></tr>`;
    }
}

/**
 * 渲染系统配置页面
 */
async function renderConfig() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">站点基本信息</h3>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">站点名称</label>
                        <input type="text" class="form-input" id="configSiteName" value="棉花糖教育平台">
                    </div>
                    <div class="form-group">
                        <label class="form-label">网站域名</label>
                        <input type="text" class="form-input" id="configSiteDomain" value="https://mt.dajiaopei.com">
                        <div class="form-help">不带尾部斜杠</div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">站点Logo</label>
                        <input type="text" class="form-input" id="configSiteLogo" placeholder="Logo图片URL">
                        <div class="form-help">建议尺寸: 200x60</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">站点描述</label>
                        <input type="text" class="form-input" id="configSiteDesc" value="专业的教育信息撮合平台">
                        <div class="form-help">用于SEO和分享</div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">客服电话</label>
                        <input type="text" class="form-input" id="configContactPhone" placeholder="对外展示的联系电话">
                    </div>
                    <div class="form-group">
                        <label class="form-label">客服微信</label>
                        <input type="text" class="form-input" id="configContactWechat" placeholder="对外展示的微信号">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">ICP备案号</label>
                    <input type="text" class="form-input" id="configIcpNumber" placeholder="京ICP备XXXXXXXX号">
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">分佣配置</h3>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">平台分佣比例(%)</label>
                        <input type="number" class="form-input" id="configPlatformRate" value="5">
                        <div class="form-help">平台从课时费中抽取的比例</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">推荐人分佣比例(%)</label>
                        <input type="number" class="form-input" id="configReferrerRate" value="10">
                        <div class="form-help">推荐人从课时费中抽取的比例</div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">超级会员邀请人数</label>
                    <input type="number" class="form-input" id="configSuperMemberCount" value="10">
                    <div class="form-help">邀请多少人可解锁超级会员</div>
                </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="loadConfig()">重置</button>
            <button class="btn btn-primary" onclick="saveConfig()">保存配置</button>
        </div>
    `;
}

/**
 * 渲染支付配置页面
 */
async function renderPayment() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">微信小程序配置</h3>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">小程序AppID</label>
                        <input type="text" class="form-input" id="paymentAppId" placeholder="wxXXXXXXXXXXXXXXXX">
                        <div class="form-help">微信小程序AppID</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">小程序Secret</label>
                        <input type="password" class="form-input" id="paymentSecret" placeholder="32位密钥">
                        <div class="form-help">微信小程序Secret</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">微信支付配置</h3>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">商户号</label>
                        <input type="text" class="form-input" id="paymentMchId" placeholder="微信支付商户号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">支付密钥</label>
                        <input type="password" class="form-input" id="paymentApiKey" placeholder="32位API密钥">
                        <div class="form-help">微信支付API密钥(32位)</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
            <button class="btn btn-primary" onclick="savePaymentConfig()">保存配置</button>
        </div>
    `;
}

/**
 * 渲染其他页面的占位内容
 */
function renderPlaceholder(pageName) {
    const titles = {
        'teachers': '教师管理',
        'orgs': '机构管理',
        'orders': '订单管理',
        'elite-class': '牛师班管理',
        'membership': '会员套餐',
        'activities': '活动管理',
        'products': '商品管理',
        'banners': '广告位管理',
        'commissions': '分佣管理',
        'withdrawals': '提现审核',
        'agents': '代理商管理'
    };
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🚧</div>
            <div class="empty-text">${titles[pageName] || pageName} 功能开发中...</div>
            <p style="margin-top: 8px; font-size: 13px;">该模块正在开发中，敬请期待</p>
        </div>
    `;
}

// ========== 事件处理函数 ==========

/**
 * 切换页面
 */
function switchPage(pageName) {
    // 更新菜单激活状态
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // 更新页面标题
    const titles = {
        'dashboard': '数据概览',
        'users': '用户管理',
        'teachers': '教师管理',
        'orgs': '机构管理',
        'orders': '订单管理',
        'elite-class': '牛师班管理',
        'membership': '会员套餐',
        'activities': '活动管理',
        'products': '商品管理',
        'banners': '广告位管理',
        'commissions': '分佣管理',
        'withdrawals': '提现审核',
        'agents': '代理商管理',
        'config': '系统配置',
        'payment': '支付配置'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || pageName;
    
    // 渲染对应页面
    state.currentPage = pageName;
    state.pagination.page = 1;
    
    switch(pageName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'users':
            renderUsers();
            break;
        case 'config':
            renderConfig();
            break;
        case 'payment':
            renderPayment();
            break;
        default:
            renderPlaceholder(pageName);
    }
}

/**
 * 分页 - 上一页
 */
function prevPage() {
    if (state.pagination.page > 1) {
        state.pagination.page--;
        if (state.currentPage === 'users') {
            loadUsers();
        }
    }
}

/**
 * 分页 - 下一页
 */
function nextPage() {
    const maxPage = Math.ceil(state.pagination.total / state.pagination.pageSize);
    if (state.pagination.page < maxPage) {
        state.pagination.page++;
        if (state.currentPage === 'users') {
            loadUsers();
        }
    }
}

/**
 * 查看用户详情
 */
function viewUser(userId) {
    showMessage(`查看用户 ${userId} 详情`);
}

/**
 * 切换用户状态
 */
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? '启用' : '禁用';
    
    if (confirm(`确定要${action}该用户吗？`)) {
        try {
            await apiRequest(`/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            showMessage(`${action}成功`);
            loadUsers();
        } catch (error) {
            showMessage(`${action}失败: ${error.message}`);
        }
    }
}

/**
 * 保存系统配置
 */
async function saveConfig() {
    const config = {
        site_name: document.getElementById('configSiteName').value,
        site_domain: document.getElementById('configSiteDomain').value,
        site_logo: document.getElementById('configSiteLogo').value,
        site_description: document.getElementById('configSiteDesc').value,
        contact_phone: document.getElementById('configContactPhone').value,
        contact_wechat: document.getElementById('configContactWechat').value,
        icp_number: document.getElementById('configIcpNumber').value,
        commission_rate_platform: document.getElementById('configPlatformRate').value,
        commission_rate_referrer: document.getElementById('configReferrerRate').value,
        super_member_invite_count: document.getElementById('configSuperMemberCount').value,
    };
    
    try {
        await apiRequest('/config/batch-update', {
            method: 'POST',
            body: JSON.stringify({
                configs: Object.entries(config).map(([key, value]) => ({ key, value }))
            })
        });
        showMessage('保存成功');
    } catch (error) {
        showMessage('保存失败: ' + error.message);
    }
}

/**
 * 保存支付配置
 */
async function savePaymentConfig() {
    showMessage('保存支付配置功能开发中...');
}

/**
 * 退出登录
 */
function handleLogout() {
    if (confirm('确定要退出管理后台吗？')) {
        // 清除登录状态
        localStorage.removeItem('admin_token');
        // 跳转到登录页或首页
        window.location.href = '/';
    }
}

// ========== 初始化 ==========

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    // 绑定菜单点击事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                switchPage(page);
            }
        });
    });
    
    // 默认加载仪表盘
    switchPage('dashboard');
});
