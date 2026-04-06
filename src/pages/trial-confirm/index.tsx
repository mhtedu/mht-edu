import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Network } from '@/network'
import { Calendar, Clock, MapPin, User, Check, X, CircleAlert, Star, MessageSquare } from 'lucide-react-taro'
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
}

export default function TrialConfirmPage() {
  const router = useRouter()
  const invitationId = router.params.id ? parseInt(router.params.id) : 0
  const defaultResult = router.params.result as 'success' | 'failed' | undefined

  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [invitation, setInvitation] = useState<TrialInvitation | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmResult, setConfirmResult] = useState<'success' | 'failed'>(defaultResult || 'success')
  const [rating, setRating] = useState(5)
  const [feedback] = useState('')

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

  const handleConfirm = async () => {
    if (!invitation) return

    try {
      setConfirming(true)

      const res = await Network.request({
        url: '/api/trial-lesson/confirm',
        method: 'POST',
        data: {
          invitationId: invitation.id,
          result: confirmResult,
          rating: confirmResult === 'success' ? rating : undefined,
          feedback
        }
      }) as any

      if (res.data && res.data.code === 0) {
        Taro.showToast({ 
          title: confirmResult === 'success' ? '试课成功！' : '已确认试课失败', 
          icon: 'success' 
        })
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/trial-detail/index?id=${invitation.id}` })
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '确认失败', icon: 'none' })
      }
    } catch (error) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setConfirming(false)
    }
  }

  const openConfirmDialog = (result: 'success' | 'failed') => {
    setConfirmResult(result)
    setShowConfirmDialog(true)
  }

  const showFeedbackInput = () => {
    // 使用输入弹窗
    Taro.showModal({
      title: '请输入评价',
      content: feedback || '',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      success: () => {
        // 用户点击确定
      }
    })
  }

  if (loading) {
    return (
      <View className="trial-confirm-page">
        <View className="loading-container">
          <Text className="text-gray-400">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!invitation) {
    return (
      <View className="trial-confirm-page">
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
    <View className="trial-confirm-page">
      <ScrollView scrollY className="content">
        {/* 试课信息卡片 */}
        <Card className="m-4">
          <CardHeader>
            <View className="flex items-center gap-2">
              <Calendar size={18} color="#2563EB" />
              <CardTitle>试课信息</CardTitle>
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

            <View className="h-px bg-gray-100" />

            <View className="flex justify-between items-center">
              <Text className="text-gray-600">试课费用</Text>
              <Text className="text-lg font-semibold text-orange-500">¥{invitation.trial_fee}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 确认提示 */}
        <View className="mx-4 p-4 bg-blue-50 rounded-lg">
          <View className="flex items-start gap-2">
            <CircleAlert size={16} color="#2563EB" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-blue-700">请确认试课结果</Text>
              <Text className="text-xs text-blue-600 mt-1 block">试课成功：平台收取全部试课费</Text>
              <Text className="text-xs text-blue-600 mt-1 block">试课失败：平台与教师各得50%</Text>
            </View>
          </View>
        </View>

        {/* 确认按钮 */}
        <View className="mx-4 mt-6 space-y-3">
          <Button 
            className="w-full bg-green-500 py-4"
            onClick={() => openConfirmDialog('success')}
          >
            <Check size={20} color="white" />
            <Text className="text-white ml-2 text-lg">试课成功</Text>
          </Button>
          <Button 
            variant="outline"
            className="w-full border-red-500 py-4"
            onClick={() => openConfirmDialog('failed')}
          >
            <X size={20} color="#EF4444" />
            <Text className="text-red-500 ml-2 text-lg">试课失败</Text>
          </Button>
        </View>

        {/* 历史记录 */}
        <View className="mx-4 mt-6">
          <Text className="text-sm text-gray-500">时间线</Text>
          <View className="mt-2 space-y-2">
            <View className="flex items-center gap-2">
              <View className="w-2 h-2 bg-blue-500 rounded-full" />
              <Text className="text-xs text-gray-600">创建于 {formatDate(invitation.created_at)}</Text>
            </View>
            {invitation.paid_at && (
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 bg-green-500 rounded-full" />
                <Text className="text-xs text-gray-600">支付于 {formatDate(invitation.paid_at)}</Text>
              </View>
            )}
            {invitation.confirmed_at && (
              <View className="flex items-center gap-2">
                <View className="w-2 h-2 bg-purple-500 rounded-full" />
                <Text className="text-xs text-gray-600">确认于 {formatDate(invitation.confirmed_at)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 确认弹窗 */}
      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>
                {confirmResult === 'success' ? '确认试课成功' : '确认试课失败'}
              </DialogTitle>
            </DialogHeader>
            <View className="mt-4">
              {confirmResult === 'success' && (
                <>
                  {/* 评分 */}
                  <View className="mb-4">
                    <Text className="text-sm text-gray-600 mb-2">请为本次试课评分</Text>
                    <View className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <View 
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star 
                            size={28} 
                            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 评价 */}
                  <View className="mb-4">
                    <Text className="text-sm text-gray-600 mb-2">评价（可选）</Text>
                    <View className="bg-gray-50 rounded-lg p-3">
                      <View className="flex items-start gap-2">
                        <MessageSquare size={16} color="#6B7280" />
                        <Text 
                          className="text-sm text-gray-500 flex-1"
                          onClick={showFeedbackInput}
                        >
                          {feedback || '点击输入评价...'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {confirmResult === 'failed' && (
                <View className="mb-4">
                  <Text className="text-sm text-gray-600 mb-2">失败原因（可选）</Text>
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text 
                      className="text-sm text-gray-500"
                      onClick={showFeedbackInput}
                    >
                      {feedback || '点击输入原因...'}
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  <Text>取消</Text>
                </Button>
                <Button 
                  className={`flex-1 ${confirmResult === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  <Text className="text-white">{confirming ? '确认中...' : '确认'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
