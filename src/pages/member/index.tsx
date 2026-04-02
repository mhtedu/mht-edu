import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { Crown, Check, Star, Phone, Eye, Zap } from 'lucide-react-taro'

interface MembershipStatus {
  is_member: boolean
  expire_at: string
  remaining_days: number
  plan_name: string
}

interface MembershipPlan {
  id: number
  name: string
  price: number
  original_price: number
  days: number
  features: string[]
  is_popular: boolean
}

/**
 * 会员中心页面
 */
const MemberPage = () => {
  const [currentRole, setCurrentRole] = useState(0) // 0: 家长, 1: 牛师
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null)

  // 家长会员套餐
  const parentPlans: MembershipPlan[] = [
    {
      id: 1,
      name: '月卡',
      price: 29.9,
      original_price: 49.9,
      days: 30,
      features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣'],
      is_popular: false
    },
    {
      id: 2,
      name: '季卡',
      price: 79.9,
      original_price: 149.9,
      days: 90,
      features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣', '优先客服'],
      is_popular: true
    },
    {
      id: 3,
      name: '年卡',
      price: 199.9,
      original_price: 599.9,
      days: 365,
      features: ['无限发布需求', '查看牛师联系方式', '主动搜索牛师', '分销返佣', '优先客服', '专属顾问'],
      is_popular: false
    }
  ]

  // 牛师会员套餐
  const teacherPlans: MembershipPlan[] = [
    {
      id: 4,
      name: '月卡',
      price: 39.9,
      original_price: 79,
      days: 30,
      features: ['查看联系方式', '无限抢单', '优先派单', '更多曝光'],
      is_popular: false
    },
    {
      id: 5,
      name: '季卡',
      price: 99.9,
      original_price: 239,
      days: 90,
      features: ['查看联系方式', '无限抢单', '优先派单', '更多曝光', '专属客服'],
      is_popular: true
    },
    {
      id: 6,
      name: '年卡',
      price: 299.9,
      original_price: 949,
      days: 365,
      features: ['查看联系方式', '无限抢单', '优先派单', '更多曝光', '专属客服', '创建牛师班'],
      is_popular: false
    }
  ]

  const plans = currentRole === 0 ? parentPlans : teacherPlans

  // 会员权益
  const memberBenefits = currentRole === 0 ? [
    { icon: <Star size={20} color="#F59E0B" />, title: '主动搜索', desc: '搜索筛选牛师' },
    { icon: <Eye size={20} color="#2563EB" />, title: '查看联系方式', desc: '直接联系牛师' },
    { icon: <Phone size={20} color="#10B981" />, title: '优先客服', desc: '专属客服支持' },
    { icon: <Zap size={20} color="#8B5CF6" />, title: '分销返佣', desc: '推荐奖励' }
  ] : [
    { icon: <Zap size={20} color="#F59E0B" />, title: '优先派单', desc: '优先获得派单' },
    { icon: <Eye size={20} color="#2563EB" />, title: '查看联系方式', desc: '直接联系家长' },
    { icon: <Phone size={20} color="#10B981" />, title: '专属客服', desc: '专业客服支持' },
    { icon: <Star size={20} color="#8B5CF6" />, title: '更多曝光', desc: '提升展示权重' }
  ]

  useDidShow(() => {
    const savedRole = Taro.getStorageSync('userRole')
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0)
    setCurrentRole(role)
    loadMembershipStatus()
  })

  const loadMembershipStatus = async () => {
    try {
      const res = await Network.request({
        url: '/api/user/membership'
      })
      if (res.data) {
        setMembershipStatus(res.data)
      }
    } catch (error) {
      console.log('加载会员状态失败:', error)
    }
  }

  const handlePurchase = (plan: MembershipPlan) => {
    Taro.showModal({
      title: '确认开通',
      content: `${plan.name} - ¥${plan.price}\n有效期：${plan.days}天`,
      confirmText: '立即支付',
      success: (res) => {
        if (res.confirm) {
          // 跳转支付页面
          Taro.navigateTo({
            url: `/pages/pay/index?type=membership&plan_id=${plan.id}&amount=${plan.price}`
          })
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="pb-20">
        {/* 角色切换 */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex flex-row gap-2">
            <View
              className={`flex-1 py-2 rounded-full text-center ${currentRole === 0 ? 'bg-blue-600' : 'bg-gray-100'}`}
              onClick={() => setCurrentRole(0)}
            >
              <Text className={currentRole === 0 ? 'text-white' : 'text-gray-600'}>家长端</Text>
            </View>
            <View
              className={`flex-1 py-2 rounded-full text-center ${currentRole === 1 ? 'bg-blue-600' : 'bg-gray-100'}`}
              onClick={() => setCurrentRole(1)}
            >
              <Text className={currentRole === 1 ? 'text-white' : 'text-gray-600'}>牛师端</Text>
            </View>
          </View>
        </View>

        {/* 会员状态 */}
        {membershipStatus && membershipStatus.is_member && (
          <View className="bg-gradient-to-r from-amber-400 to-orange-400 mx-4 mt-4 rounded-xl p-4">
            <View className="flex flex-row items-center gap-3">
              <View className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Crown size={24} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">会员有效</Text>
                <Text className="text-white opacity-90 text-sm">
                  剩余 {membershipStatus.remaining_days} 天
                </Text>
              </View>
              <Badge className="bg-white text-amber-600">
                <Text className="text-xs">{membershipStatus.plan_name}</Text>
              </Badge>
            </View>
          </View>
        )}

        {/* 会员头部 */}
        <View className="bg-gradient-to-br from-amber-100 to-amber-200 mx-4 mt-4 rounded-xl p-6 flex flex-col items-center">
          <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3">
            <Crown size={32} color="#F59E0B" />
          </View>
          <Text className="text-lg font-semibold text-amber-900 mb-1">
            {currentRole === 0 ? '家长会员' : '牛师会员'}
          </Text>
          <Text className="text-sm text-amber-700">
            开通会员，享受专属特权
          </Text>
        </View>

        {/* 会员权益 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">会员权益</Text>
            <View className="grid grid-cols-2 gap-4">
              {memberBenefits.map((benefit, idx) => (
                <View key={idx} className="flex flex-row items-start gap-3">
                  <View className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {benefit.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{benefit.title}</Text>
                    <Text className="text-xs text-gray-500">{benefit.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 套餐列表 */}
        <View className="px-4 mt-4">
          <Text className="text-base font-semibold mb-3">选择套餐</Text>
          <View className="flex flex-row gap-3">
            {plans.map((plan) => (
              <View
                key={plan.id}
                className={`flex-1 bg-white rounded-xl p-4 flex flex-col items-center relative ${plan.is_popular ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
              >
                {plan.is_popular && (
                  <View className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 px-3 py-1 rounded-full">
                    <Text className="text-xs text-white font-medium">推荐</Text>
                  </View>
                )}
                
                <Text className="text-base font-semibold text-gray-900 mb-2">{plan.name}</Text>
                
                <View className="flex flex-row items-baseline gap-1 mb-3">
                  <Text className="text-xl font-bold text-orange-500">¥{plan.price}</Text>
                  <Text className="text-xs text-gray-400 line-through">¥{plan.original_price}</Text>
                </View>
                
                <View className="w-full mb-3">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <View key={idx} className="flex flex-row items-center gap-1 py-1">
                      <Check size={12} color="#10B981" />
                      <Text className="text-xs text-gray-600">{feature}</Text>
                    </View>
                  ))}
                  {plan.features.length > 3 && (
                    <Text className="text-xs text-gray-400 pl-4">+{plan.features.length - 3}项权益</Text>
                  )}
                </View>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handlePurchase(plan)}
                >
                  <Text className="text-white text-sm">立即开通</Text>
                </Button>
              </View>
            ))}
          </View>
        </View>

        {/* 常见问题 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-3">常见问题</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-900 mb-1">Q: 会员权益如何生效？</Text>
              <Text className="text-xs text-gray-600">支付成功后，会员权益立即生效，可在个人中心查看会员状态。</Text>
            </View>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-gray-900 mb-1">Q: 会员可以退款吗？</Text>
              <Text className="text-xs text-gray-600">会员服务为虚拟商品，开通后不支持退款，请谨慎购买。</Text>
            </View>
            
            <View>
              <Text className="text-sm font-medium text-gray-900 mb-1">Q: 如何联系客服？</Text>
              <Text className="text-xs text-gray-600">会员用户可享受专属客服支持，在个人中心找到客服入口。</Text>
            </View>
          </CardContent>
        </Card>

        {/* 底部说明 */}
        <View className="mx-4 mt-4 mb-4">
          <Text className="text-xs text-gray-400 text-center">
            开通会员即表示同意《会员服务协议》
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default MemberPage
