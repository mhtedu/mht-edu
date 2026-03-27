import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, FileText, Building, MapPin, Image as ImageIcon, 
  Settings, LogOut, DollarSign, 
  UserPlus, Bell
} from 'lucide-react-taro';
import './index.css';

// 统计数据类型
interface DashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalParents: number;
  totalOrgs: number;
  totalAgents: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthRevenue: number;
}

// 订单类型
interface Order {
  id: number;
  subject: string;
  hourly_rate: number;
  student_grade: string;
  address: string;
  status: number;
  created_at: string;
  parent_name: string;
  teacher_name: string;
}

// 用户类型
interface User {
  id: number;
  nickname: string;
  avatar: string;
  role: number;
  phone: string;
  is_member: boolean;
  member_expire: string;
  created_at: string;
}

// 菜单项
interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

/**
 * PC管理后台
 */
const AdminPage = () => {
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 菜单配置
  const menus: MenuItem[] = [
    { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
    { id: 'orders', label: '订单管理', icon: FileText, badge: 5 },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'teachers', label: '教师管理', icon: UserPlus },
    { id: 'orgs', label: '机构管理', icon: Building },
    { id: 'agents', label: '代理商管理', icon: MapPin },
    { id: 'banners', label: '广告位管理', icon: ImageIcon },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  useEffect(() => {
    loadData();
  }, [currentMenu]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentMenu === 'dashboard') {
        await loadStats();
      } else if (currentMenu === 'orders') {
        await loadOrders();
      } else if (currentMenu === 'users') {
        await loadUsers();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/stats',
        method: 'GET',
      });
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 模拟数据
      setStats({
        totalUsers: 2586,
        totalTeachers: 328,
        totalParents: 2158,
        totalOrgs: 45,
        totalAgents: 12,
        totalOrders: 1856,
        pendingOrders: 23,
        completedOrders: 1680,
        totalRevenue: 568900,
        monthRevenue: 128600,
      });
    }
  };

  const loadOrders = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/orders',
        method: 'GET',
      });
      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      // 模拟数据
      setOrders([
        { id: 1, subject: '数学', hourly_rate: 180, student_grade: '初三', address: '朝阳区望京', status: 0, created_at: '2024-01-15 10:30', parent_name: '张女士', teacher_name: '' },
        { id: 2, subject: '英语', hourly_rate: 150, student_grade: '高二', address: '海淀区中关村', status: 1, created_at: '2024-01-15 09:20', parent_name: '李先生', teacher_name: '王老师' },
        { id: 3, subject: '物理', hourly_rate: 200, student_grade: '高一', address: '西城区金融街', status: 2, created_at: '2024-01-14 16:45', parent_name: '赵女士', teacher_name: '刘老师' },
      ]);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/users',
        method: 'GET',
      });
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
      // 模拟数据
      setUsers([
        { id: 1, nickname: '张老师', avatar: '', role: 1, phone: '138****1234', is_member: true, member_expire: '2025-01-15', created_at: '2024-01-01' },
        { id: 2, nickname: '李家长', avatar: '', role: 0, phone: '139****5678', is_member: false, member_expire: '', created_at: '2024-01-10' },
        { id: 3, nickname: '王教育', avatar: '', role: 2, phone: '137****9012', is_member: true, member_expire: '2024-12-31', created_at: '2023-12-15' },
      ]);
    }
  };

  const getStatusInfo = (status: number) => {
    const statusMap: Record<number, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { text: '待抢单', variant: 'default' },
      1: { text: '已匹配', variant: 'secondary' },
      2: { text: '试课中', variant: 'secondary' },
      3: { text: '已签约', variant: 'outline' },
      4: { text: '已完成', variant: 'outline' },
      5: { text: '已解除', variant: 'destructive' },
    };
    return statusMap[status] || { text: '未知', variant: 'outline' };
  };

  const getRoleText = (role: number) => {
    const roleMap: Record<number, string> = {
      0: '家长',
      1: '教师',
      2: '机构',
      3: '代理商',
    };
    return roleMap[role] || '未知';
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出管理后台吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('admin_token');
          Taro.redirectTo({ url: '/pages/index/index' });
        }
      },
    });
  };

  // 渲染数据概览
  const renderDashboard = () => (
    <View className="admin-content">
      {/* 统计卡片 */}
      <View className="admin-stats-grid">
        <Card className="admin-stat-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">总用户数</Text>
                <Text className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</Text>
              </View>
              <Users size={32} color="#2563EB" />
            </View>
          </CardContent>
        </Card>
        
        <Card className="admin-stat-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">教师数量</Text>
                <Text className="text-2xl font-bold mt-1">{stats?.totalTeachers || 0}</Text>
              </View>
              <UserPlus size={32} color="#10B981" />
            </View>
          </CardContent>
        </Card>
        
        <Card className="admin-stat-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">待处理订单</Text>
                <Text className="text-2xl font-bold mt-1 text-orange-500">{stats?.pendingOrders || 0}</Text>
              </View>
              <FileText size={32} color="#F59E0B" />
            </View>
          </CardContent>
        </Card>
        
        <Card className="admin-stat-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">本月营收</Text>
                <Text className="text-2xl font-bold mt-1">¥{(stats?.monthRevenue || 0).toLocaleString()}</Text>
              </View>
              <DollarSign size={32} color="#EC4899" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 详细统计 */}
      <View className="admin-stats-grid mt-4">
        <Card className="admin-stat-card">
          <CardHeader>
            <CardTitle>用户分布</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-2">
              <View className="flex justify-between">
                <Text className="text-gray-600">家长</Text>
                <Text className="font-semibold">{stats?.totalParents || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">教师</Text>
                <Text className="font-semibold">{stats?.totalTeachers || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">机构</Text>
                <Text className="font-semibold">{stats?.totalOrgs || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">代理商</Text>
                <Text className="font-semibold">{stats?.totalAgents || 0}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardHeader>
            <CardTitle>订单统计</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-2">
              <View className="flex justify-between">
                <Text className="text-gray-600">总订单数</Text>
                <Text className="font-semibold">{stats?.totalOrders || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">待处理</Text>
                <Text className="font-semibold text-orange-500">{stats?.pendingOrders || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">已完成</Text>
                <Text className="font-semibold text-green-500">{stats?.completedOrders || 0}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-600">总营收</Text>
                <Text className="font-semibold">¥{(stats?.totalRevenue || 0).toLocaleString()}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );

  // 渲染订单管理
  const renderOrders = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>订单列表</CardTitle>
            <Button size="sm">导出数据</Button>
          </View>
        </CardHeader>
        <CardContent>
          {/* 表格头部 */}
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">科目</Text>
            <Text className="admin-table-cell w-20">时薪</Text>
            <Text className="admin-table-cell w-20">年级</Text>
            <Text className="admin-table-cell flex-1">家长</Text>
            <Text className="admin-table-cell flex-1">教师</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-32">操作</Text>
          </View>
          
          {/* 表格内容 */}
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <View key={order.id} className="admin-table-row">
                <Text className="admin-table-cell w-16">{order.id}</Text>
                <Text className="admin-table-cell flex-1">{order.subject}</Text>
                <Text className="admin-table-cell w-20">¥{order.hourly_rate}</Text>
                <Text className="admin-table-cell w-20">{order.student_grade}</Text>
                <Text className="admin-table-cell flex-1">{order.parent_name}</Text>
                <Text className="admin-table-cell flex-1">{order.teacher_name || '-'}</Text>
                <View className="admin-table-cell w-20">
                  <Badge variant={statusInfo.variant}>
                    <Text className="text-xs">{statusInfo.text}</Text>
                  </Badge>
                </View>
                <View className="admin-table-cell w-32 flex gap-2">
                  <Button size="sm" variant="outline">查看</Button>
                  <Button size="sm" variant="outline">编辑</Button>
                </View>
              </View>
            );
          })}
        </CardContent>
      </Card>
    </View>
  );

  // 渲染用户管理
  const renderUsers = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>用户列表</CardTitle>
            <Button size="sm">添加用户</Button>
          </View>
        </CardHeader>
        <CardContent>
          {/* 表格头部 */}
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">昵称</Text>
            <Text className="admin-table-cell w-20">角色</Text>
            <Text className="admin-table-cell w-28">手机号</Text>
            <Text className="admin-table-cell w-20">会员</Text>
            <Text className="admin-table-cell w-28">注册时间</Text>
            <Text className="admin-table-cell w-32">操作</Text>
          </View>
          
          {/* 表格内容 */}
          {users.map((user) => (
            <View key={user.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{user.id}</Text>
              <Text className="admin-table-cell flex-1">{user.nickname}</Text>
              <Text className="admin-table-cell w-20">{getRoleText(user.role)}</Text>
              <Text className="admin-table-cell w-28">{user.phone}</Text>
              <View className="admin-table-cell w-20">
                <Badge variant={user.is_member ? 'default' : 'outline'}>
                  <Text className="text-xs">{user.is_member ? '会员' : '普通'}</Text>
                </Badge>
              </View>
              <Text className="admin-table-cell w-28">{user.created_at}</Text>
              <View className="admin-table-cell w-32 flex gap-2">
                <Button size="sm" variant="outline">查看</Button>
                <Button size="sm" variant="outline">禁用</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  );

  // 渲染其他模块（占位）
  const renderPlaceholder = (title: string) => (
    <View className="admin-content flex items-center justify-center h-96">
      <View className="text-center">
        <Text className="text-gray-400 text-lg">{title}模块开发中...</Text>
        <Text className="text-gray-300 text-sm mt-2">敬请期待</Text>
      </View>
    </View>
  );

  return (
    <View className="admin-layout">
      {/* 侧边栏 */}
      <View className="admin-sidebar">
        <View className="admin-logo">
          <Text className="text-xl font-bold text-white">棉花糖教育</Text>
          <Text className="text-xs text-blue-200">管理后台</Text>
        </View>
        
        <View className="admin-menu">
          {menus.map((menu) => (
            <View
              key={menu.id}
              className={`admin-menu-item ${currentMenu === menu.id ? 'active' : ''}`}
              onClick={() => setCurrentMenu(menu.id)}
            >
              <menu.icon size={18} color={currentMenu === menu.id ? '#2563EB' : '#9CA3AF'} />
              <Text className={currentMenu === menu.id ? 'text-blue-500' : 'text-gray-500'}>
                {menu.label}
              </Text>
              {menu.badge && (
                <Badge variant="destructive" className="ml-auto">
                  <Text className="text-xs">{menu.badge}</Text>
                </Badge>
              )}
            </View>
          ))}
        </View>
        
        <View className="admin-sidebar-footer">
          <View className="admin-menu-item" onClick={handleLogout}>
            <LogOut size={18} color="#EF4444" />
            <Text className="text-red-500">退出登录</Text>
          </View>
        </View>
      </View>

      {/* 主内容区 */}
      <View className="admin-main">
        {/* 顶部栏 */}
        <View className="admin-header">
          <Text className="text-lg font-semibold">
            {menus.find(m => m.id === currentMenu)?.label || '数据概览'}
          </Text>
          <View className="flex items-center gap-4">
            <Bell size={20} color="#6B7280" />
            <View className="flex items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Text className="text-white text-sm">管</Text>
              </View>
              <Text className="text-sm">管理员</Text>
            </View>
          </View>
        </View>

        {/* 内容区 */}
        {loading ? (
          <View className="flex items-center justify-center h-96">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : (
          <>
            {currentMenu === 'dashboard' && renderDashboard()}
            {currentMenu === 'orders' && renderOrders()}
            {currentMenu === 'users' && renderUsers()}
            {currentMenu === 'teachers' && renderPlaceholder('教师管理')}
            {currentMenu === 'orgs' && renderPlaceholder('机构管理')}
            {currentMenu === 'agents' && renderPlaceholder('代理商管理')}
            {currentMenu === 'banners' && renderPlaceholder('广告位管理')}
            {currentMenu === 'settings' && renderPlaceholder('系统设置')}
          </>
        )}
      </View>
    </View>
  );
};

export default AdminPage;
