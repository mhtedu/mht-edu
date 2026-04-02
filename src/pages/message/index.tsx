import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { formatTime } from '@/utils'
import { MessageCircle, Bell, ChevronRight } from 'lucide-react-taro'
import './index.css'

interface MessageItem {
  id: number
  from_user_id: number
  from_user_name: string
  from_user_avatar: string
  content: string
  type: string
  is_read: boolean
  created_at: string
  unread_count?: number
}

const MessagePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [systemMessages, setSystemMessages] = useState<MessageItem[]>([])

  const { isLoggedIn, token } = useUserStore()
  
  // 使用 token 来判断是否登录
  const isUserLoggedIn = isLoggedIn || !!token

  useLoad(() => {
    console.log('Message page loaded.')
    console.log('登录状态:', { isLoggedIn, token: token ? '有' : '无' })
  })

  useDidShow(() => {
    if (isUserLoggedIn) {
      loadMessages()
    } else {
      setLoading(false)
    }
  })

  const loadMessages = async () => {
    setLoading(true)
    try {
      console.log('加载消息列表请求:', { url: '/api/message/list' })
      const res = await Network.request({
        url: '/api/message/list',
        data: { page: 1, pageSize: 20 }
      })
      console.log('加载消息列表响应:', res.data)

      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        const chats = list.filter((m: MessageItem) => m.type === 'chat')
        const systems = list.filter((m: MessageItem) => m.type === 'system')
        setMessages(chats)
        setSystemMessages(systems)
      }
    } catch (error) {
      console.error('加载消息列表失败:', error)
      // 使用模拟数据
      setMessages([
        {
          id: 1,
          from_user_id: 2,
          from_user_name: '李老师',
          from_user_avatar: '',
          content: '您好，我看过您的需求了，方便详细沟通一下吗？',
          type: 'chat',
          is_read: false,
          created_at: '2024-01-15 14:30:00',
          unread_count: 2
        },
        {
          id: 2,
          from_user_id: 3,
          from_user_name: '王老师',
          from_user_avatar: '',
          content: '好的，那我们约周六下午2点试课',
          type: 'chat',
          is_read: true,
          created_at: '2024-01-14 10:20:00'
        }
      ])
      setSystemMessages([
        {
          id: 101,
          from_user_id: 0,
          from_user_name: '系统通知',
          from_user_avatar: '',
          content: '您关注的老师有了新的可预约时间',
          type: 'system',
          is_read: false,
          created_at: '2024-01-15 12:00:00',
          unread_count: 1
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const goToChat = (message: MessageItem) => {
    Taro.navigateTo({
      url: `/pages/message/chat?userId=${message.from_user_id}&name=${message.from_user_name}`
    })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  if (!isUserLoggedIn) {
    return (
      <View className="message-page">
        <View className="not-logged-in">
          <MessageCircle size={48} color="#D1D5DB" />
          <Text className="not-logged-text">登录后查看消息</Text>
          <Button className="login-btn" onClick={goToLogin}>立即登录</Button>
        </View>
      </View>
    )
  }

  return (
    <View className="message-page">
      <ScrollView scrollY className="message-scroll">
        {/* 系统消息 */}
        {systemMessages.length > 0 && (
          <Card className="message-card">
            <CardContent className="message-content">
              <View className="message-item" onClick={() => {}}>
                <View className="message-avatar system">
                  <Bell size={20} color="#F59E0B" />
                </View>
                <View className="message-info">
                  <View className="message-header">
                    <Text className="message-name">系统通知</Text>
                    <Text className="message-time">{formatTime(systemMessages[0].created_at)}</Text>
                  </View>
                  <Text className="message-content-text">{systemMessages[0].content}</Text>
                </View>
                {systemMessages[0].unread_count && systemMessages[0].unread_count > 0 && (
                  <Badge className="unread-badge">{systemMessages[0].unread_count}</Badge>
                )}
                <ChevronRight size={20} color="#D1D5DB" />
              </View>
            </CardContent>
          </Card>
        )}

        {/* 聊天消息 */}
        <Card className="message-card">
          <CardContent className="message-content">
            {loading ? (
              <>
                <Skeleton className="h-16 mb-3" />
                <Skeleton className="h-16" />
              </>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  className="message-item"
                  onClick={() => goToChat(msg)}
                >
                  <View className="message-avatar">
                    {msg.from_user_avatar ? (
                      <Image src={msg.from_user_avatar} className="avatar-img" mode="aspectFill" />
                    ) : (
                      <View className="avatar-placeholder">
                        <Text className="avatar-text">{msg.from_user_name?.[0]}</Text>
                      </View>
                    )}
                  </View>
                  <View className="message-info">
                    <View className="message-header">
                      <Text className="message-name">{msg.from_user_name}</Text>
                      <Text className="message-time">{formatTime(msg.created_at)}</Text>
                    </View>
                    <Text className="message-content-text">{msg.content}</Text>
                  </View>
                  {msg.unread_count && msg.unread_count > 0 && (
                    <Badge className="unread-badge">{msg.unread_count}</Badge>
                  )}
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>
              ))
            ) : (
              <View className="empty-state">
                <MessageCircle size={48} color="#D1D5DB" />
                <Text className="empty-text">暂无消息</Text>
              </View>
            )}
          </CardContent>
        </Card>

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default MessagePage
