import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, FileText, Building, MapPin, Image as ImageIcon, 
  Settings, LogOut, DollarSign, UserPlus, Gift, Percent,
  ShoppingBag, Calendar, ChevronRight, Search, Eye, Pencil, Trash2,
  Check, X, Plus, Download, Upload, Award, CreditCard
} from 'lucide-react-taro';
import './index.css';

// ==================== 类型定义 ====================

interface DashboardStats {
  users: { total: number; parents: number; teachers: number; orgs: number; members: number; todayNew: number };
  orders: { total: number; pending: number; matched: number; ongoing: number; completed: number; todayNew: number };
  payments: { totalAmount: number; todayAmount: number; weekAmount: number; monthAmount: number };
  commissions: { pending: number; settled: number; withdrawn: number };
}

interface User {
  id: number;
  nickname: string;
  phone: string;
  avatar: string;
  role: number; // 0-家长 1-教师 2-机构
  status: number;
  is_member: number;
  member_expire: string;
  created_at: string;
}

interface Teacher {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  avatar: string;
  subjects: string[];
  verify_status: number; // 0-待审核 1-已认证 2-已拒绝
  rating: number;
  order_count: number;
  created_at: string;
}

interface Order {
  id: number;
  order_no: string;
  parent_name: string;
  teacher_name: string;
  subject: string;
  status: number; // 0-待抢单 1-已匹配 2-进行中 3-已完成 4-已取消
  price: number;
  created_at: string;
}

interface Org {
  id: number;
  user_id: number;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  teacher_count: number;
  status: number;
  created_at: string;
}

interface MembershipPlan {
  id: number;
  name: string;
  role: number;
  price: number;
  original_price: number;
  duration_days: number;
  features: string[];
  is_active: number;
}

interface Activity {
  id: number;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
  address: string;
  max_participants: number;
  current_participants: number;
  status: string;
}

interface Banner {
  id: number;
  position: string;
  title: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: number;
}

interface SiteConfig {
  [key: string]: string;
}

// ==================== 菜单配置 ====================

const MENUS = [
  { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'teachers', label: '教师管理', icon: UserPlus },
  { id: 'orgs', label: '机构管理', icon: Building },
  { id: 'orders', label: '订单管理', icon: FileText },
  { id: 'elite-class', label: '牛师班管理', icon: Award },
  { id: 'membership', label: '会员套餐', icon: Gift },
  { id: 'activities', label: '活动管理', icon: Calendar },
  { id: 'products', label: '商品管理', icon: ShoppingBag },
  { id: 'banners', label: '广告位管理', icon: ImageIcon },
  { id: 'commissions', label: '分佣管理', icon: Percent },
  { id: 'withdrawals', label: '提现审核', icon: CreditCard },
  { id: 'agents', label: '代理商管理', icon: MapPin },
  { id: 'config', label: '系统配置', icon: Settings },
  { id: 'payment', label: '支付配置', icon: DollarSign },
];

/**
 * PC管理后台 - 完整版
 */
const AdminPage = () => {
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  
  // 筛选状态
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [currentMenu, page, statusFilter, roleFilter]);

  // ==================== 数据加载 ====================

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentMenu) {
        case 'dashboard':
          await loadStats();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'teachers':
          await loadTeachers();
          break;
        case 'orgs':
          await loadOrgs();
          break;
        case 'orders':
          await loadOrders();
          break;
        case 'membership':
          await loadMembershipPlans();
          break;
        case 'activities':
          await loadActivities();
          break;
        case 'banners':
          await loadBanners();
          break;
        case 'config':
          await loadSiteConfig();
          break;
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await Network.request({ url: '/api/admin/stats', method: 'GET' });
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      // 模拟数据
      setStats({
        users: { total: 2586, parents: 2158, teachers: 328, orgs: 45, members: 856, todayNew: 23 },
        orders: { total: 1856, pending: 23, matched: 156, ongoing: 89, completed: 1580, todayNew: 15 },
        payments: { totalAmount: 568900, todayAmount: 12800, weekAmount: 85600, monthAmount: 128600 },
        commissions: { pending: 12500, settled: 85600, withdrawn: 72000 },
      });
    }
  };

  const loadUsers = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/users',
        method: 'GET',
        data: { page, pageSize, role: roleFilter, keyword, status: statusFilter }
      });
      if (res.data && res.data.data) {
        setUsers(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      // 模拟数据
      setUsers([
        { id: 1, nickname: '张三', phone: '138****1234', avatar: '', role: 0, status: 1, is_member: 1, member_expire: '2025-12-31', created_at: '2024-01-15' },
        { id: 2, nickname: '李老师', phone: '139****5678', avatar: '', role: 1, status: 1, is_member: 1, member_expire: '2025-06-30', created_at: '2024-01-10' },
        { id: 3, nickname: '王机构', phone: '136****9012', avatar: '', role: 2, status: 1, is_member: 0, member_expire: '', created_at: '2024-01-08' },
      ]);
      setTotal(100);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/teachers',
        method: 'GET',
        data: { page, pageSize, keyword, verifyStatus: statusFilter }
      });
      if (res.data && res.data.data) {
        setTeachers(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      // 模拟数据
      setTeachers([
        { id: 1, user_id: 101, name: '李老师', phone: '139****5678', avatar: '', subjects: ['数学', '物理'], verify_status: 1, rating: 4.9, order_count: 56, created_at: '2024-01-10' },
        { id: 2, user_id: 102, name: '王老师', phone: '138****9012', avatar: '', subjects: ['英语'], verify_status: 0, rating: 0, order_count: 0, created_at: '2024-01-20' },
      ]);
      setTotal(50);
    }
  };

  const loadOrgs = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/orgs',
        method: 'GET',
        data: { page, pageSize, status: statusFilter }
      });
      if (res.data && res.data.data) {
        setOrgs(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      // 模拟数据
      setOrgs([
        { id: 1, user_id: 201, name: '启航教育', contact_person: '张经理', phone: '138****1234', address: '北京市海淀区', teacher_count: 15, status: 1, created_at: '2024-01-05' },
        { id: 2, user_id: 202, name: '优学派教育', contact_person: '李经理', phone: '139****5678', address: '北京市朝阳区', teacher_count: 8, status: 0, created_at: '2024-01-18' },
      ]);
      setTotal(20);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/orders',
        method: 'GET',
        data: { page, pageSize, keyword, status: statusFilter }
      });
      if (res.data && res.data.data) {
        setOrders(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      // 模拟数据
      setOrders([
        { id: 1, order_no: 'ORD202401150001', parent_name: '张三', teacher_name: '李老师', subject: '数学', status: 1, price: 200, created_at: '2024-01-15' },
        { id: 2, order_no: 'ORD202401160002', parent_name: '李四', teacher_name: '', subject: '英语', status: 0, price: 150, created_at: '2024-01-16' },
      ]);
      setTotal(500);
    }
  };

  const loadMembershipPlans = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/membership-plans',
        method: 'GET',
      });
      if (res.data && res.data.data) {
        setMembershipPlans(res.data.data || []);
      }
    } catch (error) {
      // 模拟数据
      setMembershipPlans([
        { id: 1, name: '家长月卡', role: 0, price: 29.9, original_price: 59, duration_days: 30, features: ['查看联系方式', '无限发布需求'], is_active: 1 },
        { id: 2, name: '家长年卡', role: 0, price: 199, original_price: 708, duration_days: 365, features: ['查看联系方式', '无限发布需求', '专属客服'], is_active: 1 },
        { id: 3, name: '教师月卡', role: 1, price: 39.9, original_price: 79, duration_days: 30, features: ['查看联系方式', '无限抢单'], is_active: 1 },
        { id: 4, name: '机构年卡', role: 2, price: 999, original_price: 2388, duration_days: 365, features: ['无限发布教师', '优先展示'], is_active: 1 },
      ]);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/activities',
        method: 'GET',
        data: { page, pageSize }
      });
      if (res.data && res.data.data) {
        setActivities(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (error) {
      // 模拟数据
      setActivities([
        { id: 1, title: '北京四中探校活动', type: 'visit', start_time: '2024-04-15 09:00', end_time: '2024-04-15 12:00', address: '北京四中', max_participants: 50, current_participants: 32, status: 'upcoming' },
      ]);
      setTotal(20);
    }
  };

  const loadBanners = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/banners',
        method: 'GET',
      });
      if (res.data && res.data.data) {
        setBanners(res.data.data || []);
      }
    } catch (error) {
      // 模拟数据
      setBanners([
        { id: 1, position: 'home_top', title: '新年活动', image_url: '', link_url: '/pages/activity/index', sort_order: 1, is_active: 1 },
        { id: 2, position: 'home_top', title: '会员优惠', image_url: '', link_url: '/pages/membership/index', sort_order: 2, is_active: 1 },
      ]);
    }
  };

  const loadSiteConfig = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/config',
        method: 'GET',
      });
      if (res.data && res.data.data) {
        const config: SiteConfig = {};
        res.data.data.forEach((item: any) => {
          config[item.config_key] = item.config_value;
        });
        setSiteConfig(config);
      }
    } catch (error) {
      // 模拟数据
      setSiteConfig({
        site_name: '教育平台',
        site_logo: '',
        site_description: '专业的教育信息撮合平台',
        contact_phone: '400-888-8888',
        contact_wechat: 'mht_edu',
        icp_number: '京ICP备XXXXXXXX号',
      });
    }
  };

  // ==================== 操作方法 ====================

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

  const updateUserStatus = async (userId: number, status: number) => {
    try {
      await Network.request({
        url: `/api/admin/users/${userId}/status`,
        method: 'PUT',
        data: { status }
      });
      Taro.showToast({ title: '操作成功', icon: 'success' });
      loadUsers();
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const verifyTeacher = async (teacherId: number, status: number) => {
    try {
      await Network.request({
        url: `/api/admin/teachers/${teacherId}/verify`,
        method: 'PUT',
        data: { status }
      });
      Taro.showToast({ title: '操作成功', icon: 'success' });
      loadTeachers();
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const auditOrg = async (orgId: number, status: number) => {
    try {
      await Network.request({
        url: `/api/admin/orgs/${orgId}/audit`,
        method: 'PUT',
        data: { status }
      });
      Taro.showToast({ title: '操作成功', icon: 'success' });
      loadOrgs();
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const saveSiteConfig = async () => {
    try {
      const configs = Object.entries(siteConfig).map(([key, value]) => ({ key, value }));
      await Network.request({
        url: '/api/admin/config/batch-update',
        method: 'POST',
        data: { configs }
      });
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  // ==================== 渲染方法 ====================

  const renderDashboard = () => (
    <View className="p-6">
      {/* 统计卡片 */}
      <View className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">总用户数</Text>
                <Text className="text-2xl font-bold mt-1">{(stats && stats.users && stats.users.total) || 0}</Text>
                <Text className="text-xs text-green-500 mt-1">今日+{(stats && stats.users && stats.users.todayNew) || 0}</Text>
              </View>
              <Users size={32} color="#2563EB" />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">教师数量</Text>
                <Text className="text-2xl font-bold mt-1">{(stats && stats.users && stats.users.teachers) || 0}</Text>
                <Text className="text-xs text-gray-400 mt-1">会员{(stats && stats.users && stats.users.members) || 0}</Text>
              </View>
              <UserPlus size={32} color="#10B981" />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">待处理订单</Text>
                <Text className="text-2xl font-bold mt-1 text-orange-500">{(stats && stats.orders && stats.orders.pending) || 0}</Text>
                <Text className="text-xs text-gray-400 mt-1">进行中{(stats && stats.orders && stats.orders.ongoing) || 0}</Text>
              </View>
              <FileText size={32} color="#F59E0B" />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">本月营收</Text>
                <Text className="text-2xl font-bold mt-1">¥{((stats && stats.payments && stats.payments.monthAmount) || 0).toLocaleString()}</Text>
                <Text className="text-xs text-green-500 mt-1">今日¥{((stats && stats.payments && stats.payments.todayAmount) || 0).toLocaleString()}</Text>
              </View>
              <DollarSign size={32} color="#EC4899" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 详细统计 */}
      <View className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>用户分布</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">家长用户</Text>
                <Text className="font-semibold">{(stats && stats.users && stats.users.parents) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">教师用户</Text>
                <Text className="font-semibold">{(stats && stats.users && stats.users.teachers) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">机构用户</Text>
                <Text className="font-semibold">{(stats && stats.users && stats.users.orgs) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">会员用户</Text>
                <Text className="font-semibold text-blue-500">{(stats && stats.users && stats.users.members) || 0}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>订单统计</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">总订单数</Text>
                <Text className="font-semibold">{(stats && stats.orders && stats.orders.total) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">待抢单</Text>
                <Text className="font-semibold text-orange-500">{(stats && stats.orders && stats.orders.pending) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">已完成</Text>
                <Text className="font-semibold text-green-500">{(stats && stats.orders && stats.orders.completed) || 0}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">今日新增</Text>
                <Text className="font-semibold">{(stats && stats.orders && stats.orders.todayNew) || 0}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>分佣统计</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">待结算</Text>
                <Text className="font-semibold text-orange-500">¥{((stats && stats.commissions && stats.commissions.pending) || 0).toLocaleString()}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">已结算</Text>
                <Text className="font-semibold text-green-500">¥{((stats && stats.commissions && stats.commissions.settled) || 0).toLocaleString()}</Text>
              </View>
              <View className="flex justify-between items-center">
                <Text className="text-gray-600">已提现</Text>
                <Text className="font-semibold">¥{((stats && stats.commissions && stats.commissions.withdrawn) || 0).toLocaleString()}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View className="p-6">
      {/* 筛选栏 */}
      <View className="flex gap-4 mb-4">
        <View className="flex-1 flex items-center gap-2">
          <Search size={16} color="#999" />
          <Input
            className="flex-1"
            placeholder="搜索用户昵称/手机号"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>
        <View className="flex items-center gap-2">
          <Text className="text-gray-600">角色：</Text>
          <View className="flex gap-2">
            <Button size="sm" variant={roleFilter === '' ? 'default' : 'outline'} onClick={() => setRoleFilter('')}>全部</Button>
            <Button size="sm" variant={roleFilter === '0' ? 'default' : 'outline'} onClick={() => setRoleFilter('0')}>家长</Button>
            <Button size="sm" variant={roleFilter === '1' ? 'default' : 'outline'} onClick={() => setRoleFilter('1')}>教师</Button>
            <Button size="sm" variant={roleFilter === '2' ? 'default' : 'outline'} onClick={() => setRoleFilter('2')}>机构</Button>
          </View>
        </View>
      </View>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">用户信息</Text>
              <Text className="w-20">角色</Text>
              <Text className="w-20">会员</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">注册时间</Text>
              <Text className="w-32">操作</Text>
            </View>
            {users.map((user) => (
              <View key={user.id} className="admin-table-row">
                <Text className="w-16">{user.id}</Text>
                <View className="flex-1 flex items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-gray-200" />
                  <View>
                    <Text className="font-medium">{user.nickname}</Text>
                    <Text className="text-xs text-gray-500">{user.phone}</Text>
                  </View>
                </View>
                <Text className="w-20">{user.role === 0 ? '家长' : user.role === 1 ? '教师' : '机构'}</Text>
                <Text className="w-20">{user.is_member ? '是' : '否'}</Text>
                <View className="w-20">
                  <Badge variant={user.status === 1 ? 'default' : 'secondary'}>
                    <Text className="text-xs">{user.status === 1 ? '正常' : '禁用'}</Text>
                  </Badge>
                </View>
                <Text className="w-32 text-sm text-gray-500">{user.created_at}</Text>
                <View className="w-32 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  <Button size="sm" onClick={() => updateUserStatus(user.id, user.status === 1 ? 0 : 1)}>
                    {user.status === 1 ? <X size={14} color="#fff" /> : <Check size={14} color="#fff" />}
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* 分页 */}
      <View className="flex justify-between items-center mt-4">
        <Text className="text-gray-500">共 {total} 条记录</Text>
        <View className="flex gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <Button size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>下一页</Button>
        </View>
      </View>
    </View>
  );

  const renderTeachers = () => (
    <View className="p-6">
      <View className="flex gap-4 mb-4">
        <View className="flex-1 flex items-center gap-2">
          <Search size={16} color="#999" />
          <Input
            className="flex-1"
            placeholder="搜索教师姓名/手机号"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>
        <View className="flex items-center gap-2">
          <Text className="text-gray-600">状态：</Text>
          <View className="flex gap-2">
            <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
            <Button size="sm" variant={statusFilter === '0' ? 'default' : 'outline'} onClick={() => setStatusFilter('0')}>待审核</Button>
            <Button size="sm" variant={statusFilter === '1' ? 'default' : 'outline'} onClick={() => setStatusFilter('1')}>已认证</Button>
          </View>
        </View>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">教师信息</Text>
              <Text className="w-32">科目</Text>
              <Text className="w-20">评分</Text>
              <Text className="w-20">订单</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">操作</Text>
            </View>
            {teachers.map((teacher) => (
              <View key={teacher.id} className="admin-table-row">
                <Text className="w-16">{teacher.id}</Text>
                <View className="flex-1 flex items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-gray-200" />
                  <View>
                    <Text className="font-medium">{teacher.name}</Text>
                    <Text className="text-xs text-gray-500">{teacher.phone}</Text>
                  </View>
                </View>
                <Text className="w-32">{teacher.subjects && teacher.subjects.join(', ')}</Text>
                <Text className="w-20">{teacher.rating || '-'}</Text>
                <Text className="w-20">{teacher.order_count}</Text>
                <View className="w-20">
                  <Badge variant={teacher.verify_status === 1 ? 'default' : teacher.verify_status === 0 ? 'secondary' : 'destructive'}>
                    <Text className="text-xs">{teacher.verify_status === 1 ? '已认证' : teacher.verify_status === 0 ? '待审核' : '已拒绝'}</Text>
                  </Badge>
                </View>
                <View className="w-32 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  {teacher.verify_status === 0 && (
                    <>
                      <Button size="sm" onClick={() => verifyTeacher(teacher.id, 1)}><Check size={14} color="#fff" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => verifyTeacher(teacher.id, 2)}><X size={14} color="#fff" /></Button>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderOrgs = () => (
    <View className="p-6">
      <View className="flex gap-4 mb-4">
        <View className="flex items-center gap-2">
          <Text className="text-gray-600">状态：</Text>
          <View className="flex gap-2">
            <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
            <Button size="sm" variant={statusFilter === '0' ? 'default' : 'outline'} onClick={() => setStatusFilter('0')}>待审核</Button>
            <Button size="sm" variant={statusFilter === '1' ? 'default' : 'outline'} onClick={() => setStatusFilter('1')}>已通过</Button>
          </View>
        </View>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">机构信息</Text>
              <Text className="w-24">教师数</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">注册时间</Text>
              <Text className="w-32">操作</Text>
            </View>
            {orgs.map((org) => (
              <View key={org.id} className="admin-table-row">
                <Text className="w-16">{org.id}</Text>
                <View className="flex-1">
                  <Text className="font-medium">{org.name}</Text>
                  <Text className="text-xs text-gray-500">{org.contact_person} | {org.phone}</Text>
                  <Text className="text-xs text-gray-400">{org.address}</Text>
                </View>
                <Text className="w-24">{org.teacher_count}人</Text>
                <View className="w-20">
                  <Badge variant={org.status === 1 ? 'default' : 'secondary'}>
                    <Text className="text-xs">{org.status === 1 ? '已通过' : '待审核'}</Text>
                  </Badge>
                </View>
                <Text className="w-32 text-sm text-gray-500">{org.created_at}</Text>
                <View className="w-32 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  {org.status === 0 && (
                    <>
                      <Button size="sm" onClick={() => auditOrg(org.id, 1)}><Check size={14} color="#fff" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => auditOrg(org.id, 2)}><X size={14} color="#fff" /></Button>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderOrders = () => (
    <View className="p-6">
      <View className="flex gap-4 mb-4">
        <View className="flex-1 flex items-center gap-2">
          <Search size={16} color="#999" />
          <Input
            className="flex-1"
            placeholder="搜索订单号"
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
        </View>
        <View className="flex items-center gap-2">
          <Text className="text-gray-600">状态：</Text>
          <View className="flex gap-2">
            <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
            <Button size="sm" variant={statusFilter === '0' ? 'default' : 'outline'} onClick={() => setStatusFilter('0')}>待抢单</Button>
            <Button size="sm" variant={statusFilter === '1' ? 'default' : 'outline'} onClick={() => setStatusFilter('1')}>已匹配</Button>
            <Button size="sm" variant={statusFilter === '3' ? 'default' : 'outline'} onClick={() => setStatusFilter('3')}>已完成</Button>
          </View>
        </View>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-40">订单号</Text>
              <Text className="flex-1">家长</Text>
              <Text className="flex-1">教师</Text>
              <Text className="w-24">科目</Text>
              <Text className="w-24">金额</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">创建时间</Text>
              <Text className="w-24">操作</Text>
            </View>
            {orders.map((order) => (
              <View key={order.id} className="admin-table-row">
                <Text className="w-40 text-sm">{order.order_no}</Text>
                <Text className="flex-1">{order.parent_name}</Text>
                <Text className="flex-1">{order.teacher_name || '-'}</Text>
                <Text className="w-24">{order.subject}</Text>
                <Text className="w-24">¥{order.price}</Text>
                <View className="w-20">
                  <Badge variant={order.status === 3 ? 'default' : order.status === 0 ? 'secondary' : 'outline'}>
                    <Text className="text-xs">{order.status === 0 ? '待抢单' : order.status === 1 ? '已匹配' : order.status === 2 ? '进行中' : '已完成'}</Text>
                  </Badge>
                </View>
                <Text className="w-32 text-sm text-gray-500">{order.created_at}</Text>
                <View className="w-24">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderMembership = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">会员套餐管理</Text>
        <Button><Plus size={16} color="#fff" className="mr-1" /> 添加套餐</Button>
      </View>

      <View className="grid grid-cols-3 gap-4">
        {/* 家长套餐 */}
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>家长套餐</CardTitle>
              <Badge><Text className="text-xs">{membershipPlans.filter(p => p.role === 0).length}个</Text></Badge>
            </View>
          </CardHeader>
          <CardContent>
            {membershipPlans.filter(p => p.role === 0).map((plan) => (
              <View key={plan.id} className="p-3 border rounded mb-2">
                <View className="flex justify-between items-center">
                  <Text className="font-medium">{plan.name}</Text>
                  <View className="flex gap-1">
                    <Button size="sm" variant="outline"><Pencil size={14} color="#666" /></Button>
                  </View>
                </View>
                <View className="flex items-baseline gap-2 mt-1">
                  <Text className="text-lg font-bold text-blue-500">¥{plan.price}</Text>
                  <Text className="text-sm text-gray-400 line-through">¥{plan.original_price}</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">{plan.duration_days}天</Text>
                <View className="flex flex-wrap gap-1 mt-2">
                  {plan.features && plan.features.slice(0, 2).map((f, i) => (
                    <Badge key={i} variant="secondary"><Text className="text-xs">{f}</Text></Badge>
                  ))}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 教师套餐 */}
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>教师套餐</CardTitle>
              <Badge><Text className="text-xs">{membershipPlans.filter(p => p.role === 1).length}个</Text></Badge>
            </View>
          </CardHeader>
          <CardContent>
            {membershipPlans.filter(p => p.role === 1).map((plan) => (
              <View key={plan.id} className="p-3 border rounded mb-2">
                <View className="flex justify-between items-center">
                  <Text className="font-medium">{plan.name}</Text>
                  <Button size="sm" variant="outline"><Pencil size={14} color="#666" /></Button>
                </View>
                <View className="flex items-baseline gap-2 mt-1">
                  <Text className="text-lg font-bold text-blue-500">¥{plan.price}</Text>
                  <Text className="text-sm text-gray-400 line-through">¥{plan.original_price}</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">{plan.duration_days}天</Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 机构套餐 */}
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>机构套餐</CardTitle>
              <Badge><Text className="text-xs">{membershipPlans.filter(p => p.role === 2).length}个</Text></Badge>
            </View>
          </CardHeader>
          <CardContent>
            {membershipPlans.filter(p => p.role === 2).map((plan) => (
              <View key={plan.id} className="p-3 border rounded mb-2">
                <View className="flex justify-between items-center">
                  <Text className="font-medium">{plan.name}</Text>
                  <Button size="sm" variant="outline"><Pencil size={14} color="#666" /></Button>
                </View>
                <View className="flex items-baseline gap-2 mt-1">
                  <Text className="text-lg font-bold text-blue-500">¥{plan.price}</Text>
                  <Text className="text-sm text-gray-400 line-through">¥{plan.original_price}</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">{plan.duration_days}天</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    </View>
  );

  const renderBanners = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">广告位管理</Text>
        <Button><Plus size={16} color="#fff" className="mr-1" /> 添加广告</Button>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-32">位置</Text>
              <Text className="flex-1">标题</Text>
              <Text className="w-48">链接</Text>
              <Text className="w-20">排序</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">操作</Text>
            </View>
            {banners.map((banner) => (
              <View key={banner.id} className="admin-table-row">
                <Text className="w-16">{banner.id}</Text>
                <Text className="w-32">{banner.position}</Text>
                <Text className="flex-1">{banner.title}</Text>
                <Text className="w-48 text-sm text-gray-500">{banner.link_url}</Text>
                <Text className="w-20">{banner.sort_order}</Text>
                <View className="w-20">
                  <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                    <Text className="text-xs">{banner.is_active ? '启用' : '禁用'}</Text>
                  </Badge>
                </View>
                <View className="w-32 flex gap-2">
                  <Button size="sm" variant="outline"><Pencil size={14} color="#666" /></Button>
                  <Button size="sm" variant="outline"><Trash2 size={14} color="#666" /></Button>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderActivities = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">活动管理</Text>
        <Button><Plus size={16} color="#fff" className="mr-1" /> 创建活动</Button>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">活动名称</Text>
              <Text className="w-24">类型</Text>
              <Text className="w-48">时间</Text>
              <Text className="w-24">人数</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">操作</Text>
            </View>
            {activities.map((activity) => (
              <View key={activity.id} className="admin-table-row">
                <Text className="w-16">{activity.id}</Text>
                <Text className="flex-1">{activity.title}</Text>
                <Text className="w-24">{activity.type === 'visit' ? '探校' : activity.type === 'training' ? '培训' : '讲座'}</Text>
                <Text className="w-48 text-sm text-gray-500">{activity.start_time}</Text>
                <Text className="w-24">{activity.current_participants}/{activity.max_participants}</Text>
                <View className="w-20">
                  <Badge variant={activity.status === 'upcoming' ? 'secondary' : 'default'}>
                    <Text className="text-xs">{activity.status === 'upcoming' ? '未开始' : '进行中'}</Text>
                  </Badge>
                </View>
                <View className="w-32 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  <Button size="sm" variant="outline"><Pencil size={14} color="#666" /></Button>
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderConfig = () => (
    <View className="p-6">
      <Card>
        <CardHeader><CardTitle>站点基本信息</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">站点名称</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.site_name || ''}
                  onInput={(e) => setSiteConfig({ ...siteConfig, site_name: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">站点Logo</Text>
              <View className="flex-1 flex items-center gap-2">
                <Input
                  value={siteConfig.site_logo || ''}
                  placeholder="Logo图片URL"
                  onInput={(e) => setSiteConfig({ ...siteConfig, site_logo: e.detail.value })}
                />
                <Button size="sm" variant="outline"><Upload size={14} color="#666" /></Button>
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">站点描述</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.site_description || ''}
                  onInput={(e) => setSiteConfig({ ...siteConfig, site_description: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">客服电话</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.contact_phone || ''}
                  onInput={(e) => setSiteConfig({ ...siteConfig, contact_phone: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">客服微信</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.contact_wechat || ''}
                  onInput={(e) => setSiteConfig({ ...siteConfig, contact_wechat: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">ICP备案号</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.icp_number || ''}
                  placeholder="京ICP备XXXXXXXX号"
                  onInput={(e) => setSiteConfig({ ...siteConfig, icp_number: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>分佣配置</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">平台分佣比例(%)</Text>
              <View className="w-32">
                <Input
                  type="number"
                  value={siteConfig.commission_rate_platform || '5'}
                  onInput={(e) => setSiteConfig({ ...siteConfig, commission_rate_platform: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">推荐人分佣比例(%)</Text>
              <View className="w-32">
                <Input
                  type="number"
                  value={siteConfig.commission_rate_referrer || '10'}
                  onInput={(e) => setSiteConfig({ ...siteConfig, commission_rate_referrer: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="mt-4 flex justify-end">
        <Button onClick={saveSiteConfig}>保存配置</Button>
      </View>
    </View>
  );

  const renderPayment = () => (
    <View className="p-6">
      <Card>
        <CardHeader><CardTitle>微信小程序配置</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">小程序AppID</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wechat_appid || ''}
                  placeholder="wxXXXXXXXXXXXXXXXX"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wechat_appid: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">小程序Secret</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wechat_secret || ''}
                  placeholder="32位密钥"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wechat_secret: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>微信支付配置</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">商户号</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wechat_mch_id || ''}
                  placeholder="微信支付商户号"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wechat_mch_id: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">支付密钥</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wechat_pay_key || ''}
                  placeholder="32位API密钥"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wechat_pay_key: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="mt-4 flex justify-end">
        <Button onClick={saveSiteConfig}>保存配置</Button>
      </View>
    </View>
  );

  const renderEliteClass = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">牛师班管理</Text>
        <Button><Plus size={16} color="#fff" className="mr-1" /> 创建班级</Button>
      </View>

      <Card>
        <CardContent className="p-8">
          <View className="flex flex-col items-center justify-center text-gray-400">
            <Award size={48} color="#9ca3af" />
            <Text className="mt-4">暂无牛师班数据</Text>
            <Text className="text-sm mt-2">教师创建的牛师班将在此显示</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderCommissions = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">分佣管理</Text>
        <View className="flex gap-2">
          <Button variant="outline"><Download size={16} color="#666" className="mr-1" /> 导出</Button>
          <Button><Check size={16} color="#fff" className="mr-1" /> 批量结算</Button>
        </View>
      </View>

      <Card>
        <CardContent className="p-8">
          <View className="flex flex-col items-center justify-center text-gray-400">
            <Percent size={48} color="#9ca3af" />
            <Text className="mt-4">暂无分佣记录</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderWithdrawals = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">提现审核</Text>
        <View className="flex gap-2">
          <Button variant="outline" onClick={() => setStatusFilter('0')}>待审核</Button>
          <Button variant="outline" onClick={() => setStatusFilter('1')}>已通过</Button>
        </View>
      </View>

      <Card>
        <CardContent className="p-8">
          <View className="flex flex-col items-center justify-center text-gray-400">
            <CreditCard size={48} color="#9ca3af" />
            <Text className="mt-4">暂无提现申请</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderAgents = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">代理商管理</Text>
        <Button><Plus size={16} color="#fff" className="mr-1" /> 添加代理</Button>
      </View>

      <Card>
        <CardContent className="p-8">
          <View className="flex flex-col items-center justify-center text-gray-400">
            <MapPin size={48} color="#9ca3af" />
            <Text className="mt-4">暂无代理商</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderContent = () => {
    switch (currentMenu) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'teachers': return renderTeachers();
      case 'orgs': return renderOrgs();
      case 'orders': return renderOrders();
      case 'membership': return renderMembership();
      case 'activities': return renderActivities();
      case 'banners': return renderBanners();
      case 'config': return renderConfig();
      case 'payment': return renderPayment();
      case 'elite-class': return renderEliteClass();
      case 'commissions': return renderCommissions();
      case 'withdrawals': return renderWithdrawals();
      case 'agents': return renderAgents();
      default: return renderDashboard();
    }
  };

  return (
    <View className="admin-layout">
      {/* 左侧菜单 */}
      <View className="admin-sidebar">
        <View className="admin-sidebar-header">
          <Text className="text-xl font-bold text-blue-600">{siteConfig.site_name || '管理后台'}</Text>
          <Text className="text-xs text-gray-400 mt-1">管理后台</Text>
        </View>

        <ScrollView className="admin-sidebar-menu">
          {MENUS.map((menu) => {
            const Icon = menu.icon;
            return (
              <View
                key={menu.id}
                className={`admin-menu-item ${currentMenu === menu.id ? 'active' : ''}`}
                onClick={() => setCurrentMenu(menu.id)}
              >
                <Icon size={18} color={currentMenu === menu.id ? '#2563EB' : '#666'} />
                <Text className={currentMenu === menu.id ? 'text-blue-600' : 'text-gray-600'}>{menu.label}</Text>
                <ChevronRight size={16} color={currentMenu === menu.id ? '#2563EB' : '#999'} className="ml-auto" />
              </View>
            );
          })}
        </ScrollView>

        <View className="admin-sidebar-footer">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut size={16} color="#666" className="mr-2" /> 退出登录
          </Button>
        </View>
      </View>

      {/* 右侧内容区 */}
      <View className="admin-main">
        <View className="admin-header">
          <Text className="text-lg font-semibold">{(() => { const menu = MENUS.find(m => m.id === currentMenu); return menu ? menu.label : ''; })()}</Text>
          <View className="flex items-center gap-4">
            <Text className="text-sm text-gray-500">管理员</Text>
            <View className="w-8 h-8 rounded-full bg-blue-500" />
          </View>
        </View>

        <ScrollView className="admin-content">
          {loading ? (
            <View className="flex items-center justify-center h-64">
              <Text className="text-gray-400">加载中...</Text>
            </View>
          ) : (
            renderContent()
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default AdminPage;
