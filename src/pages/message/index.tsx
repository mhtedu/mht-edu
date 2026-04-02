import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { useConfigStore } from '@/stores/config'
import { useUserStore } from '@/stores/user'
import { Bell, Megaphone, ShoppingCart, Heart, MessageCircle, ChevronRight, Phone, MessageSquare, Calendar, Clock, User, Check, X } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// 消息类型
interface MessageItem {
  id: number
  type: 'system' | 'order' | 'interact' | 'invitation'
  title: string
  content: string
  time: string
  read: boolean
  icon?: string
}

// 邀约类型
interface InvitationItem {
  id: number
  from_user_id: number
  to_user_id: number
  order_id: number | null
  invitation_type: 'exchange_contact' | 'exchange_wechat' | 'invite_trial' | 'invite_course'
  status: 0 | 1 | 2 | 3 // 待处理/已同意/已拒绝/已过期
  message: string
  trial_time: string | null
  trial_address: string | null
  response_message: string | null
  created_at: string
  from_nickname: string
  from_avatar: string
  from_role: number
  to_nickname: string
  to_avatar: string
  to_role: number
  order_subject?: string
  order_grade?: string
  contact_info?: {
    mobile: string
    wechat_id: string
  }
}

// 邀约类型映射
const invitationTypeMap: Record<string, { label: string; icon: any; color: string }> = {
  exchange_contact: { label: '交换联系方式', icon: Phone, color: '#10B981' },
  exchange_wechat: { label: '交换微信', icon: MessageCircle, color: '#2563EB' },
  invite_trial: { label: '邀约试课', icon: Calendar, color: '#F59E0B' },
  invite_course: { label: '邀约正式课程', icon: Clock, color: '#8B5CF6' },
}

// 邀约状态映射
const invitationStatusMap: Record<number, { label: string; color: string }> = {
  0: { label: '待处理', color: '#F59E0B' },
  1: { label: '已同意', color: '#10B981' },
  2: { label: '已拒绝', color: '#EF4444' },
  3: { label: '已过期', color: '#9CA3AF' },
}

const MessagePage: FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [invitations, setInvitations] = useState<InvitationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'order' | 'interact' | 'invitation'>('all')

  const { getSiteName } = useConfigStore()
  const { userInfo } = useUserStore()
  const userId = userInfo?.id

  useDidShow(() => {
    loadData()
  })

  usePullDownRefresh(() => {
    loadData().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadMessages(), loadInvitations()])
    setLoading(false)
  }

  const loadMessages = async () => {
    const siteName = getSiteName()
    try {
      // 调用消息提醒接口，传递用户ID（确保 userId 是数字类型）
      const effectiveUserId = userId || 401
      console.log('加载消息提醒，userId:', effectiveUserId)
      const res = await Network.request({
        url: `/api/message/reminders?userId=${effectiveUserId}&page=1&pageSize=50`
      })
      
      console.log('消息提醒响应:', res.data)
      
      if (res.data && res.data.list) {
        // 转换后端数据格式到前端格式
        const list = res.data.list.map((item: any) => {
          // 后端类型: 1-订单 2-评价 3-消息 4-系统
          // 前端类型: 'system' | 'order' | 'interact' | 'invitation'
          const typeMap: Record<number, 'system' | 'order' | 'interact'> = {
            1: 'order',     // 订单
            2: 'interact',  // 评价
            3: 'interact',  // 消息
            4: 'system',    // 系统
          }
          
          const typeTitleMap: Record<number, string> = {
            1: '订单消息',
            2: '评价消息',
            3: '互动消息',
            4: '系统通知',
          }
          
          return {
            id: item.id,
            type: typeMap[item.type] || 'system',
            title: typeTitleMap[item.type] || '消息通知',
            content: item.content,
            time: formatTime(item.created_at),
            read: item.is_read === 1,
            from_nickname: item.from_nickname,
            from_avatar: item.from_avatar,
            target_id: item.target_id,
          }
        })
        setMessages(list)
      }
    } catch (error) {
      console.error('加载消息失败:', error)
      // 如果未登录或请求失败，使用演示数据
      setMessages([
        {
          id: 1,
          type: 'system',
          title: '系统通知',
          content: `欢迎使用${siteName}平台，祝您使用愉快！`,
          time: '10:30',
          read: false
        },
        {
          id: 2,
          type: 'order',
          title: '订单消息',
          content: '您的订单已被老师接单，请及时确认。',
          time: '昨天',
          read: false
        },
        {
          id: 3,
          type: 'interact',
          title: '互动消息',
          content: '张老师回复了您的评价：感谢您的认可！',
          time: '2天前',
          read: true
        }
      ])
    }
  }

  const loadInvitations = async () => {
    try {
      const res = await Network.request({
        url: '/api/invitation/received',
        data: { page: 1, pageSize: 20 }
      })
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setInvitations(list)
      }
    } catch (error) {
      console.error('加载邀约失败:', error)
    }
  }

  const handleTabChange = (tab: 'all' | 'system' | 'order' | 'interact' | 'invitation') => {
    setActiveTab(tab)
  }

  const handleItemClick = (item: MessageItem) => {
    if (!item.read) {
      Network.request({
        url: `/api/messages/${item.id}/read`,
        method: 'POST'
      }).catch(err => console.error('标记已读失败:', err))
      
      setMessages(prev => prev.map(m => 
        m.id === item.id ? { ...m, read: true } : m
      ))
    }

    if (item.type === 'order') {
      Taro.navigateTo({ url: '/pages/orders/index' })
    }
  }

  const handleAcceptInvitation = async (invitation: InvitationItem) => {
    try {
      await Network.request({
        url: `/api/invitation/${invitation.id}/accept`,
        method: 'POST',
        data: { responseMessage: '好的，期待与您的合作！' }
      })
      Taro.showToast({ title: '已同意邀约', icon: 'success' })
      loadInvitations()
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleRejectInvitation = async (invitation: InvitationItem) => {
    try {
      await Network.request({
        url: `/api/invitation/${invitation.id}/reject`,
        method: 'POST',
        data: { responseMessage: '暂时不方便，抱歉。' }
      })
      Taro.showToast({ title: '已拒绝邀约', icon: 'success' })
      loadInvitations()
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleInvitationClick = (invitation: InvitationItem) => {
    // 跳转到邀约详情页或老师详情页
    const teacherId = invitation.from_role === 1 ? invitation.from_user_id : invitation.to_user_id
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${teacherId}` })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Bell size={20} color="#2563EB" />
      case 'order':
        return <ShoppingCart size={20} color="#10B981" />
      case 'interact':
        return <Heart size={20} color="#F59E0B" />
      default:
        return <MessageCircle size={20} color="#6B7280" />
    }
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(diff / 86400000)
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  const filteredMessages = activeTab === 'all' || activeTab === 'invitation' 
    ? messages 
    : messages.filter(m => m.type === activeTab)

  const unreadCount = {
    all: messages.filter(m => !m.read).length + invitations.filter(i => i.status === 0).length,
    system: messages.filter(m => m.type === 'system' && !m.read).length,
    order: messages.filter(m => m.type === 'order' && !m.read).length,
    interact: messages.filter(m => m.type === 'interact' && !m.read).length,
    invitation: invitations.filter(i => i.status === 0).length
  }

  // 渲染邀约卡片
  const renderInvitationCard = (invitation: InvitationItem) => {
    const typeInfo = invitationTypeMap[invitation.invitation_type]
    const statusInfo = invitationStatusMap[invitation.status]
    const IconComponent = typeInfo.icon
    const isReceived = true // 当前是收到的邀约列表

    return (
      <View key={`invitation-${invitation.id}`} className="bg-white mb-2">
        {/* 邀约头部 */}
        <View className="flex flex-row items-center px-4 py-3 border-b border-gray-100">
          <View className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
            <IconComponent size={20} color={typeInfo.color} />
          </View>
          <View className="flex-1">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-base font-medium text-gray-900">{typeInfo.label}</Text>
              <Badge 
                className={`${statusInfo.color === '#10B981' ? 'bg-green-100 text-green-700' : 
                  statusInfo.color === '#F59E0B' ? 'bg-yellow-100 text-yellow-700' :
                  statusInfo.color === '#EF4444' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {statusInfo.label}
              </Badge>
            </View>
            <Text className="text-xs text-gray-400">{formatTime(invitation.created_at)}</Text>
          </View>
        </View>

        {/* 邀约内容 */}
        <View className="px-4 py-3" onClick={() => handleInvitationClick(invitation)}>
          <View className="flex flex-row items-center mb-2">
            <User size={14} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1">
              {isReceived ? invitation.from_nickname : invitation.to_nickname}
            </Text>
            {invitation.order_subject && (
              <>
                <Text className="text-gray-300 mx-2">|</Text>
                <Text className="text-sm text-gray-500">{invitation.order_subject}</Text>
                {invitation.order_grade && (
                  <Text className="text-sm text-gray-400 ml-1">· {invitation.order_grade}</Text>
                )}
              </>
            )}
          </View>
          
          <Text className="text-sm text-gray-700 leading-relaxed">{invitation.message}</Text>

          {/* 试课信息 */}
          {invitation.invitation_type === 'invite_trial' && invitation.trial_time && (
            <View className="mt-2 p-3 bg-yellow-50 rounded-lg">
              <View className="flex flex-row items-center mb-1">
                <Calendar size={14} color="#F59E0B" />
                <Text className="text-sm text-yellow-700 ml-1">
                  {new Date(invitation.trial_time).toLocaleString('zh-CN', { 
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </Text>
              </View>
              {invitation.trial_address && (
                <Text className="text-xs text-yellow-600">{invitation.trial_address}</Text>
              )}
            </View>
          )}

          {/* 已同意时显示联系方式 */}
          {invitation.status === 1 && invitation.contact_info && (
            <View className="mt-2 p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-700 font-medium mb-1">联系方式已解锁</Text>
              {invitation.contact_info.mobile && (
                <Text className="text-sm text-green-600">手机: {invitation.contact_info.mobile}</Text>
              )}
              {invitation.contact_info.wechat_id && (
                <Text className="text-sm text-green-600">微信: {invitation.contact_info.wechat_id}</Text>
              )}
            </View>
          )}

          {/* 操作按钮 */}
          {invitation.status === 0 && (
            <View className="flex flex-row gap-3 mt-3">
              <Button 
                variant="outline"
                className="flex-1 border-gray-300 text-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRejectInvitation(invitation)
                }}
              >
                <X size={16} color="#6B7280" />
                <Text className="ml-1">拒绝</Text>
              </Button>
              <Button 
                className="flex-1 bg-blue-500"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAcceptInvitation(invitation)
                }}
              >
                <Check size={16} color="#fff" />
                <Text className="ml-1 text-white">同意</Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <View className="flex flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Text className="block text-lg font-semibold text-gray-900">消息中心</Text>
        <View className="p-2">
          <Bell size={20} color="#6B7280" />
        </View>
      </View>

      {/* 消息类型标签 */}
      <ScrollView scrollX className="flex flex-row items-center px-4 py-3 bg-white gap-2 mb-2">
        <View 
          className={`flex flex-row items-center px-3 py-2 rounded-full shrink-0 ${activeTab === 'all' ? 'bg-blue-50' : 'bg-gray-100'}`}
          onClick={() => handleTabChange('all')}
        >
          <Text className={`block text-sm ${activeTab === 'all' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>全部</Text>
          {unreadCount.all > 0 && (
            <View className="min-w-4 h-4 rounded-full bg-red-500 flex items-center justify-center px-1 ml-1">
              <Text className="block text-xs text-white font-medium">{unreadCount.all}</Text>
            </View>
          )}
        </View>
        <View 
          className={`flex flex-row items-center px-3 py-2 rounded-full shrink-0 gap-1 ${activeTab === 'invitation' ? 'bg-blue-50' : 'bg-gray-100'}`}
          onClick={() => handleTabChange('invitation')}
        >
          <MessageSquare size={14} color={activeTab === 'invitation' ? '#2563EB' : '#6B7280'} />
          <Text className={`block text-sm ${activeTab === 'invitation' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>邀约</Text>
          {unreadCount.invitation > 0 && (
            <View className="min-w-4 h-4 rounded-full bg-red-500 flex items-center justify-center px-1">
              <Text className="block text-xs text-white font-medium">{unreadCount.invitation}</Text>
            </View>
          )}
        </View>
        <View 
          className={`flex flex-row items-center px-3 py-2 rounded-full shrink-0 gap-1 ${activeTab === 'system' ? 'bg-blue-50' : 'bg-gray-100'}`}
          onClick={() => handleTabChange('system')}
        >
          <Megaphone size={14} color={activeTab === 'system' ? '#2563EB' : '#6B7280'} />
          <Text className={`block text-sm ${activeTab === 'system' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>系统</Text>
          {unreadCount.system > 0 && (
            <View className="min-w-4 h-4 rounded-full bg-red-500 flex items-center justify-center px-1">
              <Text className="block text-xs text-white font-medium">{unreadCount.system}</Text>
            </View>
          )}
        </View>
        <View 
          className={`flex flex-row items-center px-3 py-2 rounded-full shrink-0 gap-1 ${activeTab === 'order' ? 'bg-blue-50' : 'bg-gray-100'}`}
          onClick={() => handleTabChange('order')}
        >
          <ShoppingCart size={14} color={activeTab === 'order' ? '#2563EB' : '#6B7280'} />
          <Text className={`block text-sm ${activeTab === 'order' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>订单</Text>
        </View>
        <View 
          className={`flex flex-row items-center px-3 py-2 rounded-full shrink-0 gap-1 ${activeTab === 'interact' ? 'bg-blue-50' : 'bg-gray-100'}`}
          onClick={() => handleTabChange('interact')}
        >
          <Heart size={14} color={activeTab === 'interact' ? '#2563EB' : '#6B7280'} />
          <Text className={`block text-sm ${activeTab === 'interact' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>互动</Text>
        </View>
      </ScrollView>

      {/* 消息列表 */}
      <ScrollView scrollY className="h-screen box-border">
        {loading ? (
          <View className="py-10 text-center">
            <Text className="block text-sm text-gray-400">加载中...</Text>
          </View>
        ) : (
          <>
            {/* 邀约消息 */}
            {(activeTab === 'all' || activeTab === 'invitation') && invitations.length > 0 && (
              invitations.map(renderInvitationCard)
            )}

            {/* 普通消息 */}
            {(activeTab === 'all' || activeTab !== 'invitation') && filteredMessages.map((item) => (
              <View 
                key={`msg-${item.id}`} 
                className={`flex flex-row items-center px-4 py-4 bg-white mb-px ${!item.read ? 'bg-white' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 shrink-0">
                  {getIcon(item.type)}
                </View>
                <View className="flex-1 overflow-hidden">
                  <View className="flex flex-row items-center justify-between mb-1">
                    <Text className="block text-base font-medium text-gray-900">{item.title}</Text>
                    <Text className="block text-xs text-gray-400">{item.time}</Text>
                  </View>
                  <Text className="block text-sm text-gray-500 truncate">{item.content}</Text>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </View>
            ))}

            {/* 空状态 */}
            {((activeTab === 'invitation' && invitations.length === 0) || 
              (activeTab !== 'invitation' && filteredMessages.length === 0)) && (
              <View className="py-16 text-center">
                <Text className="block text-sm text-gray-400">暂无消息</Text>
              </View>
            )}
          </>
        )}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}

export default MessagePage
