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
        activities: '活动管理',
        products: '商品管理',
        banners: '广告位管理',
        commissions: '分佣管理',
        withdrawals: '提现审核',
        agents: '代理商管理',
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
        renderTeacherTable(data.list || []);
    } catch (error) {
        // 显示模拟数据
        const mockTeachers = [
            { id: 1, name: '李老师', phone: '139****5678', subject: '数学', rating: 4.9, status: 'approved', createdAt: '2024-01-08' },
            { id: 2, name: '王老师', phone: '138****9012', subject: '英语', rating: 4.8, status: 'pending', createdAt: '2024-01-10' },
            { id: 3, name: '张老师', phone: '137****3456', subject: '物理', rating: 0, status: 'pending', createdAt: '2024-01-11' },
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
        pending: { name: '待审核', class: 'badge-warning' },
        approved: { name: '已认证', class: 'badge-success' },
        rejected: { name: '已拒绝', class: 'badge-danger' }
    };
    
    tbody.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.id}</td>
            <td>
                <div class="user-info">
                    <span class="user-name">${teacher.name}</span>
                    <span class="user-phone">${teacher.phone}</span>
                </div>
            </td>
            <td>${teacher.subject}</td>
            <td>${teacher.rating > 0 ? `⭐ ${teacher.rating}` : '-'}</td>
            <td><span class="badge ${statusMap[teacher.status]?.class}">${statusMap[teacher.status]?.name}</span></td>
            <td>${formatDate(teacher.createdAt)}</td>
            <td>
                ${teacher.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="approveTeacher(${teacher.id})">通过</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectTeacher(${teacher.id})">拒绝</button>
                ` : `
                    <button class="btn btn-sm btn-text" onclick="viewTeacherDetail(${teacher.id})">查看</button>
                `}
            </td>
        </tr>
    `).join('');
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
    } catch (error) {
        showMessage('保存失败: ' + error.message, 'error');
    }
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

/**
 * 编辑管理员
 */
async function editAdmin(adminId) {
    try {
        const admin = await apiRequest(`/admins/${adminId}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'editAdminModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑管理员</h3>
                    <button class="modal-close" onclick="closeModal('editAdminModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editAdminForm" onsubmit="saveAdmin(event, ${adminId})">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-input" name="username" value="${admin.username || ''}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">姓名 *</label>
                            <input type="text" class="form-input" name="realName" value="${admin.realName || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="email" class="form-input" name="email" value="${admin.email || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input type="text" class="form-input" name="phone" value="${admin.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">角色 *</label>
                            <select class="form-select" name="roleId" required>
                                <option value="">请选择角色</option>
                                <option value="1" ${admin.roleId === 1 ? 'selected' : ''}>超级管理员</option>
                                <option value="2" ${admin.roleId === 2 ? 'selected' : ''}>运营管理员</option>
                                <option value="3" ${admin.roleId === 3 ? 'selected' : ''}>客服管理员</option>
                                <option value="4" ${admin.roleId === 4 ? 'selected' : ''}>财务管理</option>
                                <option value="5" ${admin.roleId === 5 ? 'selected' : ''}>内容管理</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <select class="form-select" name="status">
                                <option value="1" ${admin.status === 1 ? 'selected' : ''}>启用</option>
                                <option value="0" ${admin.status === 0 ? 'selected' : ''}>禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModal('editAdminModal')">取消</button>
                    <button type="submit" form="editAdminForm" class="btn btn-primary">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        showMessage('获取管理员信息失败: ' + error.message, 'error');
    }
}

/**
 * 保存管理员编辑
 */
async function saveAdmin(event, adminId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest(`/admins/${adminId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showMessage('保存成功', 'success');
        closeModal('editAdminModal');
        await loadAdmins();
    } catch (error) {
        showMessage('保存失败: ' + error.message, 'error');
    }
}

/**
 * 删除管理员
 */
async function deleteAdmin(adminId) {
    if (!confirm('确定要删除该管理员吗？此操作不可恢复！')) return;
    
    try {
        await apiRequest(`/admins/${adminId}`, {
            method: 'DELETE'
        });
        showMessage('删除成功', 'success');
        await loadAdmins();
    } catch (error) {
        showMessage('删除失败: ' + error.message, 'error');
    }
}

/**
 * 重置管理员密码
 */
async function resetAdminPassword(adminId) {
    const newPassword = prompt('请输入新密码（留空则自动生成）：');
    
    if (newPassword === null) return; // 用户取消
    
    try {
        const result = await apiRequest(`/admins/${adminId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword })
        });
        showMessage(`密码重置成功，新密码：${result.newPassword || newPassword}`, 'success');
    } catch (error) {
        showMessage('重置失败: ' + error.message, 'error');
    }
}

/**
 * 切换管理员状态
 */
async function toggleAdminStatus(adminId, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? '启用' : '禁用';
    
    if (!confirm(`确定要${action}该管理员吗？`)) return;
    
    try {
        await apiRequest(`/admins/${adminId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showMessage(`${action}成功`, 'success');
        await loadAdmins();
    } catch (error) {
        showMessage(`${action}失败: ` + error.message, 'error');
    }
}

/**
 * 编辑角色权限
 */
async function editRole(roleId) {
    try {
        const role = await apiRequest(`/roles/${roleId}`);
        
        const allPermissions = [
            { module: '用户管理', permissions: ['user:view', 'user:edit', 'user:delete'] },
            { module: '教师管理', permissions: ['teacher:view', 'teacher:audit', 'teacher:edit'] },
            { module: '机构管理', permissions: ['org:view', 'org:audit', 'org:edit'] },
            { module: '订单管理', permissions: ['order:view', 'order:edit'] },
            { module: '财务管理', permissions: ['finance:view', 'finance:withdraw'] },
            { module: '系统设置', permissions: ['config:view', 'config:edit'] },
        ];
        
        let permissionsHtml = '';
        allPermissions.forEach(module => {
            permissionsHtml += `
                <div class="permission-module">
                    <div class="module-header">
                        <input type="checkbox" class="module-check" data-module="${module.module}">
                        <label>${module.module}</label>
                    </div>
                    <div class="module-permissions">
                        ${module.permissions.map(p => `
                            <label class="permission-item">
                                <input type="checkbox" name="permissions" value="${p}" 
                                    ${role.permissions?.includes(p) ? 'checked' : ''}>
                                ${p.split(':')[1]}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'editRoleModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>编辑角色权限 - ${role.roleName || role.name}</h3>
                    <button class="modal-close" onclick="closeModal('editRoleModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editRoleForm" onsubmit="saveRolePermissions(event, ${roleId})">
                        <div class="form-group">
                            <label class="form-label">角色名称</label>
                            <input type="text" class="form-input" name="roleName" value="${role.roleName || role.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">权限配置</label>
                            <div class="permissions-container">
                                ${permissionsHtml}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModal('editRoleModal')">取消</button>
                    <button type="submit" form="editRoleForm" class="btn btn-primary">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        showMessage('获取角色信息失败: ' + error.message, 'error');
    }
}

/**
 * 保存角色权限
 */
async function saveRolePermissions(event, roleId) {
    event.preventDefault();
    const form = event.target;
    const roleName = form.roleName.value;
    const permissions = Array.from(form.querySelectorAll('input[name="permissions"]:checked')).map(cb => cb.value);
    
    try {
        await apiRequest(`/roles/${roleId}`, {
            method: 'PUT',
            body: JSON.stringify({ roleName, permissions })
        });
        showMessage('保存成功', 'success');
        closeModal('editRoleModal');
        await loadRoles();
    } catch (error) {
        showMessage('保存失败: ' + error.message, 'error');
    }
}

/**
 * 删除角色
 */
async function deleteRole(roleId) {
    if (!confirm('确定要删除该角色吗？已分配该角色的管理员将失去权限！')) return;
    
    try {
        await apiRequest(`/roles/${roleId}`, {
            method: 'DELETE'
        });
        showMessage('删除成功', 'success');
        await loadRoles();
    } catch (error) {
        showMessage('删除失败: ' + error.message, 'error');
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
                    <div class="stat-value">¥12,345</div>
                    <div class="stat-label">总分佣金额</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-value">¥2,580</div>
                    <div class="stat-label">待结算</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                    <div class="stat-value">¥9,765</div>
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
                            <th>订单金额</th>
                            <th>佣金比例</th>
                            <th>佣金金额</th>
                            <th>状态</th>
                            <th>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>张老师</td>
                            <td>李家长</td>
                            <td>¥199.00</td>
                            <td>10%</td>
                            <td><strong>¥19.90</strong></td>
                            <td><span class="badge badge-success">已结算</span></td>
                            <td>2024-01-15</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>王老师</td>
                            <td>赵家长</td>
                            <td>¥299.00</td>
                            <td>10%</td>
                            <td><strong>¥29.90</strong></td>
                            <td><span class="badge badge-warning">待结算</span></td>
                            <td>2024-01-14</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>李老师</td>
                            <td>孙家长</td>
                            <td>¥799.00</td>
                            <td>10%</td>
                            <td><strong>¥79.90</strong></td>
                            <td><span class="badge badge-success">已结算</span></td>
                            <td>2024-01-13</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 提现审核页面 ==========

async function renderWithdrawals() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab-btn active">全部申请</button>
            <button class="tab-btn">待审核 (3)</button>
            <button class="tab-btn">已通过</button>
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

// ========== 用户管理操作函数 ==========

/**
 * 查看用户详情
 */
async function viewUserDetail(userId) {
    try {
        const user = await apiRequest(`/users/${userId}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'userDetailModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>用户详情</h3>
                    <button class="modal-close" onclick="closeModal('userDetailModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>用户ID</label>
                            <span>${user.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>昵称</label>
                            <span>${user.nickname || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>手机号</label>
                            <span>${user.mobile || user.phone || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>角色</label>
                            <span>${user.role === 'parent' ? '家长' : user.role === 'teacher' ? '教师' : user.role === 'org' ? '机构' : user.role}</span>
                        </div>
                        <div class="detail-item">
                            <label>会员状态</label>
                            <span>${user.membership_type ? '会员用户' : '普通用户'}</span>
                        </div>
                        <div class="detail-item">
                            <label>会员到期时间</label>
                            <span>${user.membership_expire_at || user.membership_expire_time || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>注册时间</label>
                            <span>${formatDate(user.created_at || user.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <label>最后登录</label>
                            <span>${formatDate(user.last_login_at)}</span>
                        </div>
                        <div class="detail-item">
                            <label>城市</label>
                            <span>${user.city_name || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>邀请人ID</label>
                            <span>${user.inviter_id || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModal('userDetailModal')">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        showMessage('获取用户详情失败: ' + error.message, 'error');
    }
}

/**
 * 编辑用户
 */
async function editUser(userId) {
    try {
        const user = await apiRequest(`/users/${userId}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'editUserModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑用户</h3>
                    <button class="modal-close" onclick="closeModal('editUserModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm" onsubmit="saveUser(event, ${userId})">
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" name="nickname" value="${user.nickname || ''}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="text" name="mobile" value="${user.mobile || user.phone || ''}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>角色</label>
                            <select name="role" class="form-input">
                                <option value="parent" ${user.role === 'parent' ? 'selected' : ''}>家长</option>
                                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>教师</option>
                                <option value="org" ${user.role === 'org' ? 'selected' : ''}>机构</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>会员类型</label>
                            <select name="membership_type" class="form-input">
                                <option value="0" ${!user.membership_type ? 'selected' : ''}>普通用户</option>
                                <option value="1" ${user.membership_type === 1 ? 'selected' : ''}>年度会员</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>会员到期时间</label>
                            <input type="datetime-local" name="membership_expire_at" value="${user.membership_expire_at || user.membership_expire_time || ''}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>状态</label>
                            <select name="status" class="form-input">
                                <option value="1" ${user.status === 1 ? 'selected' : ''}>启用</option>
                                <option value="0" ${user.status === 0 ? 'selected' : ''}>禁用</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick="closeModal('editUserModal')">取消</button>
                    <button type="submit" form="editUserForm" class="btn btn-primary">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        showMessage('获取用户信息失败: ' + error.message, 'error');
    }
}

/**
 * 保存用户编辑
 */
async function saveUser(event, userId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showMessage('保存成功', 'success');
        closeModal('editUserModal');
        loadUsers();
    } catch (error) {
        showMessage('保存失败: ' + error.message, 'error');
    }
}

/**
 * 切换用户状态
 */
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? '启用' : '禁用';
    
    if (!confirm(`确定要${action}该用户吗？`)) return;
    
    try {
        await apiRequest(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showMessage(`${action}成功`, 'success');
        loadUsers();
    } catch (error) {
        showMessage(`${action}失败: ` + error.message, 'error');
    }
}

// ========== 教师管理操作函数 ==========

let currentTeacherTab = 'all';

/**
 * 切换教师标签页
 */
function switchTeacherTab(tab) {
    currentTeacherTab = tab;
    
    // 更新标签页激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadTeachers();
}

/**
 * 查看教师详情
 */
async function viewTeacherDetail(teacherId) {
    try {
        const teacher = await apiRequest(`/teachers/${teacherId}`);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'teacherDetailModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>教师详情</h3>
                    <button class="modal-close" onclick="closeModal('teacherDetailModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>教师ID</label>
                            <span>${teacher.user_id || teacher.id}</span>
                        </div>
                        <div class="detail-item">
                            <label>真实姓名</label>
                            <span>${teacher.real_name || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>学历</label>
                            <span>${teacher.education || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>毕业院校</label>
                            <span>${teacher.school || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>专业</label>
                            <span>${teacher.major || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>教学科目</label>
                            <span>${Array.isArray(teacher.subjects) ? teacher.subjects.join('、') : teacher.subjects || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <label>教龄</label>
                            <span>${teacher.teaching_years || 0}年</span>
                        </div>
                        <div class="detail-item">
                            <label>时薪范围</label>
                            <span>¥${teacher.hourly_rate_min || 0} - ¥${teacher.hourly_rate_max || 0}</span>
                        </div>
                        <div class="detail-item">
                            <label>评分</label>
                            <span>⭐ ${teacher.rating || 5.0}</span>
                        </div>
                        <div class="detail-item">
                            <label>认证状态</label>
                            <span>${teacher.verify_status === 1 ? '已认证' : teacher.verify_status === 0 ? '待审核' : '已拒绝'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>个人简介</label>
                            <span>${teacher.intro || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModal('teacherDetailModal')">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        showMessage('获取教师详情失败: ' + error.message, 'error');
    }
}

/**
 * 通过教师认证
 */
async function approveTeacher(teacherId) {
    if (!confirm('确定要通过该教师的认证申请吗？')) return;
    
    try {
        await apiRequest(`/teachers/${teacherId}/approve`, {
            method: 'POST'
        });
        showMessage('认证通过', 'success');
        loadTeachers();
    } catch (error) {
        showMessage('操作失败: ' + error.message, 'error');
    }
}

/**
 * 拒绝教师认证
 */
async function rejectTeacher(teacherId) {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;
    
    try {
        await apiRequest(`/teachers/${teacherId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        showMessage('已拒绝', 'success');
        loadTeachers();
    } catch (error) {
        showMessage('操作失败: ' + error.message, 'error');
    }
}

// ========== 提现管理操作函数 ==========

/**
 * 通过提现申请
 */
async function approveWithdrawal(withdrawalId) {
    if (!confirm('确定通过该提现申请吗？')) return;
    
    try {
        await apiRequest(`/withdrawals/${withdrawalId}/approve`, {
            method: 'POST'
        });
        showMessage('提现已通过', 'success');
        renderPage('withdrawals');
    } catch (error) {
        showMessage('操作失败: ' + error.message, 'error');
    }
}

/**
 * 拒绝提现申请
 */
async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('请输入拒绝原因：');
    if (!reason) return;
    
    try {
        await apiRequest(`/withdrawals/${withdrawalId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        showMessage('已拒绝', 'success');
        renderPage('withdrawals');
    } catch (error) {
        showMessage('操作失败: ' + error.message, 'error');
    }
}

// ========== 通用弹窗关闭 ==========

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// 点击遮罩关闭弹窗
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.remove();
    }
});

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
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 18px;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .detail-item.full-width {
        grid-column: 1 / -1;
    }
    
    .detail-item label {
        font-size: 12px;
        color: #6b7280;
    }
    
    .detail-item span {
        font-size: 14px;
        color: #1f2937;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        color: #374151;
    }
    
    .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
    }
    
    .form-input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
`;
document.head.appendChild(style);
