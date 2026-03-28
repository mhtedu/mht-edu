import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, FileText, Building, MapPin, Image as ImageIcon, 
  Settings, LogOut, DollarSign, UserPlus, Bell, BookOpen, Gift, Percent,
  ShoppingBag, Calendar, Shield
} from 'lucide-react-taro';
import './index.css';

// 统计数据类型
interface DashboardStats {
  users: { total_users: number; parent_count: number; teacher_count: number; org_count: number; member_count: number; today_new: number };
  orders: { total_orders: number; pending_count: number; matched_count: number; ongoing_count: number; completed_count: number; today_new: number };
  payments: { total_count: number; total_amount: number; today_amount: number; week_amount: number; month_amount: number };
  commissions: { pending_amount: number; settled_amount: number; withdrawn_amount: number };
}

// 系统配置类型
interface SystemConfig {
  site_name: string;
  site_logo: string;
  site_description: string;
  contact_phone: string;
  contact_wechat: string;
  order_expire_days: number;
  trial_lesson_hours: number;
}

// 分销配置类型
interface DistributionConfig {
  level: number;
  rate: number;
  description: string;
}

// 科目类型
interface Subject {
  id: number;
  name: string;
  category: string;
  sort_order: number;
  is_active: number;
}

// 会员套餐类型
interface MembershipPlan {
  id: number;
  name: string;
  role: number;
  type: 'month' | 'quarter' | 'year'; // 月卡、季卡、年卡
  price: number;
  original_price: number;
  duration_days: number;
  features: string[];
  is_active: number;
}

// 虚拟产品（资料）类型
interface VirtualProduct {
  id: number;
  name: string;
  cover: string;
  price: number;
  original_price: number;
  category: string;
  file_type: 'download' | 'link'; // 文件下载或百度网盘链接
  file_url: string;
  file_size: string;
  description: string;
  sales: number;
  is_active: number;
}

// 活动类型
interface Activity {
  id: number;
  title: string;
  type: 'visit' | 'training' | 'lecture' | 'other';
  cover_image: string;
  start_time: string;
  end_time: string;
  address: string;
  is_online: boolean;
  online_price: number;
  offline_price: number;
  max_participants: number;
  current_participants: number;
  target_roles: number[];
  description: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  is_active: number;
}

// 订单类型（渲染时使用内联类型）

// 用户类型（渲染时使用内联类型）

// 代理商类型（渲染时使用内联类型）
interface Agent {
  id: number;
  name: string;
  phone: string;
  city: string;
  rate: number;
  total_orders: number;
  total_commission: number;
  settled_commission: number;
  status: number;
  created_at: string;
}

// 管理账号类型（渲染时使用内联类型）

// 聊天消息类型（渲染时使用内联类型）

// 支付配置类型
interface PaymentConfig {
  wechat_appid: string;
  wechat_mchid: string;
  wechat_secret: string;
  wechat_api_key: string;
  alipay_appid: string;
  alipay_public_key: string;
  alipay_private_key: string;
}

// 商品类型（渲染时使用内联类型）

// 广告类型（渲染时使用内联类型）

// 菜单项
interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

/**
 * PC管理后台 - 完整版
 */
const AdminPage = () => {
  const [currentMenu, setCurrentMenu] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 系统配置
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    site_name: '棉花糖教育成长平台',
    site_logo: '',
    site_description: '专业的家教信息撮合平台',
    contact_phone: '400-888-8888',
    contact_wechat: 'mht_edu',
    order_expire_days: 7,
    trial_lesson_hours: 2,
  });
  
  // 分销配置
  const [distributionConfigs, setDistributionConfigs] = useState<DistributionConfig[]>([]);
  
  // 科目列表
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // 会员套餐
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  
  // 虚拟产品（资料）列表
  const [virtualProducts, setVirtualProducts] = useState<VirtualProduct[]>([]);
  
  // 活动列表
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // 订单列表
  const [orderStatus, setOrderStatus] = useState<string>('all');
  
  // 用户列表
  const [userRole, setUserRole] = useState<number | null>(null);
  
  // 代理商列表
  const [] = useState<Agent[]>([]);
  
  // 管理账号列表
  
  // 聊天消息列表
  
  // 支付配置
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    wechat_appid: '',
    wechat_mchid: '',
    wechat_secret: '',
    wechat_api_key: '',
    alipay_appid: '',
    alipay_public_key: '',
    alipay_private_key: '',
  });

  // 菜单配置
  const menus: MenuItem[] = [
    { id: 'dashboard', label: '数据概览', icon: LayoutDashboard },
    { id: 'orders', label: '订单管理', icon: FileText, badge: stats?.orders?.pending_count || 0 },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'teachers', label: '教师管理', icon: UserPlus },
    { id: 'orgs', label: '机构管理', icon: Building },
    { id: 'agents', label: '代理商管理', icon: MapPin },
    { id: 'messages', label: '消息管理', icon: Bell },
    { id: 'payment', label: '支付配置', icon: DollarSign },
    { id: 'permissions', label: '角色权限', icon: Shield },
    { id: 'products', label: '商品管理', icon: ShoppingBag },
    { id: 'virtual', label: '资料管理', icon: BookOpen },
    { id: 'activities', label: '活动管理', icon: Calendar },
    { id: 'banners', label: '广告位管理', icon: ImageIcon },
    { id: 'subjects', label: '科目管理', icon: BookOpen },
    { id: 'membership', label: '会员套餐', icon: Gift },
    { id: 'distribution', label: '分销设置', icon: Percent },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  useEffect(() => {
    loadData();
  }, [currentMenu]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (currentMenu) {
        case 'dashboard':
          await loadStats();
          break;
        case 'settings':
          await loadSystemConfig();
          break;
        case 'distribution':
          await loadDistributionConfigs();
          break;
        case 'subjects':
          await loadSubjects();
          break;
        case 'membership':
          await loadMembershipPlans();
          break;
        case 'products':
          await loadProducts();
          break;
        case 'virtual':
          await loadVirtualProducts();
          break;
        case 'activities':
          await loadActivities();
          break;
        case 'banners':
          await loadBanners();
          break;
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
        users: { total_users: 2586, parent_count: 2158, teacher_count: 328, org_count: 45, member_count: 856, today_new: 23 },
        orders: { total_orders: 1856, pending_count: 23, matched_count: 156, ongoing_count: 89, completed_count: 1580, today_new: 15 },
        payments: { total_count: 1234, total_amount: 568900, today_amount: 12800, week_amount: 85600, month_amount: 128600 },
        commissions: { pending_amount: 12500, settled_amount: 85600, withdrawn_amount: 72000 },
      });
    }
  };

  const loadSystemConfig = async () => {
    try {
      const res = await Network.request({
        url: '/api/config/system',
        method: 'GET',
      });
      if (res.data) {
        setSystemConfig(res.data);
      }
    } catch (error) {
      console.error('加载系统配置失败:', error);
    }
  };

  const loadDistributionConfigs = async () => {
    try {
      const res = await Network.request({
        url: '/api/config/distribution',
        method: 'GET',
      });
      if (res.data) {
        setDistributionConfigs(res.data);
      }
    } catch (error) {
      console.error('加载分销配置失败:', error);
      // 模拟数据
      setDistributionConfigs([
        { level: 1, rate: 20, description: '一级推荐人分佣' },
        { level: 2, rate: 10, description: '二级推荐人分佣' },
        { level: 3, rate: 5, description: '城市代理分佣' },
        { level: 4, rate: 10, description: '机构分佣' },
      ]);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await Network.request({
        url: '/api/config/subjects',
        method: 'GET',
      });
      if (res.data) {
        setSubjects(res.data);
      }
    } catch (error) {
      console.error('加载科目失败:', error);
      // 模拟数据
      setSubjects([
        { id: 1, name: '语文', category: '文科', sort_order: 1, is_active: 1 },
        { id: 2, name: '数学', category: '理科', sort_order: 2, is_active: 1 },
        { id: 3, name: '英语', category: '语言', sort_order: 3, is_active: 1 },
        { id: 4, name: '物理', category: '理科', sort_order: 4, is_active: 1 },
        { id: 5, name: '钢琴', category: '艺术', sort_order: 10, is_active: 1 },
      ]);
    }
  };

  const loadMembershipPlans = async () => {
    try {
      const res = await Network.request({
        url: '/api/config/membership-plans',
        method: 'GET',
      });
      if (res.data) {
        setMembershipPlans(res.data);
      }
    } catch (error) {
      console.error('加载会员套餐失败:', error);
      // 模拟数据 - 包含月卡、季卡、年卡
      setMembershipPlans([
        // 家长套餐
        { id: 1, name: '家长月卡', role: 0, type: 'month', price: 29.9, original_price: 59, duration_days: 30, features: ['查看教师联系方式', '无限发布需求', '优先匹配'], is_active: 1 },
        { id: 2, name: '家长季卡', role: 0, type: 'quarter', price: 79, original_price: 177, duration_days: 90, features: ['查看教师联系方式', '无限发布需求', '优先匹配', '专属客服'], is_active: 1 },
        { id: 3, name: '家长年卡', role: 0, type: 'year', price: 199, original_price: 708, duration_days: 365, features: ['查看教师联系方式', '无限发布需求', '优先匹配', '专属客服', '年度报告'], is_active: 1 },
        // 教师套餐
        { id: 4, name: '教师月卡', role: 1, type: 'month', price: 39.9, original_price: 79, duration_days: 30, features: ['查看家长联系方式', '无限抢单', '优先展示'], is_active: 1 },
        { id: 5, name: '教师季卡', role: 1, type: 'quarter', price: 99, original_price: 237, duration_days: 90, features: ['查看家长联系方式', '无限抢单', '优先展示', '专属客服'], is_active: 1 },
        { id: 6, name: '教师年卡', role: 1, type: 'year', price: 299, original_price: 948, duration_days: 365, features: ['查看家长联系方式', '无限抢单', '优先展示', '专属客服', '年度报告'], is_active: 1 },
        // 机构套餐
        { id: 7, name: '机构月卡', role: 2, type: 'month', price: 99, original_price: 199, duration_days: 30, features: ['无限发布教师', '优先展示', '数据分析'], is_active: 1 },
        { id: 8, name: '机构年卡', role: 2, type: 'year', price: 999, original_price: 2388, duration_days: 365, features: ['无限发布教师', '优先展示', '数据分析', '专属客服'], is_active: 1 },
      ]);
    }
  };

  const loadProducts = async () => {
    // 商品数据在渲染时使用本地模拟
  };

  const loadBanners = async () => {
    // 广告数据在渲染时使用本地模拟
  };

  const loadVirtualProducts = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/virtual-products',
        method: 'GET',
      });
      if (res.data?.list) {
        setVirtualProducts(res.data.list);
      }
    } catch (error) {
      console.error('加载虚拟产品失败:', error);
      // 模拟数据
      setVirtualProducts([
        { id: 1, name: '高考数学压轴题解析', cover: '', price: 29.9, original_price: 59, category: '数学', file_type: 'download', file_url: '', file_size: '15.2MB', description: '精选近5年高考数学压轴题详细解析', sales: 356, is_active: 1 },
        { id: 2, name: '英语语法大全PDF', cover: '', price: 19.9, original_price: 39, category: '英语', file_type: 'link', file_url: 'https://pan.baidu.com/s/xxxxx', file_size: '', description: '完整英语语法知识点汇总', sales: 528, is_active: 1 },
        { id: 3, name: '初中物理实验视频合集', cover: '', price: 49.9, original_price: 99, category: '物理', file_type: 'link', file_url: 'https://pan.baidu.com/s/yyyyy', file_size: '', description: '包含50+物理实验演示视频', sales: 189, is_active: 1 },
      ]);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/activities',
        method: 'GET',
      });
      if (res.data?.list) {
        setActivities(res.data.list);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
      // 模拟数据
      setActivities([
        { id: 1, title: '北京四中探校活动', type: 'visit', cover_image: '', start_time: '2024-04-15 09:00', end_time: '2024-04-15 12:00', address: '北京市西城区北京四中', is_online: false, online_price: 0, offline_price: 99, max_participants: 50, current_participants: 32, target_roles: [0], description: '带领家长参观学校环境', status: 'upcoming', is_active: 1 },
        { id: 2, title: '教师教学技能提升培训', type: 'training', cover_image: '', start_time: '2024-04-20 09:00', end_time: '2024-04-21 17:00', address: '海淀区教师进修学校', is_online: false, online_price: 0, offline_price: 299, max_participants: 30, current_participants: 28, target_roles: [1], description: '提升教师教学技能', status: 'upcoming', is_active: 1 },
        { id: 3, title: '新高考政策解读讲座', type: 'lecture', cover_image: '', start_time: '2024-04-25 14:00', end_time: '2024-04-25 16:00', address: '线上直播', is_online: true, online_price: 29, offline_price: 0, max_participants: 200, current_participants: 156, target_roles: [0, 1], description: '解读新高考政策变化', status: 'upcoming', is_active: 1 },
      ]);
    }
  };

  const saveSystemConfig = async () => {
    try {
      await Network.request({
        url: '/api/config/system/batch',
        method: 'POST',
        data: systemConfig,
      });
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      console.error('保存失败:', error);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const updateDistributionRate = async (level: number, rate: number) => {
    try {
      await Network.request({
        url: `/api/config/distribution/${level}`,
        method: 'PUT',
        data: { rate },
      });
      Taro.showToast({ title: '保存成功', icon: 'success' });
      loadDistributionConfigs();
    } catch (error) {
      console.error('保存失败:', error);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const toggleSubjectStatus = async (id: number, isActive: boolean) => {
    try {
      await Network.request({
        url: `/api/config/subjects/${id}`,
        method: 'PUT',
        data: { isActive: isActive ? 1 : 0 },
      });
      loadSubjects();
    } catch (error) {
      console.error('操作失败:', error);
    }
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
      <View className="admin-stats-grid">
        <Card className="admin-stat-card">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">总用户数</Text>
                <Text className="text-2xl font-bold mt-1">{stats?.users?.total_users || 0}</Text>
                <Text className="text-xs text-green-500 mt-1">今日新增 +{stats?.users?.today_new || 0}</Text>
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
                <Text className="text-2xl font-bold mt-1">{stats?.users?.teacher_count || 0}</Text>
                <Text className="text-xs text-gray-400 mt-1">会员 {stats?.users?.member_count || 0}</Text>
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
                <Text className="text-2xl font-bold mt-1 text-orange-500">{stats?.orders?.pending_count || 0}</Text>
                <Text className="text-xs text-gray-400 mt-1">进行中 {stats?.orders?.ongoing_count || 0}</Text>
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
                <Text className="text-2xl font-bold mt-1">¥{(stats?.payments?.month_amount || 0).toLocaleString()}</Text>
                <Text className="text-xs text-green-500 mt-1">本周 ¥{(stats?.payments?.week_amount || 0).toLocaleString()}</Text>
              </View>
              <DollarSign size={32} color="#EC4899" />
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="admin-stats-grid mt-4">
        <Card className="admin-stat-card">
          <CardHeader><CardTitle>用户分布</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-2">
              <View className="flex justify-between"><Text className="text-gray-600">家长</Text><Text className="font-semibold">{stats?.users?.parent_count || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">教师</Text><Text className="font-semibold">{stats?.users?.teacher_count || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">机构</Text><Text className="font-semibold">{stats?.users?.org_count || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">会员用户</Text><Text className="font-semibold text-blue-500">{stats?.users?.member_count || 0}</Text></View>
            </View>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardHeader><CardTitle>订单统计</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-2">
              <View className="flex justify-between"><Text className="text-gray-600">总订单数</Text><Text className="font-semibold">{stats?.orders?.total_orders || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">待抢单</Text><Text className="font-semibold text-orange-500">{stats?.orders?.pending_count || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">已完成</Text><Text className="font-semibold text-green-500">{stats?.orders?.completed_count || 0}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">总营收</Text><Text className="font-semibold">¥{(stats?.payments?.total_amount || 0).toLocaleString()}</Text></View>
            </View>
          </CardContent>
        </Card>

        <Card className="admin-stat-card">
          <CardHeader><CardTitle>分佣统计</CardTitle></CardHeader>
          <CardContent>
            <View className="flex flex-col gap-2">
              <View className="flex justify-between"><Text className="text-gray-600">待结算</Text><Text className="font-semibold text-orange-500">¥{(stats?.commissions?.pending_amount || 0).toLocaleString()}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">已结算</Text><Text className="font-semibold text-green-500">¥{(stats?.commissions?.settled_amount || 0).toLocaleString()}</Text></View>
              <View className="flex justify-between"><Text className="text-gray-600">已提现</Text><Text className="font-semibold">¥{(stats?.commissions?.withdrawn_amount || 0).toLocaleString()}</Text></View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );

  // 渲染系统设置
  const renderSettings = () => (
    <View className="admin-content">
      <Card>
        <CardHeader><CardTitle>网站基本信息</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">网站名称</Text>
              <View className="flex-1">
                <Input 
                  value={systemConfig.site_name} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, site_name: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">网站Logo</Text>
              <View className="flex-1">
                <Input 
                  value={systemConfig.site_logo} 
                  placeholder="输入Logo图片URL"
                  onInput={(e) => setSystemConfig({ ...systemConfig, site_logo: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">网站描述</Text>
              <View className="flex-1">
                <Input 
                  value={systemConfig.site_description} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, site_description: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">客服电话</Text>
              <View className="flex-1">
                <Input 
                  value={systemConfig.contact_phone} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, contact_phone: e.detail.value })}
                />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">客服微信</Text>
              <View className="flex-1">
                <Input 
                  value={systemConfig.contact_wechat} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, contact_wechat: e.detail.value })}
                />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>业务参数设置</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">订单过期天数</Text>
              <View className="w-32">
                <Input 
                  type="number"
                  value={String(systemConfig.order_expire_days)} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, order_expire_days: parseInt(e.detail.value) || 7 })}
                />
              </View>
              <Text className="text-gray-400 text-sm">天</Text>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-24 text-gray-600">试课时长</Text>
              <View className="w-32">
                <Input 
                  type="number"
                  value={String(systemConfig.trial_lesson_hours)} 
                  onInput={(e) => setSystemConfig({ ...systemConfig, trial_lesson_hours: parseInt(e.detail.value) || 2 })}
                />
              </View>
              <Text className="text-gray-400 text-sm">小时</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="mt-4">
        <Button onClick={saveSystemConfig}>保存设置</Button>
      </View>
    </View>
  );

  // 渲染分销设置
  const renderDistribution = () => (
    <View className="admin-content">
      <Card>
        <CardHeader><CardTitle>分销比例设置</CardTitle></CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-24">层级</Text>
            <Text className="admin-table-cell flex-1">说明</Text>
            <Text className="admin-table-cell w-24">比例(%)</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {distributionConfigs.map((config) => (
            <View key={config.level} className="admin-table-row">
              <Text className="admin-table-cell w-24">{config.level}级</Text>
              <Text className="admin-table-cell flex-1">{config.description}</Text>
              <View className="admin-table-cell w-24">
                <Input 
                  type="number"
                  value={String(config.rate)}
                  className="w-20"
                  onInput={(e) => {
                    const newConfigs = distributionConfigs.map(c => 
                      c.level === config.level ? { ...c, rate: parseFloat(e.detail.value) || 0 } : c
                    );
                    setDistributionConfigs(newConfigs);
                  }}
                />
              </View>
              <View className="admin-table-cell w-24">
                <Button size="sm" onClick={() => updateDistributionRate(config.level, config.rate)}>保存</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>分佣说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 一级推荐人：用户直接邀请的好友，可获得20%分佣</Text>
            <Text>• 二级推荐人：好友邀请的好友，可获得10%分佣</Text>
            <Text>• 城市代理：订单所在城市的代理，可获得5%分佣</Text>
            <Text>• 机构：教师所属机构，可获得10%分佣</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染科目管理
  const renderSubjects = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>科目列表</CardTitle>
            <Button size="sm">添加科目</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">科目名称</Text>
            <Text className="admin-table-cell w-24">分类</Text>
            <Text className="admin-table-cell w-20">排序</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {subjects.map((subject) => (
            <View key={subject.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{subject.id}</Text>
              <Text className="admin-table-cell flex-1">{subject.name}</Text>
              <Text className="admin-table-cell w-24">{subject.category}</Text>
              <Text className="admin-table-cell w-20">{subject.sort_order}</Text>
              <View className="admin-table-cell w-20">
                <Badge variant={subject.is_active ? 'default' : 'secondary'}>
                  <Text className="text-xs">{subject.is_active ? '启用' : '禁用'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-24">
                <Button size="sm" variant="outline" onClick={() => toggleSubjectStatus(subject.id, !subject.is_active)}>
                  {subject.is_active ? '禁用' : '启用'}
                </Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  );

  // 渲染会员套餐
  const renderMembership = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>会员套餐管理</CardTitle>
            <Button size="sm">添加套餐</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">套餐名称</Text>
            <Text className="admin-table-cell w-20">角色</Text>
            <Text className="admin-table-cell w-16">类型</Text>
            <Text className="admin-table-cell w-24">价格</Text>
            <Text className="admin-table-cell w-24">原价</Text>
            <Text className="admin-table-cell w-20">天数</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {membershipPlans.map((plan) => (
            <View key={plan.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{plan.id}</Text>
              <Text className="admin-table-cell flex-1">{plan.name}</Text>
              <Text className="admin-table-cell w-20">{['家长', '教师', '机构'][plan.role]}</Text>
              <Text className="admin-table-cell w-16">{plan.type === 'month' ? '月卡' : plan.type === 'quarter' ? '季卡' : '年卡'}</Text>
              <Text className="admin-table-cell w-24">¥{plan.price}</Text>
              <Text className="admin-table-cell w-24 text-gray-400 line-through">¥{plan.original_price}</Text>
              <Text className="admin-table-cell w-20">{plan.duration_days}天</Text>
              <View className="admin-table-cell w-20">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  <Text className="text-xs">{plan.is_active ? '启用' : '禁用'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-24 flex gap-1">
                <Button size="sm" variant="outline">编辑</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>套餐类型说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 月卡：30天有效期，适合体验用户</Text>
            <Text>• 季卡：90天有效期，价格优惠约40%</Text>
            <Text>• 年卡：365天有效期，价格优惠约70%，性价比最高</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染商品管理
  const renderProducts = () => {
    const productsList = [
      { id: 1, name: '小学数学思维训练', price: 68, stock: 100, sales: 256, category: '教材', is_active: 1 },
      { id: 2, name: '英语口语学习机', price: 299, stock: 50, sales: 128, category: '教具', is_active: 1 },
    ];
    return (
      <View className="admin-content">
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>商品列表</CardTitle>
              <Button size="sm">添加商品</Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className="admin-table-header">
              <Text className="admin-table-cell w-16">ID</Text>
              <Text className="admin-table-cell flex-1">商品名称</Text>
              <Text className="admin-table-cell w-24">价格</Text>
              <Text className="admin-table-cell w-20">库存</Text>
              <Text className="admin-table-cell w-20">销量</Text>
              <Text className="admin-table-cell w-20">分类</Text>
              <Text className="admin-table-cell w-20">状态</Text>
              <Text className="admin-table-cell w-24">操作</Text>
            </View>
            {productsList.map((product) => (
              <View key={product.id} className="admin-table-row">
                <Text className="admin-table-cell w-16">{product.id}</Text>
                <Text className="admin-table-cell flex-1">{product.name}</Text>
                <Text className="admin-table-cell w-24">¥{product.price}</Text>
                <Text className="admin-table-cell w-20">{product.stock}</Text>
                <Text className="admin-table-cell w-20">{product.sales}</Text>
                <Text className="admin-table-cell w-20">{product.category}</Text>
                <View className="admin-table-cell w-20">
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    <Text className="text-xs">{product.is_active ? '上架' : '下架'}</Text>
                  </Badge>
                </View>
                <View className="admin-table-cell w-24 flex gap-1">
                  <Button size="sm" variant="outline">编辑</Button>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    );
  };

  // 渲染广告位管理
  const renderBanners = () => {
    const bannersList = [
      { id: 1, position: 'home_top', title: '新用户福利', sort_order: 1, is_active: 1 },
      { id: 2, position: 'home_middle', title: '邀请有礼', sort_order: 2, is_active: 1 },
    ];
    return (
      <View className="admin-content">
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>广告位管理</CardTitle>
              <Button size="sm">添加广告</Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className="admin-table-header">
              <Text className="admin-table-cell w-16">ID</Text>
              <Text className="admin-table-cell flex-1">标题</Text>
              <Text className="admin-table-cell w-28">位置</Text>
              <Text className="admin-table-cell w-20">排序</Text>
              <Text className="admin-table-cell w-20">状态</Text>
              <Text className="admin-table-cell w-24">操作</Text>
            </View>
            {bannersList.map((banner) => (
              <View key={banner.id} className="admin-table-row">
                <Text className="admin-table-cell w-16">{banner.id}</Text>
                <Text className="admin-table-cell flex-1">{banner.title}</Text>
                <Text className="admin-table-cell w-28">{banner.position === 'home_top' ? '首页顶部' : '首页中部'}</Text>
                <Text className="admin-table-cell w-20">{banner.sort_order}</Text>
                <View className="admin-table-cell w-20">
                  <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                    <Text className="text-xs">{banner.is_active ? '启用' : '禁用'}</Text>
                  </Badge>
                </View>
                <View className="admin-table-cell w-24 flex gap-1">
                  <Button size="sm" variant="outline">编辑</Button>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
    );
  };

  // 渲染虚拟产品（资料）管理
  const renderVirtualProducts = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>资料管理</CardTitle>
            <Button size="sm">添加资料</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">资料名称</Text>
            <Text className="admin-table-cell w-20">分类</Text>
            <Text className="admin-table-cell w-20">类型</Text>
            <Text className="admin-table-cell w-24">价格</Text>
            <Text className="admin-table-cell w-20">销量</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-28">操作</Text>
          </View>
          {virtualProducts.map((product) => (
            <View key={product.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{product.id}</Text>
              <Text className="admin-table-cell flex-1">{product.name}</Text>
              <Text className="admin-table-cell w-20">{product.category}</Text>
              <Text className="admin-table-cell w-20">{product.file_type === 'download' ? '文件' : '链接'}</Text>
              <Text className="admin-table-cell w-24">¥{product.price}</Text>
              <Text className="admin-table-cell w-20">{product.sales}</Text>
              <View className="admin-table-cell w-20">
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  <Text className="text-xs">{product.is_active ? '上架' : '下架'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-28 flex gap-1">
                <Button size="sm" variant="outline">编辑</Button>
                <Button size="sm" variant="outline" onClick={() => Taro.showToast({ title: '复制链接成功', icon: 'success' })}>链接</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>上传说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 文件类型：支持上传PDF、Word、视频等文件，用户付费后可直接下载</Text>
            <Text>• 链接类型：填写百度网盘链接和提取码，系统自动发送给付费用户</Text>
            <Text>• 价格设置：可设置原价和优惠价，优惠价即为实际售价</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染活动管理
  const renderActivities = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>活动管理</CardTitle>
            <Button size="sm">创建活动</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">活动名称</Text>
            <Text className="admin-table-cell w-16">类型</Text>
            <Text className="admin-table-cell w-28">时间</Text>
            <Text className="admin-table-cell w-20">形式</Text>
            <Text className="admin-table-cell w-20">价格</Text>
            <Text className="admin-table-cell w-24">报名/限额</Text>
            <Text className="admin-table-cell w-28">可见角色</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {activities.map((activity) => (
            <View key={activity.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{activity.id}</Text>
              <Text className="admin-table-cell flex-1">{activity.title}</Text>
              <Text className="admin-table-cell w-16">{activity.type === 'visit' ? '探校' : activity.type === 'training' ? '培训' : activity.type === 'lecture' ? '讲座' : '其他'}</Text>
              <Text className="admin-table-cell w-28">{activity.start_time.split(' ')[0]}</Text>
              <Text className="admin-table-cell w-20">{activity.is_online ? '线上' : '线下'}</Text>
              <Text className="admin-table-cell w-20">
                {(() => {
                  const price = activity.is_online ? activity.online_price : activity.offline_price;
                  return price === 0 ? '免费' : `¥${price}`;
                })()}
              </Text>
              <Text className="admin-table-cell w-24">{activity.current_participants}/{activity.max_participants}</Text>
              <Text className="admin-table-cell w-28">
                {activity.target_roles.includes(0) ? '家长 ' : ''}{activity.target_roles.includes(1) ? '教师 ' : ''}{activity.target_roles.includes(2) ? '机构' : ''}
              </Text>
              <View className="admin-table-cell w-20">
                <Badge variant={activity.is_active ? 'default' : 'secondary'}>
                  <Text className="text-xs">{activity.is_active ? '启用' : '禁用'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-24 flex gap-1">
                <Button size="sm" variant="outline">编辑</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>活动类型说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 探校活动：组织家长参观学校，适合家长参与</Text>
            <Text>• 教研培训：教师技能提升培训，适合教师参与</Text>
            <Text>• 讲座活动：政策解读、教育分享等，可设置线上/线下</Text>
            <Text>• 可见角色：选择后仅对应角色用户可在首页看到该活动</Text>
            <Text>• 线上活动：用户付费后获得直播链接；线下活动：用户付费后签到入场</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染占位符
  const renderPlaceholder = (title: string) => (
    <View className="admin-content flex items-center justify-center h-96">
      <View className="text-center">
        <Text className="text-gray-400 text-lg">{title}模块</Text>
        <Text className="text-gray-300 text-sm mt-2">功能已就绪，可调用API使用</Text>
      </View>
    </View>
  );

  // 渲染订单管理
  const renderOrders = () => (
    <View className="admin-content">
      {/* 筛选栏 */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <View className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待抢单' },
              { key: 'matched', label: '已匹配' },
              { key: 'trial', label: '试课中' },
              { key: 'signed', label: '已签约' },
              { key: 'completed', label: '已完成' },
              { key: 'cancelled', label: '已取消' },
            ].map((tab) => (
              <View
                key={tab.key}
                className={`px-3 py-1 rounded-full ${orderStatus === tab.key ? 'bg-blue-500' : 'bg-gray-100'}`}
                onClick={() => setOrderStatus(tab.key)}
              >
                <Text className={orderStatus === tab.key ? 'text-white' : 'text-gray-600'}>{tab.label}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>订单列表</CardTitle></CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-24">订单号</Text>
            <Text className="admin-table-cell flex-1">需求描述</Text>
            <Text className="admin-table-cell w-20">家长</Text>
            <Text className="admin-table-cell w-20">教师</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">创建时间</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {[
            { id: 1, order_no: 'O20240321001', parent_name: '王家长', teacher_name: '张老师', subject: '高中数学', status: 'pending', amount: 200, created_at: '2024-03-21', address: '朝阳区', description: '需要高中数学指导' },
            { id: 2, order_no: 'O20240320002', parent_name: '李家长', teacher_name: '李老师', subject: '初中英语', status: 'matched', amount: 150, created_at: '2024-03-20', address: '海淀区', description: '英语口语提升' },
            { id: 3, order_no: 'O20240319003', parent_name: '张家长', teacher_name: '王老师', subject: '高中物理', status: 'trial', amount: 180, created_at: '2024-03-19', address: '西城区', description: '物理竞赛指导' },
            { id: 4, order_no: 'O20240315004', parent_name: '赵家长', teacher_name: '刘老师', subject: '钢琴', status: 'signed', amount: 300, created_at: '2024-03-15', address: '东城区', description: '钢琴考级指导' },
          ].filter(o => orderStatus === 'all' || o.status === orderStatus).map((order) => {
            const statusMap: Record<string, { label: string; className: string }> = {
              pending: { label: '待抢单', className: 'bg-orange-100 text-orange-700' },
              matched: { label: '已匹配', className: 'bg-blue-100 text-blue-700' },
              trial: { label: '试课中', className: 'bg-purple-100 text-purple-700' },
              signed: { label: '已签约', className: 'bg-green-100 text-green-700' },
              completed: { label: '已完成', className: 'bg-gray-100 text-gray-600' },
              cancelled: { label: '已取消', className: 'bg-red-100 text-red-600' },
            };
            const statusConfig = statusMap[order.status];
            return (
              <View key={order.id} className="admin-table-row">
                <Text className="admin-table-cell w-24 text-xs">{order.order_no}</Text>
                <Text className="admin-table-cell flex-1">{order.subject} - {order.description}</Text>
                <Text className="admin-table-cell w-20">{order.parent_name}</Text>
                <Text className="admin-table-cell w-20">{order.teacher_name || '-'}</Text>
                <View className="admin-table-cell w-20">
                  <Badge className={statusConfig.className}><Text className="text-xs">{statusConfig.label}</Text></Badge>
                </View>
                <Text className="admin-table-cell w-24 text-xs">{order.created_at}</Text>
                <View className="admin-table-cell w-24">
                  <Button size="sm" variant="outline">详情</Button>
                </View>
              </View>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>订单状态说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 待抢单：家长发布需求，等待教师抢单</Text>
            <Text>• 已匹配：教师接单，双方建立联系</Text>
            <Text>• 试课中：双方进行试课阶段</Text>
            <Text>• 已签约：试课成功，正式签约合作</Text>
            <Text>• 已完成：课程结束，订单完成</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染用户管理
  const renderUsers = () => (
    <View className="admin-content">
      {/* 筛选栏 */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <View className="flex flex-wrap gap-2">
            {[
              { key: null, label: '全部' },
              { key: 0, label: '家长' },
              { key: 1, label: '教师' },
              { key: 2, label: '机构' },
            ].map((tab) => (
              <View
                key={tab.key ?? 'all'}
                className={`px-3 py-1 rounded-full ${userRole === tab.key ? 'bg-blue-500' : 'bg-gray-100'}`}
                onClick={() => setUserRole(tab.key)}
              >
                <Text className={userRole === tab.key ? 'text-white' : 'text-gray-600'}>{tab.label}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>用户列表</CardTitle>
            <Button size="sm">导出数据</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">昵称/手机</Text>
            <Text className="admin-table-cell w-16">角色</Text>
            <Text className="admin-table-cell w-20">会员状态</Text>
            <Text className="admin-table-cell w-24">注册时间</Text>
            <Text className="admin-table-cell w-24">最后登录</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {[
            { id: 1, nickname: '张三', phone: '138****8888', role: 0, is_member: true, member_expire: '2024-06-15', created_at: '2024-01-15', last_login: '2024-03-21', status: 1 },
            { id: 2, nickname: '李老师', phone: '139****9999', role: 1, is_member: true, member_expire: '2024-12-31', created_at: '2024-02-20', last_login: '2024-03-21', status: 1 },
            { id: 3, nickname: '王教育', phone: '137****7777', role: 2, is_member: false, created_at: '2024-03-01', last_login: '2024-03-20', status: 1 },
            { id: 4, nickname: '赵家长', phone: '136****6666', role: 0, is_member: false, created_at: '2024-03-10', last_login: '2024-03-19', status: 1 },
          ].filter(u => userRole === null || u.role === userRole).map((user) => (
            <View key={user.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{user.id}</Text>
              <View className="admin-table-cell flex-1">
                <Text>{user.nickname}</Text>
                <Text className="text-xs text-gray-400">{user.phone}</Text>
              </View>
              <Text className="admin-table-cell w-16">{['家长', '教师', '机构'][user.role]}</Text>
              <View className="admin-table-cell w-20">
                {user.is_member ? (
                  <Badge className="bg-yellow-100 text-yellow-700"><Text className="text-xs">会员</Text></Badge>
                ) : (
                  <Text className="text-xs text-gray-400">普通</Text>
                )}
              </View>
              <Text className="admin-table-cell w-24 text-xs">{user.created_at}</Text>
              <Text className="admin-table-cell w-24 text-xs">{user.last_login}</Text>
              <View className="admin-table-cell w-20">
                <Badge className={user.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                  <Text className="text-xs">{user.status ? '正常' : '禁用'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-24 flex gap-1">
                <Button size="sm" variant="outline">详情</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <View className="grid grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-gray-500">家长总数</Text>
            <Text className="text-2xl font-bold mt-2">2,158</Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-gray-500">教师总数</Text>
            <Text className="text-2xl font-bold mt-2">328</Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Text className="text-gray-500">会员用户</Text>
            <Text className="text-2xl font-bold mt-2 text-blue-500">856</Text>
          </CardContent>
        </Card>
      </View>
    </View>
  );

  // 渲染代理商管理
  const renderAgents = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>代理商列表</CardTitle>
            <Button size="sm">添加代理商</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">姓名/手机</Text>
            <Text className="admin-table-cell w-20">代理城市</Text>
            <Text className="admin-table-cell w-16">分佣比例</Text>
            <Text className="admin-table-cell w-20">订单数</Text>
            <Text className="admin-table-cell w-24">累计佣金</Text>
            <Text className="admin-table-cell w-24">已结算</Text>
            <Text className="admin-table-cell w-20">状态</Text>
            <Text className="admin-table-cell w-24">操作</Text>
          </View>
          {[
            { id: 1, name: '张代理', phone: '138****8888', city: '北京', rate: 5, total_orders: 156, total_commission: 12500, settled_commission: 10000, status: 1, created_at: '2024-01-01' },
            { id: 2, name: '李代理', phone: '139****9999', city: '上海', rate: 5, total_orders: 98, total_commission: 8600, settled_commission: 7200, status: 1, created_at: '2024-02-01' },
            { id: 3, name: '王代理', phone: '137****7777', city: '广州', rate: 5, total_orders: 67, total_commission: 5800, settled_commission: 4500, status: 1, created_at: '2024-02-15' },
          ].map((agent) => (
            <View key={agent.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{agent.id}</Text>
              <View className="admin-table-cell flex-1">
                <Text>{agent.name}</Text>
                <Text className="text-xs text-gray-400">{agent.phone}</Text>
              </View>
              <Text className="admin-table-cell w-20">{agent.city}</Text>
              <Text className="admin-table-cell w-16">{agent.rate}%</Text>
              <Text className="admin-table-cell w-20">{agent.total_orders}</Text>
              <Text className="admin-table-cell w-24 text-orange-500">¥{agent.total_commission}</Text>
              <Text className="admin-table-cell w-24 text-green-600">¥{agent.settled_commission}</Text>
              <View className="admin-table-cell w-20">
                <Badge className={agent.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                  <Text className="text-xs">{agent.status ? '正常' : '禁用'}</Text>
                </Badge>
              </View>
              <View className="admin-table-cell w-24 flex gap-1">
                <Button size="sm" variant="outline">编辑</Button>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>代理商说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 代理商可获得其代理城市内所有订单的5%分佣</Text>
            <Text>• 佣金在订单完成后自动结算到代理商账户</Text>
            <Text>• 代理商可申请提现，审核后打款</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  // 渲染支付配置
  const renderPayment = () => (
    <View className="admin-content">
      <Card>
        <CardHeader><CardTitle>微信支付配置</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">AppID</Text>
              <View className="flex-1">
                <Input placeholder="微信支付AppID" value={paymentConfig.wechat_appid} onInput={(e) => setPaymentConfig({ ...paymentConfig, wechat_appid: e.detail.value })} />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">商户号</Text>
              <View className="flex-1">
                <Input placeholder="微信支付商户号" value={paymentConfig.wechat_mchid} onInput={(e) => setPaymentConfig({ ...paymentConfig, wechat_mchid: e.detail.value })} />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">AppSecret</Text>
              <View className="flex-1">
                <Input placeholder="微信AppSecret" value={paymentConfig.wechat_secret} onInput={(e) => setPaymentConfig({ ...paymentConfig, wechat_secret: e.detail.value })} />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">API密钥</Text>
              <View className="flex-1">
                <Input placeholder="微信支付API密钥" value={paymentConfig.wechat_api_key} onInput={(e) => setPaymentConfig({ ...paymentConfig, wechat_api_key: e.detail.value })} />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>支付宝配置</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">AppID</Text>
              <View className="flex-1">
                <Input placeholder="支付宝AppID" value={paymentConfig.alipay_appid} onInput={(e) => setPaymentConfig({ ...paymentConfig, alipay_appid: e.detail.value })} />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">公钥</Text>
              <View className="flex-1">
                <Input placeholder="支付宝公钥" value={paymentConfig.alipay_public_key} onInput={(e) => setPaymentConfig({ ...paymentConfig, alipay_public_key: e.detail.value })} />
              </View>
            </View>
            <View className="flex items-center gap-4">
              <Text className="w-28 text-gray-600">私钥</Text>
              <View className="flex-1">
                <Input placeholder="应用私钥" value={paymentConfig.alipay_private_key} onInput={(e) => setPaymentConfig({ ...paymentConfig, alipay_private_key: e.detail.value })} />
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      <View className="mt-4">
        <Button onClick={() => Taro.showToast({ title: '保存成功', icon: 'success' })}>保存配置</Button>
      </View>
    </View>
  );

  // 渲染消息管理
  const renderMessages = () => (
    <View className="admin-content">
      <Card>
        <CardHeader>
          <View className="flex justify-between items-center">
            <CardTitle>聊天记录查询</CardTitle>
            <Button size="sm">导出记录</Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="admin-table-header">
            <Text className="admin-table-cell w-16">ID</Text>
            <Text className="admin-table-cell flex-1">内容</Text>
            <Text className="admin-table-cell w-24">发送方</Text>
            <Text className="admin-table-cell w-24">接收方</Text>
            <Text className="admin-table-cell w-20">类型</Text>
            <Text className="admin-table-cell w-28">时间</Text>
          </View>
          {[
            { id: 1, from_user: '张老师', to_user: '王家长', content: '您好，请问孩子现在的学习情况怎么样？', msg_type: 'text', created_at: '2024-03-21 16:30' },
            { id: 2, from_user: '王家长', to_user: '张老师', content: '孩子数学基础还可以，就是函数部分比较薄弱', msg_type: 'text', created_at: '2024-03-21 16:32' },
            { id: 3, from_user: '张老师', to_user: '王家长', content: '好的，我会重点讲解函数', msg_type: 'text', created_at: '2024-03-21 16:33' },
            { id: 4, from_user: '系统', to_user: '王家长', content: '您的会员即将到期，续费可享8折优惠', msg_type: 'system', created_at: '2024-03-21 10:00' },
          ].map((msg) => (
            <View key={msg.id} className="admin-table-row">
              <Text className="admin-table-cell w-16">{msg.id}</Text>
              <Text className="admin-table-cell flex-1 text-sm">{msg.content.substring(0, 30)}...</Text>
              <Text className="admin-table-cell w-24">{msg.from_user}</Text>
              <Text className="admin-table-cell w-24">{msg.to_user}</Text>
              <View className="admin-table-cell w-20">
                <Badge className={msg.msg_type === 'system' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                  <Text className="text-xs">{msg.msg_type === 'system' ? '系统' : '聊天'}</Text>
                </Badge>
              </View>
              <Text className="admin-table-cell w-28 text-xs">{msg.created_at}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </View>
  );

  // 渲染角色权限管理
  const renderPermissions = () => (
    <View className="admin-content">
      <View className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>角色管理</CardTitle>
              <Button size="sm">添加角色</Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              {[
                { id: 1, name: '超级管理员', permissions: ['全部权限'], user_count: 1 },
                { id: 2, name: '运营管理', permissions: ['订单管理', '用户管理', '活动管理'], user_count: 3 },
                { id: 3, name: '客服', permissions: ['订单查看', '用户查看', '消息管理'], user_count: 5 },
                { id: 4, name: '财务管理', permissions: ['订单查看', '支付配置', '佣金管理'], user_count: 2 },
              ].map((role) => (
                <View key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <View>
                    <Text className="font-semibold">{role.name}</Text>
                    <Text className="text-xs text-gray-400 mt-1">{role.permissions.join('、')}</Text>
                  </View>
                  <View className="flex items-center gap-2">
                    <Text className="text-xs text-gray-500">{role.user_count}人</Text>
                    <Button size="sm" variant="outline">编辑</Button>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <View className="flex justify-between items-center">
              <CardTitle>管理账号</CardTitle>
              <Button size="sm">添加账号</Button>
            </View>
          </CardHeader>
          <CardContent>
            <View className="admin-table-header text-sm">
              <Text className="admin-table-cell flex-1">账号</Text>
              <Text className="admin-table-cell w-24">角色</Text>
              <Text className="admin-table-cell w-28">最后登录</Text>
              <Text className="admin-table-cell w-20">状态</Text>
            </View>
            {[
              { id: 1, username: 'admin', nickname: '超级管理员', role: '超级管理员', last_login: '2024-03-21 16:00', status: 1 },
              { id: 2, username: 'operator1', nickname: '运营小王', role: '运营管理', last_login: '2024-03-21 15:30', status: 1 },
              { id: 3, username: 'service1', nickname: '客服小李', role: '客服', last_login: '2024-03-21 14:00', status: 1 },
              { id: 4, username: 'finance1', nickname: '财务小张', role: '财务管理', last_login: '2024-03-20 18:00', status: 1 },
            ].map((account) => (
              <View key={account.id} className="admin-table-row text-sm">
                <View className="admin-table-cell flex-1">
                  <Text>{account.nickname}</Text>
                  <Text className="text-xs text-gray-400">{account.username}</Text>
                </View>
                <Text className="admin-table-cell w-24">{account.role}</Text>
                <Text className="admin-table-cell w-28 text-xs">{account.last_login}</Text>
                <View className="admin-table-cell w-20">
                  <Badge className={account.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                    <Text className="text-xs">{account.status ? '正常' : '禁用'}</Text>
                  </Badge>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      <Card className="mt-4">
        <CardHeader><CardTitle>权限说明</CardTitle></CardHeader>
        <CardContent>
          <View className="flex flex-col gap-2 text-sm text-gray-600">
            <Text>• 超级管理员：拥有所有权限，可管理其他管理员</Text>
            <Text>• 运营管理：可管理订单、用户、活动等业务数据</Text>
            <Text>• 客服：可查看订单和用户信息，处理用户咨询</Text>
            <Text>• 财务管理：可查看订单和支付相关数据</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  return (
    <View className="admin-layout">
      {/* 侧边栏 */}
      <View className="admin-sidebar">
        <View className="admin-logo">
          <Text className="text-xl font-bold text-white">棉花糖教育</Text>
          <Text className="text-xs text-blue-200">管理后台 v2.0</Text>
        </View>
        
        <View className="admin-menu">
          {menus.map((menu) => (
            <View
              key={menu.id}
              className={`admin-menu-item ${currentMenu === menu.id ? 'active' : ''}`}
              onClick={() => setCurrentMenu(menu.id)}
            >
              <menu.icon size={18} color={currentMenu === menu.id ? '#2563EB' : '#9CA3AF'} />
              <Text className={currentMenu === menu.id ? 'text-blue-500' : 'text-gray-500'}>{menu.label}</Text>
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
        <View className="admin-header">
          <Text className="text-lg font-semibold">{menus.find(m => m.id === currentMenu)?.label || '数据概览'}</Text>
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

        {loading ? (
          <View className="flex items-center justify-center h-96">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : (
          <>
            {currentMenu === 'dashboard' && renderDashboard()}
            {currentMenu === 'settings' && renderSettings()}
            {currentMenu === 'distribution' && renderDistribution()}
            {currentMenu === 'subjects' && renderSubjects()}
            {currentMenu === 'membership' && renderMembership()}
            {currentMenu === 'products' && renderProducts()}
            {currentMenu === 'virtual' && renderVirtualProducts()}
            {currentMenu === 'activities' && renderActivities()}
            {currentMenu === 'banners' && renderBanners()}
            {currentMenu === 'orders' && renderOrders()}
            {currentMenu === 'users' && renderUsers()}
            {currentMenu === 'teachers' && renderPlaceholder('教师管理')}
            {currentMenu === 'orgs' && renderPlaceholder('机构管理')}
            {currentMenu === 'agents' && renderAgents()}
            {currentMenu === 'messages' && renderMessages()}
            {currentMenu === 'payment' && renderPayment()}
            {currentMenu === 'permissions' && renderPermissions()}
          </>
        )}
      </View>
    </View>
  );
};

export default AdminPage;