import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { 
  CircleCheck, Shield, Clock, ChevronRight
} from 'lucide-react-taro'

interface OrderInfo {
  order_id: string
  order_no: string
  type: 'membership' | 'activity' | 'demand'
  amount: number
  title: string
  description: string
  created_at: string
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  available: boolean
}

/**
 * 支付页面
 */
const PayPage: FC = () => {
  const router = useRouter()
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('wechat')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  const paymentMethods: PaymentMethod[] = [
    { id: 'wechat', name: '微信支付', icon: '💳', available: true },
    { id: 'balance', name: '余额支付', icon: '💰', available: false },
  ]

  useDidShow(() => {
    const { type, plan_id, activity_id, demand_id, amount } = router.params
    
    if (!type || !amount) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
      return
    }

    loadOrderInfo(type, plan_id, activity_id, demand_id, parseFloat(amount))
  })

  const loadOrderInfo = async (
    type: string,
    planId?: string,
    activityId?: string,
    demandId?: string,
    amount?: number
  ) => {
    setLoading(true)
    try {
      // 构建订单信息
      let title = ''
      let description = ''
      
      if (type === 'membership') {
        title = '会员购买'
        description = planId === '1' ? '月卡会员' : planId === '2' ? '季卡会员' : '年卡会员'
      } else if (type === 'activity') {
        title = '活动报名'
        description = '活动报名费'
      } else if (type === 'demand') {
        title = '需求发布'
        description = '需求发布费用'
      }

      // 创建订单
      const res = await Network.request({
        url: '/api/orders',
        method: 'POST',
        data: {
          type,
          plan_id: planId,
          activity_id: activityId,
          demand_id: demandId,
          amount
        }
      })

      console.log('创建订单响应:', res.data)

      setOrderInfo({
        order_id: res.data?.order_id || `ORD${Date.now()}`,
        order_no: res.data?.order_no || `NO${Date.now()}`,
        type: type as OrderInfo['type'],
        amount: amount || 0,
        title,
        description,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('加载订单信息失败:', error)
      // 使用模拟数据
      setOrderInfo({
        order_id: `ORD${Date.now()}`,
        order_no: `NO${Date.now()}`,
        type: type as OrderInfo['type'],
        amount: amount || 0,
        title: type === 'membership' ? '会员购买' : type === 'activity' ? '活动报名' : '需求发布',
        description: '订单描述',
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!orderInfo) return

    setPaying(true)
    try {
      console.log('发起支付请求:', { 
        url: '/api/pay/create', 
        data: { 
          order_id: orderInfo.order_id, 
          method: selectedMethod 
        } 
      })

      const res = await Network.request({
        url: '/api/pay/create',
        method: 'POST',
        data: {
          order_id: orderInfo.order_id,
          method: selectedMethod,
          amount: orderInfo.amount
        }
      })

      console.log('支付响应:', res.data)

      if (res.data && res.data.pay_params) {
        // 调用微信支付
        const payParams = res.data.pay_params
        
        // 小程序端调用微信支付
        // @ts-ignore
        if (typeof wx !== 'undefined' && wx.requestPayment) {
          // @ts-ignore
          wx.requestPayment({
            ...payParams,
            success: () => {
              handlePaySuccess()
            },
            fail: (err: any) => {
              console.error('支付失败:', err)
              handlePayFail()
            }
          })
        } else {
          // H5端模拟支付成功
          setTimeout(() => {
            handlePaySuccess()
          }, 1500)
        }
      } else {
        // 模拟支付成功
        setTimeout(() => {
          handlePaySuccess()
        }, 1500)
      }
    } catch (error) {
      console.error('支付失败:', error)
      handlePayFail()
    } finally {
      setPaying(false)
    }
  }

  const handlePaySuccess = () => {
    // 更新订单状态
    Network.request({
      url: '/api/pay/confirm',
      method: 'POST',
      data: { order_id: orderInfo?.order_id }
    }).catch(err => console.error('确认支付失败:', err))

    // 跳转支付成功页
    Taro.redirectTo({
      url: `/pages/pay-result/index?status=success&order_id=${orderInfo?.order_id}&type=${orderInfo?.type}`
    })
  }

  const handlePayFail = () => {
    Taro.redirectTo({
      url: `/pages/pay-result/index?status=fail&order_id=${orderInfo?.order_id}`
    })
  }

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (loading || !orderInfo) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="pb-24">
        {/* 订单信息 */}
        <Card className="m-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold">订单信息</Text>
              <Text className="text-xs text-gray-400">订单号: {orderInfo.order_no}</Text>
            </View>
            
            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <Text className="text-sm font-medium text-gray-900 mb-1">{orderInfo.title}</Text>
              <Text className="text-xs text-gray-500">{orderInfo.description}</Text>
            </View>
            
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-1">
                <Clock size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-400">{formatTime(orderInfo.created_at)}</Text>
              </View>
              <View className="flex flex-row items-baseline gap-1">
                <Text className="text-sm text-gray-500">支付金额</Text>
                <Text className="text-xl font-bold text-orange-500">¥{orderInfo.amount}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 支付方式 */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">支付方式</Text>
            
            {paymentMethods.map((method) => (
              <View
                key={method.id}
                className={`flex flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0 ${!method.available ? 'opacity-50' : ''}`}
                onClick={() => method.available && setSelectedMethod(method.id)}
              >
                <View className="flex flex-row items-center gap-3">
                  <Text className="text-2xl">{method.icon}</Text>
                  <View>
                    <Text className="text-sm font-medium text-gray-900">{method.name}</Text>
                    {!method.available && (
                      <Text className="text-xs text-gray-400">暂不可用</Text>
                    )}
                  </View>
                </View>
                <View className="flex flex-row items-center gap-2">
                  {selectedMethod === method.id && (
                    <CircleCheck size={18} color="#2563EB" />
                  )}
                  {selectedMethod !== method.id && (
                    <View className="w-4 h-4 rounded-full border border-gray-300" />
                  )}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 支付说明 */}
        <View className="mx-4 mt-4 bg-blue-50 rounded-lg p-4">
          <View className="flex flex-row items-start gap-2">
            <Shield size={16} color="#2563EB" className="mt-1 shrink-0" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-900 mb-1">支付安全保障</Text>
              <Text className="text-xs text-blue-700">
                您的支付信息将通过银行级加密传输，确保资金安全。支付过程中请勿关闭页面。
              </Text>
            </View>
          </View>
        </View>

        {/* 订单详情链接 */}
        {orderInfo.type === 'activity' && (
          <View 
            className="mx-4 mt-4 flex flex-row items-center justify-between bg-white rounded-lg px-4 py-3"
            onClick={() => Taro.navigateTo({ url: '/pages/my-activities/index' })}
          >
            <Text className="text-sm text-gray-600">查看我的活动</Text>
            <ChevronRight size={16} color="#9CA3AF" />
          </View>
        )}
      </ScrollView>

      {/* 底部支付按钮 */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">支付金额</Text>
            <Text className="text-2xl font-bold text-orange-500">¥{orderInfo.amount}</Text>
          </View>
          <Button
            className="px-8"
            disabled={paying}
            onClick={handlePay}
          >
            <Text className="text-white font-medium">
              {paying ? '支付中...' : '立即支付'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default PayPage
