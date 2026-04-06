import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { Calendar, Clock, MapPin, User, CreditCard, Check, ChevronRight } from 'lucide-react-taro'
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

export default function MyTrialLessonsPage() {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<TrialInvitation[]>([])
  const [activeStatus, setActiveStatus] = useState<string>('all')

  const { isLoggedIn, userInfo } = useUserStore()

  useDidShow(() => {
    if (isLoggedIn) {
      loadInvitations()
    } else {
      setLoading(false)
    }
  })

  usePullDownRefresh(() => {
    loadInvitations().finally(() => Taro.stopPullDownRefresh())
  })

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/trial-lesson/my-invitations',
        method: 'GET',
        data: { status: activeStatus === 'all' ? undefined : activeStatus }
      }) as any

      if (res.data && res.data.code === 0) {
        setInvitations(res.data.data || [])
      } else {
        // 模拟数据
        setInvitations([
          {
            id: 1,
            teacher_id: 101,
            teacher_name: '张老师',
            teacher_avatar: '',
            parent_id: userInfo?.id || 1,
            parent_name: '家长',
            subject: '数学',
            trial_time: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
            trial_address: '海淀区中关村',
            trial_duration: 1,
            trial_fee: 50,
            status: 'confirmed',
            created_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
            paid_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
          },
          {
            id: 2,
            teacher_id: 102,
            teacher_name: '李老师',
            teacher_avatar: '',
            parent_id: userInfo?.id || 1,
            parent_name: '家长',
            subject: '英语',
            trial_time: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
            trial_address: '朝阳区望京',
            trial_duration: 1.5,
            trial_fee: 80,
            status: 'pending',
            created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
          },
          {
            id: 3,
            teacher_id: 103,
            teacher_name: '王老师',
            teacher_avatar: '',
            parent_id: userInfo?.id || 1,
            parent_name: '家长',
            subject: '物理',
            trial_time: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
            trial_address: '西城区金融街',
            trial_duration: 1,
            trial_fee: 60,
            status: 'success',
            created_at: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
            paid_at: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
            confirmed_at: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
            completed_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
            rating: 5,
            feedback: '老师很专业，讲解清晰',
          },
        ])
      }
    } catch (error) {
      console.error('加载试课列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    setTimeout(() => loadInvitations(), 100)
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/trial-detail/index?id=${id}` })
  }

  const goToPay = (id: number) => {
    Taro.navigateTo({ url: `/pages/trial-pay/index?id=${id}` })
  }

  const goToConfirm = (id: number) => {
    Taro.navigateTo({ url: `/pages/trial-confirm/index?id=${id}` })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    return `${month}月${day}日 ${weekDay} ${hour}:${minute}`
  }

  const filteredInvitations = activeStatus === 'all' 
    ? invitations 
    : invitations.filter(i => i.status === activeStatus)

  // 统计数量
  const statusCounts = {
    all: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    confirmed: invitations.filter(i => ['paid', 'confirmed'].includes(i.status)).length,
    completed: invitations.filter(i => ['success', 'failed'].includes(i.status)).length,
  }

  if (!isLoggedIn) {
    return (
      <View className="my-trial-page">
        <View className="empty-state">
          <User size={48} color="#D1D5DB" />
          <Text className="empty-text mt-4">请先登录查看试课记录</Text>
          <Button className="mt-4" onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            <Text className="text-white">去登录</Text>
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="my-trial-page">
      {/* 顶部统计 */}
      <View className="stats-bar">
        <View className="stat-item" onClick={() => handleStatusChange('all')}>
          <Text className="stat-num">{statusCounts.all}</Text>
          <Text className="stat-label">全部</Text>
        </View>
        <View className="stat-item" onClick={() => handleStatusChange('pending')}>
          <Text className="stat-num text-yellow-500">{statusCounts.pending}</Text>
          <Text className="stat-label">待支付</Text>
        </View>
        <View className="stat-item" onClick={() => handleStatusChange('confirmed')}>
          <Text className="stat-num text-blue-500">{statusCounts.confirmed}</Text>
          <Text className="stat-label">进行中</Text>
        </View>
        <View className="stat-item" onClick={() => handleStatusChange('success')}>
          <Text className="stat-num text-green-500">{statusCounts.completed}</Text>
          <Text className="stat-label">已完成</Text>
        </View>
      </View>

      {/* 筛选标签 */}
      <ScrollView scrollX className="filter-scroll">
        {['all', 'pending', 'paid', 'confirmed', 'success', 'failed', 'cancelled'].map((status) => (
          <View
            key={status}
            className={`filter-item ${activeStatus === status ? 'active' : ''}`}
            onClick={() => handleStatusChange(status)}
          >
            <Text className="filter-text">{status === 'all' ? '全部' : statusConfig[status]?.label || status}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 试课列表 */}
      <ScrollView scrollY className="list-scroll">
        {loading ? (
          <View className="loading-wrap">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : filteredInvitations.length === 0 ? (
          <View className="empty-state">
            <Calendar size={48} color="#D1D5DB" />
            <Text className="empty-text mt-4">暂无试课记录</Text>
          </View>
        ) : (
          filteredInvitations.map((invitation) => {
            const status = statusConfig[invitation.status] || statusConfig.pending
            return (
              <Card key={invitation.id} className="invitation-card" onClick={() => goToDetail(invitation.id)}>
                <CardContent className="p-4">
                  {/* 头部 */}
                  <View className="card-header">
                    <View className="teacher-info">
                      <Image 
                        src={invitation.teacher_avatar || 'https://placehold.co/100/2563EB/white?text=师'} 
                        className="teacher-avatar"
                      />
                      <View className="teacher-detail">
                        <Text className="teacher-name">{invitation.teacher_name}</Text>
                        <Text className="subject-text">{invitation.subject}</Text>
                      </View>
                    </View>
                    <Badge className={status.bgClass}>{status.label}</Badge>
                  </View>

                  {/* 试课信息 */}
                  <View className="trial-info">
                    <View className="info-row">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="info-text">{formatDate(invitation.trial_time)}</Text>
                    </View>
                    <View className="info-row">
                      <MapPin size={14} color="#6B7280" />
                      <Text className="info-text">{invitation.trial_address}</Text>
                    </View>
                    <View className="info-row">
                      <Clock size={14} color="#6B7280" />
                      <Text className="info-text">{invitation.trial_duration}小时</Text>
                    </View>
                  </View>

                  {/* 费用 */}
                  <View className="fee-row">
                    <Text className="fee-label">试课费用</Text>
                    <Text className="fee-value">¥{invitation.trial_fee}</Text>
                  </View>

                  {/* 操作按钮 */}
                  <View className="action-row">
                    {invitation.status === 'pending' && (
                      <Button size="sm" className="pay-btn" onClick={(e) => { e.stopPropagation(); goToPay(invitation.id) }}>
                        <CreditCard size={14} color="white" />
                        <Text className="text-white ml-1">立即支付</Text>
                      </Button>
                    )}
                    {invitation.status === 'confirmed' && (
                      <Button size="sm" className="confirm-btn" onClick={(e) => { e.stopPropagation(); goToConfirm(invitation.id) }}>
                        <Check size={14} color="white" />
                        <Text className="text-white ml-1">确认试课结果</Text>
                      </Button>
                    )}
                    {invitation.status === 'success' && invitation.rating && (
                      <View className="rating-info">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <View key={star} className={star <= invitation.rating! ? 'star-filled' : 'star-empty'}>
                            <Text>{star <= invitation.rating! ? '★' : '☆'}</Text>
                          </View>
                        ))}
                        <Text className="rating-text ml-1">{invitation.rating}分</Text>
                      </View>
                    )}
                    <ChevronRight size={20} color="#D1D5DB" />
                  </View>
                </CardContent>
              </Card>
            )
          })
        )}
        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}
