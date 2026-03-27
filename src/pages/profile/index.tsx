import { View, Text, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, Crown, Users, Building2, MapPin, 
  ChevronRight, Star, Wallet, Gift, Settings,
  FileText, Award, TrendingUp
} from 'lucide-react-taro';
import './index.css';

interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
  role: number;
  mobile: string;
  membership_type: number;
  membership_expire_at: string | null;
}

// 角色配置
const roleConfig: Record<number, { name: string; icon: any; color: string }> = {
  0: { name: '家长', icon: User, color: 'bg-blue-500' },
  1: { name: '教师', icon: Star, color: 'bg-green-500' },
  2: { name: '机构', icon: Building2, color: 'bg-purple-500' },
  3: { name: '代理', icon: MapPin, color: 'bg-orange-500' },
};

/**
 * 个人中心页面
 */
const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentRole, setCurrentRole] = useState(0);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    // 模拟用户数据
    setUserInfo({
      id: 1,
      nickname: '测试用户',
      avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
      role: currentRole,
      mobile: '138****8888',
      membership_type: currentRole === 0 ? 1 : 0,
      membership_expire_at: '2027-03-27',
    });
  };

  // 切换角色（测试用）
  const switchRole = (role: number) => {
    setCurrentRole(role);
    setUserInfo({
      ...userInfo!,
      role,
      membership_type: role === 0 ? 1 : 0,
    });
  };

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url });
  };

  const roleInfo = roleConfig[currentRole];

  // 家长端菜单
  const parentMenus = [
    { icon: FileText, title: '我的需求', desc: '已发布3条', url: '/pages/orders/index' },
    { icon: Star, title: '收藏教师', desc: '已收藏5位', url: '/pages/favorites/index' },
    { icon: Crown, title: '会员中心', desc: '尊享特权', url: '/pages/membership/index' },
    { icon: Gift, title: '邀请有礼', desc: '赚佣金', url: '/pages/distribution/index' },
  ];

  // 教师端菜单
  const teacherMenus = [
    { icon: FileText, title: '我的接单', desc: '已完成12单', url: '/pages/orders/index' },
    { icon: Users, title: '我的学员', desc: '在教3人', url: '/pages/students/index' },
    { icon: Crown, title: '会员中心', desc: '解锁抢单', url: '/pages/membership/index' },
    { icon: Wallet, title: '收益中心', desc: '¥2,580.00', url: '/pages/earnings/index' },
    { icon: Gift, title: '邀请有礼', desc: '赚佣金', url: '/pages/distribution/index' },
  ];

  // 机构端菜单
  const orgMenus = [
    { icon: Users, title: '教师管理', desc: '已入驻8人', url: '/pages/org-dashboard/index' },
    { icon: FileText, title: '订单管理', desc: '待处理5单', url: '/pages/orders/index' },
    { icon: TrendingUp, title: '数据统计', desc: '营收分析', url: '/pages/org-dashboard/index' },
    { icon: Wallet, title: '收益中心', desc: '¥12,800.00', url: '/pages/distribution/index' },
    { icon: Crown, title: '会员中心', desc: '机构特权', url: '/pages/membership/index' },
  ];

  // 代理端菜单
  const agentMenus = [
    { icon: MapPin, title: '辖区管理', desc: '北京市朝阳区', url: '/pages/agent-dashboard/index' },
    { icon: Users, title: '入驻审核', desc: '待审核3人', url: '/pages/agent-dashboard/index' },
    { icon: TrendingUp, title: '数据看板', desc: '实时数据', url: '/pages/agent-dashboard/index' },
    { icon: Wallet, title: '分润结算', desc: '¥8,600.00', url: '/pages/agent-dashboard/index' },
  ];

  const menus = currentRole === 0 ? parentMenus : currentRole === 1 ? teacherMenus : currentRole === 2 ? orgMenus : agentMenus;

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部用户信息 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-8 pb-12">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center">
            <Image 
              src={userInfo?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              className="w-16 h-16 rounded-full border-2 border-white"
            />
            <View className="ml-3">
              <View className="flex flex-row items-center">
                <Text className="text-white text-lg font-bold">{userInfo?.nickname}</Text>
                {userInfo?.membership_type === 1 && (
                  <Badge className="ml-2 bg-yellow-400">
                    <Text className="text-xs text-yellow-900">会员</Text>
                  </Badge>
                )}
              </View>
              <Text className="text-blue-100 text-sm mt-1">{userInfo?.mobile}</Text>
            </View>
          </View>
          <Settings size={24} color="white" onClick={() => navigateTo('/pages/settings/index')} />
        </View>

        {/* 角色切换（测试用） */}
        <View className="bg-white bg-opacity-20 rounded-lg p-3">
          <Text className="text-white text-xs mb-2">当前身份：{roleInfo.name}</Text>
          <View className="flex flex-row gap-2">
            {[0, 1, 2, 3].map((role) => (
              <View
                key={role}
                className={`px-3 py-1 rounded-full ${
                  currentRole === role ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
                onClick={() => switchRole(role)}
              >
                <Text className={`text-xs ${currentRole === role ? 'text-blue-500 font-semibold' : 'text-white'}`}>
                  {roleConfig[role].name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className="px-4 -mt-6">
        <Card className="mb-4">
          <CardContent className="p-0">
            {menus.map((menu, index) => (
              <View
                key={menu.title}
                className={`flex flex-row items-center justify-between px-4 py-4 ${
                  index !== menus.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => navigateTo(menu.url)}
              >
                <View className="flex flex-row items-center">
                  <menu.icon size={20} color="#2563EB" className="mr-3" />
                  <View>
                    <Text className="text-gray-800">{menu.title}</Text>
                    <Text className="text-gray-400 text-xs mt-1">{menu.desc}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 其他功能 */}
        <Card>
          <CardContent className="p-0">
            <View
              className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              onClick={() => navigateTo('/pages/about/index')}
            >
              <View className="flex flex-row items-center">
                <Award size={20} color="#6B7280" className="mr-3" />
                <Text className="text-gray-800">关于我们</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
            <View
              className="flex flex-row items-center justify-between px-4 py-4"
              onClick={() => Taro.makePhoneCall({ phoneNumber: '400-888-8888' })}
            >
              <View className="flex flex-row items-center">
                <User size={20} color="#6B7280" className="mr-3" />
                <Text className="text-gray-800">联系客服</Text>
              </View>
              <Text className="text-gray-400 text-sm">400-888-8888</Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default ProfilePage;
