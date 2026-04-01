import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Star, Gift, Zap, Lock } from 'lucide-react-taro';
import './index.css';

interface Plan {
  id: number;
  name: string;
  role: number;
  price: number;
  original_price: number;
  duration_days: number;
  features: string[];
}

/**
 * 会员中心页面 - 每端会员独立
 */
const MembershipPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentRole, setCurrentRole] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberExpire, setMemberExpire] = useState('');

  useEffect(() => {
    // 获取当前角色
    const savedRole = Taro.getStorageSync('userRole');
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
    setCurrentRole(role);
    
    // 检查当前角色的会员状态
    const memberKey = `member_expire_role_${role}`;
    const expire = Taro.getStorageSync(memberKey);
    if (expire && new Date(expire) > new Date()) {
      setIsMember(true);
      setMemberExpire(expire);
    }
    
    loadPlans(role);
  }, []);

  const loadPlans = async (role: number) => {
    // 模拟数据 - 根据角色显示不同套餐
    const mockPlans: Plan[] = role === 0 ? [
      {
        id: 1,
        name: '家长月卡',
        role: 0,
        price: 99,
        original_price: 129,
        duration_days: 30,
        features: ['无限发布需求', '查看教师联系方式', '主动搜索教师', '分销返佣'],
      },
      {
        id: 2,
        name: '家长季卡',
        role: 0,
        price: 269,
        original_price: 387,
        duration_days: 90,
        features: ['无限发布需求', '查看教师联系方式', '主动搜索教师', '分销返佣', '优先客服'],
      },
      {
        id: 3,
        name: '家长年卡',
        role: 0,
        price: 899,
        original_price: 1548,
        duration_days: 365,
        features: ['无限发布需求', '查看教师联系方式', '主动搜索教师', '分销返佣', '优先客服', '专属顾问'],
      },
    ] : [
      {
        id: 4,
        name: '教师月卡',
        role: 1,
        price: 99,
        original_price: 129,
        duration_days: 30,
        features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣'],
      },
      {
        id: 5,
        name: '教师季卡',
        role: 1,
        price: 269,
        original_price: 387,
        duration_days: 90,
        features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣', '专属展示'],
      },
      {
        id: 6,
        name: '教师年卡',
        role: 1,
        price: 899,
        original_price: 1548,
        duration_days: 365,
        features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣', '专属展示', '推荐特权'],
      },
    ];

    setPlans(mockPlans);
    if (mockPlans.length > 0) {
      setSelectedPlan(mockPlans[0]);
    }
  };

  const handleBuy = async () => {
    if (!selectedPlan) return;

    Taro.showModal({
      title: '确认购买',
      content: `确定购买 ${selectedPlan.name}（¥${selectedPlan.price}）吗？`,
      success: (res) => {
        if (res.confirm) {
          // 模拟支付成功
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + selectedPlan.duration_days);
          const expireStr = expireDate.toISOString();
          
          // 保存到对应的角色会员状态
          const memberKey = `member_expire_role_${currentRole}`;
          Taro.setStorageSync(memberKey, expireStr);
          
          setIsMember(true);
          setMemberExpire(expireStr);
          
          Taro.showToast({ title: '购买成功', icon: 'success' });
        }
      },
    });
  };

  const roleText = currentRole === 0 ? '家长' : '教师';
  const memberBenefits = [
    { icon: Zap, title: currentRole === 0 ? '无限发布' : '无限抢单', desc: currentRole === 0 ? '不限次数发布需求' : '不限次数抢单' },
    { icon: Star, title: currentRole === 0 ? '主动搜索' : '优先派单', desc: currentRole === 0 ? '搜索筛选教师' : '优先获得派单' },
    { icon: Lock, title: '联系方式', desc: '解锁查看联系方式' },
    { icon: Gift, title: '分销返佣', desc: '邀请好友赚佣金' },
  ];

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-yellow-400 to-orange-500 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-center mb-4">
          <Crown size={32} color="white" />
          <Text className="text-white text-2xl font-bold ml-2">{roleText}会员</Text>
        </View>
        
        {isMember ? (
          <View className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
            <Text className="text-white text-sm">会员有效期至</Text>
            <Text className="text-white text-lg font-bold mt-1">
              {memberExpire.split('T')[0]}
            </Text>
          </View>
        ) : (
          <Text className="text-white text-center text-sm">
            开通{roleText}会员，享受专属权益
          </Text>
        )}
      </View>

      {/* 会员权益 */}
      <View className="px-4 -mt-4">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>会员权益</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-2 gap-4">
              {memberBenefits.map((benefit) => (
                <View key={benefit.title} className="flex flex-row items-start">
                  <benefit.icon size={20} color="#F59E0B" className="mr-2 mt-1" />
                  <View>
                    <Text className="font-medium">{benefit.title}</Text>
                    <Text className="text-gray-500 text-xs mt-1">{benefit.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 套餐选择 */}
      <View className="px-4">
        <Text className="text-lg font-semibold mb-3">选择套餐</Text>
        <View className="flex flex-col gap-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`cursor-pointer transition-all ${
                (selectedPlan && selectedPlan.id) === plan.id 
                  ? 'ring-2 ring-yellow-500 bg-yellow-50' 
                  : 'bg-white'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardContent className="p-4">
                <View className="flex flex-row items-center justify-between">
                  <View>
                    <View className="flex flex-row items-center">
                      <Text className="font-semibold text-lg">{plan.name}</Text>
                      {plan.original_price > plan.price && (
                        <Badge variant="destructive" className="ml-2">
                          <Text className="text-xs">省¥{plan.original_price - plan.price}</Text>
                        </Badge>
                      )}
                    </View>
                    <View className="flex flex-row items-baseline mt-1">
                      <Text className="text-yellow-500 text-2xl font-bold">¥{plan.price}</Text>
                      <Text className="text-gray-400 text-sm line-through ml-2">¥{plan.original_price}</Text>
                    </View>
                  </View>
                  {(selectedPlan && selectedPlan.id) === plan.id && (
                    <View className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Check size={16} color="white" />
                    </View>
                  )}
                </View>
                
                <View className="flex flex-row flex-wrap gap-2 mt-3">
                  {plan.features.map((feature, index) => (
                    <View key={index} className="flex flex-row items-center">
                      <Check size={12} color="#10B981" className="mr-1" />
                      <Text className="text-gray-600 text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      </View>

      {/* 底部购买按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-gray-500 text-xs">应付金额</Text>
            <Text className="text-yellow-500 text-2xl font-bold">¥{(selectedPlan && selectedPlan.price) || 0}</Text>
          </View>
          <Button 
            className="flex-1 ml-4 bg-gradient-to-r from-yellow-400 to-orange-500"
            size="lg"
            onClick={handleBuy}
          >
            <Text className="text-white font-semibold">
              {isMember ? '立即续费' : '立即开通'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
};

export default MembershipPage;
