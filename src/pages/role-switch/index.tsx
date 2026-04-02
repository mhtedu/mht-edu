import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore, CurrentView } from '@/stores/user';
import { Network } from '@/network';
import { 
  GraduationCap, BookOpen, Building2, Crown,
  ChevronRight, Check, Sparkles, Gift, Users, TrendingUp, Info, Lock
} from 'lucide-react-taro';
import './index.css';

interface RoleConfig {
  id: number;
  view: CurrentView;
  name: string;
  icon: typeof GraduationCap;
  color: string;
  bgClass: string;
  description: string;
  features: string[];
  memberBenefit: string;
}

const roles: RoleConfig[] = [
  {
    id: 0,
    view: 'parent',
    name: '家长端',
    icon: GraduationCap,
    color: '#2563EB',
    bgClass: 'from-blue-500 to-blue-600',
    description: '发布需求，找到满意的老师',
    features: ['发布家教需求', '浏览牛师主页', '收藏心仪牛师', '在线沟通预约'],
    memberBenefit: '查看联系方式、无限沟通',
  },
  {
    id: 1,
    view: 'teacher',
    name: '牛师端',
    icon: BookOpen,
    color: '#22C55E',
    bgClass: 'from-green-500 to-green-600',
    description: '抢单接课，展示教学实力',
    features: ['浏览需求抢单', '展示牛师主页', '管理学员课程', '转发需求赚佣金'],
    memberBenefit: '无限抢单、优先展示',
  },
  {
    id: 2,
    view: 'org',
    name: '机构端',
    icon: Building2,
    color: '#9333EA',
    bgClass: 'from-purple-500 to-purple-600',
    description: '管理团队，扩展业务版图',
    features: ['管理机构牛师', '发布课程活动', '代录家长需求', '多渠道推广招生'],
    memberBenefit: '更多牛师名额、数据分析',
  },
];

/**
 * 角色切换中心页面
 * 会员权益按角色独立，切换角色需重新购买会员
 */
const RoleSwitchPage = () => {
  const { currentView, setCurrentView, userInfo, getRoleMembership, setRoleMembership } = useUserStore();

  // 当前选中的角色ID
  const currentRoleId = roles.find(r => r.view === currentView)?.id ?? 0;

  useEffect(() => {
    // 加载各角色的会员状态
    loadMembershipStatus();
  }, []);

  const loadMembershipStatus = async () => {
    if (!userInfo?.id) return;
    
    try {
      const res = await Network.request({
        url: '/api/user/membership/all',
        method: 'GET'
      });
      
      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((m: any) => {
          if (m.role !== undefined) {
            setRoleMembership(m.role, {
              role: m.role,
              isMember: m.is_member,
              expireAt: m.expire_at,
              membershipType: m.membership_type || 0
            });
          }
        });
      }
    } catch (error) {
      console.error('加载会员状态失败:', error);
    }
  };

  const getMemberStatus = (roleId: number) => {
    const membership = getRoleMembership(roleId);
    if (!membership || !membership.expireAt) return { isMember: false, expireText: '' };
    const isMember = new Date(membership.expireAt) > new Date();
    return {
      isMember,
      expireText: isMember ? membership.expireAt.split('T')[0] : ''
    };
  };

  const handleSelectRole = (role: RoleConfig) => {
    if (role.view === currentView) {
      // 已经是当前角色，返回首页
      Taro.switchTab({ url: '/pages/index/index' });
      return;
    }

    const currentMemberStatus = getMemberStatus(currentRoleId);
    const targetMemberStatus = getMemberStatus(role.id);

    // 构建提示内容
    let content = `确定切换到${role.name}吗？\n\n`;
    content += '⚠️ 重要提示：\n';
    content += '• 每个角色的会员权益独立生效\n';
    
    if (currentMemberStatus.isMember) {
      content += `• 当前${roles.find(r => r.id === currentRoleId)?.name}会员有效期内不会失效\n`;
    }
    
    if (!targetMemberStatus.isMember) {
      content += `• 切换后需单独购买${role.name}会员才能享受权益`;
    } else {
      content += `• ${role.name}会员有效期至${targetMemberStatus.expireText}`;
    }

    Taro.showModal({
      title: '切换身份',
      content,
      confirmText: '立即切换',
      success: (res) => {
        if (res.confirm) {
          // 更新 store 中的当前视角
          setCurrentView(role.view);
          
          Taro.switchTab({ url: '/pages/index/index' });
        }
      },
    });
  };

  const handleApplyAgent = () => {
    Taro.navigateTo({ url: '/pages/agent-apply/index' });
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-blue-500 to-purple-600 px-4 pt-8 pb-12">
        <View className="flex items-center justify-center mb-2">
          <Sparkles size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-2">角色切换中心</Text>
        </View>
        <Text className="text-white text-opacity-80 text-center text-sm">
          选择您的身份，体验专属功能
        </Text>
      </View>

      {/* 会员独立提示 */}
      <View className="px-4 -mt-6">
        <Card className="bg-amber-50 border border-amber-200">
          <CardContent className="p-3">
            <View className="flex items-start gap-2">
              <Info size={18} color="#F59E0B" className="shrink-0 mt-1" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-amber-800">会员权益说明</Text>
                <Text className="text-xs text-amber-600 mt-1">
                  每个角色的会员权益独立计算，切换角色后需单独购买对应角色的会员才能享受权益。
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 角色卡片 */}
      <View className="px-4 mt-4">
        {roles.map((role) => {
          const RoleIcon = role.icon;
          const isActive = currentView === role.view;
          const memberStatus = getMemberStatus(role.id);
          
          return (
            <Card 
              key={role.id} 
              className={`mb-4 ${isActive ? 'border-2 border-blue-500' : ''}`}
              onClick={() => handleSelectRole(role)}
            >
              <CardContent className="p-4">
                <View className="flex items-start justify-between">
                  <View className="flex items-center">
                    <View className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.bgClass} flex items-center justify-center`}>
                      <RoleIcon size={28} color="white" />
                    </View>
                    <View className="ml-3 flex-1">
                      <View className="flex items-center">
                        <Text className="text-lg font-bold">{role.name}</Text>
                        {isActive && (
                          <Badge className="ml-2 bg-blue-500">
                            <Check size={12} color="white" className="mr-1" />
                            <Text className="text-white text-xs">当前</Text>
                          </Badge>
                        )}
                      </View>
                      <Text className="text-gray-500 text-sm mt-1">{role.description}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={isActive ? '#2563EB' : '#9CA3AF'} />
                </View>

                {/* 功能列表 */}
                <View className="mt-4 flex flex-wrap gap-2">
                  {role.features.map((feature, idx) => (
                    <View key={idx} className="bg-gray-50 px-3 py-1 rounded-full">
                      <Text className="text-gray-600 text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* 会员状态 */}
                <View className="mt-4 bg-yellow-50 rounded-lg p-3 flex items-center justify-between">
                  <View className="flex items-center">
                    {memberStatus.isMember ? (
                      <>
                        <Crown size={16} color="#F59E0B" />
                        <Text className="text-yellow-700 text-sm ml-2">
                          会员有效期至 {memberStatus.expireText}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-2">
                          未开通会员 · {role.memberBenefit}
                        </Text>
                      </>
                    )}
                  </View>
                  {!memberStatus.isMember && (
                    <Button 
                      size="sm" 
                      className="bg-yellow-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 先切换角色再跳转到会员页
                        setCurrentView(role.view);
                        Taro.navigateTo({ url: '/pages/membership/index' });
                      }}
                    >
                      <Text className="text-white text-xs">开通</Text>
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>
          );
        })}

        {/* 代理入驻 */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                <View className="w-14 h-14 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                  <TrendingUp size={28} color="white" />
                </View>
                <View className="ml-3">
                  <Text className="text-white text-lg font-bold">城市代理</Text>
                  <Text className="text-white text-opacity-80 text-sm">本地化推广，赚取区域分润</Text>
                </View>
              </View>
              <Button 
                className="bg-white"
                onClick={handleApplyAgent}
              >
                <Text className="text-orange-600 font-semibold">申请入驻</Text>
              </Button>
            </View>

            <View className="mt-4 flex justify-around">
              <View className="text-center">
                <Users size={20} color="white" className="mx-auto" />
                <Text className="text-white text-opacity-80 text-xs mt-1">区域独家</Text>
              </View>
              <View className="text-center">
                <Gift size={20} color="white" className="mx-auto" />
                <Text className="text-white text-opacity-80 text-xs mt-1">5%流水分成</Text>
              </View>
              <View className="text-center">
                <TrendingUp size={20} color="white" className="mx-auto" />
                <Text className="text-white text-opacity-80 text-xs mt-1">数据分析</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 分销说明 */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <View className="flex items-center mb-3">
              <Gift size={20} color="#9333EA" />
              <Text className="font-semibold ml-2">全员分销，一起赚钱</Text>
            </View>
            <View className="space-y-2">
              <View className="flex items-center justify-between text-sm">
                <Text className="text-gray-600">一级邀请佣金</Text>
                <Text className="text-orange-500 font-semibold">20%</Text>
              </View>
              <View className="flex items-center justify-between text-sm">
                <Text className="text-gray-600">二级邀请佣金</Text>
                <Text className="text-orange-500 font-semibold">10%</Text>
              </View>
              <View className="flex items-center justify-between text-sm">
                <Text className="text-gray-600">转发需求成交佣金</Text>
                <Text className="text-orange-500 font-semibold">5%</Text>
              </View>
            </View>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => Taro.navigateTo({ url: '/pages/distribution/index' })}
            >
              <Text className="text-purple-600">查看我的推广数据</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default RoleSwitchPage;
