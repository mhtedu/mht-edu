import { View, Text, ScrollView, Image } from '@tarojs/components';
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
  Check, X, Plus, Download, Upload, Award, CreditCard, Crown,
  Receipt, RotateCcw
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
  role: number; // 0-家长 1-牛师 2-机构
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
  { id: 'teachers', label: '牛师管理', icon: UserPlus },
  { id: 'orgs', label: '机构管理', icon: Building },
  { id: 'orders', label: '订单管理', icon: FileText },
  { id: 'elite-class', label: '牛师班管理', icon: Award },
  { id: 'membership', label: '会员套餐', icon: Gift },
  { id: 'activities', label: '活动管理', icon: Calendar },
  { id: 'products', label: '商品管理', icon: ShoppingBag },
  { id: 'banners', label: '广告位管理', icon: ImageIcon },
  { id: 'commissions', label: '分佣管理', icon: Percent },
  { id: 'finance', label: '财务流水', icon: Receipt },
  { id: 'withdrawals', label: '提现审核', icon: CreditCard },
  { id: 'refunds', label: '退费管理', icon: RotateCcw },
  { id: 'agents', label: '代理商管理', icon: MapPin },
  { id: 'demo', label: '演示数据', icon: Users },
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
  const [financeFilter, setFinanceFilter] = useState<string>('');
  const [refundFilter, setRefundFilter] = useState<string>('');
  
  // 新增数据状态
  const [financeRecords, setFinanceRecords] = useState<any[]>([]);
  const [financeStats, setFinanceStats] = useState<any>({});
  const [refunds, setRefunds] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '' });
  
  // 会员弹窗状态
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; nickname: string; is_member: boolean } | null>(null);
  const [memberDays, setMemberDays] = useState('365');
  const [memberReason, setMemberReason] = useState('后台开通');
  const [submitting, setSubmitting] = useState(false);

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
        case 'products':
          await loadProducts();
          break;
        case 'banners':
          await loadBanners();
          break;
        case 'finance':
          await loadFinanceRecords();
          break;
        case 'refunds':
          await loadRefunds();
          break;
        case 'commissions':
          await loadCommissions();
          break;
        case 'withdrawals':
          await loadWithdrawals();
          break;
        case 'config':
          await loadSiteConfig();
          break;
        case 'demo':
          await loadDemoData();
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
      console.log('[Admin] Stats response:', res.data);
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('[Admin] Load stats error:', error);
      // 模拟数据
      setStats({
        users: { total: 360, parents: 246, teachers: 114, orgs: 0, members: 0, todayNew: 0 },
        orders: { total: 117, pending: 50, matched: 31, ongoing: 20, completed: 7, todayNew: 0 },
        payments: { totalAmount: 1400, todayAmount: 0, weekAmount: 0, monthAmount: 0 },
        commissions: { pending: 0, settled: 0, withdrawn: 0 },
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
      console.log('[Admin] Users response:', res.data);
      if (res.data) {
        // 支持两种响应格式: { list, total } 和 { data: { list, total } }
        const data = res.data.data || res.data;
        setUsers(data.list || []);
        setTotal(data.total || 0);
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
      console.log('[Admin] Teachers response:', res.data);
      if (res.data) {
        // 支持两种响应格式
        const data = res.data.data || res.data;
        setTeachers(Array.isArray(data) ? data : (data.list || []));
        setTotal(Array.isArray(data) ? data.length : (data.total || 0));
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
      console.log('[Admin] Orgs response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setOrgs(Array.isArray(data) ? data : (data.list || []));
        setTotal(Array.isArray(data) ? data.length : (data.total || 0));
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
      console.log('[Admin] Orders response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setOrders(Array.isArray(data) ? data : (data.list || []));
        setTotal(Array.isArray(data) ? data.length : (data.total || 0));
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
      console.log('[Admin] Membership plans response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setMembershipPlans(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      // 模拟数据
      setMembershipPlans([
        { id: 1, name: '家长月卡', role: 0, price: 29.9, original_price: 59, duration_days: 30, features: ['查看联系方式', '无限发布需求'], is_active: 1 },
        { id: 2, name: '家长年卡', role: 0, price: 199, original_price: 708, duration_days: 365, features: ['查看联系方式', '无限发布需求', '专属客服'], is_active: 1 },
        { id: 3, name: '牛师月卡', role: 1, price: 39.9, original_price: 79, duration_days: 30, features: ['查看联系方式', '无限抢单'], is_active: 1 },
        { id: 4, name: '机构年卡', role: 2, price: 999, original_price: 2388, duration_days: 365, features: ['无限发布牛师', '优先展示'], is_active: 1 },
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
      console.log('[Admin] Activities response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setActivities(Array.isArray(data) ? data : (data.list || []));
        setTotal(Array.isArray(data) ? data.length : (data.total || 0));
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
      console.log('[Admin] Banners response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setBanners(Array.isArray(data) ? data : []);
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
      console.log('[Admin] Config response:', res.data);
      if (res.data) {
        // 后端直接返回配置对象 { site_name: 'xxx', ... }
        const data = res.data.data || res.data;
        if (typeof data === 'object' && !Array.isArray(data)) {
          setSiteConfig(data);
        }
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

  // ==================== 财务流水管理 ====================

  const loadFinanceRecords = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/finance-records',
        method: 'GET',
        data: { page, pageSize, type: financeFilter }
      });
      console.log('[Admin] Finance records response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setFinanceRecords(data.list || []);
        setFinanceStats(data.stats || {});
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载财务流水失败:', error);
      setFinanceRecords([]);
      setFinanceStats({});
    }
  };

  // ==================== 退费管理 ====================

  const loadRefunds = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/refunds',
        method: 'GET',
        data: { page, pageSize, status: refundFilter }
      });
      console.log('[Admin] Refunds response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setRefunds(data.list || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载退费列表失败:', error);
      setRefunds([]);
    }
  };

  const handleAuditRefund = async (id: number, status: number, rejectReason?: string) => {
    try {
      await Network.request({
        url: `/api/admin/refunds/${id}/audit`,
        method: 'POST',
        data: { status, reject_reason: rejectReason }
      });
      Taro.showToast({ title: '审核成功', icon: 'success' });
      loadRefunds();
    } catch (error) {
      Taro.showToast({ title: '审核失败', icon: 'error' });
    }
  };

  // ==================== 商品管理 ====================

  const loadProducts = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/products',
        method: 'GET',
        data: { page, pageSize }
      });
      console.log('[Admin] Products response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setProducts(data.list || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
      setProducts([]);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Taro.showToast({ title: '请填写商品名称和价格', icon: 'error' });
      return;
    }
    try {
      await Network.request({
        url: '/api/admin/products',
        method: 'POST',
        data: {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: newProduct.stock ? parseInt(newProduct.stock) : -1,
          description: newProduct.description
        }
      });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      setShowProductDialog(false);
      setNewProduct({ name: '', price: '', stock: '', description: '' });
      loadProducts();
    } catch (error) {
      Taro.showToast({ title: '创建失败', icon: 'error' });
    }
  };

  const handleToggleProductStatus = async (id: number, currentStatus: number) => {
    try {
      await Network.request({
        url: `/api/admin/products/${id}`,
        method: 'PUT',
        data: { status: currentStatus === 1 ? 0 : 1 }
      });
      Taro.showToast({ title: currentStatus === 1 ? '已下架' : '已上架', icon: 'success' });
      loadProducts();
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/admin/products/${id}`,
              method: 'DELETE'
            });
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadProducts();
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'error' });
          }
        }
      }
    });
  };

  // ==================== 分佣管理 ====================

  const loadCommissions = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/commissions',
        method: 'GET',
        data: { page, pageSize, status: statusFilter }
      });
      console.log('[Admin] Commissions response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setCommissions(data.list || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载分佣列表失败:', error);
      setCommissions([]);
    }
  };

  const settleCommission = async (id: number) => {
    try {
      await Network.request({
        url: '/api/admin/commissions/settle',
        method: 'POST',
        data: { ids: [id] }
      });
      Taro.showToast({ title: '结算成功', icon: 'success' });
      loadCommissions();
    } catch (error) {
      Taro.showToast({ title: '结算失败', icon: 'error' });
    }
  };

  // ==================== 提现审核 ====================

  const loadWithdrawals = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/withdrawals',
        method: 'GET',
        data: { page, pageSize, status: statusFilter }
      });
      console.log('[Admin] Withdrawals response:', res.data);
      if (res.data) {
        const data = res.data.data || res.data;
        setWithdrawals(data.list || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载提现列表失败:', error);
      setWithdrawals([]);
    }
  };

  const auditWithdrawal = async (id: number, status: number) => {
    try {
      await Network.request({
        url: `/api/admin/withdrawals/${id}/audit`,
        method: 'POST',
        data: { status }
      });
      Taro.showToast({ title: status === 1 ? '已通过' : '已拒绝', icon: 'success' });
      loadWithdrawals();
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  // ==================== 演示数据管理 ====================

  interface DemoConfig {
    enabled: boolean;
    robotTeachers: number;
    robotParents: number;
    demoOrders: number;
    autoGrabEnabled: boolean;
    autoCommentEnabled: boolean;
    activeHours: { start: number; end: number };
  }

  interface RobotUser {
    id: number;
    nickname: string;
    avatar: string;
    role: number;
    city_name: string;
    membership_type: number;
    real_name: string;
    subjects: string[];
    rating: number;
  }

  const [demoConfig, setDemoConfig] = useState<DemoConfig | null>(null);
  const [robotUsers, setRobotUsers] = useState<RobotUser[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);

  const loadDemoData = async () => {
    try {
      // 加载配置
      const configRes = await Network.request({ url: '/api/admin/demo/config', method: 'GET' });
      if (configRes.data) {
        setDemoConfig(configRes.data);
      }
      // 加载机器人列表
      const robotsRes = await Network.request({ url: '/api/admin/demo/robots', method: 'GET' });
      if (robotsRes.data) {
        setRobotUsers(robotsRes.data || []);
      }
    } catch (error) {
      console.error('加载演示数据失败:', error);
    }
  };

  const initDemoData = async () => {
    Taro.showModal({
      title: '初始化演示数据',
      content: '将创建机器人老师和家长，以及演示订单。是否继续？',
      success: async (res) => {
        if (res.confirm) {
          setDemoLoading(true);
          try {
            // 创建老师
            await Network.request({ url: '/api/admin/demo/teachers/batch', method: 'POST', data: { count: 20 } });
            // 创建家长
            await Network.request({ url: '/api/admin/demo/parents/batch', method: 'POST', data: { count: 30 } });
            // 创建订单
            await Network.request({ url: '/api/admin/demo/orders/batch', method: 'POST', data: { count: 15 } });
            Taro.showToast({ title: '初始化成功', icon: 'success' });
            loadDemoData();
          } catch (error) {
            Taro.showToast({ title: '初始化失败', icon: 'error' });
          } finally {
            setDemoLoading(false);
          }
        }
      },
    });
  };

  const clearDemoData = async () => {
    Taro.showModal({
      title: '清除演示数据',
      content: '将删除所有演示数据，此操作不可恢复。是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({ url: '/api/admin/demo/clear', method: 'DELETE' });
            Taro.showToast({ title: '清除成功', icon: 'success' });
            loadDemoData();
          } catch (error) {
            Taro.showToast({ title: '清除失败', icon: 'error' });
          }
        }
      },
    });
  };

  const triggerGrab = async () => {
    try {
      await Network.request({ url: '/api/admin/demo/trigger/grab', method: 'POST' });
      Taro.showToast({ title: '已触发抢单', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '触发失败', icon: 'error' });
    }
  };

  const updateDemoConfig = async (key: string, value: any) => {
    try {
      await Network.request({
        url: '/api/admin/demo/config',
        method: 'PUT',
        data: { ...demoConfig, [key]: value },
      });
      loadDemoData();
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const renderDemo = () => (
    <View className="p-6">
      {/* 配置卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>演示数据配置</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="font-medium">启用演示数据</Text>
                <Text className="text-xs text-gray-500">开启后机器人将自动活动</Text>
              </View>
              <Button 
                size="sm" 
                variant={demoConfig?.enabled ? 'default' : 'outline'}
                onClick={() => updateDemoConfig('enabled', !demoConfig?.enabled)}
              >
                {demoConfig?.enabled ? '已开启' : '已关闭'}
              </Button>
            </View>
            <View className="flex items-center justify-between">
              <View>
                <Text className="font-medium">自动抢单</Text>
                <Text className="text-xs text-gray-500">机器人老师自动抢单</Text>
              </View>
              <Button 
                size="sm" 
                variant={demoConfig?.autoGrabEnabled ? 'default' : 'outline'}
                onClick={() => updateDemoConfig('autoGrabEnabled', !demoConfig?.autoGrabEnabled)}
              >
                {demoConfig?.autoGrabEnabled ? '已开启' : '已关闭'}
              </Button>
            </View>
            <View className="flex items-center justify-between">
              <View>
                <Text className="font-medium">自动评论</Text>
                <Text className="text-xs text-gray-500">机器人自动评论动态</Text>
              </View>
              <Button 
                size="sm" 
                variant={demoConfig?.autoCommentEnabled ? 'default' : 'outline'}
                onClick={() => updateDemoConfig('autoCommentEnabled', !demoConfig?.autoCommentEnabled)}
              >
                {demoConfig?.autoCommentEnabled ? '已开启' : '已关闭'}
              </Button>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <View className="flex gap-4 mb-6">
        <Button onClick={initDemoData} disabled={demoLoading}>
          {demoLoading ? '处理中...' : '一键初始化演示数据'}
        </Button>
        <Button variant="outline" onClick={triggerGrab}>手动触发抢单</Button>
        <Button variant="destructive" onClick={clearDemoData}>清除所有演示数据</Button>
      </View>

      {/* 统计卡片 */}
      <View className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-2xl font-bold text-blue-500">{robotUsers.filter(r => r.role === 1).length}</Text>
            <Text className="text-sm text-gray-500 mt-1">机器人老师</Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-2xl font-bold text-green-500">{robotUsers.filter(r => r.role === 0).length}</Text>
            <Text className="text-sm text-gray-500 mt-1">机器人家长</Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-2xl font-bold text-orange-500">{demoConfig?.demoOrders || 0}</Text>
            <Text className="text-sm text-gray-500 mt-1">演示订单</Text>
          </CardContent>
        </Card>
      </View>

      {/* 机器人列表 */}
      <Card>
        <CardHeader>
          <CardTitle>机器人用户列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">用户信息</Text>
              <Text className="w-20">角色</Text>
              <Text className="w-24">科目/城市</Text>
              <Text className="w-16">会员</Text>
              <Text className="w-16">评分</Text>
            </View>
            {robotUsers.map((robot) => (
              <View key={robot.id} className="admin-table-row">
                <Text className="w-16">{robot.id}</Text>
                <View className="flex-1 flex items-center gap-2">
                  <Image src={robot.avatar} className="w-8 h-8 rounded-full" mode="aspectFill" />
                  <Text className="font-medium">{robot.nickname}</Text>
                </View>
                <Text className="w-20">{robot.role === 1 ? '老师' : '家长'}</Text>
                <Text className="w-24">
                  {robot.role === 1 
                    ? (robot.subjects && robot.subjects.slice(0, 2).join(','))
                    : robot.city_name}
                </Text>
                <Text className="w-16">{robot.membership_type ? '是' : '否'}</Text>
                <Text className="w-16">{robot.rating?.toFixed(1) || '-'}</Text>
              </View>
            ))}
            {robotUsers.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <Text>暂无演示数据，请点击「一键初始化」创建</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );

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

  // ==================== 导出功能 ====================

  const exportUsers = async () => {
    try {
      Taro.showLoading({ title: '导出中...' });
      const res = await Network.request({
        url: '/api/admin/export/users',
        method: 'GET',
        data: { role: roleFilter }
      });
      Taro.hideLoading();
      
      if (res.data && res.data.success) {
        // 创建下载链接
        const base64 = res.data.data;
        const filename = res.data.filename;
        // 在H5端触发下载
        if (Taro.getEnv() === 'WEB') {
          const link = document.createElement('a');
          link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
          link.download = filename;
          link.click();
        }
        Taro.showToast({ title: '导出成功', icon: 'success' });
      } else {
        Taro.showToast({ title: '导出失败', icon: 'error' });
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '导出失败', icon: 'error' });
    }
  };

  const exportTeachers = async () => {
    try {
      Taro.showLoading({ title: '导出中...' });
      const res = await Network.request({
        url: '/api/admin/export/teachers',
        method: 'GET'
      });
      Taro.hideLoading();
      
      if (res.data && res.data.success) {
        const base64 = res.data.data;
        const filename = res.data.filename;
        if (Taro.getEnv() === 'WEB') {
          const link = document.createElement('a');
          link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
          link.download = filename;
          link.click();
        }
        Taro.showToast({ title: '导出成功', icon: 'success' });
      } else {
        Taro.showToast({ title: '导出失败', icon: 'error' });
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '导出失败', icon: 'error' });
    }
  };

  // ==================== 会员开通功能 ====================

  const openMemberDialog = (user: { id: number; nickname: string; is_member: boolean }) => {
    setSelectedUser(user);
    setMemberDays('365');
    setMemberReason('后台开通');
    setMemberDialogOpen(true);
  };

  const closeMemberDialog = () => {
    setMemberDialogOpen(false);
    setSelectedUser(null);
  };

  const grantMembership = async () => {
    if (!selectedUser) return;
    
    setSubmitting(true);
    try {
      const res = await Network.request({
        url: `/api/admin/users/${selectedUser.id}/grant-membership`,
        method: 'POST',
        data: { days: parseInt(memberDays), reason: memberReason }
      });
      
      if (res.data && res.data.success) {
        Taro.showToast({ title: '开通成功', icon: 'success' });
        closeMemberDialog();
        loadData(); // 刷新数据
      } else {
        Taro.showToast({ title: res.data?.message || '开通失败', icon: 'error' });
      }
    } catch (error) {
      Taro.showToast({ title: '开通失败', icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const revokeMembership = async () => {
    if (!selectedUser) return;
    
    Taro.showModal({
      title: '确认取消会员',
      content: `确定要取消 ${selectedUser.nickname} 的会员吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await Network.request({
              url: `/api/admin/users/${selectedUser.id}/revoke-membership`,
              method: 'POST',
              data: { reason: '后台取消' }
            });
            
            if (result.data && result.data.success) {
              Taro.showToast({ title: '取消成功', icon: 'success' });
              closeMemberDialog();
              loadData();
            }
          } catch (error) {
            Taro.showToast({ title: '取消失败', icon: 'error' });
          }
        }
      }
    });
  };

  // ==================== 渲染会员弹窗 ====================

  const renderMemberDialog = () => {
    if (!memberDialogOpen || !selectedUser) return null;
    
    return (
      <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <View className="bg-white rounded-lg p-6 w-96">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-bold">会员管理</Text>
            <Text className="text-gray-400 cursor-pointer" onClick={closeMemberDialog}>✕</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-600">用户：{selectedUser.nickname}</Text>
            <Text className="text-gray-400 text-sm ml-2">(ID: {selectedUser.id})</Text>
          </View>
          
          <View className="mb-4">
            <Text className="block text-sm font-medium text-gray-700 mb-1">开通天数</Text>
            <View className="flex gap-2">
              {['30', '90', '180', '365'].map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={memberDays === d ? 'default' : 'outline'}
                  onClick={() => setMemberDays(d)}
                >
                  {d === '30' ? '月卡' : d === '90' ? '季卡' : d === '180' ? '半年' : '年卡'}
                </Button>
              ))}
            </View>
            <Input
              className="mt-2"
              type="number"
              value={memberDays}
              onInput={(e) => setMemberDays(e.detail.value)}
              placeholder="自定义天数"
            />
          </View>
          
          <View className="mb-4">
            <Text className="block text-sm font-medium text-gray-700 mb-1">开通原因</Text>
            <Input
              value={memberReason}
              onInput={(e) => setMemberReason(e.detail.value)}
              placeholder="请输入开通原因"
            />
          </View>
          
          <View className="flex gap-2 justify-end">
            {selectedUser.is_member && (
              <Button variant="destructive" onClick={revokeMembership}>取消会员</Button>
            )}
            <Button variant="outline" onClick={closeMemberDialog}>取消</Button>
            <Button onClick={grantMembership} disabled={submitting}>
              {submitting ? '处理中...' : '开通会员'}
            </Button>
          </View>
        </View>
      </View>
    );
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
                <Text className="text-gray-500 text-sm">牛师数量</Text>
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
                <Text className="text-gray-600">牛师用户</Text>
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
            <Button size="sm" variant={roleFilter === '1' ? 'default' : 'outline'} onClick={() => setRoleFilter('1')}>牛师</Button>
            <Button size="sm" variant={roleFilter === '2' ? 'default' : 'outline'} onClick={() => setRoleFilter('2')}>机构</Button>
          </View>
        </View>
        <Button variant="outline" onClick={exportUsers}>
          <Download size={16} color="#666" className="mr-1" /> 导出Excel
        </Button>
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
              <Text className="w-40">操作</Text>
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
                <Text className="w-20">{user.role === 0 ? '家长' : user.role === 1 ? '牛师' : '机构'}</Text>
                <Text className="w-20">{user.is_member ? '是' : '否'}</Text>
                <View className="w-20">
                  <Badge variant={user.status === 1 ? 'default' : 'secondary'}>
                    <Text className="text-xs">{user.status === 1 ? '正常' : '禁用'}</Text>
                  </Badge>
                </View>
                <Text className="w-32 text-sm text-gray-500">{user.created_at}</Text>
                <View className="w-40 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openMemberDialog({ id: user.id, nickname: user.nickname, is_member: !!user.is_member })}>
                    <Crown size={14} color={user.is_member ? "#f59e0b" : "#666"} />
                  </Button>
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
            placeholder="搜索牛师姓名/手机号"
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
        <Button variant="outline" onClick={exportTeachers}>
          <Download size={16} color="#666" className="mr-1" /> 导出Excel
        </Button>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">牛师信息</Text>
              <Text className="w-32">科目</Text>
              <Text className="w-20">评分</Text>
              <Text className="w-20">订单</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-40">操作</Text>
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
                <View className="w-40 flex gap-2">
                  <Button size="sm" variant="outline"><Eye size={14} color="#666" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openMemberDialog({ id: teacher.user_id, nickname: teacher.name, is_member: false })}>
                    <Crown size={14} color="#666" />
                  </Button>
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
              <Text className="w-24">牛师数</Text>
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
              <Text className="flex-1">牛师</Text>
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

        {/* 牛师套餐 */}
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>牛师套餐</CardTitle>
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

      <Card className="mt-4">
        <CardHeader><CardTitle>短信配置</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">短信服务商</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_provider || ''}
                  placeholder="如: 阿里云、腾讯云"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_provider: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">AccessKey ID</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_access_key_id || ''}
                  placeholder="短信服务AccessKey ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_access_key_id: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">AccessKey Secret</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_access_key_secret || ''}
                  placeholder="短信服务AccessKey Secret"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_access_key_secret: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">短信签名</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_sign_name || ''}
                  placeholder="如: 棉花糖教育"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_sign_name: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">验证码模板ID</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_template_code_verify || ''}
                  placeholder="验证码短信模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_template_code_verify: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">通知模板ID</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.sms_template_code_notify || ''}
                  placeholder="通知短信模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, sms_template_code_notify: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>小程序订阅消息配置</CardTitle></CardHeader>
        <CardContent>
          <View className="grid grid-cols-2 gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">订单通知模板</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wx_template_order_notify || ''}
                  placeholder="订单状态变更通知模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wx_template_order_notify: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">抢单通知模板</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wx_template_grab_notify || ''}
                  placeholder="牛师抢单成功通知模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wx_template_grab_notify: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">会员到期提醒</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wx_template_member_expire || ''}
                  placeholder="会员即将到期提醒模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wx_template_member_expire: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-32 text-gray-600">活动提醒模板</Text>
              <View className="flex-1">
                <Input
                  value={siteConfig.wx_template_activity_remind || ''}
                  placeholder="活动开始前提醒模板ID"
                  onInput={(e) => setSiteConfig({ ...siteConfig, wx_template_activity_remind: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>通知开关配置</CardTitle></CardHeader>
        <CardContent>
          <View className="space-y-3">
            <View className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <View>
                <Text className="font-medium">订单状态变更通知</Text>
                <Text className="text-xs text-gray-400">订单状态变更时通知用户</Text>
              </View>
              <View 
                className={`w-12 h-6 rounded-full ${siteConfig.notify_order_enabled === '1' ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                onClick={() => setSiteConfig({ ...siteConfig, notify_order_enabled: siteConfig.notify_order_enabled === '1' ? '0' : '1' })}
              >
                <View className={`w-5 h-5 bg-white rounded-full absolute top-1 ${siteConfig.notify_order_enabled === '1' ? 'right-1' : 'left-1'}`} />
              </View>
            </View>
            <View className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <View>
                <Text className="font-medium">抢单成功通知</Text>
                <Text className="text-xs text-gray-400">牛师抢单成功后通知双方</Text>
              </View>
              <View 
                className={`w-12 h-6 rounded-full ${siteConfig.notify_grab_enabled === '1' ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                onClick={() => setSiteConfig({ ...siteConfig, notify_grab_enabled: siteConfig.notify_grab_enabled === '1' ? '0' : '1' })}
              >
                <View className={`w-5 h-5 bg-white rounded-full absolute top-1 ${siteConfig.notify_grab_enabled === '1' ? 'right-1' : 'left-1'}`} />
              </View>
            </View>
            <View className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <View>
                <Text className="font-medium">会员到期提醒</Text>
                <Text className="text-xs text-gray-400">会员即将到期前7天提醒</Text>
              </View>
              <View 
                className={`w-12 h-6 rounded-full ${siteConfig.notify_member_expire_enabled === '1' ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                onClick={() => setSiteConfig({ ...siteConfig, notify_member_expire_enabled: siteConfig.notify_member_expire_enabled === '1' ? '0' : '1' })}
              >
                <View className={`w-5 h-5 bg-white rounded-full absolute top-1 ${siteConfig.notify_member_expire_enabled === '1' ? 'right-1' : 'left-1'}`} />
              </View>
            </View>
            <View className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <View>
                <Text className="font-medium">短信验证码</Text>
                <Text className="text-xs text-gray-400">登录/注册时发送短信验证码</Text>
              </View>
              <View 
                className={`w-12 h-6 rounded-full ${siteConfig.sms_enabled === '1' ? 'bg-blue-500' : 'bg-gray-300'} relative`}
                onClick={() => setSiteConfig({ ...siteConfig, sms_enabled: siteConfig.sms_enabled === '1' ? '0' : '1' })}
              >
                <View className={`w-5 h-5 bg-white rounded-full absolute top-1 ${siteConfig.sms_enabled === '1' ? 'right-1' : 'left-1'}`} />
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
            <Text className="text-sm mt-2">牛师创建的牛师班将在此显示</Text>
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
          <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
          <Button size="sm" variant={statusFilter === '0' ? 'default' : 'outline'} onClick={() => setStatusFilter('0')}>待结算</Button>
          <Button size="sm" variant={statusFilter === '1' ? 'default' : 'outline'} onClick={() => setStatusFilter('1')}>已结算</Button>
        </View>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-32">用户</Text>
              <Text className="w-32">来源用户</Text>
              <Text className="w-20">级别</Text>
              <Text className="w-24">金额</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">时间</Text>
              <Text className="w-24">操作</Text>
            </View>
            {commissions.map(c => (
              <View key={c.id} className="admin-table-row">
                <Text className="w-16">{c.id}</Text>
                <Text className="w-32 truncate">{c.user_nickname || c.user_id}</Text>
                <Text className="w-32 truncate">{c.from_nickname || c.from_user_id}</Text>
                <Text className="w-20">{c.level}级</Text>
                <Text className="w-24 text-green-600">+¥{c.amount}</Text>
                <Text className={`w-20 ${c.status === 1 ? 'text-green-600' : 'text-orange-600'}`}>
                  {c.status === 1 ? '已结算' : '待结算'}
                </Text>
                <Text className="w-32">{c.created_at?.substring(0, 10)}</Text>
                <View className="w-24">
                  {c.status === 0 && (
                    <Button size="sm" onClick={() => settleCommission(c.id)}>结算</Button>
                  )}
                </View>
              </View>
            ))}
            {commissions.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <Percent size={48} color="#9ca3af" />
                <Text className="mt-4 block">暂无分佣记录</Text>
              </View>
            )}
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
          <Button size="sm" variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => setStatusFilter('')}>全部</Button>
          <Button size="sm" variant={statusFilter === '0' ? 'default' : 'outline'} onClick={() => setStatusFilter('0')}>待审核</Button>
          <Button size="sm" variant={statusFilter === '1' ? 'default' : 'outline'} onClick={() => setStatusFilter('1')}>已通过</Button>
          <Button size="sm" variant={statusFilter === '2' ? 'default' : 'outline'} onClick={() => setStatusFilter('2')}>已拒绝</Button>
        </View>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-32">用户信息</Text>
              <Text className="w-24">金额</Text>
              <Text className="flex-1">账户信息</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">申请时间</Text>
              <Text className="w-32">操作</Text>
            </View>
            {withdrawals.map(w => (
              <View key={w.id} className="admin-table-row">
                <Text className="w-16">{w.id}</Text>
                <Text className="w-32 truncate">{w.nickname || w.user_id}</Text>
                <Text className="w-24 text-red-600">¥{w.amount}</Text>
                <Text className="flex-1 truncate">{w.account_info || '-'}</Text>
                <Text className={`w-20 ${w.status === 1 ? 'text-green-600' : w.status === 2 ? 'text-red-600' : 'text-orange-600'}`}>
                  {w.status === 1 ? '已通过' : w.status === 2 ? '已拒绝' : '待审核'}
                </Text>
                <Text className="w-32">{w.created_at?.substring(0, 16)}</Text>
                <View className="w-32 flex gap-1">
                  {w.status === 0 && (
                    <>
                      <Button size="sm" variant="default" onClick={() => auditWithdrawal(w.id, 1)}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => auditWithdrawal(w.id, 2)}>拒绝</Button>
                    </>
                  )}
                </View>
              </View>
            ))}
            {withdrawals.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <CreditCard size={48} color="#9ca3af" />
                <Text className="mt-4 block">暂无提现申请</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderFinanceRecords = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">财务流水</Text>
        <View className="flex items-center gap-4 text-sm">
          <Text className="text-green-600">收入: ¥{(financeStats.total_income || 0).toFixed(2)}</Text>
          <Text className="text-red-600">支出: ¥{(financeStats.total_expense || 0).toFixed(2)}</Text>
          <Text className="text-orange-600">退款: ¥{(financeStats.total_refund || 0).toFixed(2)}</Text>
        </View>
      </View>

      <Card className="mb-4">
        <CardContent className="flex gap-2 flex-wrap">
          <Button size="sm" variant={financeFilter === '' ? 'default' : 'outline'} onClick={() => setFinanceFilter('')}>全部</Button>
          <Button size="sm" variant={financeFilter === '1' ? 'default' : 'outline'} onClick={() => setFinanceFilter('1')}>收入</Button>
          <Button size="sm" variant={financeFilter === '2' ? 'default' : 'outline'} onClick={() => setFinanceFilter('2')}>支出</Button>
          <Button size="sm" variant={financeFilter === '3' ? 'default' : 'outline'} onClick={() => setFinanceFilter('3')}>退款</Button>
          <Button size="sm" variant={financeFilter === '4' ? 'default' : 'outline'} onClick={() => setFinanceFilter('4')}>提现</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-24">用户</Text>
              <Text className="w-20">类型</Text>
              <Text className="w-24">金额</Text>
              <Text className="flex-1">描述</Text>
              <Text className="w-32">时间</Text>
            </View>
            {financeRecords.map(record => (
              <View key={record.id} className="admin-table-row">
                <Text className="w-16">{record.id}</Text>
                <Text className="w-24">{record.nickname || record.user_id}</Text>
                <Text className={`w-20 ${record.type === 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {record.type === 1 ? '收入' : record.type === 2 ? '支出' : record.type === 3 ? '退款' : '提现'}
                </Text>
                <Text className={`w-24 ${record.type === 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {record.type === 1 ? '+' : '-'}¥{record.amount}
                </Text>
                <Text className="flex-1 truncate">{record.description}</Text>
                <Text className="w-32">{record.created_at?.substring(0, 16)}</Text>
              </View>
            ))}
            {financeRecords.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <Receipt size={48} color="#9ca3af" />
                <Text className="mt-4 block">暂无财务流水</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderRefunds = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">退费管理</Text>
        <View className="flex items-center gap-4 text-sm">
          <Text className="text-orange-600">待处理: {refunds.filter(r => r.status === 0).length}</Text>
        </View>
      </View>

      <Card className="mb-4">
        <CardContent className="flex gap-2 flex-wrap">
          <Button size="sm" variant={refundFilter === '' ? 'default' : 'outline'} onClick={() => setRefundFilter('')}>全部</Button>
          <Button size="sm" variant={refundFilter === '0' ? 'default' : 'outline'} onClick={() => setRefundFilter('0')}>待处理</Button>
          <Button size="sm" variant={refundFilter === '1' ? 'default' : 'outline'} onClick={() => setRefundFilter('1')}>已同意</Button>
          <Button size="sm" variant={refundFilter === '2' ? 'default' : 'outline'} onClick={() => setRefundFilter('2')}>已拒绝</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-24">用户</Text>
              <Text className="w-24">金额</Text>
              <Text className="flex-1">原因</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">操作</Text>
            </View>
            {refunds.map(refund => (
              <View key={refund.id} className="admin-table-row">
                <Text className="w-16">{refund.id}</Text>
                <Text className="w-24">{refund.nickname || refund.user_id}</Text>
                <Text className="w-24 text-red-600">¥{refund.amount}</Text>
                <Text className="flex-1 truncate">{refund.reason}</Text>
                <Text className={`w-20 ${refund.status === 0 ? 'text-orange-600' : refund.status === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  {refund.status === 0 ? '待处理' : refund.status === 1 ? '已同意' : '已拒绝'}
                </Text>
                <View className="w-32 flex gap-1">
                  {refund.status === 0 && (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleAuditRefund(refund.id, 1)}>同意</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAuditRefund(refund.id, 2)}>拒绝</Button>
                    </>
                  )}
                </View>
              </View>
            ))}
            {refunds.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <RotateCcw size={48} color="#9ca3af" />
                <Text className="mt-4 block">暂无退费申请</Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderProducts = () => (
    <View className="p-6">
      <View className="flex justify-between items-center mb-4">
        <Text className="text-lg font-semibold">商品管理</Text>
        <Button onClick={() => setShowProductDialog(true)}><Plus size={16} color="#fff" className="mr-1" /> 添加商品</Button>
      </View>

      <Card>
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="w-48">商品名称</Text>
              <Text className="w-20">价格</Text>
              <Text className="w-20">库存</Text>
              <Text className="w-20">销量</Text>
              <Text className="w-20">状态</Text>
              <Text className="w-32">操作</Text>
            </View>
            {products.map(product => (
              <View key={product.id} className="admin-table-row">
                <Text className="w-16">{product.id}</Text>
                <Text className="w-48 truncate">{product.name}</Text>
                <Text className="w-20 text-red-600">¥{product.price}</Text>
                <Text className="w-20">{product.stock === -1 ? '无限' : product.stock}</Text>
                <Text className="w-20">{product.sales || 0}</Text>
                <Text className={`w-20 ${product.status === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  {product.status === 1 ? '上架' : '下架'}
                </Text>
                <View className="w-32 flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleToggleProductStatus(product.id, product.status)}>
                    {product.status === 1 ? '下架' : '上架'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>删除</Button>
                </View>
              </View>
            ))}
            {products.length === 0 && (
              <View className="p-8 text-center text-gray-400">
                <ShoppingBag size={48} color="#9ca3af" />
                <Text className="mt-4 block">暂无商品数据</Text>
                <Text className="text-sm mt-2">点击「添加商品」创建第一个商品</Text>
              </View>
            )}
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
        <CardContent className="p-0">
          <View className="admin-table">
            <View className="admin-table-header">
              <Text className="w-16">ID</Text>
              <Text className="flex-1">用户信息</Text>
              <Text className="w-24">城市</Text>
              <Text className="w-20">佣金比例</Text>
              <Text className="w-24">累计佣金</Text>
              <Text className="w-32">注册时间</Text>
            </View>
            <View className="p-8 text-center text-gray-400">
              <MapPin size={48} color="#9ca3af" />
              <Text className="mt-4 block">暂无代理商</Text>
            </View>
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
      case 'products': return renderProducts();
      case 'banners': return renderBanners();
      case 'finance': return renderFinanceRecords();
      case 'refunds': return renderRefunds();
      case 'config': return renderConfig();
      case 'payment': return renderPayment();
      case 'demo': return renderDemo();
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

      {/* 会员开通弹窗 */}
      {renderMemberDialog()}

      {/* 商品添加弹窗 */}
      {showProductDialog && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-lg w-96 p-6">
            <Text className="text-lg font-semibold mb-4">添加商品</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">商品名称 *</Text>
                <Input
                  value={newProduct.name}
                  placeholder="请输入商品名称"
                  onInput={(e) => setNewProduct({ ...newProduct, name: e.detail.value })}
                />
              </View>
              <View>
                <Text className="text-sm text-gray-600 mb-1">价格 *</Text>
                <Input
                  value={newProduct.price}
                  type="number"
                  placeholder="请输入价格"
                  onInput={(e) => setNewProduct({ ...newProduct, price: e.detail.value })}
                />
              </View>
              <View>
                <Text className="text-sm text-gray-600 mb-1">库存</Text>
                <Input
                  value={newProduct.stock}
                  type="number"
                  placeholder="留空或-1表示无限"
                  onInput={(e) => setNewProduct({ ...newProduct, stock: e.detail.value })}
                />
              </View>
              <View>
                <Text className="text-sm text-gray-600 mb-1">描述</Text>
                <Input
                  value={newProduct.description}
                  placeholder="请输入商品描述"
                  onInput={(e) => setNewProduct({ ...newProduct, description: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>取消</Button>
              <Button onClick={handleCreateProduct}>确认添加</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default AdminPage;
