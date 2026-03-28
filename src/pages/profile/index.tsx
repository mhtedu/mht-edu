import { View, Text, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Crown, Users, 
  ChevronRight, Star, Wallet, Gift, Settings,
  FileText, Award, Shield, BookOpen, GraduationCap, Building2
} from 'lucide-react-taro';
import './index.css';

interface UserInfo {
  id: number;
  nickname: string;
  avatar: string;
  role: number; // 0-家长, 1-教师, 2-机构
  mobile: string;
  membership_type: number;
  membership_expire_at: string | null;
}

// 角色配置
const roleConfig: Record<number, { name: string; icon: typeof User; color: string }> = {
  0: { name: '家长', icon: GraduationCap, color: 'bg-blue-500' },
  1: { name: '教师', icon: BookOpen, color: 'bg-green-500' },
  2: { name: '机构', icon: Building2, color: 'bg-purple-500' },
};

/**
 * 个人中心页面
 */
const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentRole, setCurrentRole] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserInfo();
    }
  }, [currentRole, isLoggedIn]);

  const checkLoginStatus = () => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);
    // 确保角色值转换为数字
    const savedRole = Taro.getStorageSync('userRole');
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
    setCurrentRole(role);
    
    // 检查会员状态（每端独立）
    const memberKey = `member_expire_role_${role}`;
    const memberExpire = Taro.getStorageSync(memberKey);
    setIsMember(!!memberExpire && new Date(memberExpire) > new Date());
  };

  const loadUserInfo = () => {
    // 从本地存储获取用户信息
    const nickname = Taro.getStorageSync('userNickname') || '用户';
    const phone = Taro.getStorageSync('userPhone') || '';
    const memberKey = `member_expire_role_${currentRole}`;
    const memberExpire = Taro.getStorageSync(memberKey);

    setUserInfo({
      id: 1,
      nickname,
      avatar: '',
      role: currentRole,
      mobile: phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '',
      membership_type: memberExpire && new Date(memberExpire) > new Date() ? 1 : 0,
      membership_expire_at: memberExpire,
    });
  };

  // 切换角色
  const switchRole = (role: number) => {
    if (role === currentRole) return;
    
    Taro.showModal({
      title: '切换身份',
      content: `确定切换到${roleConfig[role].name}端吗？`,
      success: (res) => {
        if (res.confirm) {
          setCurrentRole(role);
          Taro.setStorageSync('userRole', role);
          
          // 更新会员状态
          const memberKey = `member_expire_role_${role}`;
          const memberExpire = Taro.getStorageSync(memberKey);
          setIsMember(!!memberExpire && new Date(memberExpire) > new Date());
          
          // 切换角色后跳转首页
          Taro.switchTab({ url: '/pages/index/index' });
        }
      },
    });
  };

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync();
          Taro.redirectTo({ url: '/pages/login/index' });
        }
      },
    });
  };

  const roleInfo = roleConfig[currentRole];

  // 家长端菜单
  const parentMenus = [
    { icon: FileText, title: '我的需求', desc: '已发布的需求', url: '/pages/orders/index', badge: '' },
    { icon: Star, title: '收藏教师', desc: '已收藏的教师', url: '/pages/favorites/index', badge: '' },
    { icon: Crown, title: '会员中心', desc: isMember ? '已开通' : '未开通', url: '/pages/membership/index', badge: isMember ? '' : '开通' },
    { icon: Gift, title: '邀请有礼', desc: '赚佣金', url: '/pages/distribution/index', badge: '' },
  ];

  // 教师端菜单
  const teacherMenus = [
    { icon: FileText, title: '我的接单', desc: '接单记录', url: '/pages/orders/index', badge: '' },
    { icon: Users, title: '我的学员', desc: '在教学生', url: '/pages/students/index', badge: '' },
    { icon: Crown, title: '会员中心', desc: isMember ? '已开通' : '未开通', url: '/pages/membership/index', badge: isMember ? '' : '开通' },
    { icon: Wallet, title: '收益中心', desc: '查看收益', url: '/pages/earnings/index', badge: '' },
    { icon: Gift, title: '邀请有礼', desc: '赚佣金', url: '/pages/distribution/index', badge: '' },
  ];

  // 机构端菜单
  const orgMenus = [
    { icon: Building2, title: '机构管理', desc: '机构信息设置', url: '/pages/org-dashboard/index', badge: '' },
    { icon: Users, title: '教师管理', desc: '管理机构教师', url: '/pages/org-teachers/index', badge: '' },
    { icon: FileText, title: '课程管理', desc: '课程发布与统计', url: '/pages/org-courses/index', badge: '' },
    { icon: Crown, title: '会员中心', desc: isMember ? '已开通' : '未开通', url: '/pages/membership/index', badge: isMember ? '' : '开通' },
    { icon: Gift, title: '邀请有礼', desc: '赚佣金', url: '/pages/distribution/index', badge: '' },
  ];

  const menus = currentRole === 0 ? parentMenus : currentRole === 1 ? teacherMenus : orgMenus;

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <User size={40} color="#2563EB" />
        </View>
        <Text className="text-gray-600 mb-4">登录后查看更多内容</Text>
        <Button onClick={() => Taro.redirectTo({ url: '/pages/login/index' })}>
          <Text className="text-white">立即登录</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-32">
      {/* 头部用户信息 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-8 pb-12">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              {userInfo?.avatar ? (
                <Image 
                  src={userInfo.avatar}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <User size={32} color="#2563EB" />
              )}
            </View>
            <View className="ml-3">
              <View className="flex flex-row items-center">
                <Text className="text-white text-lg font-bold">{userInfo?.nickname}</Text>
                {isMember && (
                  <Badge className="ml-2 bg-yellow-400">
                    <Text className="text-xs text-yellow-900">会员</Text>
                  </Badge>
                )}
              </View>
              <Text className="text-blue-100 text-sm mt-1">{userInfo?.mobile || '未绑定手机'}</Text>
            </View>
          </View>
          <Settings size={24} color="white" onClick={() => navigateTo('/pages/settings/index')} />
        </View>
      </View>

      {/* 会员状态卡片 */}
      <View className="px-4 -mt-6">
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <Crown size={24} color={isMember ? '#F59E0B' : '#9CA3AF'} className="mr-3" />
                <View>
                  <Text className="font-semibold">
                    {isMember ? `${roleInfo.name}会员` : `${roleInfo.name}会员特权`}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {isMember 
                      ? `有效期至：${userInfo?.membership_expire_at?.split('T')[0]}` 
                      : '开通会员解锁更多权益'}
                  </Text>
                </View>
              </View>
              <Button 
                size="sm" 
                className={isMember ? 'bg-gray-200' : 'bg-yellow-500'}
                onClick={() => navigateTo('/pages/membership/index')}
              >
                <Text className={isMember ? 'text-gray-600' : 'text-white'}>
                  {isMember ? '续费' : '立即开通'}
                </Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能菜单 */}
      <View className="px-4">
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
                <View className="flex flex-row items-center">
                  {menu.badge && (
                    <Badge variant="default" className="mr-2">
                      <Text className="text-xs">{menu.badge}</Text>
                    </Badge>
                  )}
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 其他功能 */}
        <Card>
          <CardContent className="p-0">
            <View
              className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
              onClick={() => navigateTo('/pages/admin/index')}
            >
              <View className="flex flex-row items-center">
                <Shield size={20} color="#2563EB" className="mr-3" />
                <Text className="text-gray-800">管理后台</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
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

        {/* 退出登录 */}
        <View className="mt-6 mb-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleLogout}
          >
            <Text className="text-red-500">退出登录</Text>
          </Button>
        </View>
      </View>

      {/* 底部角色切换（固定） */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <View className="flex flex-row items-center justify-between mb-2">
          <Text className="text-gray-500 text-xs">切换身份</Text>
          <Text className="text-blue-500 text-xs">当前：{roleInfo.name}</Text>
        </View>
        <View className="flex flex-row gap-2">
          {[0, 1, 2].map((role) => {
            const RoleIcon = roleConfig[role].icon;
            const isActive = currentRole === role;
            return (
              <View
                key={role}
                className={`flex-1 px-3 py-2 rounded-lg flex flex-row items-center justify-center ${
                  isActive ? 'bg-blue-500' : 'bg-gray-100'
                }`}
                onClick={() => switchRole(role)}
              >
                <RoleIcon size={16} color={isActive ? '#ffffff' : '#6B7280'} />
                <Text className={`ml-1 text-sm ${isActive ? 'text-white font-semibold' : 'text-gray-600'}`}>
                  {roleConfig[role].name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;
