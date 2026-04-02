import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Crown, Check, Users, Gift, 
  Star, Sparkles, Building2, TrendingUp
} from 'lucide-react-taro'

interface MembershipPlan {
  id: number
  name: string
  type: number
  price: number
  duration_days: number
  teacher_quota: number
  features: string[]
  commission_discount: number
}

interface MembershipInfo {
  is_member: boolean
  membership_type: number
  plan_name: string | null
  expire_at: string | null
  teacher_quota: number
  used_quota: number
  remaining_quota: number
  features: string[]
}

/**
 * 机构会员中心页面
 */
export default function OrgMembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [showPayDialog, setShowPayDialog] = useState(false)

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    setLoading(true)
    // 模拟数据
    const mockPlans: MembershipPlan[] = [
      {
        id: 1,
        name: '基础版',
        type: 1,
        price: 1999,
        duration_days: 365,
        teacher_quota: 5,
        features: ['教师管理', '订单派单', '基础数据统计', '会员共享'],
        commission_discount: 0
      },
      {
        id: 2,
        name: '专业版',
        type: 2,
        price: 4999,
        duration_days: 365,
        teacher_quota: 20,
        features: ['教师管理', '订单派单', '完整数据分析', '会员共享', '营销工具', '优惠券', '活动管理'],
        commission_discount: 5
      },
      {
        id: 3,
        name: '旗舰版',
        type: 3,
        price: 9999,
        duration_days: 365,
        teacher_quota: 100,
        features: ['教师管理', '订单派单', '完整数据分析', '会员共享', '营销工具', '优惠券', '活动管理', '专属客服', '品牌展示', '优先推荐'],
        commission_discount: 10
      }
    ]
    setPlans(mockPlans)

    setMembershipInfo({
      is_member: false,
      membership_type: 0,
      plan_name: null,
      expire_at: null,
      teacher_quota: 0,
      used_quota: 0,
      remaining_quota: 0,
      features: []
    })
    setLoading(false)
  }

  const handleBuyPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setShowPayDialog(true)
  }

  const handleConfirmPay = () => {
    if (!selectedPlan) return
    
    Taro.showModal({
      title: '确认购买',
      content: `即将支付 ¥${selectedPlan.price} 购买${selectedPlan.name}`,
      success: (res) => {
        if (res.confirm) {
          // 调用支付
          Taro.showToast({ title: '支付成功', icon: 'success' })
          setShowPayDialog(false)
          loadData()
        }
      }
    })
  }

  const getPlanIcon = (type: number) => {
    switch (type) {
      case 1: return '🥉'
      case 2: return '🥈'
      case 3: return '🥇'
      default: return '⭐'
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 会员状态卡片 */}
      <View className="bg-gradient-to-br from-purple-600 to-purple-700 px-4 pt-6 pb-8">
        <View className="flex items-center gap-2 mb-4">
          <Building2 size={24} color="white" />
          <Text className="text-white text-xl font-bold">机构会员中心</Text>
        </View>

        {membershipInfo?.is_member ? (
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-4">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Crown size={24} color="#FFD700" />
                  <View>
                    <Text className="text-white font-bold">{membershipInfo.plan_name}</Text>
                    <Text className="text-white text-opacity-80 text-xs">
                      有效期至 {membershipInfo.expire_at?.split('T')[0]}
                    </Text>
                  </View>
                </View>
                <Badge className="bg-green-500">
                  <Text className="text-white text-xs">已开通</Text>
                </Badge>
              </View>
              
              <View className="mt-4 flex justify-around">
                <View className="text-center">
                  <Text className="text-white text-xl font-bold">{membershipInfo.teacher_quota}</Text>
                  <Text className="text-white text-opacity-80 text-xs">教师名额</Text>
                </View>
                <View className="text-center">
                  <Text className="text-white text-xl font-bold">{membershipInfo.used_quota}</Text>
                  <Text className="text-white text-opacity-80 text-xs">已使用</Text>
                </View>
                <View className="text-center">
                  <Text className="text-white text-xl font-bold">{membershipInfo.remaining_quota}</Text>
                  <Text className="text-white text-opacity-80 text-xs">剩余名额</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Text className="text-white text-opacity-80">暂未开通会员</Text>
              <Text className="text-white text-sm mt-1">开通会员享受更多权益</Text>
            </CardContent>
          </Card>
        )}
      </View>

      {/* 核心价值说明 */}
      <View className="px-4 -mt-4">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={20} color="#7C3AED" />
              <Text>会员核心权益</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-2 gap-4">
              <View className="flex items-center gap-2">
                <View className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text className="font-semibold">会员共享</Text>
                  <Text className="text-xs text-gray-500">教师自动获得会员</Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="font-semibold">数据分析</Text>
                  <Text className="text-xs text-gray-500">全面经营数据</Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <View className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Gift size={20} color="#10B981" />
                </View>
                <View>
                  <Text className="font-semibold">营销工具</Text>
                  <Text className="text-xs text-gray-500">优惠券/活动</Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <View className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Star size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text className="font-semibold">品牌展示</Text>
                  <Text className="text-xs text-gray-500">优先推荐曝光</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 套餐列表 */}
      <View className="px-4">
        <Text className="text-lg font-bold mb-3">选择套餐</Text>
        
        {plans.map((plan) => (
          <Card key={plan.id} className={`mb-4 ${plan.type === 2 ? 'border-2 border-purple-500' : ''}`}>
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <Text className="text-2xl">{getPlanIcon(plan.type)}</Text>
                  <View>
                    <Text className="font-bold text-lg">{plan.name}</Text>
                    <Text className="text-xs text-gray-500">
                      教师名额: {plan.teacher_quota}人
                    </Text>
                  </View>
                </View>
                {plan.type === 2 && (
                  <Badge className="bg-purple-500">
                    <Text className="text-white text-xs">推荐</Text>
                  </Badge>
                )}
              </View>

              <View className="flex items-baseline gap-1 mb-3">
                <Text className="text-3xl font-bold text-purple-600">¥{plan.price}</Text>
                <Text className="text-gray-500 text-sm">/年</Text>
                {plan.commission_discount > 0 && (
                  <Badge className="bg-red-100 text-red-600 ml-2">
                    <Text className="text-xs">平台抽成减免{plan.commission_discount}%</Text>
                  </Badge>
                )}
              </View>

              {/* 功能列表 */}
              <View className="mb-4">
                {plan.features.map((feature, idx) => (
                  <View key={idx} className="flex items-center gap-2 py-1">
                    <Check size={16} color="#10B981" />
                    <Text className="text-sm text-gray-600">{feature}</Text>
                  </View>
                ))}
              </View>

              <Button 
                className="w-full" 
                variant={plan.type === 2 ? 'default' : 'outline'}
                onClick={() => handleBuyPlan(plan)}
              >
                {membershipInfo?.is_member && membershipInfo.membership_type >= plan.type ? (
                  <Text className={plan.type === 2 ? 'text-white' : 'text-purple-600'}>续费</Text>
                ) : (
                  <Text className={plan.type === 2 ? 'text-white' : 'text-purple-600'}>立即开通</Text>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* 会员共享说明 */}
      <View className="px-4 mt-4">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <View className="flex items-center gap-2 mb-2">
              <Users size={20} color="#7C3AED" />
              <Text className="font-bold">会员共享机制</Text>
            </View>
            <Text className="text-sm text-gray-600 leading-6">
              机构开通会员后，旗下所有教师自动获得会员资格。教师无需单独购买，即可享受抢单、查看联系方式等会员专属功能。
              {'\n\n'}
              教师加入机构时自动继承会员，退出机构时自动取消。名额不足时无法邀请新教师。
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* 支付弹窗 */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="w-80">
          <DialogHeader>
            <DialogTitle>确认购买</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <View className="mt-4">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-gray-500">套餐名称</Text>
                <Text className="font-semibold">{selectedPlan.name}</Text>
              </View>
              <View className="flex items-center justify-between mb-4">
                <Text className="text-gray-500">教师名额</Text>
                <Text>{selectedPlan.teacher_quota}人</Text>
              </View>
              <View className="flex items-center justify-between mb-4">
                <Text className="text-gray-500">有效期</Text>
                <Text>{selectedPlan.duration_days}天</Text>
              </View>
              <View className="flex items-center justify-between mb-4">
                <Text className="text-gray-500">支付金额</Text>
                <Text className="text-2xl font-bold text-purple-600">¥{selectedPlan.price}</Text>
              </View>
              <Button className="w-full mt-4" onClick={handleConfirmPay}>
                <Text className="text-white">确认支付</Text>
              </Button>
            </View>
          )}
        </DialogContent>
      </Dialog>
    </View>
  )
}
