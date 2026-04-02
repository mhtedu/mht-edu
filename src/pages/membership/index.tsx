import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Star, Gift, Zap, Lock, Info } from 'lucide-react-taro';
import { useUserStore } from '@/stores/user';
import { Network } from '@/network';
import { isIOS, isWeapp } from '@/utils/device';
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
 * 切换角色需要重新购买会员
 */
const MembershipPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const { 
    currentView, 
    userInfo, 
    getRoleMembership, 
    setRoleMembership 
  } = useUserStore();

  // 当前视角对应的角色ID
  const currentRole = currentView === 'teacher' ? 1 : currentView === 'org' ? 2 : 0;

  // 获取当前角色的会员状态
  const membership = getRoleMembership(currentRole);
  const isMember = membership?.isMember && membership?.expireAt && new Date(membership.expireAt) > new Date();
  const memberExpire = membership?.expireAt || '';

  useEffect(() => {
    loadPlans(currentRole);
  }, [currentRole]);

  const loadPlans = async (role: number) => {
    try {
      const res = await Network.request({
        url: `/api/membership/plans/${role}`,
        method: 'GET'
      });
      
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPlans(res.data);
        setSelectedPlan(res.data[0]);
      } else {
        // 使用模拟数据
        const mockPlans: Plan[] = role === 0 ? [
          {
            id: 1,
            name: '家长月卡',
            role: 0,
            price: 99,
            original_price: 129,
            duration_days: 30,
            features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣'],
          },
          {
            id: 2,
            name: '家长季卡',
            role: 0,
            price: 269,
            original_price: 387,
            duration_days: 90,
            features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣', '优先客服'],
          },
          {
            id: 3,
            name: '家长年卡',
            role: 0,
            price: 899,
            original_price: 1548,
            duration_days: 365,
            features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣', '优先客服', '专属顾问'],
          },
        ] : role === 1 ? [
          {
            id: 4,
            name: '牛师月卡',
            role: 1,
            price: 99,
            original_price: 129,
            duration_days: 30,
            features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣'],
          },
          {
            id: 5,
            name: '牛师季卡',
            role: 1,
            price: 269,
            original_price: 387,
            duration_days: 90,
            features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣', '专属展示'],
          },
          {
            id: 6,
            name: '牛师年卡',
            role: 1,
            price: 899,
            original_price: 1548,
            duration_days: 365,
            features: ['无限抢单', '查看家长联系方式', '优先派单', '分销返佣', '专属展示', '推荐特权'],
          },
        ] : [
          {
            id: 7,
            name: '机构月卡',
            role: 2,
            price: 199,
            original_price: 259,
            duration_days: 30,
            features: ['无限发布课程', '管理更多牛师', '数据分析', '优先推广'],
          },
          {
            id: 8,
            name: '机构季卡',
            role: 2,
            price: 539,
            original_price: 777,
            duration_days: 90,
            features: ['无限发布课程', '管理更多牛师', '数据分析', '优先推广', '专属客服'],
          },
          {
            id: 9,
            name: '机构年卡',
            role: 2,
            price: 1799,
            original_price: 3108,
            duration_days: 365,
            features: ['无限发布课程', '管理更多牛师', '数据分析', '优先推广', '专属客服', '定制服务'],
          },
        ];

        setPlans(mockPlans);
        if (mockPlans.length > 0) {
          setSelectedPlan(mockPlans[0]);
        }
      }
    } catch (error) {
      console.error('加载套餐失败:', error);
    }
  };

  const handleBuy = async () => {
    if (!selectedPlan) return;
    
    if (!userInfo?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      Taro.navigateTo({ url: '/pages/login/index' });
      return;
    }

    // iOS 设备虚拟支付限制处理
    if (isWeapp() && isIOS()) {
      Taro.showModal({
        title: '温馨提示',
        content: '由于苹果公司政策限制，iOS设备暂不支持小程序内购买会员。请联系客服完成购买。',
        confirmText: '联系客服',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 引导用户联系客服
            Taro.setClipboardData({
              data: 'mht_edu',
              success: () => {
                Taro.showToast({
                  title: '已复制客服微信号：mht_edu',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
      return
    }

    // 非iOS设备，正常支付流程
    setLoading(true);
    try {
      // 调用后端创建订单
      const res = await Network.request({
        url: '/api/membership/buy',
        method: 'POST',
        data: {
          userId: userInfo.id,
          planId: selectedPlan.id,
          role: currentRole // 传递角色ID，确保会员绑定到对应角色
        }
      });

      console.log('购买会员响应:', res.data);

      if (res.data && (res.data.success || res.data.payment_id)) {
        // 模拟支付成功（实际应该跳转到支付页面）
        Taro.showModal({
          title: '确认购买',
          content: `确定购买 ${selectedPlan.name}（¥${selectedPlan.price}）吗？`,
          success: async (modalRes) => {
            if (modalRes.confirm) {
              // 模拟支付成功，更新会员状态
              const expireDate = new Date();
              expireDate.setDate(expireDate.getDate() + selectedPlan.duration_days);
              const expireStr = expireDate.toISOString();
              
              // 更新当前角色的会员状态
              setRoleMembership(currentRole, {
                role: currentRole,
                isMember: true,
                expireAt: expireStr,
                membershipType: 1
              });
              
              Taro.showToast({ title: '购买成功', icon: 'success' });
              
              // 刷新页面状态
              setTimeout(() => {
                loadPlans(currentRole);
              }, 1000);
            }
          },
        });
      } else {
        Taro.showToast({ title: res.data?.message || '创建订单失败', icon: 'none' });
      }
    } catch (error) {
      console.error('购买失败:', error);
      // 开发环境模拟成功
      Taro.showModal({
        title: '确认购买',
        content: `确定购买 ${selectedPlan.name}（¥${selectedPlan.price}）吗？`,
        success: (modalRes) => {
          if (modalRes.confirm) {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + selectedPlan.duration_days);
            const expireStr = expireDate.toISOString();
            
            setRoleMembership(currentRole, {
              role: currentRole,
              isMember: true,
              expireAt: expireStr,
              membershipType: 1
            });
            
            Taro.showToast({ title: '购买成功', icon: 'success' });
          }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const roleText = currentRole === 0 ? '家长' : currentRole === 1 ? '牛师' : '机构';
  
  const memberBenefits = [
    { icon: Zap, title: currentRole === 0 ? '无限发布' : currentRole === 1 ? '无限抢单' : '无限发布', desc: currentRole === 0 ? '不限次数发布需求' : currentRole === 1 ? '不限次数抢单' : '不限次数发布课程' },
    { icon: Star, title: currentRole === 0 ? '主动搜索' : currentRole === 1 ? '优先派单' : '数据分析', desc: currentRole === 0 ? '搜索筛选牛师' : currentRole === 1 ? '优先获得派单' : '详细数据分析' },
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

      {/* 会员独立提示 */}
      <View className="px-4 -mt-4">
        <Card className="mb-4 bg-blue-50 border border-blue-200">
          <CardContent className="p-3">
            <View className="flex items-start gap-2">
              <Info size={18} color="#2563EB" className="shrink-0 mt-1" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-800">会员权益说明</Text>
                <Text className="text-xs text-blue-600 mt-1">
                  每个角色的会员权益独立生效。切换到其他角色后，需要单独购买该角色的会员才能享受相应权益。
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 会员权益 */}
      <View className="px-4">
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
        {/* iOS 设备提示 */}
        {isWeapp() && isIOS() && (
          <View className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
            <Text className="text-orange-700 text-xs">
              iOS设备由于苹果政策限制，请点击下方按钮联系客服完成购买
            </Text>
          </View>
        )}
        
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-gray-500 text-xs">应付金额</Text>
            <Text className="text-yellow-500 text-2xl font-bold">¥{(selectedPlan && selectedPlan.price) || 0}</Text>
          </View>
          
          {/* iOS 设备显示客服按钮 */}
          {isWeapp() && isIOS() ? (
            <View className="flex-1 ml-4">
              {/* 引导用户复制客服微信号 */}
              <Button
                className="bg-gradient-to-r from-yellow-400 to-orange-500"
                size="lg"
                onClick={() => {
                  // 引导用户联系客服
                  Taro.setClipboardData({
                    data: 'mht_edu',
                    success: () => {
                      Taro.showToast({
                        title: '已复制客服微信号：mht_edu',
                        icon: 'success',
                        duration: 2000
                      })
                    }
                  })
                }}
              >
                <Text className="text-white font-semibold text-center">联系客服购买</Text>
              </Button>
            </View>
          ) : (
            <Button 
              className="flex-1 ml-4 bg-gradient-to-r from-yellow-400 to-orange-500"
              size="lg"
              disabled={loading}
              onClick={handleBuy}
            >
              <Text className="text-white font-semibold">
                {loading ? '处理中...' : isMember ? '立即续费' : '立即开通'}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default MembershipPage;
