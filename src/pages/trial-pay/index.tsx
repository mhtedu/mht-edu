import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'
import { Calendar, Clock, MapPin, User, CreditCard, CircleAlert, Check } from 'lucide-react-taro'
import './index.css'

interface TrialInvitation {
  id: number
  teacher_id: number
  teacher_name: string
  teacher_avatar?: string
  parent_id: number
  parent_name: string
  subject: string
  trial_time: string
  trial_address: string
  trial_duration: number
  trial_fee: number
  status: string
}

export default function TrialPayPage() {
  const router = useRouter()
  const invitationId = router.params.id ? parseInt(router.params.id) : 0

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [invitation, setInvitation] = useState<TrialInvitation | null>(null)
  const [payMethod, setPayMethod] = useState<'wechat' | 'balance'>('wechat')

  useDidShow(() => {
    if (invitationId > 0) {
      loadInvitation()
    }
  })

  const loadInvitation = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/trial-lesson/invitation/${invitationId}`,
        method: 'GET'
      }) as any

      if (res.data && res.data.code === 0) {
        setInvitation(res.data.data)
      } else {
        Taro.showToast({ title: res.data?.msg || '加载失败', icon: 'none' })
      }
    } catch (error) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    return `${year}年${month}月${day}日 ${weekDay} ${hour}:${minute}`
  }

  const handlePay = async () => {
    if (!invitation) return

    try {
      setPaying(true)

      // 调用支付接口
      const res = await Network.request({
        url: '/api/trial-lesson/pay',
        method: 'POST',
        data: {
          invitationId: invitation.id,
          payMethod
        }
      }) as any

      if (res.data && res.data.code === 0) {
        const payData = res.data.data

        if (payMethod === 'wechat' && payData.payParams) {
          // 微信支付
          Taro.requestPayment({
            ...payData.payParams,
            success: () => {
              Taro.showToast({ title: '支付成功', icon: 'success' })
              setTimeout(() => {
                Taro.redirectTo({ url: `/pages/trial-detail/index?id=${invitation.id}` })
              }, 1500)
            },
            fail: (err) => {
              if (err.errMsg !== 'requestPayment:fail cancel') {
                Taro.showToast({ title: '支付失败', icon: 'none' })
              }
            }
          })
        } else {
          // 余额支付成功
          Taro.showToast({ title: '支付成功', icon: 'success' })
          setTimeout(() => {
            Taro.redirectTo({ url: `/pages/trial-detail/index?id=${invitation.id}` })
          }, 1500)
        }
      } else {
        Taro.showToast({ title: res.data?.msg || '支付失败', icon: 'none' })
      }
    } catch (error) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <View className="trial-pay-page">
        <View className="loading-container">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!invitation) {
    return (
      <View className="trial-pay-page">
        <View className="error-container">
          <CircleAlert size={48} color="#EF4444" />
          <Text className="text-gray-500 mt-4">邀约不存在或已失效</Text>
          <Button className="mt-4" onClick={() => Taro.navigateBack()}>
            <Text className="text-white">返回</Text>
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="trial-pay-page">
      <ScrollView scrollY className="content">
        {/* 试课信息卡片 */}
        <Card className="m-4">
          <CardHeader>
            <View className="flex items-center gap-2">
              <Calendar size={18} color="#2563EB" />
              <CardTitle>试课邀约</CardTitle>
            </View>
          </CardHeader>
          <CardContent className="space-y-3">
            <View className="flex items-center gap-2">
              <Image 
                src={invitation.teacher_avatar || 'https://placehold.co/100/2563EB/white?text=师'} 
                className="w-12 h-12 rounded-full"
              />
              <View>
                <Text className="font-semibold">{invitation.teacher_name}</Text>
                <Text className="text-sm text-gray-500">{invitation.subject}</Text>
              </View>
            </View>

            <View className="h-px bg-gray-100" />

            <View className="flex items-center gap-2">
              <Clock size={16} color="#6B7280" />
              <Text className="text-sm">{formatDate(invitation.trial_time)}</Text>
            </View>
            <View className="flex items-center gap-2">
              <MapPin size={16} color="#6B7280" />
              <Text className="text-sm">{invitation.trial_address}</Text>
            </View>
            <View className="flex items-center gap-2">
              <User size={16} color="#6B7280" />
              <Text className="text-sm">试课时长：{invitation.trial_duration}小时</Text>
            </View>
          </CardContent>
        </Card>

        {/* 费用明细 */}
        <Card className="mx-4">
          <CardHeader>
            <CardTitle>费用明细</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex justify-between items-center py-2">
              <Text className="text-gray-600">试课费</Text>
              <Text className="text-orange-500 font-semibold">¥{invitation.trial_fee}</Text>
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex justify-between items-center py-2">
              <Text className="text-gray-600">平台服务费</Text>
              <Text className="text-green-500">免费</Text>
            </View>
          </CardContent>
        </Card>

        {/* 支付方式 */}
        <Card className="mx-4 mt-4">
          <CardHeader>
            <CardTitle>支付方式</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <View 
              className={`pay-method ${payMethod === 'wechat' ? 'active' : ''}`}
              onClick={() => setPayMethod('wechat')}
            >
              <View className="flex items-center gap-3">
                <View className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Text className="text-white text-xs font-bold">微</Text>
                </View>
                <Text>微信支付</Text>
              </View>
              {payMethod === 'wechat' && <Check size={20} color="#10B981" />}
            </View>

            <View 
              className={`pay-method ${payMethod === 'balance' ? 'active' : ''}`}
              onClick={() => setPayMethod('balance')}
            >
              <View className="flex items-center gap-3">
                <View className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Text className="text-white text-xs font-bold">余</Text>
                </View>
                <View>
                  <Text>余额支付</Text>
                  <Text className="text-xs text-gray-400">可用余额：¥0.00</Text>
                </View>
              </View>
              {payMethod === 'balance' && <Check size={20} color="#10B981" />}
            </View>
          </CardContent>
        </Card>

        {/* 温馨提示 */}
        <View className="mx-4 mt-4 p-4 bg-yellow-50 rounded-lg">
          <View className="flex items-start gap-2">
            <CircleAlert size={16} color="#F59E0B" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-yellow-700">温馨提示</Text>
              <Text className="text-xs text-yellow-600 mt-1 block">1. 试课费支付后，请按时参加试课</Text>
              <Text className="text-xs text-yellow-600 mt-1 block">2. 试课成功，平台将收取全部试课费</Text>
              <Text className="text-xs text-yellow-600 mt-1 block">3. 试课不成功，平台与教师各得50%</Text>
              <Text className="text-xs text-yellow-600 mt-1 block">4. 如有疑问，请联系客服处理</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部支付栏 */}
      <View className="bottom-bar">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500">应付金额</Text>
            <Text className="text-2xl font-bold text-orange-500">¥{invitation.trial_fee}</Text>
          </View>
          <Button 
            className="pay-btn" 
            onClick={handlePay}
            disabled={paying}
          >
            <CreditCard size={18} color="white" />
            <Text className="text-white ml-1">{paying ? '支付中...' : '立即支付'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
