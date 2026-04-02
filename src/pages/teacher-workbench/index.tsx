import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteConfig } from '@/store';
import { 
  Wallet, Users, FileText, Share2, Gift,
  TrendingUp, ChevronRight, Plus, MessageCircle,
  BookOpen, Award, Star, Send, Clock
} from 'lucide-react-taro';
import './index.css';

interface Stats {
  today_earnings: number;
  month_earnings: number;
  active_students: number;
  pending_orders: number;
  total_shared: number;
  commission: number;
}

interface RecentOrder {
  id: number;
  subject: string;
  grade: string;
  hourly_rate: number;
  address: string;
  distance: number;
  created_at: string;
}

/**
 * 牛师工作台 - 牛师端核心功能入口
 */
const TeacherWorkbenchPage = () => {
  const siteName = useSiteConfig(state => state.getSiteName)();
  const [stats, setStats] = useState<Stats>({
    today_earnings: 0,
    month_earnings: 0,
    active_students: 0,
    pending_orders: 0,
    total_shared: 0,
    commission: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isMember, setIsMember] = useState(false);

  useDidShow(() => {
    loadData();
    checkMemberStatus();
  });

  // 配置分享
  useShareAppMessage(() => ({
    title: `${siteName} - 找好老师，上${siteName}`,
    path: '/pages/index/index?from=teacher_share',
    imageUrl: `https://placehold.co/500x400/2563EB/white?text=${encodeURIComponent(siteName)}`,
  }));

  useShareTimeline(() => ({
    title: `${siteName} - 找好老师，上${siteName}`,
    query: 'from=teacher_share',
    imageUrl: `https://placehold.co/500x400/2563EB/white?text=${encodeURIComponent(siteName)}`,
  }));

  const loadData = () => {
    // 模拟数据
    setStats({
      today_earnings: 480,
      month_earnings: 8920,
      active_students: 5,
      pending_orders: 12,
      total_shared: 28,
      commission: 1260,
    });

    setRecentOrders([
      { id: 1, subject: '高中数学', grade: '高二', hourly_rate: 200, address: '朝阳区望京', distance: 2.5, created_at: '刚刚' },
      { id: 2, subject: '初中英语', grade: '初三', hourly_rate: 150, address: '海淀区中关村', distance: 4.2, created_at: '10分钟前' },
      { id: 3, subject: '小学语文', grade: '五年级', hourly_rate: 120, address: '西城区金融街', distance: 1.8, created_at: '30分钟前' },
    ]);
  };

  const checkMemberStatus = () => {
    const memberExpire = Taro.getStorageSync('member_expire_role_1');
    setIsMember(!!memberExpire && new Date(memberExpire) > new Date());
  };

  // 快捷功能
  const quickActions = [
    { icon: FileText, title: '浏览需求', desc: '抢单接课', url: '/pages/index/index', color: '#2563EB' },
    { icon: Plus, title: '代录需求', desc: '帮家长发布', url: '/pages/publish/index?mode=teacher', color: '#22C55E' },
    { icon: Share2, title: '转发赚钱', desc: '分享需求', url: '/pages/share-center/index', color: '#F59E0B' },
    { icon: Users, title: '我的学员', desc: '管理学生', url: '/pages/students/index', color: '#9333EA' },
  ];

  // 功能菜单
  const menus = [
    { icon: Wallet, title: '收益中心', desc: '查看收益明细', url: '/pages/earnings/index', badge: '' },
    { icon: Gift, title: '推广中心', desc: '邀请赚佣金', url: '/pages/distribution/index', badge: '赚钱' },
    { icon: Clock, title: '课程安排', desc: '管理日程', url: '/pages/course-manage/index', badge: '' },
    { icon: BookOpen, title: '我的主页', desc: '牛师展示页', url: '/pages/teacher-detail/index?id=1', badge: '' },
    { icon: Award, title: '会员特权', desc: isMember ? '已开通' : '立即开通', url: '/pages/membership/index', badge: isMember ? '' : '热门' },
    { icon: MessageCircle, title: '消息中心', desc: '沟通记录', url: '/pages/message/index', badge: '' },
  ];

  const handleGrabOrder = (_orderId: number) => {
    if (!isMember) {
      Taro.showModal({
        title: '开通会员',
        content: '开通会员后可无限抢单，优先展示给家长',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' });
          }
        },
      });
      return;
    }
    
    Taro.showModal({
      title: '确认抢单',
      content: '确定要抢单吗？抢单后请及时联系家长',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '抢单成功', icon: 'success' });
        }
      },
    });
  };

  const handleShareApp = () => {
    Taro.showShareMenu({ withShareTicket: true } as any);
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部收益卡片 */}
      <View className="bg-gradient-to-br from-green-500 to-green-600 px-4 pt-6 pb-8">
        <View className="flex items-center justify-between mb-4">
          <View className="flex items-center">
            <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <BookOpen size={24} color="white" />
            </View>
            <View className="ml-3">
              <Text className="text-white font-semibold">牛师工作台</Text>
              <View className="flex items-center mt-1">
                {isMember ? (
                  <Badge className="bg-yellow-400">
                    <Star size={12} color="#92400E" className="mr-1" />
                    <Text className="text-yellow-900 text-xs">会员牛师</Text>
                  </Badge>
                ) : (
                  <Text className="text-white text-opacity-80 text-sm">开通会员享更多权益</Text>
                )}
              </View>
            </View>
          </View>
          <View 
            className="bg-white bg-opacity-20 px-3 py-1 rounded-full"
            onClick={() => Taro.navigateTo({ url: '/pages/role-switch/index' })}
          >
            <Text className="text-white text-sm">切换身份</Text>
          </View>
        </View>

        <Card className="bg-white bg-opacity-10 backdrop-blur">
          <CardContent className="p-4">
            <View className="flex justify-around">
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">今日收入</Text>
                <Text className="text-white text-2xl font-bold">¥{stats.today_earnings}</Text>
              </View>
              <View className="w-px bg-white bg-opacity-20" />
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">本月收入</Text>
                <Text className="text-white text-2xl font-bold">¥{stats.month_earnings}</Text>
              </View>
              <View className="w-px bg-white bg-opacity-20" />
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">推广佣金</Text>
                <Text className="text-white text-2xl font-bold">¥{stats.commission}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 -mt-4">
        {/* 快捷功能 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <View
                  key={action.title}
                  className="flex flex-col items-center py-2"
                  onClick={() => Taro.navigateTo({ url: action.url })}
                >
                  <View 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon size={24} color={action.color} />
                  </View>
                  <Text className="text-sm font-medium">{action.title}</Text>
                  <Text className="text-xs text-gray-400">{action.desc}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 待抢单需求 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                <FileText size={18} color="#2563EB" className="mr-2" />
                <CardTitle>最新需求</CardTitle>
                {stats.pending_orders > 0 && (
                  <Badge className="ml-2 bg-red-500">
                    <Text className="text-white text-xs">{stats.pending_orders}</Text>
                  </Badge>
                )}
              </View>
              <View 
                className="flex items-center"
                onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
              >
                <Text className="text-gray-400 text-sm">更多</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              {recentOrders.map((order) => (
                <View 
                  key={order.id}
                  className="bg-gray-50 rounded-lg p-3"
                  onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })}
                >
                  <View className="flex justify-between items-start mb-2">
                    <View>
                      <Text className="font-semibold">{order.subject}</Text>
                      <Text className="text-gray-500 text-xs">{order.grade} · {order.address}</Text>
                    </View>
                    <Text className="text-orange-500 font-bold">¥{order.hourly_rate}/h</Text>
                  </View>
                  <View className="flex justify-between items-center">
                    <Text className="text-gray-400 text-xs">{order.created_at} · {order.distance}km</Text>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGrabOrder(order.id);
                      }}
                    >
                      <Text className="text-white text-xs">抢单</Text>
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 推广赚钱 */}
        <Card className="mb-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                <Gift size={24} color="#F97316" />
                <View className="ml-3">
                  <Text className="font-semibold text-orange-700">转发需求，赚佣金</Text>
                  <Text className="text-orange-600 text-xs">分享需求到群，成交后获得5%佣金</Text>
                </View>
              </View>
              <Button 
                className="bg-orange-500"
                onClick={handleShareApp}
              >
                <Send size={14} color="white" className="mr-1" />
                <Text className="text-white text-sm">去分享</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 功能菜单 */}
        <Card>
          <CardContent className="p-0">
            {menus.map((menu, index) => (
              <View
                key={menu.title}
                className={`flex items-center justify-between px-4 py-4 ${
                  index !== menus.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => Taro.navigateTo({ url: menu.url })}
              >
                <View className="flex items-center">
                  <menu.icon size={20} color="#2563EB" className="mr-3" />
                  <View>
                    <Text className="text-gray-800">{menu.title}</Text>
                    <Text className="text-gray-400 text-xs mt-1">{menu.desc}</Text>
                  </View>
                </View>
                <View className="flex items-center">
                  {menu.badge && (
                    <Badge className={`mr-2 ${menu.badge === '热门' ? 'bg-red-500' : 'bg-green-500'}`}>
                      <Text className="text-white text-xs">{menu.badge}</Text>
                    </Badge>
                  )}
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 统计数据 */}
        <View className="mt-4 grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <Users size={20} color="#2563EB" className="mx-auto" />
              <Text className="text-lg font-bold mt-1">{stats.active_students}</Text>
              <Text className="text-gray-500 text-xs">在教学生</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Share2 size={20} color="#F59E0B" className="mx-auto" />
              <Text className="text-lg font-bold mt-1">{stats.total_shared}</Text>
              <Text className="text-gray-500 text-xs">转发次数</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp size={20} color="#22C55E" className="mx-auto" />
              <Text className="text-lg font-bold mt-1">98%</Text>
              <Text className="text-gray-500 text-xs">好评率</Text>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  );
};

export default TeacherWorkbenchPage;
