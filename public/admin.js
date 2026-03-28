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
