import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'
import { Calendar, Clock, MapPin, User, CreditCard, Check, X, CircleAlert, Phone, Star } from 'lucide-react-taro'
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
  created_at: string
  paid_at?: string
  confirmed_at?: string
  completed_at?: string
  rating?: number
  feedback?: string
  settlement?: {
    platform_amount: number
    teacher_amount: number
    agent_commission: number
  }
}

const statusConfig: Record<string, { label: string; color: string; bgClass: string }> = {
  pending: { label: '待支付', color: '#F59E0B', bgClass: 'bg-yellow-100 text-yellow-700' },
  paid: { label: '已支付', color: '#3B82F6', bgClass: 'bg-blue-100 text-blue-700' },
  confirmed: { label: '已确认', color: '#8B5CF6', bgClass: 'bg-purple-100 text-purple-700' },
  success: { label: '试课成功', color: '#10B981', bgClass: 'bg-green-100 text-green-700' },
  failed: { label: '试课失败', color: '#EF4444', bgClass: 'bg-red-100 text-red-700' },
  cancelled: { label: '已取消', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-500' },
  timeout: { label: '已超时', color: '#6B7280', bgClass: 'bg-gray-100 text-gray-500' },
}

export default function TrialDetailPage() {
  const router = useRouter()
  const invitationId = router.params.id ? parseInt(router.params.id) : 0

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<TrialInvitation | null>(null)

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
    return `${year}年${month}月${day}日 ${hour}:${minute}`
  }

  const handlePay = () => {
    Taro.navigateTo({ url: `/pages/trial-pay/index?id=${invitationId}` })
  }

  const handleConfirm = () => {
    Taro.navigateTo({ url: `/pages/trial-confirm/index?id=${invitationId}` })
  }

  const handleContact = () => {
    if (invitation) {
      Taro.navigateTo({ url: `/pages/chat/index?id=${invitation.teacher_id}` })
    }
  }

  if (loading) {
    return (
      <View className="trial-detail-page">
        <View className="loading-container">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!invitation) {
    return (
      <View className="trial-detail-page">
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

  const status = statusConfig[invitation.status] || statusConfig.pending

  return (
    <View className="trial-detail-page">
      <ScrollView scrollY className="content">
        {/* 状态卡片 */}
        <View className="status-card" style={{ backgroundColor: status.color + '10' }}>
          <View className="flex items-center justify-center flex-col">
            {invitation.status === 'success' && <Check size={48} color={status.color} />}
            {invitation.status === 'failed' && <X size={48} color={status.color} />}
            {(invitation.status === 'pending' || invitation.status === 'paid' || invitation.status === 'confirmed') && (
              <CircleAlert size={48} color={status.color} />
            )}
            <Text className="text-lg font-semibold mt-2" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* 试课信息 */}
        <Card className="m-4">
          <CardHeader>
            <View className="flex items-center gap-2">
              <Calendar size={18} color="#2563EB" />
              <CardTitle>试课信息</CardTitle>
            </View>
          </CardHeader>
          <CardContent className="space-y-3">
            <View className="flex items-center gap-3">
              <Image 
                src={invitation.teacher_avatar || 'https://placehold.co/100/2563EB/white?text=师'} 
                className="w-14 h-14 rounded-full"
              />
              <View className="flex-1">
                <Text className="font-semibold text-lg">{invitation.teacher_name}</Text>
                <Text className="text-sm text-gray-500">{invitation.subject}</Text>
              </View>
              <Button size="sm" variant="outline" onClick={handleContact}>
                <Phone size={14} color="#2563EB" />
                <Text className="text-blue-500 ml-1">联系</Text>
              </Button>
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

            <View className="h-px bg-gray-100" />

            <View className="flex justify-between items-center">
              <Text className="text-gray-600">试课费用</Text>
              <Text className="text-xl font-bold text-orange-500">¥{invitation.trial_fee}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 评价信息 */}
        {invitation.rating && (
          <Card className="mx-4">
            <CardHeader>
              <CardTitle>试课评价</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={20} 
                    color={star <= invitation.rating! ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
                <Text className="ml-2 text-gray-600">{invitation.rating}分</Text>
              </View>
              {invitation.feedback && (
                <Text className="text-sm text-gray-600">{invitation.feedback}</Text>
              )}
            </CardContent>
          </Card>
        )}

        {/* 结算信息 */}
        {invitation.settlement && (
          <Card className="mx-4 mt-4">
            <CardHeader>
              <CardTitle>结算明细</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-2">
                <View className="flex justify-between">
                  <Text className="text-gray-600">平台收入</Text>
                  <Text className="text-orange-500">¥{invitation.settlement.platform_amount}</Text>
                </View>
                <View className="flex justify-between">
                  <Text className="text-gray-600">教师收入</Text>
                  <Text className="text-green-500">¥{invitation.settlement.teacher_amount}</Text>
                </View>
                {invitation.settlement.agent_commission > 0 && (
                  <View className="flex justify-between">
                    <Text className="text-gray-600">分销佣金</Text>
                    <Text className="text-blue-500">¥{invitation.settlement.agent_commission}</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* 时间线 */}
        <Card className="mx-4 mt-4">
          <CardHeader>
            <CardTitle>时间线</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="timeline">
              <View className="timeline-item">
                <View className="timeline-dot bg-blue-500" />
                <View className="timeline-content">
                  <Text className="text-sm font-medium">创建邀约</Text>
                  <Text className="text-xs text-gray-400">{formatDate(invitation.created_at)}</Text>
                </View>
              </View>
              {invitation.paid_at && (
                <View className="timeline-item">
                  <View className="timeline-dot bg-green-500" />
                  <View className="timeline-content">
                    <Text className="text-sm font-medium">支付成功</Text>
                    <Text className="text-xs text-gray-400">{formatDate(invitation.paid_at)}</Text>
                  </View>
                </View>
              )}
              {invitation.confirmed_at && (
                <View className="timeline-item">
                  <View className="timeline-dot bg-purple-500" />
                  <View className="timeline-content">
                    <Text className="text-sm font-medium">确认试课</Text>
                    <Text className="text-xs text-gray-400">{formatDate(invitation.confirmed_at)}</Text>
                  </View>
                </View>
              )}
              {invitation.completed_at && (
                <View className="timeline-item">
                  <View className={`timeline-dot ${invitation.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <View className="timeline-content">
                    <Text className="text-sm font-medium">
                      {invitation.status === 'success' ? '试课成功' : '试课失败'}
                    </Text>
                    <Text className="text-xs text-gray-400">{formatDate(invitation.completed_at)}</Text>
                  </View>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* 底部操作栏 */}
      {invitation.status === 'pending' && (
        <View className="bottom-bar">
          <Button className="pay-btn" onClick={handlePay}>
            <CreditCard size={18} color="white" />
            <Text className="text-white ml-1">立即支付 ¥{invitation.trial_fee}</Text>
          </Button>
        </View>
      )}

      {invitation.status === 'confirmed' && (
        <View className="bottom-bar">
          <Button className="confirm-btn" onClick={handleConfirm}>
            <Check size={18} color="white" />
            <Text className="text-white ml-1">确认试课结果</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
