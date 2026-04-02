import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { CircleCheck, CircleX, Clock, House, FileText } from 'lucide-react-taro'

/**
 * 支付结果页面
 */
const PayResultPage: FC = () => {
  const router = useRouter()
  const [status, setStatus] = useState<'success' | 'fail' | 'pending'>('pending')

  useDidShow(() => {
    const { status: statusParam, order_id } = router.params
    
    if (statusParam === 'success') {
      setStatus('success')
      // 查询订单状态确认
      if (order_id) {
        checkOrderStatus(order_id)
      }
    } else if (statusParam === 'fail') {
      setStatus('fail')
    } else {
      // 没有状态参数，查询订单
      if (order_id) {
        checkOrderStatus(order_id)
      }
    }
  })

  const checkOrderStatus = async (orderId: string) => {
    try {
      const res = await Network.request({
        url: `/api/orders/${orderId}/status`
      })
      console.log('订单状态:', res.data)
      
      if (res.data && res.data.status === 'paid') {
        setStatus('success')
      } else if (res.data && res.data.status === 'failed') {
        setStatus('fail')
      } else {
        setStatus('pending')
      }
    } catch (error) {
      console.error('查询订单状态失败:', error)
      // 默认显示pending状态
      setStatus('pending')
    }
  }

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleViewOrder = () => {
    const { type } = router.params
    if (type === 'membership') {
      Taro.navigateTo({ url: '/pages/member/index' })
    } else if (type === 'activity') {
      Taro.navigateTo({ url: '/pages/my-activities/index' })
    } else {
      Taro.navigateTo({ url: '/pages/orders/index' })
    }
  }

  const handleRetry = () => {
    const { order_id } = router.params
    Taro.redirectTo({ url: `/pages/pay/index?order_id=${order_id}` })
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      {status === 'success' && (
        <>
          <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CircleCheck size={48} color="#10B981" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">支付成功</Text>
          <Text className="text-sm text-gray-500 text-center mb-8">
            恭喜您，支付已成功完成！{'\n'}订单权益已生效
          </Text>
          
          <View className="w-full flex flex-col gap-3">
            <Button className="w-full" onClick={handleViewOrder}>
              <Text className="text-white">查看订单</Text>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoHome}>
              <House size={18} color="#6B7280" />
              <Text className="text-gray-600 ml-2">返回首页</Text>
            </Button>
          </View>
        </>
      )}

      {status === 'fail' && (
        <>
          <View className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <CircleX size={48} color="#EF4444" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">支付失败</Text>
          <Text className="text-sm text-gray-500 text-center mb-8">
            支付遇到问题，请重新尝试{'\n'}如已扣款请联系客服
          </Text>
          
          <View className="w-full flex flex-col gap-3">
            <Button className="w-full" onClick={handleRetry}>
              <Text className="text-white">重新支付</Text>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoHome}>
              <House size={18} color="#6B7280" />
              <Text className="text-gray-600 ml-2">返回首页</Text>
            </Button>
          </View>
        </>
      )}

      {status === 'pending' && (
        <>
          <View className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Clock size={48} color="#2563EB" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">支付处理中</Text>
          <Text className="text-sm text-gray-500 text-center mb-8">
            支付正在处理中，请稍后{'\n'}可前往订单列表查看状态
          </Text>
          
          <View className="w-full flex flex-col gap-3">
            <Button className="w-full" onClick={handleViewOrder}>
              <FileText size={18} color="white" />
              <Text className="text-white ml-2">查看订单</Text>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoHome}>
              <House size={18} color="#6B7280" />
              <Text className="text-gray-600 ml-2">返回首页</Text>
            </Button>
          </View>
        </>
      )}
    </View>
  )
}

export default PayResultPage
