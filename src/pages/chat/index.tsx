import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network } from '@/network'
import { 
  Phone, MessageCircle, Calendar, Clock, MapPin,
  Send, Check, X, User, CreditCard
} from 'lucide-react-taro'
import './index.css'

interface Message {
  id: number
  content: string
  type: 'text' | 'contact_request' | 'contact_accept' | 'contact_reject' | 'trial_request' | 'trial_accept' | 'trial_reject' | 'trial_modify' | 'trial_invitation'
  sender_id: number
  created_at: string
  extra?: {
    contact_type?: 'phone' | 'wechat'
    trial_time?: string
    trial_address?: string
    trial_duration?: number
    trial_fee?: number
    trial_subject?: string
    trial_status?: string
    invitation_id?: number
    new_time?: string
    new_address?: string
  }
}

/**
 * 聊天详情页面
 */
export default function ChatPage() {
  const router = useRouter()
  const targetId = router.params.id ? parseInt(router.params.id) : 0
  
  const [userRole, setUserRole] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [targetInfo, setTargetInfo] = useState({
    id: targetId,
    nickname: '',
    avatar: '',
    online: false
  })
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showTrialDialog, setShowTrialDialog] = useState(false)
  const [contactType, setContactType] = useState<'phone' | 'wechat'>('wechat')
  const [trialTime, setTrialTime] = useState('')
  const [trialAddress, setTrialAddress] = useState('')
  const [trialDuration, setTrialDuration] = useState(2)
  const [trialSubject, setTrialSubject] = useState('')
  const [trialFee, setTrialFee] = useState(100)
  const [sending, setSending] = useState(false)

  useDidShow(() => {
    const savedRole = Taro.getStorageSync('userRole')
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0)
    setUserRole(role)
    
    loadChatHistory()
    loadTargetInfo()
  })

  const loadChatHistory = async () => {
    // 模拟聊天记录
    setMessages(getMockMessages())
  }

  const loadTargetInfo = () => {
    // 根据角色设置目标信息
    if (userRole === 1) {
      // 牛师端 - 目标是家长
      setTargetInfo({
        id: targetId,
        nickname: '王家长',
        avatar: 'https://placehold.co/100/2563EB/white?text=王',
        online: true
      })
    } else {
      // 家长端 - 目标是牛师
      setTargetInfo({
        id: targetId,
        nickname: '张老师',
        avatar: 'https://placehold.co/100/2563EB/white?text=张',
        online: true
      })
    }
  }

  const getMockMessages = (): Message[] => [
    {
      id: 1,
      content: '您好，我看过孩子的学习情况了，基础还是不错的',
      type: 'text',
      sender_id: userRole === 1 ? 0 : targetId,
      created_at: '2024-03-20 10:00'
    },
    {
      id: 2,
      content: '您好张老师，孩子数学成绩一直不太稳定，想请老师帮忙辅导一下',
      type: 'text',
      sender_id: userRole === 1 ? targetId : 0,
      created_at: '2024-03-20 10:05'
    },
    {
      id: 3,
      content: '没问题，我们可以先安排一次试课，了解一下孩子的具体情况',
      type: 'text',
      sender_id: userRole === 1 ? 0 : targetId,
      created_at: '2024-03-20 10:10'
    }
  ]

  const handleSend = async () => {
    if (!inputText.trim()) return
    
    const newMsg: Message = {
      id: messages.length + 1,
      content: inputText,
      type: 'text',
      sender_id: 0,
      created_at: new Date().toLocaleString()
    }
    
    setMessages([...messages, newMsg])
    setInputText('')
  }

  // 申请交换联系方式
  const handleRequestContact = async () => {
    try {
      const newMsg: Message = {
        id: messages.length + 1,
        content: '',
        type: 'contact_request',
        sender_id: 0,
        created_at: new Date().toLocaleString(),
        extra: { contact_type: contactType }
      }
      
      setMessages([...messages, newMsg])
      setShowContactDialog(false)
      Taro.showToast({ title: '请求已发送', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '发送失败', icon: 'none' })
    }
  }

  // 发起试课邀请
  const handleRequestTrial = async () => {
    if (!trialTime || !trialAddress || !trialSubject) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    try {
      setSending(true)

      // 调用后端API创建试课邀约
      const res = await Network.request({
        url: '/api/trial-lesson/create',
        method: 'POST',
        data: {
          targetUserId: targetId,
          subject: trialSubject,
          trialTime: trialTime,
          trialAddress: trialAddress,
          trialDuration: trialDuration,
          trialFee: trialFee
        }
      }) as any

      if (res.data && res.data.code === 0) {
        const invitation = res.data.data

        const newMsg: Message = {
          id: messages.length + 1,
          content: '',
          type: 'trial_invitation',
          sender_id: 0,
          created_at: new Date().toLocaleString(),
          extra: {
            invitation_id: invitation.id,
            trial_time: trialTime,
            trial_address: trialAddress,
            trial_duration: trialDuration,
            trial_fee: trialFee,
            trial_subject: trialSubject,
            trial_status: 'pending'
          }
        }
        
        setMessages([...messages, newMsg])
        setShowTrialDialog(false)
        Taro.showToast({ title: '试课邀约已发送', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data?.msg || '发送失败', icon: 'none' })
      }
    } catch (error) {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setSending(false)
    }
  }

  // 处理对方的请求
  const handleResponse = async (msgId: number, action: 'accept' | 'reject' | 'modify') => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return

    let newType: Message['type']
    if (msg.type === 'contact_request') {
      newType = action === 'accept' ? 'contact_accept' : 'contact_reject'
    } else if (msg.type === 'trial_request' || msg.type === 'trial_invitation') {
      newType = action === 'accept' ? 'trial_accept' : action === 'reject' ? 'trial_reject' : 'trial_modify'
    } else {
      return
    }

    const newMsg: Message = {
      id: messages.length + 1,
      content: '',
      type: newType,
      sender_id: 0,
      created_at: new Date().toLocaleString(),
      extra: msg.extra
    }

    setMessages([...messages, newMsg])
    Taro.showToast({ 
      title: action === 'accept' ? '已同意' : action === 'reject' ? '已拒绝' : '已提出修改', 
      icon: 'success' 
    })
  }

  // 跳转到试课支付页
  const handlePayTrial = (invitationId: number) => {
    Taro.navigateTo({ url: `/pages/trial-pay/index?id=${invitationId}` })
  }

  // 跳转到试课详情页
  const handleViewTrial = (invitationId: number) => {
    Taro.navigateTo({ url: `/pages/trial-detail/index?id=${invitationId}` })
  }

  // 试课邀约状态配置
  const trialStatusConfig: Record<string, { label: string; colorClass: string }> = {
    pending: { label: '待支付', colorClass: 'bg-yellow-100 text-yellow-700' },
    paid: { label: '已支付', colorClass: 'bg-blue-100 text-blue-700' },
    confirmed: { label: '已确认', colorClass: 'bg-purple-100 text-purple-700' },
    success: { label: '试课成功', colorClass: 'bg-green-100 text-green-700' },
    failed: { label: '试课失败', colorClass: 'bg-red-100 text-red-700' },
    cancelled: { label: '已取消', colorClass: 'bg-gray-100 text-gray-500' },
    timeout: { label: '已超时', colorClass: 'bg-gray-100 text-gray-500' },
  }

  const renderMessage = (msg: Message) => {
    const isSelf = msg.sender_id === 0
    
    if (msg.type === 'text') {
      return (
        <View className={`msg-bubble ${isSelf ? 'self' : 'other'}`}>
          <Text>{msg.content}</Text>
        </View>
      )
    }
    
    if (msg.type === 'contact_request') {
      return (
        <View className={`msg-card ${isSelf ? 'self' : 'other'}`}>
          <View className="msg-card-header">
            <Phone size={16} color="#2563EB" />
            <Text className="font-semibold ml-1">
              {(msg.extra && msg.extra.contact_type) === 'wechat' ? '交换微信' : '交换手机号'}
            </Text>
          </View>
          <Text className="text-sm text-gray-500 mt-2">
            {isSelf ? '您请求交换联系方式' : '对方请求交换联系方式'}
          </Text>
          {!isSelf && (
            <View className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 bg-green-500" onClick={() => handleResponse(msg.id, 'accept')}>
                <Check size={14} color="white" />
                <Text className="text-white ml-1">同意</Text>
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500" onClick={() => handleResponse(msg.id, 'reject')}>
                <X size={14} color="#EF4444" />
                <Text className="text-red-500 ml-1">拒绝</Text>
              </Button>
            </View>
          )}
        </View>
      )
    }
    
    if (msg.type === 'contact_accept') {
      return (
        <View className={`msg-card ${isSelf ? 'self' : 'other'}`}>
          <View className="msg-card-header">
            <Check size={16} color="#10B981" />
            <Text className="font-semibold ml-1 text-green-600">已同意交换联系方式</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-2">
            {isSelf ? '您已同意，对方可查看您的联系方式' : '对方已同意，您可查看对方的联系方式'}
          </Text>
        </View>
      )
    }
    
    // 试课邀约卡片（新版）
    if (msg.type === 'trial_invitation') {
      const status = msg.extra?.trial_status || 'pending'
      const statusInfo = trialStatusConfig[status] || trialStatusConfig.pending
      
      return (
        <Card className={`w-72 ${isSelf ? 'bg-blue-50' : 'bg-white'}`}>
          <CardHeader className="pb-2">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Calendar size={16} color="#2563EB" />
                <CardTitle className="text-base">试课邀约</CardTitle>
              </View>
              <Badge className={statusInfo.colorClass}>
                <Text className="text-xs">{statusInfo.label}</Text>
              </Badge>
            </View>
          </CardHeader>
          <CardContent>
            <View className="space-y-2">
              <View className="flex items-center gap-2">
                <Clock size={14} color="#6B7280" />
                <Text className="text-sm">{msg.extra?.trial_time}</Text>
              </View>
              <View className="flex items-center gap-2">
                <MapPin size={14} color="#6B7280" />
                <Text className="text-sm">{msg.extra?.trial_address}</Text>
              </View>
              <View className="flex items-center gap-2">
                <MessageCircle size={14} color="#6B7280" />
                <Text className="text-sm">{msg.extra?.trial_subject} · {msg.extra?.trial_duration}小时</Text>
              </View>
              
              <View className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Text className="text-sm text-gray-500">试课费</Text>
                <Text className="text-lg font-semibold text-orange-500">¥{msg.extra?.trial_fee}</Text>
              </View>
            </View>

            {/* 操作按钮 */}
            {status === 'pending' && !isSelf && (
              <View className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="flex-1 bg-orange-500" 
                  onClick={() => handlePayTrial(msg.extra?.invitation_id || 0)}
                >
                  <CreditCard size={14} color="white" />
                  <Text className="text-white ml-1">立即支付</Text>
                </Button>
              </View>
            )}

            {(status === 'success' || status === 'failed' || status === 'cancelled') && (
              <View className="mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full" 
                  onClick={() => handleViewTrial(msg.extra?.invitation_id || 0)}
                >
                  <Text>查看详情</Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>
      )
    }
    
    if (msg.type === 'trial_request') {
      return (
        <View className={`msg-card ${isSelf ? 'self' : 'other'}`}>
          <View className="msg-card-header">
            <Calendar size={16} color="#2563EB" />
            <Text className="font-semibold ml-1">试课邀请</Text>
          </View>
          <View className="mt-3 space-y-2">
            <View className="flex items-center gap-2">
              <Clock size={14} color="#6B7280" />
              <Text className="text-sm">{msg.extra && msg.extra.trial_time}</Text>
            </View>
            <View className="flex items-center gap-2">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-sm">{msg.extra && msg.extra.trial_address}</Text>
            </View>
            <Text className="text-xs text-gray-400">时长：{msg.extra && msg.extra.trial_duration}小时</Text>
          </View>
          {!isSelf && (
            <View className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1 bg-green-500" onClick={() => handleResponse(msg.id, 'accept')}>
                <Check size={14} color="white" />
                <Text className="text-white ml-1">接受</Text>
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleResponse(msg.id, 'modify')}>
                <Text>修改</Text>
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-red-500" onClick={() => handleResponse(msg.id, 'reject')}>
                <X size={14} color="#EF4444" />
                <Text className="text-red-500 ml-1">拒绝</Text>
              </Button>
            </View>
          )}
        </View>
      )
    }
    
    if (msg.type === 'trial_accept') {
      return (
        <View className={`msg-card ${isSelf ? 'self' : 'other'}`}>
          <View className="msg-card-header">
            <Check size={16} color="#10B981" />
            <Text className="font-semibold ml-1 text-green-600">已接受试课邀请</Text>
          </View>
          <View className="mt-2 text-sm text-gray-500">
            <Text>时间：{msg.extra && msg.extra.trial_time}</Text>
            <Text>地点：{msg.extra && msg.extra.trial_address}</Text>
          </View>
        </View>
      )
    }
    
    return null
  }

  return (
    <View className="chat-page">
      {/* 头部 */}
      <View className="chat-header">
        <View className="flex items-center gap-3">
          <Image src={targetInfo.avatar} className="w-10 h-10 rounded-full" />
          <View>
            <Text className="font-semibold">{targetInfo.nickname}</Text>
            <Text className="text-xs text-gray-500">
              {targetInfo.online ? '在线' : '离线'}
            </Text>
          </View>
        </View>
        <View 
          className="p-2"
          onClick={() => Taro.navigateTo({ 
            url: userRole === 0 ? `/pages/teacher-detail/index?id=${targetId}` : `/pages/parent-profile/index?id=${targetId}`
          })}
        >
          <User size={20} color="#2563EB" />
        </View>
      </View>

      {/* 功能按钮 */}
      <View className="action-bar">
        <View 
          className="action-item"
          onClick={() => setShowContactDialog(true)}
        >
          <Phone size={18} color="#2563EB" />
          <Text className="text-xs text-blue-500 mt-1">交换联系方式</Text>
        </View>
        <View 
          className="action-item"
          onClick={() => setShowTrialDialog(true)}
        >
          <Calendar size={18} color="#2563EB" />
          <Text className="text-xs text-blue-500 mt-1">发起试课</Text>
        </View>
        <View 
          className="action-item"
          onClick={() => Taro.navigateTo({ url: `/pages/trial-detail/index?id=1` })}
        >
          <MessageCircle size={18} color="#2563EB" />
          <Text className="text-xs text-blue-500 mt-1">试课记录</Text>
        </View>
      </View>

      {/* 消息列表 */}
      <ScrollView scrollY className="msg-list">
        {messages.map((msg) => {
          const isSelf = msg.sender_id === 0
          return (
            <View key={msg.id} className={`msg-item ${isSelf ? 'self' : 'other'}`}>
              {!isSelf && (
                <Image src={targetInfo.avatar} className="msg-avatar" />
              )}
              {renderMessage(msg)}
              {isSelf && (
                <Image 
                  src="https://placehold.co/100/7C3AED/white?text=我" 
                  className="msg-avatar" 
                />
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* 输入栏 */}
      <View className="input-bar">
        <View className="flex-1 bg-gray-100 rounded-full px-4 py-2">
          <Input
            className="w-full border-0 bg-transparent"
            placeholder="输入消息..."
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
          />
        </View>
        <Button size="sm" className="ml-2 rounded-full" onClick={handleSend}>
          <Send size={16} color="white" />
        </Button>
      </View>

      {/* 交换联系方式弹窗 */}
      {showContactDialog && (
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="w-72">
            <DialogHeader>
              <DialogTitle>申请交换联系方式</DialogTitle>
            </DialogHeader>
            <View className="flex flex-col gap-3 mt-4">
              <View 
                className={`p-3 rounded-lg border ${contactType === 'wechat' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setContactType('wechat')}
              >
                <Text className={contactType === 'wechat' ? 'text-blue-600' : ''}>交换微信</Text>
              </View>
              <View 
                className={`p-3 rounded-lg border ${contactType === 'phone' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setContactType('phone')}
              >
                <Text className={contactType === 'phone' ? 'text-blue-600' : ''}>交换手机号</Text>
              </View>
              <View className="flex gap-3 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowContactDialog(false)}>
                  <Text>取消</Text>
                </Button>
                <Button className="flex-1" onClick={handleRequestContact}>
                  <Text className="text-white">发送请求</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}

      {/* 发起试课弹窗 */}
      {showTrialDialog && (
        <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>发起试课邀约</DialogTitle>
            </DialogHeader>
            <View className="flex flex-col gap-4 mt-4">
              <View>
                <Text className="text-sm text-gray-500 mb-1">试课科目</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Input
                    className="border-0 bg-transparent"
                    placeholder="如：数学、英语"
                    value={trialSubject}
                    onInput={(e) => setTrialSubject(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">试课时间</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Input
                    className="border-0 bg-transparent"
                    placeholder="如：2024-03-23 14:00"
                    value={trialTime}
                    onInput={(e) => setTrialTime(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">试课地点</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Input
                    className="border-0 bg-transparent"
                    placeholder="请输入详细地址"
                    value={trialAddress}
                    onInput={(e) => setTrialAddress(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">试课时长（小时）</Text>
                <View className="flex gap-2">
                  {[1, 2, 3, 4].map((h) => (
                    <View
                      key={h}
                      className={`flex-1 py-2 rounded-lg text-center ${trialDuration === h ? 'bg-blue-500' : 'bg-gray-100'}`}
                      onClick={() => setTrialDuration(h)}
                    >
                      <Text className={trialDuration === h ? 'text-white' : 'text-gray-700'}>{h}小时</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View>
                <Text className="text-sm text-gray-500 mb-1">试课费用（元）</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Input
                    type="number"
                    className="border-0 bg-transparent"
                    placeholder="请输入试课费用"
                    value={trialFee.toString()}
                    onInput={(e) => setTrialFee(parseInt(e.detail.value) || 0)}
                  />
                </View>
              </View>
              <View className="flex gap-3 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowTrialDialog(false)}>
                  <Text>取消</Text>
                </Button>
                <Button className="flex-1" onClick={handleRequestTrial} disabled={sending}>
                  <Text className="text-white">{sending ? '发送中...' : '发送邀约'}</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
