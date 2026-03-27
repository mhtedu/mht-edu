import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, Star, Gift, Zap, Lock } from 'lucide-react-taro';
import './index.css';

interface Plan {
  id: number;
  name: string;
  role: number;
  price: number;
  original_price: number;
  duration_days: number;
  commission_rate: number;
  features: string[];
}

/**
 * 会员中心页面
 */
const MembershipPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentRole, setCurrentRole] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans();
  }, [currentRole]);

  const loadPlans = async () => {
    try {
      const res = await Network.request({
        url: `/api/membership/plans/${currentRole}`,
        method: 'GET',
      });
      
      if (res.data && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (error) {
      // 使用模拟数据
      setPlans([
        {
          id: 1,
          name: '家长年度会员',
          role: 0,
          price: 299,
          original_price: 399,
          duration_days: 365,
          commission_rate: 20,
          features: ['无限发布需求', '主动搜索教师', '解锁联系方式', '分销返佣权益', '专属客服'],
        },
      ]);
    } finally {
    }
  };

  const handleBuy = async () => {
    if (!selectedPlan) {
      Taro.showToast({ title: '请选择套餐', icon: 'none' });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/membership/buy',
        method: 'POST',
        data: {
          user_id: 1, // TODO: 从登录状态获取
          plan_id: selectedPlan.id,
        },
      });

      if (res.data) {
        Taro.showToast({ title: '购买成功', icon: 'success' });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (error) {
      Taro.showToast({ title: '购买失败', icon: 'none' });
    }
  };

  const roleTabs = [
    { key: 0, label: '家长', price: '¥299/年' },
    { key: 1, label: '教师', price: '¥199/年' },
    { key: 2, label: '机构', price: '¥999/年' },
  ];

  const memberBenefits = [
    { icon: Zap, title: '无限发布', desc: '不限次数发布需求' },
    { icon: Star, title: '主动搜索', desc: '搜索并筛选教师' },
    { icon: Lock, title: '联系方式', desc: '解锁查看联系方式' },
    { icon: Gift, title: '分销返佣', desc: '邀请好友赚佣金' },
  ];

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-yellow-400 to-orange-500 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-center mb-4">
          <Crown size={32} color="white" />
          <Text className="text-white text-2xl font-bold ml-2">开通会员</Text>
        </View>
        <Text className="text-white text-opacity-90 text-center">解锁全部功能，享受专属权益</Text>
      </View>

      {/* 角色切换 */}
      <View className="px-4 -mt-4">
        <Card className="mb-4">
          <CardContent className="p-0">
            <View className="flex flex-row">
              {roleTabs.map((tab) => (
                <View
                  key={tab.key}
                  className={`flex-1 py-4 ${currentRole === tab.key ? 'bg-blue-50' : ''}`}
                  onClick={() => setCurrentRole(tab.key)}
                >
                  <Text className={`text-center ${currentRole === tab.key ? 'text-blue-500 font-semibold' : 'text-gray-600'}`}>
                    {tab.label}
                  </Text>
                  <Text className="text-center text-xs text-gray-400 mt-1">{tab.price}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 会员权益 */}
      <View className="px-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>会员权益</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-2 gap-4">
              {memberBenefits.map((benefit, index) => (
                <View key={index} className="flex flex-row items-start">
                  <benefit.icon size={20} color="#2563EB" className="mr-2 flex-shrink-0" />
                  <View>
                    <Text className="font-semibold">{benefit.title}</Text>
                    <Text className="text-gray-500 text-xs">{benefit.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 套餐选择 */}
      <View className="px-4">
        <Text className="text-gray-800 font-semibold mb-3">选择套餐</Text>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`mb-3 ${selectedPlan?.id === plan.id ? 'border-2 border-blue-500' : ''}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <CardContent className="p-4">
              <View className="flex flex-row justify-between items-start">
                <View>
                  <Text className="font-semibold">{plan.name}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{plan.duration_days}天有效期</Text>
                </View>
                <View className="flex flex-col items-end">
                  <Text className="text-orange-500 text-xl font-bold">¥{plan.price}</Text>
                  <Text className="text-gray-400 text-xs line-through">¥{plan.original_price}</Text>
                </View>
              </View>
              <View className="flex flex-row flex-wrap gap-2 mt-3">
                {plan.features.map((feature, idx) => (
                  <View key={idx} className="flex flex-row items-center">
                    <Check size={12} color="#22C55E" className="mr-1" />
                    <Text className="text-gray-600 text-xs">{feature}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* 底部购买按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <Button className="w-full bg-orange-500" onClick={handleBuy}>
          <Text className="text-white font-semibold">
            {selectedPlan ? `立即开通 ¥${selectedPlan.price}` : '请选择套餐'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default MembershipPage;
