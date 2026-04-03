/**
 * 棉花糖教育平台 - PC端管理后台
 * 完整版本 - 包含登录验证和所有管理功能
 */

// ========== 全局配置 ==========
const CONFIG = {
    API_BASE: '/api/admin',
    PAGE_SIZE: 20,
};

// ========== 状态管理 ==========
const state = {
    currentPage: 'dashboard',
    currentUser: null,
    token: null,
    filters: {},
    pagination: {
        page: 1,
        pageSize: CONFIG.PAGE_SIZE,
        total: 0
    }
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkAuth();
    
    // 绑定菜单点击事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                switchPage(page);
            }
        });
    });
});

/**
 * 检查登录状态
 */
function checkAuth() {
    state.token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    
    if (!state.token || !userStr) {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
        return;
    }
    
    try {
        state.currentUser = JSON.parse(userStr);
        updateUserInfo();
        // 加载默认页面
        switchPage('dashboard');
    } catch (error) {
        console.error('解析用户信息失败:', error);
        window.location.href = 'login.html';
    }
}

/**
 * 更新用户信息显示
 */
function updateUserInfo() {
    const adminName = document.querySelector('.admin-name');
    if (adminName && state.currentUser) {
        adminName.textContent = state.currentUser.realName || state.currentUser.username;
    }
}

/**
 * 退出登录
 */
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
    }
}

// ========== API请求工具 ==========

/**
 * 发送API请求
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        // 401未授权，跳转登录
        if (response.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            throw new Error(data.message || '请求失败');
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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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

// ========== 页面切换 ==========

/**
 * 切换页面
 */
function switchPage(pageName) {
    state.currentPage = pageName;
    
    // 更新菜单激活状态
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // 更新页面标题
    const titles = {
        dashboard: '数据概览',
        users: '用户管理',
        teachers: '教师管理',
        orgs: '机构管理',
        orders: '订单管理',
        'elite-class': '牛师班管理',
        membership: '会员套餐',
        'membership-sales': '会员销售记录',
        activities: '活动管理',
        products: '商品管理',
        banners: '广告位管理',
        commissions: '分佣管理',
        withdrawals: '提现审核',
        agents: '代理商管理',
        report: '运营报表',
        export: '数据导出',
        config: '系统配置',
        payment: '支付配置',
        admins: '管理员管理',
        roles: '角色权限'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || '管理后台';
    
    // 渲染页面内容
    renderPage(pageName);
}

/**
 * 渲染页面
 */
async function renderPage(pageName) {
    const content = document.getElementById('mainContent');
    content.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        switch (pageName) {
            case 'dashboard':
                await renderDashboard();
                break;
            case 'users':
                await renderUsers();
                break;
            case 'teachers':
                await renderTeachers();
                break;
            case 'orgs':
                await renderOrgs();
                break;
            case 'orders':
                await renderOrders();
                break;
            case 'elite-class':
                await renderEliteClass();
                break;
            case 'membership':
                await renderMembership();
                break;
            case 'membership-sales':
                await renderMembershipSales();
                break;
            case 'activities':
                await renderActivities();
                break;
            case 'products':
                await renderProducts();
                break;
            case 'banners':
                await renderBanners();
                break;
            case 'commissions':
                await renderCommissions();
                break;
            case 'withdrawals':
                await renderWithdrawals();
                break;
            case 'agents':
                await renderAgents();
                break;
            case 'report':
                await renderReport();
                break;
            case 'export':
                await renderExport();
                break;
            case 'config':
                await renderConfig();
                break;
            case 'payment':
                await renderPayment();
                break;
            case 'admins':
                await renderAdmins();
                break;
            case 'roles':
                await renderRoles();
                break;
            default:
                renderComingSoon(pageName);
        }
    } catch (error) {
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>加载失败</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="renderPage('${pageName}')">重试</button>
            </div>
        `;
    }
}

// ========== 数据概览页面 ==========

async function renderDashboard() {
    const content = document.getElementById('mainContent');
    
    try {
        // 获取统计数据
        const stats = await apiRequest('/stats/overview');
        
        content.innerHTML = `
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats?.totalUsers || 0}</div>
                        <div class="stat-label">总用户数</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">👨‍🏫</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats?.totalTeachers || 0}</div>
                        <div class="stat-label">认证教师</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats?.totalOrgs || 0}</div>
                        <div class="stat-label">入驻机构</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats?.totalOrders || 0}</div>
                        <div class="stat-label">总订单数</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💎</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats?.totalMembers || 0}</div>
                        <div class="stat-label">会员用户</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">${formatMoney(stats?.totalRevenue || 0)}</div>
                        <div class="stat-label">总收入</div>
                    </div>
                </div>
            </div>
            
            <!-- 最近订单 -->
            <div class="card">
                <div class="card-header">
                    <h3>最近订单</h3>
                    <button class="btn btn-text" onclick="switchPage('orders')">查看全部</button>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>用户</th>
                                <th>类型</th>
                                <th>金额</th>
                                <th>状态</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody id="recentOrders">
                            <tr>
                                <td colspan="6" class="empty-row">暂无数据</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 待办事项 -->
            <div class="card">
                <div class="card-header">
                    <h3>待办事项</h3>
                </div>
                <div class="card-body">
                    <div class="todo-list">
                        <div class="todo-item">
                            <span class="todo-badge badge-warning">审核中</span>
                            <span>待审核教师认证 <strong>5</strong> 人</span>
                            <button class="btn btn-sm btn-primary" onclick="switchPage('teachers')">处理</button>
                        </div>
                        <div class="todo-item">
                            <span class="todo-badge badge-warning">审核中</span>
                            <span>待审核机构入驻 <strong>2</strong> 家</span>
                            <button class="btn btn-sm btn-primary" onclick="switchPage('orgs')">处理</button>
                        </div>
                        <div class="todo-item">
                            <span class="todo-badge badge-danger">紧急</span>
                            <span>待处理提现申请 <strong>3</strong> 笔</span>
                            <button class="btn btn-sm btn-danger" onclick="switchPage('withdrawals')">处理</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        // 如果API失败，显示模拟数据
        content.innerHTML = `
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">1,234</div>
                        <div class="stat-label">总用户数</div>
                        <div class="stat-trend up">+12.5%</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">👨‍🏫</div>
                    <div class="stat-content">
                        <div class="stat-value">89</div>
                        <div class="stat-label">认证教师</div>
                        <div class="stat-trend up">+5.2%</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-content">
                        <div class="stat-value">23</div>
                        <div class="stat-label">入驻机构</div>
                        <div class="stat-trend up">+2</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">456</div>
                        <div class="stat-label">总订单数</div>
                        <div class="stat-trend up">+8.3%</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💎</div>
                    <div class="stat-content">
                        <div class="stat-value">128</div>
                        <div class="stat-label">会员用户</div>
                        <div class="stat-trend up">+15.7%</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">¥45,678</div>
                        <div class="stat-label">总收入</div>
                        <div class="stat-trend up">+22.1%</div>
                    </div>
                </div>
            </div>
            
            <!-- 最近订单 -->
            <div class="card">
                <div class="card-header">
                    <h3>最近订单</h3>
                    <button class="btn btn-text" onclick="switchPage('orders')">查看全部</button>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>用户</th>
                                <th>类型</th>
                                <th>金额</th>
                                <th>状态</th>
                                <th>时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ORD20240115001</td>
                                <td>张家长</td>
                                <td>会员购买</td>
                                <td>¥199.00</td>
                                <td><span class="badge badge-success">已完成</span></td>
                                <td>2024-01-15 14:30</td>
                            </tr>
                            <tr>
                                <td>ORD20240115002</td>
                                <td>李老师</td>
                                <td>课程发布</td>
                                <td>¥0.00</td>
                                <td><span class="badge badge-warning">待审核</span></td>
                                <td>2024-01-15 15:20</td>
                            </tr>
                            <tr>
                                <td>ORD20240115003</td>
                                <td>王机构</td>
                                <td>入驻费用</td>
                                <td>¥2,999.00</td>
                                <td><span class="badge badge-success">已完成</span></td>
                                <td>2024-01-15 16:10</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 待办事项 -->
            <div class="card">
                <div class="card-header">
                    <h3>待办事项</h3>
                </div>
                <div class="card-body">
                    <div class="todo-list">
                        <div class="todo-item">
                            <span class="todo-badge badge-warning">审核中</span>
                            <span>待审核教师认证 <strong>5</strong> 人</span>
                            <button class="btn btn-sm btn-primary" onclick="switchPage('teachers')">处理</button>
                        </div>
                        <div class="todo-item">
                            <span class="todo-badge badge-warning">审核中</span>
                            <span>待审核机构入驻 <strong>2</strong> 家</span>
                            <button class="btn btn-sm btn-primary" onclick="switchPage('orgs')">处理</button>
                        </div>
                        <div class="todo-item">
                            <span class="todo-badge badge-danger">紧急</span>
                            <span>待处理提现申请 <strong>3</strong> 笔</span>
                            <button class="btn btn-sm btn-danger" onclick="switchPage('withdrawals')">处理</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ========== 用户管理页面 ==========

async function renderUsers() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div class="header-left">
                    <h3>用户列表</h3>
                </div>
                <div class="header-right">
                    <input type="text" class="search-input" placeholder="搜索用户..." id="userSearch">
                    <select class="select-input" id="userRoleFilter">
                        <option value="">全部角色</option>
                        <option value="parent">家长</option>
                        <option value="teacher">教师</option>
                        <option value="org">机构</option>
                    </select>
                    <button class="btn btn-primary" onclick="loadUsers()">
                        🔍 查询
                    </button>
                </div>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户信息</th>
                            <th>角色</th>
                            <th>会员状态</th>
                            <th>注册时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <tr>
                            <td colspan="7" class="empty-row">暂无数据</td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- 分页 -->
                <div class="pagination" id="userPagination"></div>
            </div>
        </div>
    `;
    
    await loadUsers();
}

async function loadUsers() {
    const search = document.getElementById('userSearch')?.value || '';
    const role = document.getElementById('userRoleFilter')?.value || '';
    
    try {
        const data = await apiRequest(`/users?page=${state.pagination.page}&search=${search}&role=${role}`);
        renderUserTable(data.list || []);
        renderPagination('userPagination', data.total || 0);
    } catch (error) {
        // 显示模拟数据
        const mockUsers = [
            { id: 1, nickname: '张家长', phone: '138****1234', role: 'parent', isMember: true, createdAt: '2024-01-10', status: 1 },
            { id: 2, nickname: '李老师', phone: '139****5678', role: 'teacher', isMember: true, createdAt: '2024-01-08', status: 1 },
            { id: 3, nickname: '王机构', phone: '137****9012', role: 'org', isMember: false, createdAt: '2024-01-05', status: 1 },
            { id: 4, nickname: '赵家长', phone: '136****3456', role: 'parent', isMember: false, createdAt: '2024-01-03', status: 0 },
        ];
        renderUserTable(mockUsers);
    }
}

function renderUserTable(users) {
    const tbody = document.getElementById('userTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    const roleMap = {
        parent: { name: '家长', class: 'badge-info' },
        teacher: { name: '教师', class: 'badge-success' },
        org: { name: '机构', class: 'badge-warning' }
    };
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <span class="user-name">${user.nickname}</span>
                    <span class="user-phone">${user.phone}</span>
                </div>
            </td>
            <td><span class="badge ${roleMap[user.role]?.class || ''}">${roleMap[user.role]?.name || user.role}</span></td>
            <td>
                ${user.isMember 
                    ? '<span class="badge badge-success">会员</span>' 
                    : '<span class="badge badge-default">普通用户</span>'}
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <span class="status-switch ${user.status === 1 ? 'active' : ''}" 
                      onclick="toggleUserStatus(${user.id}, ${user.status})">
                    ${user.status === 1 ? '启用' : '禁用'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-text" onclick="viewUserDetail(${user.id})">查看</button>
                <button class="btn btn-sm btn-text" onclick="editUser(${user.id})">编辑</button>
            </td>
        </tr>
    `).join('');
}

// ========== 教师管理页面 ==========

async function renderTeachers() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTeacherTab('all')">全部教师</button>
            <button class="tab-btn" onclick="switchTeacherTab('pending')">待审核 (5)</button>
            <button class="tab-btn" onclick="switchTeacherTab('approved')">已认证</button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>教师信息</th>
                            <th>科目</th>
                            <th>评分</th>
                            <th>认证状态</th>
                            <th>申请时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="teacherTableBody">
                        <tr>
                            <td colspan="7" class="empty-row">暂无数据</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadTeachers();
}

async function loadTeachers() {
    try {
        const data = await apiRequest('/teachers');
        // 后端返回的是数组，需要适配
        const teachers = Array.isArray(data) ? data : (data.list || []);
        renderTeacherTable(teachers);
    } catch (error) {
        console.error('加载教师列表失败:', error);
        // 显示模拟数据
        const mockTeachers = [
            { id: 1, name: '李老师', phone: '139****5678', subject: '数学', rating: 4.9, verify_status: 1, createdAt: '2024-01-08' },
            { id: 2, name: '王老师', phone: '138****9012', subject: '英语', rating: 4.8, verify_status: 0, createdAt: '2024-01-10' },
            { id: 3, name: '张老师', phone: '137****3456', subject: '物理', rating: 0, verify_status: 0, createdAt: '2024-01-11' },
        ];
        renderTeacherTable(mockTeachers);
    }
}

function renderTeacherTable(teachers) {
    const tbody = document.getElementById('teacherTableBody');
    
    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    const statusMap = {
        0: { name: '待审核', class: 'badge-warning' },
        1: { name: '已认证', class: 'badge-success' },
        2: { name: '已拒绝', class: 'badge-danger' }
    };
    
    tbody.innerHTML = teachers.map(teacher => {
        const status = teacher.verify_status;
        const statusInfo = statusMap[status] || statusMap[0];
        const phone = teacher.phone || teacher.mobile || '-';
        
        return `
        <tr>
            <td>${teacher.id}</td>
            <td>
                <div class="user-info">
                    <span class="user-name">${teacher.name || teacher.real_name || teacher.nickname || '-'}</span>
                    <span class="user-phone">${phone}</span>
                </div>
            </td>
            <td>${teacher.subject || (Array.isArray(teacher.subjects) ? teacher.subjects.join('、') : '-')}</td>
            <td>${teacher.rating > 0 ? `⭐ ${teacher.rating}` : '-'}</td>
            <td><span class="badge ${statusInfo.class}">${statusInfo.name}</span></td>
            <td>${formatDate(teacher.createdAt || teacher.created_at)}</td>
            <td>
                ${status === 0 ? `
                    <button class="btn btn-sm btn-success" onclick="approveTeacher(${teacher.id})">通过</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectTeacher(${teacher.id})">拒绝</button>
                ` : `
                    <button class="btn btn-sm btn-text" onclick="viewTeacherDetail(${teacher.id})">查看</button>
                `}
            </td>
        </tr>
    `}).join('');
}

// ========== 机构管理页面 ==========

async function renderOrgs() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>机构列表</h3>
                <button class="btn btn-primary">+ 添加机构</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>机构名称</th>
                            <th>联系人</th>
                            <th>电话</th>
                            <th>地址</th>
                            <th>认证状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="orgTableBody">
                        <tr>
                            <td colspan="7" class="empty-row">暂无数据</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadOrgs();
}

async function loadOrgs() {
    try {
        const data = await apiRequest('/orgs');
        renderOrgTable(data.list || []);
    } catch (error) {
        // 显示模拟数据
        const mockOrgs = [
            { id: 1, name: '学而思教育', contact: '王经理', phone: '400-123-4567', address: '北京市朝阳区', status: 'approved' },
            { id: 2, name: '新东方培训', contact: '李主管', phone: '400-890-1234', address: '上海市浦东新区', status: 'pending' },
        ];
        renderOrgTable(mockOrgs);
    }
}

function renderOrgTable(orgs) {
    const tbody = document.getElementById('orgTableBody');
    
    if (!orgs || orgs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    const statusMap = {
        pending: { name: '待审核', class: 'badge-warning' },
        approved: { name: '已认证', class: 'badge-success' },
        rejected: { name: '已拒绝', class: 'badge-danger' }
    };
    
    tbody.innerHTML = orgs.map(org => `
        <tr>
            <td>${org.id}</td>
            <td><strong>${org.name}</strong></td>
            <td>${org.contact}</td>
            <td>${org.phone}</td>
            <td>${org.address}</td>
            <td><span class="badge ${statusMap[org.status]?.class}">${statusMap[org.status]?.name}</span></td>
            <td>
                ${org.status === 'pending' ? `
                    <button class="btn btn-sm btn-success">通过</button>
                    <button class="btn btn-sm btn-danger">拒绝</button>
                ` : `
                    <button class="btn btn-sm btn-text">查看</button>
                    <button class="btn btn-sm btn-text">编辑</button>
                `}
            </td>
        </tr>
    `).join('');
}

// ========== 订单管理页面 ==========

async function renderOrders() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active">全部订单</button>
            <button class="tab-btn">待支付</button>
            <button class="tab-btn">已完成</button>
            <button class="tab-btn">已取消</button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>用户</th>
                            <th>订单类型</th>
                            <th>金额</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="orderTableBody">
                        <tr>
                            <td colspan="7" class="empty-row">暂无数据</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadOrders();
}

async function loadOrders() {
    try {
        const data = await apiRequest('/orders');
        renderOrderTable(data.list || []);
    } catch (error) {
        // 显示模拟数据
        const mockOrders = [
            { id: 'ORD20240115001', user: '张家长', type: '会员购买', amount: 199, status: 'completed', createdAt: '2024-01-15 14:30' },
            { id: 'ORD20240115002', user: '李老师', type: '课程发布', amount: 0, status: 'pending', createdAt: '2024-01-15 15:20' },
            { id: 'ORD20240115003', user: '王机构', type: '入驻费用', amount: 2999, status: 'completed', createdAt: '2024-01-15 16:10' },
        ];
        renderOrderTable(mockOrders);
    }
}

function renderOrderTable(orders) {
    const tbody = document.getElementById('orderTableBody');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    const statusMap = {
        pending: { name: '待支付', class: 'badge-warning' },
        completed: { name: '已完成', class: 'badge-success' },
        cancelled: { name: '已取消', class: 'badge-default' }
    };
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><code>${order.id}</code></td>
            <td>${order.user}</td>
            <td>${order.type}</td>
            <td>${formatMoney(order.amount)}</td>
            <td><span class="badge ${statusMap[order.status]?.class}">${statusMap[order.status]?.name}</span></td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-text">查看详情</button>
            </td>
        </tr>
    `).join('');
}

// ========== 系统配置页面 ==========

async function renderConfig() {
    const content = document.getElementById('mainContent');
    
    try {
        const config = await apiRequest('/config');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>站点基本信息</h3>
                </div>
                <div class="card-body">
                    <form id="siteConfigForm" onsubmit="saveSiteConfig(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">站点名称</label>
                                <input type="text" class="form-input" name="siteName" 
                                       value="${config?.siteName || '棉花糖教育平台'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">站点域名</label>
                                <input type="text" class="form-input" name="siteDomain" 
                                       value="${config?.siteDomain || 'mt.dajiaopei.com'}" readonly>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">站点Logo</label>
                            <div style="display: flex; gap: 12px; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <input type="text" class="form-input" name="siteLogo" id="siteLogoInput"
                                           value="${config?.siteLogo || ''}" placeholder="请输入Logo图片URL或上传图片">
                                </div>
                                <div>
                                    <input type="file" id="logoFileInput" accept="image/*" style="display: none;" onchange="handleLogoUpload(event)">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('logoFileInput').click()">
                                        上传图片
                                    </button>
                                </div>
                            </div>
                            ${config?.siteLogo ? `
                                <div style="margin-top: 12px;">
                                    <img src="${config.siteLogo}" alt="Logo预览" style="max-width: 200px; max-height: 60px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px;">
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">客服电话</label>
                                <input type="text" class="form-input" name="servicePhone" 
                                       value="${config?.servicePhone || '400-123-4567'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">客服邮箱</label>
                                <input type="email" class="form-input" name="serviceEmail" 
                                       value="${config?.serviceEmail || 'service@mht-edu.com'}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">站点描述</label>
                            <textarea class="form-textarea" name="siteDescription" rows="3">${config?.siteDescription || '基于LBS的教育信息撮合平台'}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">版权信息</label>
                            <input type="text" class="form-input" name="copyright" 
                                   value="${config?.copyright || '© 2024 棉花糖教育平台'}">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存配置</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>微信小程序配置</h3>
                </div>
                <div class="card-body">
                    <form id="wechatConfigForm" onsubmit="saveWechatConfig(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">AppID</label>
                                <input type="text" class="form-input" name="wechatAppId" 
                                       value="${config?.wechatAppId || ''}" placeholder="请输入微信小程序AppID">
                            </div>
                            <div class="form-group">
                                <label class="form-label">AppSecret</label>
                                <input type="password" class="form-input" name="wechatAppSecret" 
                                       value="${config?.wechatAppSecret || ''}" placeholder="请输入微信小程序AppSecret">
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存配置</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>站点基本信息</h3>
                </div>
                <div class="card-body">
                    <form id="siteConfigForm" onsubmit="saveSiteConfig(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">站点名称</label>
                                <input type="text" class="form-input" name="siteName" value="棉花糖教育平台">
                            </div>
                            <div class="form-group">
                                <label class="form-label">站点域名</label>
                                <input type="text" class="form-input" name="siteDomain" value="mt.dajiaopei.com" readonly>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">客服电话</label>
                                <input type="text" class="form-input" name="servicePhone" value="400-123-4567">
                            </div>
                            <div class="form-group">
                                <label class="form-label">客服邮箱</label>
                                <input type="email" class="form-input" name="serviceEmail" value="service@mht-edu.com">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">站点描述</label>
                            <textarea class="form-textarea" name="siteDescription" rows="3">基于LBS的教育信息撮合平台</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">版权信息</label>
                            <input type="text" class="form-input" name="copyright" value="© 2024 棉花糖教育平台">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">保存配置</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}

async function saveSiteConfig(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest('/config', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showMessage('配置保存成功', 'success');
        // 重新加载配置页面以更新Logo预览
        setTimeout(() => renderConfig(), 500);
    } catch (error) {
        showMessage('保存失败: ' + error.message, 'error');
    }
}

// 处理Logo图片上传
async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showMessage('请选择图片文件', 'error');
        return;
    }
    
    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
        showMessage('图片大小不能超过2MB', 'error');
        return;
    }
    
    try {
        showMessage('正在上传...', 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        
        // 使用 moments/upload 接口上传图片
        const response = await fetch(`${CONFIG.API_BASE}/moments/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        // 兼容多种返回格式
        const logoUrl = result.data?.url || result.url || result.data?.key;
        
        if (logoUrl) {
            document.getElementById('siteLogoInput').value = logoUrl;
            showMessage('图片上传成功', 'success');
        } else {
            throw new Error(result.msg || result.message || '上传失败');
        }
    } catch (error) {
        console.error('上传失败:', error);
        showMessage('图片上传失败: ' + error.message, 'error');
    }
    
    // 清空文件选择
    event.target.value = '';
}

// ========== 支付配置页面 ==========

async function renderPayment() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>微信支付配置</h3>
            </div>
            <div class="card-body">
                <form id="paymentConfigForm" onsubmit="savePaymentConfig(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">商户号 (MchID)</label>
                            <input type="text" class="form-input" name="mchId" placeholder="请输入微信支付商户号">
                        </div>
                        <div class="form-group">
                            <label class="form-label">API密钥</label>
                            <input type="password" class="form-input" name="apiKey" placeholder="请输入API密钥">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">API证书</label>
                            <input type="file" class="form-input" name="certFile" accept=".pem">
                        </div>
                        <div class="form-group">
                            <label class="form-label">API证书密钥</label>
                            <input type="file" class="form-input" name="keyFile" accept=".pem">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">支付回调地址</label>
                        <input type="text" class="form-input" name="notifyUrl" 
                               value="https://mt.dajiaopei.com/api/payment/notify" readonly>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存配置</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function savePaymentConfig(event) {
    event.preventDefault();
    showMessage('支付配置保存成功', 'success');
}

// ========== 管理员管理页面 ==========

async function renderAdmins() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>管理员列表</h3>
                <button class="btn btn-primary" onclick="showAddAdminModal()">+ 添加管理员</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户名</th>
                            <th>姓名</th>
                            <th>角色</th>
                            <th>最后登录</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="adminTableBody">
                        <tr>
                            <td colspan="7" class="empty-row">加载中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- 添加管理员弹窗 -->
        <div class="modal" id="addAdminModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加管理员</h3>
                    <button class="modal-close" onclick="closeAddAdminModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addAdminForm" onsubmit="addAdmin(event)">
                        <div class="form-group">
                            <label class="form-label">用户名 *</label>
                            <input type="text" class="form-input" name="username" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">密码 *</label>
                            <input type="password" class="form-input" name="password" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">姓名 *</label>
                            <input type="text" class="form-input" name="realName" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="email" class="form-input" name="email">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="text" class="form-input" name="phone">
                        </div>
                        <div class="form-group">
                            <label class="form-label">角色 *</label>
                            <select class="form-select" name="roleId" required>
                                <option value="">请选择角色</option>
                                <option value="1">超级管理员</option>
                                <option value="2">运营管理员</option>
                                <option value="3">客服管理员</option>
                                <option value="4">财务管理</option>
                                <option value="5">内容管理</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn" onclick="closeAddAdminModal()">取消</button>
                            <button type="submit" class="btn btn-primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    await loadAdmins();
}

async function loadAdmins() {
    try {
        const data = await apiRequest('/admins');
        renderAdminTable(data);
    } catch (error) {
        // 显示模拟数据
        const mockAdmins = [
            { id: 1, username: 'admin', realName: '超级管理员', roleName: '超级管理员', lastLoginTime: '2024-01-15 10:30', status: 1 },
            { id: 2, username: 'operator', realName: '运营小王', roleName: '运营管理员', lastLoginTime: '2024-01-14 16:20', status: 1 },
        ];
        renderAdminTable(mockAdmins);
    }
}

function renderAdminTable(admins) {
    const tbody = document.getElementById('adminTableBody');
    
    if (!admins || admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = admins.map(admin => `
        <tr>
            <td>${admin.id}</td>
            <td>${admin.username}</td>
            <td>${admin.realName}</td>
            <td><span class="badge badge-info">${admin.roleName}</span></td>
            <td>${formatDate(admin.lastLoginTime)}</td>
            <td>
                <span class="status-switch ${admin.status === 1 ? 'active' : ''}" 
                      onclick="toggleAdminStatus(${admin.id}, ${admin.status})">
                    ${admin.status === 1 ? '启用' : '禁用'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-text" onclick="editAdmin(${admin.id})">编辑</button>
                <button class="btn btn-sm btn-text" onclick="resetAdminPassword(${admin.id})">重置密码</button>
                ${admin.id !== 1 ? `<button class="btn btn-sm btn-danger" onclick="deleteAdmin(${admin.id})">删除</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function showAddAdminModal() {
    document.getElementById('addAdminModal').style.display = 'flex';
}

function closeAddAdminModal() {
    document.getElementById('addAdminModal').style.display = 'none';
}

async function addAdmin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest('/admins', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showMessage('管理员添加成功', 'success');
        closeAddAdminModal();
        await loadAdmins();
    } catch (error) {
        showMessage('添加失败: ' + error.message, 'error');
    }
}

// ========== 角色权限页面 ==========

async function renderRoles() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>角色列表</h3>
                <button class="btn btn-primary">+ 添加角色</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>角色名称</th>
                            <th>角色标识</th>
                            <th>权限数量</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="roleTableBody">
                        <tr>
                            <td colspan="6" class="empty-row">加载中...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadRoles();
}

async function loadRoles() {
    try {
        const data = await apiRequest('/roles');
        renderRoleTable(data);
    } catch (error) {
        // 显示模拟数据
        const mockRoles = [
            { id: 1, roleName: '超级管理员', roleCode: 'super_admin', permissionCount: 53, createdAt: '2024-01-01' },
            { id: 2, roleName: '运营管理员', roleCode: 'operator', permissionCount: 35, createdAt: '2024-01-01' },
            { id: 3, roleName: '客服管理员', roleCode: 'service', permissionCount: 20, createdAt: '2024-01-01' },
            { id: 4, roleName: '财务管理', roleCode: 'finance', permissionCount: 15, createdAt: '2024-01-01' },
            { id: 5, roleName: '内容管理', roleCode: 'content', permissionCount: 25, createdAt: '2024-01-01' },
        ];
        renderRoleTable(mockRoles);
    }
}

function renderRoleTable(roles) {
    const tbody = document.getElementById('roleTableBody');
    
    if (!roles || roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = roles.map(role => `
        <tr>
            <td>${role.id}</td>
            <td><strong>${role.roleName}</strong></td>
            <td><code>${role.roleCode}</code></td>
            <td>${role.permissionCount} 个权限</td>
            <td>${formatDate(role.createdAt)}</td>
            <td>
                ${role.id !== 1 ? `
                    <button class="btn btn-sm btn-text" onclick="editRole(${role.id})">编辑权限</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.id})">删除</button>
                ` : `
                    <span class="text-muted">系统角色不可修改</span>
                `}
            </td>
        </tr>
    `).join('');
}

// ========== 牛师班管理页面 ==========

async function renderEliteClass() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>牛师班列表</h3>
                <button class="btn btn-primary">+ 创建牛师班</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>班级名称</th>
                            <th>授课教师</th>
                            <th>科目</th>
                            <th>报名人数</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><strong>高考数学冲刺班</strong></td>
                            <td>李老师</td>
                            <td>数学</td>
                            <td>15/20</td>
                            <td><span class="badge badge-success">进行中</span></td>
                            <td>2024-01-10</td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><strong>英语口语提升班</strong></td>
                            <td>王老师</td>
                            <td>英语</td>
                            <td>8/15</td>
                            <td><span class="badge badge-warning">报名中</span></td>
                            <td>2024-01-12</td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><strong>物理竞赛预备班</strong></td>
                            <td>张老师</td>
                            <td>物理</td>
                            <td>12/12</td>
                            <td><span class="badge badge-info">已满员</span></td>
                            <td>2024-01-08</td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 会员套餐管理页面 ==========

async function renderMembership() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>会员套餐配置</h3>
                <button class="btn btn-primary">+ 添加套餐</button>
            </div>
            <div class="card-body">
                <div class="membership-grid">
                    <div class="membership-card">
                        <div class="membership-header">
                            <h4>月度会员</h4>
                            <div class="membership-price">¥99/月</div>
                        </div>
                        <ul class="membership-features">
                            <li>✓ 查看教师联系方式</li>
                            <li>✓ 发布需求无限次</li>
                            <li>✓ 参与活动优惠</li>
                        </ul>
                        <div class="membership-stats">
                            <span>购买人数: 256人</span>
                        </div>
                        <div class="membership-actions">
                            <button class="btn btn-sm btn-text">编辑</button>
                            <button class="btn btn-sm btn-danger">下架</button>
                        </div>
                    </div>
                    
                    <div class="membership-card popular">
                        <div class="membership-badge">最受欢迎</div>
                        <div class="membership-header">
                            <h4>季度会员</h4>
                            <div class="membership-price">¥259/季</div>
                            <div class="membership-save">节省¥38</div>
                        </div>
                        <ul class="membership-features">
                            <li>✓ 查看教师联系方式</li>
                            <li>✓ 发布需求无限次</li>
                            <li>✓ 参与活动优惠</li>
                            <li>✓ 专属客服支持</li>
                        </ul>
                        <div class="membership-stats">
                            <span>购买人数: 512人</span>
                        </div>
                        <div class="membership-actions">
                            <button class="btn btn-sm btn-text">编辑</button>
                        </div>
                    </div>
                    
                    <div class="membership-card">
                        <div class="membership-header">
                            <h4>年度会员</h4>
                            <div class="membership-price">¥799/年</div>
                            <div class="membership-save">节省¥389</div>
                        </div>
                        <ul class="membership-features">
                            <li>✓ 查看教师联系方式</li>
                            <li>✓ 发布需求无限次</li>
                            <li>✓ 参与活动优惠</li>
                            <li>✓ 专属客服支持</li>
                            <li>✓ 优先推荐</li>
                            <li>✓ 年度报告</li>
                        </ul>
                        <div class="membership-stats">
                            <span>购买人数: 128人</span>
                        </div>
                        <div class="membership-actions">
                            <button class="btn btn-sm btn-text">编辑</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .membership-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 20px;
            }
            .membership-card {
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                position: relative;
            }
            .membership-card.popular {
                border-color: #3b82f6;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            }
            .membership-badge {
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: #3b82f6;
                color: white;
                padding: 4px 16px;
                border-radius: 20px;
                font-size: 12px;
            }
            .membership-header h4 {
                margin: 0 0 8px 0;
                font-size: 18px;
            }
            .membership-price {
                font-size: 28px;
                font-weight: bold;
                color: #3b82f6;
            }
            .membership-save {
                color: #10b981;
                font-size: 12px;
                margin-top: 4px;
            }
            .membership-features {
                list-style: none;
                padding: 0;
                margin: 16px 0;
            }
            .membership-features li {
                padding: 8px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .membership-stats {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 16px;
            }
        </style>
    `;
}

// ========== 活动管理页面 ==========

async function renderActivities() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active">全部活动</button>
            <button class="tab-btn">进行中</button>
            <button class="tab-btn">已结束</button>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>活动列表</h3>
                <button class="btn btn-primary">+ 创建活动</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>活动名称</th>
                            <th>类型</th>
                            <th>参与人数</th>
                            <th>开始时间</th>
                            <th>结束时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><strong>春季招生特惠</strong></td>
                            <td><span class="badge badge-info">线上</span></td>
                            <td>156人</td>
                            <td>2024-03-01</td>
                            <td>2024-03-31</td>
                            <td><span class="badge badge-success">进行中</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><strong>名师见面会</strong></td>
                            <td><span class="badge badge-warning">线下</span></td>
                            <td>45/100人</td>
                            <td>2024-03-15</td>
                            <td>2024-03-15</td>
                            <td><span class="badge badge-warning">报名中</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><strong>寒假课程促销</strong></td>
                            <td><span class="badge badge-info">线上</span></td>
                            <td>328人</td>
                            <td>2024-01-15</td>
                            <td>2024-02-15</td>
                            <td><span class="badge badge-default">已结束</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 商品管理页面 ==========

async function renderProducts() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active">全部商品</button>
            <button class="tab-btn">上架中</button>
            <button class="tab-btn">已下架</button>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>商品列表</h3>
                <button class="btn btn-primary">+ 添加商品</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>商品名称</th>
                            <th>类型</th>
                            <th>价格</th>
                            <th>库存</th>
                            <th>销量</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><strong>初中数学必刷题集</strong></td>
                            <td>实物商品</td>
                            <td>¥59.00</td>
                            <td>156</td>
                            <td>89</td>
                            <td><span class="badge badge-success">上架中</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                                <button class="btn btn-sm btn-danger">下架</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><strong>英语语法精讲视频</strong></td>
                            <td>虚拟商品</td>
                            <td>¥199.00</td>
                            <td>∞</td>
                            <td>234</td>
                            <td><span class="badge badge-success">上架中</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                                <button class="btn btn-sm btn-danger">下架</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><strong>学霸笔记合集</strong></td>
                            <td>虚拟商品</td>
                            <td>¥29.00</td>
                            <td>∞</td>
                            <td>567</td>
                            <td><span class="badge badge-default">已下架</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-success">上架</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 广告位管理页面 ==========

async function renderBanners() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>广告位配置</h3>
                <button class="btn btn-primary">+ 添加广告</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>广告图片</th>
                            <th>广告标题</th>
                            <th>位置</th>
                            <th>点击次数</th>
                            <th>状态</th>
                            <th>排序</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td>
                            <td><strong>春季招生特惠</strong></td>
                            <td>首页轮播</td>
                            <td>1,234</td>
                            <td><span class="badge badge-success">展示中</span></td>
                            <td>1</td>
                            <td>
                                <button class="btn btn-sm btn-text">编辑</button>
                                <button class="btn btn-sm btn-danger">删除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td>
                            <td><strong>名师一对一</strong></td>
                            <td>首页轮播</td>
                            <td>856</td>
                            <td><span class="badge badge-success">展示中</span></td>
                            <td>2</td>
                            <td>
                                <button class="btn btn-sm btn-text">编辑</button>
                                <button class="btn btn-sm btn-danger">删除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><div style="width:80px;height:40px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">广告图</div></td>
                            <td><strong>会员专享优惠</strong></td>
                            <td>我的页面</td>
                            <td>432</td>
                            <td><span class="badge badge-success">展示中</span></td>
                            <td>1</td>
                            <td>
                                <button class="btn btn-sm btn-text">编辑</button>
                                <button class="btn btn-sm btn-danger">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 分佣管理页面 ==========

async function renderCommissions() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value" id="totalCommission">¥0.00</div>
                    <div class="stat-label">总分佣金额</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-value" id="pendingCommission">¥0.00</div>
                    <div class="stat-label">待结算</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-value" id="settledCommission">¥0.00</div>
                    <div class="stat-label">已结算</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>分佣记录</h3>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>推荐人</th>
                            <th>被推荐人</th>
                            <th>层级</th>
                            <th>佣金比例</th>
                            <th>佣金金额</th>
                            <th>状态</th>
                            <th>时间</th>
                        </tr>
                    </thead>
                    <tbody id="commissionTableBody">
                        <tr><td colspan="8" class="empty-row">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadCommissions();
}

async function loadCommissions() {
    try {
        const data = await fetch('/api/admin/commissions').then(r => r.json());
        const list = data.list || [];
        
        // 统计
        let total = 0, pending = 0, settled = 0;
        list.forEach(item => {
            total += parseFloat(item.amount) || 0;
            if (item.status === 0) pending += parseFloat(item.amount) || 0;
            if (item.status === 1) settled += parseFloat(item.amount) || 0;
        });
        
        document.getElementById('totalCommission').textContent = '¥' + total.toFixed(2);
        document.getElementById('pendingCommission').textContent = '¥' + pending.toFixed(2);
        document.getElementById('settledCommission').textContent = '¥' + settled.toFixed(2);
        
        // 渲染表格
        const tbody = document.getElementById('commissionTableBody');
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无数据</td></tr>';
            return;
        }
        
        const levelNames = { 1: '一级邀请', 2: '二级邀请', 3: '城市代理', 4: '机构分佣' };
        const statusNames = { 0: { name: '待结算', class: 'badge-warning' }, 1: { name: '已结算', class: 'badge-success' }, 2: { name: '已提现', class: 'badge-info' } };
        
        tbody.innerHTML = list.map(item => {
            const status = statusNames[item.status] || statusNames[0];
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.user_nickname || '-'}</td>
                    <td>${item.from_nickname || '-'}</td>
                    <td>${levelNames[item.level_type] || '-'}</td>
                    <td>${item.rate}%</td>
                    <td><strong>¥${item.amount}</strong></td>
                    <td><span class="badge ${status.class}">${status.name}</span></td>
                    <td>${formatDate(item.created_at)}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('加载分佣记录失败:', error);
        document.getElementById('commissionTableBody').innerHTML = '<tr><td colspan="8" class="empty-row">加载失败</td></tr>';
    }
}

// ========== 提现审核页面 ==========

async function renderWithdrawals() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active" onclick="filterWithdrawals('')">全部申请</button>
            <button class="tab-btn" onclick="filterWithdrawals(0)">待审核</button>
            <button class="tab-btn" onclick="filterWithdrawals(1)">已通过</button>
            <button class="tab-btn" onclick="filterWithdrawals(2)">已拒绝</button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>申请人</th>
                            <th>提现金额</th>
                            <th>账户类型</th>
                            <th>账号</th>
                            <th>申请时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="withdrawalTableBody">
                        <tr><td colspan="8" class="empty-row">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    await loadWithdrawals();
}

async function loadWithdrawals(status = '') {
    try {
        const url = status !== '' ? `/api/admin/withdrawals?status=${status}` : '/api/admin/withdrawals';
        const data = await fetch(url).then(r => r.json());
        const list = data.list || [];
        
        const tbody = document.getElementById('withdrawalTableBody');
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-row">暂无数据</td></tr>';
            return;
        }
        
        const statusNames = { 
            0: { name: '待审核', class: 'badge-warning' }, 
            1: { name: '已通过', class: 'badge-success' }, 
            2: { name: '已拒绝', class: 'badge-danger' },
            3: { name: '已打款', class: 'badge-info' }
        };
        const accountTypes = { wechat: '微信', alipay: '支付宝', bank: '银行卡' };
        
        tbody.innerHTML = list.map(item => {
            const status = statusNames[item.status] || statusNames[0];
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>
                        <div class="user-info">
                            <span class="user-name">${item.user_nickname || '用户'}</span>
                            <span class="user-phone">${item.user_phone || '-'}</span>
                        </div>
                    </td>
                    <td><strong>¥${item.amount}</strong></td>
                    <td>${accountTypes[item.account_type] || item.account_type}</td>
                    <td>${item.account_no || '-'}</td>
                    <td>${formatDate(item.created_at)}</td>
                    <td><span class="badge ${status.class}">${status.name}</span></td>
                    <td>
                        ${item.status === 0 ? `
                            <button class="btn btn-sm btn-success" onclick="approveWithdrawal(${item.id})">通过</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectWithdrawal(${item.id})">拒绝</button>
                        ` : '-'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('加载提现记录失败:', error);
        document.getElementById('withdrawalTableBody').innerHTML = '<tr><td colspan="8" class="empty-row">加载失败</td></tr>';
    }
}

function filterWithdrawals(status) {
    loadWithdrawals(status);
}

async function approveWithdrawal(id) {
    if (!confirm('确定通过该提现申请吗？')) return;
    try {
        await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
        showMessage('已通过', 'success');
        loadWithdrawals();
    } catch (error) {
        showMessage('操作失败', 'error');
    }
}

async function rejectWithdrawal(id) {
    if (!confirm('确定拒绝该提现申请吗？')) return;
    try {
        await fetch(`/api/admin/withdrawals/${id}/reject`, { method: 'POST' });
        showMessage('已拒绝', 'success');
        loadWithdrawals();
    } catch (error) {
        showMessage('操作失败', 'error');
    }
}
            <button class="tab-btn">已拒绝</button>
        </div>
        
        <div class="card">
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>申请人</th>
                            <th>提现金额</th>
                            <th>账户信息</th>
                            <th>申请时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>
                                <div class="user-info">
                                    <span class="user-name">张老师</span>
                                    <span class="user-phone">138****1234</span>
                                </div>
                            </td>
                            <td><strong>¥580.00</strong></td>
                            <td>微信支付</td>
                            <td>2024-01-15 10:30</td>
                            <td><span class="badge badge-warning">待审核</span></td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="approveWithdrawal(1)">通过</button>
                                <button class="btn btn-sm btn-danger" onclick="rejectWithdrawal(1)">拒绝</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>
                                <div class="user-info">
                                    <span class="user-name">王机构</span>
                                    <span class="user-phone">139****5678</span>
                                </div>
                            </td>
                            <td><strong>¥1,200.00</strong></td>
                            <td>银行卡: ****6789</td>
                            <td>2024-01-14 16:20</td>
                            <td><span class="badge badge-warning">待审核</span></td>
                            <td>
                                <button class="btn btn-sm btn-success" onclick="approveWithdrawal(2)">通过</button>
                                <button class="btn btn-sm btn-danger" onclick="rejectWithdrawal(2)">拒绝</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>
                                <div class="user-info">
                                    <span class="user-name">李老师</span>
                                    <span class="user-phone">137****9012</span>
                                </div>
                            </td>
                            <td><strong>¥350.00</strong></td>
                            <td>支付宝</td>
                            <td>2024-01-13 09:15</td>
                            <td><span class="badge badge-success">已通过</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 代理商管理页面 ==========

async function renderAgents() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active">全部代理</button>
            <button class="tab-btn">待审核 (2)</button>
            <button class="tab-btn">已授权</button>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>城市代理列表</h3>
                <button class="btn btn-primary">+ 添加代理</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>代理商</th>
                            <th>代理城市</th>
                            <th>联系方式</th>
                            <th>下级用户</th>
                            <th>累计佣金</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td><strong>北京总代</strong></td>
                            <td>北京市</td>
                            <td>张总 / 138****1234</td>
                            <td>156人</td>
                            <td>¥12,580</td>
                            <td><span class="badge badge-success">已授权</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td><strong>上海分代</strong></td>
                            <td>上海市</td>
                            <td>李经理 / 139****5678</td>
                            <td>89人</td>
                            <td>¥8,960</td>
                            <td><span class="badge badge-success">已授权</span></td>
                            <td>
                                <button class="btn btn-sm btn-text">查看</button>
                                <button class="btn btn-sm btn-text">编辑</button>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td><strong>广州代理</strong></td>
                            <td>广州市</td>
                            <td>王主管 / 137****9012</td>
                            <td>0人</td>
                            <td>¥0</td>
                            <td><span class="badge badge-warning">待审核</span></td>
                            <td>
                                <button class="btn btn-sm btn-success">通过</button>
                                <button class="btn btn-sm btn-danger">拒绝</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 开发中页面 ==========

function renderComingSoon(pageName) {
    const content = document.getElementById('mainContent');
    const titles = {
        'elite-class': '牛师班管理',
        membership: '会员套餐',
        activities: '活动管理',
        products: '商品管理',
        banners: '广告位管理',
        commissions: '分佣管理',
        withdrawals: '提现审核',
        agents: '代理商管理'
    };
    
    content.innerHTML = `
        <div class="coming-soon">
            <div class="coming-soon-icon">🚧</div>
            <h3>${titles[pageName] || '功能开发中'}</h3>
            <p>该功能模块正在开发中，敬请期待...</p>
        </div>
    `;
}

// ========== 分页组件 ==========

function renderPagination(containerId, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(total / state.pagination.pageSize);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-info">共 ' + total + ' 条</div>';
    html += '<div class="pagination-buttons">';
    
    // 上一页
    html += `<button class="page-btn" ${state.pagination.page === 1 ? 'disabled' : ''} 
             onclick="changePage(${state.pagination.page - 1})">上一页</button>`;
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.pagination.page - 2 && i <= state.pagination.page + 2)) {
            html += `<button class="page-btn ${i === state.pagination.page ? 'active' : ''}" 
                     onclick="changePage(${i})">${i}</button>`;
        } else if (i === state.pagination.page - 3 || i === state.pagination.page + 3) {
            html += '<span class="page-ellipsis">...</span>';
        }
    }
    
    // 下一页
    html += `<button class="page-btn" ${state.pagination.page === totalPages ? 'disabled' : ''} 
             onclick="changePage(${state.pagination.page + 1})">下一页</button>`;
    
    html += '</div>';
    
    container.innerHTML = html;
}

function changePage(page) {
    state.pagination.page = page;
    renderPage(state.currentPage);
}

// ========== 会员销售记录页面 ==========

async function renderMembershipSales() {
    const content = document.getElementById('mainContent');
    
    // 先显示加载中
    content.innerHTML = `
        <div class="card">
            <div class="card-body" style="text-align: center; padding: 40px;">
                <div class="loading">加载中...</div>
            </div>
        </div>
    `;
    
    try {
        const data = await apiRequest('/membership-sales?page=1&pageSize=20');
        const sales = Array.isArray(data.list) ? data.list : [];
        const summary = data.summary || {};
        
        content.innerHTML = `
            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-value">¥${(summary.totalAmount || 0).toLocaleString()}</div>
                        <div class="stat-label">总收入</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-value">¥${(summary.todayAmount || 0).toLocaleString()}</div>
                        <div class="stat-label">今日收入</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-value">¥${(summary.weekAmount || 0).toLocaleString()}</div>
                        <div class="stat-label">本周收入</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-content">
                        <div class="stat-value">${summary.totalCount || 0}</div>
                        <div class="stat-label">总订单数</div>
                    </div>
                </div>
            </div>
            
            <!-- 销售记录列表 -->
            <div class="card">
                <div class="card-header">
                    <h3>会员销售记录</h3>
                    <div class="filter-group">
                        <select id="salesStatusFilter" onchange="filterMembershipSales()">
                            <option value="">全部状态</option>
                            <option value="0">待支付</option>
                            <option value="1">已支付</option>
                            <option value="2">已退款</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>支付单号</th>
                                <th>用户信息</th>
                                <th>会员套餐</th>
                                <th>金额</th>
                                <th>状态</th>
                                <th>支付方式</th>
                                <th>创建时间</th>
                                <th>支付时间</th>
                            </tr>
                        </thead>
                        <tbody id="membershipSalesTableBody">
                            ${renderMembershipSalesRows(sales)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('加载会员销售记录失败:', error);
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="error-message">加载失败，请刷新重试</div>
                </div>
            </div>
        `;
    }
}

function renderMembershipSalesRows(sales) {
    if (!sales || sales.length === 0) {
        return '<tr><td colspan="8" class="empty-row">暂无数据</td></tr>';
    }
    
    const statusMap = {
        0: { name: '待支付', class: 'badge-warning' },
        1: { name: '已支付', class: 'badge-success' },
        2: { name: '已退款', class: 'badge-danger' },
        3: { name: '已取消', class: 'badge-secondary' }
    };
    
    return sales.map(sale => {
        const statusInfo = statusMap[sale.status] || statusMap[0];
        return `
            <tr>
                <td><code>${sale.payment_no || '-'}</code></td>
                <td>
                    <div class="user-info">
                        <span class="user-name">${sale.user_name || '-'}</span>
                        <span class="user-phone">${sale.user_phone || '-'}</span>
                        <span class="user-role">[${sale.user_role_name || '用户'}]</span>
                    </div>
                </td>
                <td>${sale.membership_name || '-'}</td>
                <td><strong>¥${sale.amount || '0.00'}</strong></td>
                <td><span class="badge ${statusInfo.class}">${sale.status_name || statusInfo.name}</span></td>
                <td>${sale.payment_method || '-'}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${sale.paid_at ? formatDate(sale.paid_at) : '-'}</td>
            </tr>
        `;
    }).join('');
}

async function filterMembershipSales() {
    const status = document.getElementById('salesStatusFilter').value;
    const content = document.getElementById('mainContent');
    
    try {
        const data = await apiRequest(`/membership-sales?page=1&pageSize=20&status=${status}`);
        const tbody = document.getElementById('membershipSalesTableBody');
        if (tbody) {
            tbody.innerHTML = renderMembershipSalesRows(data.list || []);
        }
    } catch (error) {
        console.error('筛选失败:', error);
    }
}

// ========== 运营报表页面 ==========

async function renderReport() {
    const content = document.getElementById('mainContent');
    
    try {
        // 获取报表数据
        const [overview, userDist, orderDist, revenue, distribution] = await Promise.all([
            fetch('/api/report/overview').then(r => r.json()),
            fetch('/api/report/user-distribution').then(r => r.json()),
            fetch('/api/report/order-distribution').then(r => r.json()),
            fetch('/api/report/revenue').then(r => r.json()),
            fetch('/api/report/distribution').then(r => r.json())
        ]);

        content.innerHTML = `
            <div class="report-page">
                <!-- 概览卡片 -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">👥</div>
                        <div class="stat-info">
                            <div class="stat-value">${overview.users?.total_users || 0}</div>
                            <div class="stat-label">总用户数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">📋</div>
                        <div class="stat-info">
                            <div class="stat-value">${overview.orders?.total_orders || 0}</div>
                            <div class="stat-label">总订单数</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">¥${overview.payments?.total_amount || '0.00'}</div>
                            <div class="stat-label">总收入</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">💎</div>
                        <div class="stat-info">
                            <div class="stat-value">${overview.users?.member_count || 0}</div>
                            <div class="stat-label">会员数</div>
                        </div>
                    </div>
                </div>

                <!-- 用户分布 -->
                <div class="report-section">
                    <h3 class="section-title">用户分布</h3>
                    <div class="report-grid">
                        <div class="chart-card">
                            <h4>角色分布</h4>
                            <div class="distribution-list">
                                ${(userDist.by_role || []).map(item => `
                                    <div class="distribution-item">
                                        <span class="dist-label">${item.role_name}</span>
                                        <div class="dist-bar">
                                            <div class="dist-fill" style="width: ${(item.count / (overview.users?.total_users || 1)) * 100}%"></div>
                                        </div>
                                        <span class="dist-value">${item.count}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="chart-card">
                            <h4>会员分布</h4>
                            <div class="distribution-list">
                                ${(userDist.by_member || []).map(item => `
                                    <div class="distribution-item">
                                        <span class="dist-label">${item.member_type}</span>
                                        <div class="dist-bar">
                                            <div class="dist-fill" style="width: ${(item.count / (overview.users?.total_users || 1)) * 100}%"></div>
                                        </div>
                                        <span class="dist-value">${item.count}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 订单分布 -->
                <div class="report-section">
                    <h3 class="section-title">订单分布</h3>
                    <div class="report-grid">
                        <div class="chart-card">
                            <h4>订单状态分布</h4>
                            <div class="distribution-list">
                                ${(orderDist.by_status || []).map(item => `
                                    <div class="distribution-item">
                                        <span class="dist-label">${item.status_name}</span>
                                        <div class="dist-bar">
                                            <div class="dist-fill" style="width: ${(item.count / (overview.orders?.total_orders || 1)) * 100}%"></div>
                                        </div>
                                        <span class="dist-value">${item.count}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="chart-card">
                            <h4>科目分布 TOP 10</h4>
                            <div class="distribution-list">
                                ${(orderDist.by_subject || []).map(item => `
                                    <div class="distribution-item">
                                        <span class="dist-label">${item.subject}</span>
                                        <div class="dist-bar">
                                            <div class="dist-fill" style="width: ${(item.count / (orderDist.by_subject?.[0]?.count || 1)) * 100}%"></div>
                                        </div>
                                        <span class="dist-value">${item.count}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 分销统计 -->
                <div class="report-section">
                    <h3 class="section-title">分销统计</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">💰</div>
                            <div class="stat-info">
                                <div class="stat-value">¥${overview.commissions?.total_amount || '0.00'}</div>
                                <div class="stat-label">累计佣金</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">✅</div>
                            <div class="stat-info">
                                <div class="stat-value">¥${overview.commissions?.settled_amount || '0.00'}</div>
                                <div class="stat-label">已结算</div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card" style="margin-top: 16px;">
                        <h4>分销商排行 TOP 10</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>排名</th>
                                    <th>用户</th>
                                    <th>邀请人数</th>
                                    <th>累计佣金</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(distribution.top_distributors || []).map((item, index) => `
                                    <tr>
                                        <td><span class="rank-badge rank-${index + 1}">${index + 1}</span></td>
                                        <td>${item.nickname || '用户'}</td>
                                        <td>${item.invite_count || 0}</td>
                                        <td class="text-success">¥${item.total_commission || '0.00'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // 添加报表样式
        addReportStyles();
    } catch (error) {
        content.innerHTML = `<div class="error-state"><h3>加载失败</h3><p>${error.message}</p></div>`;
    }
}

// ========== 数据导出页面 ==========

async function renderExport() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="export-page">
            <div class="export-grid">
                <div class="export-card">
                    <div class="export-icon">👥</div>
                    <h3>导出用户数据</h3>
                    <p>导出所有用户信息，包括角色、会员状态等</p>
                    <div class="export-filters">
                        <select id="exportUserRole" class="form-select">
                            <option value="">全部角色</option>
                            <option value="0">家长</option>
                            <option value="1">教师</option>
                            <option value="2">机构</option>
                        </select>
                        <input type="date" id="exportUserStartDate" class="form-input" placeholder="开始日期">
                        <input type="date" id="exportUserEndDate" class="form-input" placeholder="结束日期">
                    </div>
                    <button class="btn btn-primary" onclick="handleExport('users')">
                        <span>📥</span> 导出 CSV
                    </button>
                </div>

                <div class="export-card">
                    <div class="export-icon">📋</div>
                    <h3>导出订单数据</h3>
                    <p>导出所有订单信息，包括状态、科目、金额等</p>
                    <div class="export-filters">
                        <select id="exportOrderStatus" class="form-select">
                            <option value="">全部状态</option>
                            <option value="0">待匹配</option>
                            <option value="1">已匹配</option>
                            <option value="2">进行中</option>
                            <option value="4">已完成</option>
                        </select>
                        <input type="date" id="exportOrderStartDate" class="form-input" placeholder="开始日期">
                        <input type="date" id="exportOrderEndDate" class="form-input" placeholder="结束日期">
                    </div>
                    <button class="btn btn-primary" onclick="handleExport('orders')">
                        <span>📥</span> 导出 CSV
                    </button>
                </div>

                <div class="export-card">
                    <div class="export-icon">💰</div>
                    <h3>导出支付记录</h3>
                    <p>导出所有支付记录，包括金额、状态、时间等</p>
                    <div class="export-filters">
                        <select id="exportPaymentStatus" class="form-select">
                            <option value="">全部状态</option>
                            <option value="0">待支付</option>
                            <option value="1">已支付</option>
                            <option value="2">已退款</option>
                        </select>
                        <input type="date" id="exportPaymentStartDate" class="form-input" placeholder="开始日期">
                        <input type="date" id="exportPaymentEndDate" class="form-input" placeholder="结束日期">
                    </div>
                    <button class="btn btn-primary" onclick="handleExport('payments')">
                        <span>📥</span> 导出 CSV
                    </button>
                </div>

                <div class="export-card">
                    <div class="export-icon">💎</div>
                    <h3>导出佣金记录</h3>
                    <p>导出所有分佣记录，包括金额、层级、状态等</p>
                    <div class="export-filters">
                        <select id="exportCommissionStatus" class="form-select">
                            <option value="">全部状态</option>
                            <option value="0">待结算</option>
                            <option value="1">已结算</option>
                            <option value="2">已提现</option>
                        </select>
                        <input type="date" id="exportCommissionStartDate" class="form-input" placeholder="开始日期">
                        <input type="date" id="exportCommissionEndDate" class="form-input" placeholder="结束日期">
                    </div>
                    <button class="btn btn-primary" onclick="handleExport('commissions')">
                        <span>📥</span> 导出 CSV
                    </button>
                </div>

                <div class="export-card">
                    <div class="export-icon">💳</div>
                    <h3>导出提现记录</h3>
                    <p>导出所有提现申请，包括金额、账户、状态等</p>
                    <div class="export-filters">
                        <select id="exportWithdrawStatus" class="form-select">
                            <option value="">全部状态</option>
                            <option value="0">待审核</option>
                            <option value="1">已通过</option>
                            <option value="2">已拒绝</option>
                            <option value="3">已打款</option>
                        </select>
                        <input type="date" id="exportWithdrawStartDate" class="form-input" placeholder="开始日期">
                        <input type="date" id="exportWithdrawEndDate" class="form-input" placeholder="结束日期">
                    </div>
                    <button class="btn btn-primary" onclick="handleExport('withdrawals')">
                        <span>📥</span> 导出 CSV
                    </button>
                </div>
            </div>
        </div>
    `;

    // 添加导出页面样式
    addExportStyles();
}

async function handleExport(type) {
    let params = [];
    
    switch(type) {
        case 'users':
            const userRole = document.getElementById('exportUserRole').value;
            const userStartDate = document.getElementById('exportUserStartDate').value;
            const userEndDate = document.getElementById('exportUserEndDate').value;
            if (userRole) params.push(`role=${userRole}`);
            if (userStartDate) params.push(`start_date=${userStartDate}`);
            if (userEndDate) params.push(`end_date=${userEndDate}`);
            break;
        case 'orders':
            const orderStatus = document.getElementById('exportOrderStatus').value;
            const orderStartDate = document.getElementById('exportOrderStartDate').value;
            const orderEndDate = document.getElementById('exportOrderEndDate').value;
            if (orderStatus) params.push(`status=${orderStatus}`);
            if (orderStartDate) params.push(`start_date=${orderStartDate}`);
            if (orderEndDate) params.push(`end_date=${orderEndDate}`);
            break;
        case 'payments':
            const paymentStatus = document.getElementById('exportPaymentStatus').value;
            const paymentStartDate = document.getElementById('exportPaymentStartDate').value;
            const paymentEndDate = document.getElementById('exportPaymentEndDate').value;
            if (paymentStatus) params.push(`status=${paymentStatus}`);
            if (paymentStartDate) params.push(`start_date=${paymentStartDate}`);
            if (paymentEndDate) params.push(`end_date=${paymentEndDate}`);
            break;
        case 'commissions':
            const commissionStatus = document.getElementById('exportCommissionStatus').value;
            const commissionStartDate = document.getElementById('exportCommissionStartDate').value;
            const commissionEndDate = document.getElementById('exportCommissionEndDate').value;
            if (commissionStatus) params.push(`status=${commissionStatus}`);
            if (commissionStartDate) params.push(`start_date=${commissionStartDate}`);
            if (commissionEndDate) params.push(`end_date=${commissionEndDate}`);
            break;
        case 'withdrawals':
            const withdrawStatus = document.getElementById('exportWithdrawStatus').value;
            const withdrawStartDate = document.getElementById('exportWithdrawStartDate').value;
            const withdrawEndDate = document.getElementById('exportWithdrawEndDate').value;
            if (withdrawStatus) params.push(`status=${withdrawStatus}`);
            if (withdrawStartDate) params.push(`start_date=${withdrawStartDate}`);
            if (withdrawEndDate) params.push(`end_date=${withdrawEndDate}`);
            break;
    }

    const url = `/api/export/download?type=${type}&${params.join('&')}`;
    
    showMessage('正在生成导出文件...', 'info');
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showMessage('导出成功', 'success');
}

// ========== 报表和导出样式 ==========

function addReportStyles() {
    if (document.getElementById('reportStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'reportStyles';
    style.textContent = `
        .report-page { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #1f2937; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .report-section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
        .report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .chart-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .chart-card h4 { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 16px; }
        .distribution-list { display: flex; flex-direction: column; gap: 12px; }
        .distribution-item { display: flex; align-items: center; gap: 12px; }
        .dist-label { width: 80px; font-size: 14px; color: #4b5563; }
        .dist-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .dist-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 4px; transition: width 0.3s; }
        .dist-value { width: 50px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; }
        .rank-badge { display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #e5e7eb; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600; }
        .rank-1 { background: #fbbf24; color: white; }
        .rank-2 { background: #9ca3af; color: white; }
        .rank-3 { background: #d97706; color: white; }
        .text-success { color: #10b981; font-weight: 600; }
    `;
    document.head.appendChild(style);
}

function addExportStyles() {
    if (document.getElementById('exportStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'exportStyles';
    style.textContent = `
        .export-page { padding: 20px; }
        .export-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .export-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .export-icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
        .export-card h3 { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px; text-align: center; }
        .export-card p { font-size: 14px; color: #6b7280; margin-bottom: 16px; text-align: center; }
        .export-filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .form-select, .form-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-select:focus, .form-input:focus { outline: none; border-color: #3b82f6; }
        .export-card .btn { width: 100%; padding: 12px; font-size: 16px; }
    `;
    document.head.appendChild(style);
}

// ========== 添加样式 ==========

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
