import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { Bell, Megaphone, ShoppingCart, Heart, MessageCircle, ChevronRight } from 'lucide-react-taro'
import './index.css'

// 消息类型
interface MessageItem {
  id: number
  type: 'system' | 'order' | 'interact'
  title: string
  content: string
  time: string
  read: boolean
  icon?: string
}

const MessagePage: FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'order' | 'interact'>('all')

  useDidShow(() => {
    loadMessages()
  })

  usePullDownRefresh(() => {
    loadMessages().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/messages',
        data: { type: activeTab === 'all' ? undefined : activeTab }
      })
      console.log('消息列表响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setMessages(list)
      }
    } catch (error) {
      console.error('加载消息失败:', error)
      // 使用模拟数据
      setMessages([
        {
          id: 1,
          type: 'system',
          title: '系统通知',
          content: '欢迎使用棉花糖教育平台，祝您使用愉快！',
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
        },
        {
          id: 4,
          type: 'system',
          title: '活动通知',
          content: '双十一优惠活动即将开始，敬请期待！',
          time: '3天前',
          read: true
        },
        {
          id: 5,
          type: 'order',
          title: '订单完成',
          content: '您的课程订单已完成，快来评价吧！',
          time: '5天前',
          read: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'all' | 'system' | 'order' | 'interact') => {
    setActiveTab(tab)
    loadMessages()
  }

  const handleItemClick = (item: MessageItem) => {
    // 标记为已读
    if (!item.read) {
      Network.request({
        url: `/api/messages/${item.id}/read`,
        method: 'POST'
      }).catch(err => console.error('标记已读失败:', err))
      
      setMessages(prev => prev.map(m => 
        m.id === item.id ? { ...m, read: true } : m
      ))
    }

    // 根据消息类型跳转
    if (item.type === 'order') {
      Taro.navigateTo({ url: '/pages/orders/index' })
    } else if (item.type === 'interact') {
      Taro.navigateTo({ url: '/pages/profile/index' })
    }
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

  const filteredMessages = activeTab === 'all' 
    ? messages 
    : messages.filter(m => m.type === activeTab)

  const unreadCount = {
    all: messages.filter(m => !m.read).length,
    system: messages.filter(m => m.type === 'system' && !m.read).length,
    order: messages.filter(m => m.type === 'order' && !m.read).length,
    interact: messages.filter(m => m.type === 'interact' && !m.read).length
  }

  return (
    <View className="message-page">
      {/* 顶部导航栏 */}
      <View className="message-header">
        <Text className="header-title">消息中心</Text>
        <View className="header-right">
          <Bell size={20} color="#6B7280" />
        </View>
      </View>

      {/* 消息类型标签 */}
      <View className="message-tabs">
        <View 
          className={`message-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <Text className={`tab-text ${activeTab === 'all' ? 'active' : ''}`}>全部</Text>
          {unreadCount.all > 0 && (
            <View className="tab-badge">
              <Text className="badge-text">{unreadCount.all}</Text>
            </View>
          )}
        </View>
        <View 
          className={`message-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => handleTabChange('system')}
        >
          <Megaphone size={14} color={activeTab === 'system' ? '#2563EB' : '#6B7280'} />
          <Text className={`tab-text ${activeTab === 'system' ? 'active' : ''}`}>系统</Text>
          {unreadCount.system > 0 && (
            <View className="tab-badge">
              <Text className="badge-text">{unreadCount.system}</Text>
            </View>
          )}
        </View>
        <View 
          className={`message-tab ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => handleTabChange('order')}
        >
          <ShoppingCart size={14} color={activeTab === 'order' ? '#2563EB' : '#6B7280'} />
          <Text className={`tab-text ${activeTab === 'order' ? 'active' : ''}`}>订单</Text>
          {unreadCount.order > 0 && (
            <View className="tab-badge">
              <Text className="badge-text">{unreadCount.order}</Text>
            </View>
          )}
        </View>
        <View 
          className={`message-tab ${activeTab === 'interact' ? 'active' : ''}`}
          onClick={() => handleTabChange('interact')}
        >
          <Heart size={14} color={activeTab === 'interact' ? '#2563EB' : '#6B7280'} />
          <Text className={`tab-text ${activeTab === 'interact' ? 'active' : ''}`}>互动</Text>
          {unreadCount.interact > 0 && (
            <View className="tab-badge">
              <Text className="badge-text">{unreadCount.interact}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView scrollY className="message-scroll">
        {loading ? (
          <View className="loading-area">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((item) => (
            <View 
              key={item.id} 
              className={`message-item ${!item.read ? 'unread' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <View className="item-icon">
                {getIcon(item.type)}
              </View>
              <View className="item-content">
                <View className="item-header">
                  <Text className="item-title">{item.title}</Text>
                  <Text className="item-time">{item.time}</Text>
                </View>
                <Text className="item-desc">{item.content}</Text>
              </View>
              <ChevronRight size={16} color="#D1D5DB" />
            </View>
          ))
        ) : (
          <View className="empty-area">
            <Text className="empty-text">暂无消息</Text>
          </View>
        )}
        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default MessagePage
