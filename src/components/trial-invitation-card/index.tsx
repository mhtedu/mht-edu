import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, CreditCard, Check, X, CircleAlert } from 'lucide-react-taro'

export interface TrialInvitation {
  id: number
  teacher_id: number
  teacher_name: string
  teacher_avatar?: string
  parent_id: number
  parent_name: string
  org_id?: number
  org_name?: string
  subject: string
  trial_time: string
  trial_address: string
  trial_duration: number
  trial_fee: number
  status: 'pending' | 'paid' | 'confirmed' | 'success' | 'failed' | 'cancelled' | 'timeout'
  created_at: string
  paid_at?: string
  confirmed_at?: string
  completed_at?: string
}

interface TrialInvitationCardProps {
  invitation: TrialInvitation
  isSelf: boolean
  userRole: 'teacher' | 'parent'
  onPay?: () => void
  onConfirm?: (result: 'success' | 'failed') => void
  onViewDetail?: () => void
}

const statusConfig: Record<TrialInvitation['status'], { label: string; color: string; icon: typeof Calendar }> = {
  pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-700', icon: CircleAlert },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
  confirmed: { label: '已确认', color: 'bg-purple-100 text-purple-700', icon: Check },
  success: { label: '试课成功', color: 'bg-green-100 text-green-700', icon: Check },
  failed: { label: '试课失败', color: 'bg-red-100 text-red-700', icon: X },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500', icon: X },
  timeout: { label: '已超时', color: 'bg-gray-100 text-gray-500', icon: CircleAlert },
}

export function TrialInvitationCard({
  invitation,
  isSelf,
  userRole,
  onPay,
  onConfirm,
  onViewDetail
}: TrialInvitationCardProps) {
  const status = statusConfig[invitation.status]
  const StatusIcon = status.icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  const handlePay = () => {
    if (onPay) {
      onPay()
    } else {
      Taro.navigateTo({ url: `/pages/trial-pay/index?id=${invitation.id}` })
    }
  }

  const handleConfirm = (result: 'success' | 'failed') => {
    if (onConfirm) {
      onConfirm(result)
    } else {
      Taro.navigateTo({ url: `/pages/trial-confirm/index?id=${invitation.id}&result=${result}` })
    }
  }

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail()
    } else {
      Taro.navigateTo({ url: `/pages/trial-detail/index?id=${invitation.id}` })
    }
  }

  return (
    <Card className={`w-72 ${isSelf ? 'bg-blue-50' : 'bg-white'}`}>
      <CardHeader className="pb-2">
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Calendar size={16} color="#2563EB" />
            <CardTitle className="text-base">试课邀约</CardTitle>
          </View>
          <Badge className={status.color}>
            <StatusIcon size={12} color="#2563EB" />
            <Text className="ml-1">{status.label}</Text>
          </Badge>
        </View>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* 试课信息 */}
        <View className="flex items-center gap-2">
          <Clock size={14} color="#6B7280" />
          <Text className="text-sm text-gray-700">{formatDate(invitation.trial_time)}</Text>
        </View>
        <View className="flex items-center gap-2">
          <MapPin size={14} color="#6B7280" />
          <Text className="text-sm text-gray-700">{invitation.trial_address}</Text>
        </View>
        <View className="flex items-center gap-2">
          <User size={14} color="#6B7280" />
          <Text className="text-sm text-gray-700">{invitation.subject} · {invitation.trial_duration}小时</Text>
        </View>

        {/* 费用信息 */}
        <View className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Text className="text-sm text-gray-500">试课费</Text>
          <Text className="text-lg font-semibold text-orange-500">¥{invitation.trial_fee}</Text>
        </View>

        {/* 机构信息 */}
        {invitation.org_name && (
          <View className="flex items-center gap-1 pt-1">
            <Text className="text-xs text-gray-400">机构：{invitation.org_name}</Text>
          </View>
        )}

        {/* 操作按钮 */}
        {invitation.status === 'pending' && userRole === 'parent' && (
          <View className="flex gap-2 pt-3">
            <Button 
              size="sm" 
              className="flex-1 bg-orange-500" 
              onClick={handlePay}
            >
              <CreditCard size={14} color="white" />
              <Text className="text-white ml-1">立即支付</Text>
            </Button>
          </View>
        )}

        {invitation.status === 'confirmed' && (
          <View className="flex gap-2 pt-3">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-green-500" 
              onClick={() => handleConfirm('success')}
            >
              <Check size={14} color="#10B981" />
              <Text className="text-green-600 ml-1">试课成功</Text>
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-red-500" 
              onClick={() => handleConfirm('failed')}
            >
              <X size={14} color="#EF4444" />
              <Text className="text-red-500 ml-1">试课失败</Text>
            </Button>
          </View>
        )}

        {(invitation.status === 'success' || invitation.status === 'failed' || invitation.status === 'cancelled' || invitation.status === 'timeout') && (
          <View className="pt-3">
            <Button 
              size="sm" 
              variant="outline"
              className="w-full" 
              onClick={handleViewDetail}
            >
              <Text>查看详情</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

export default TrialInvitationCard
