import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { 
  Calendar, Clock, MapPin, CircleCheck, QrCode, Ticket
} from 'lucide-react-taro'

interface ActivityRegistration {
  id: number
  activity_id: number
  activity_title: string
  activity_cover: string
  activity_type: 'visit' | 'training' | 'lecture' | 'other'
  start_time: string
  end_time: string
  address: string
  location_type: 'online' | 'offline'
  status: 'pending' | 'confirmed' | 'attended' | 'cancelled'
  verification_code: string
  qr_code_url?: string
  is_verified: boolean
  verified_at?: string
  amount: number
  created_at: string
}

/**
 * 我的活动页面 - 查看已报名活动和核销码
 */
export default function MyActivitiesPage() {
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'ended'>('all')

  useDidShow(() => {
    loadRegistrations()
  })

  const loadRegistrations = async () => {
    setLoading(true)
    try {
      console.log('加载我的活动请求:', { url: '/api/my-activities' })
      const res = await Network.request({
        url: '/api/my-activities'
      })
      console.log('加载我的活动响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setRegistrations(list)
      }
    } catch (error) {
      console.error('加载我的活动失败:', error)
      // 使用模拟数据
      setRegistrations([
        {
          id: 1,
          activity_id: 1,
          activity_title: '北京四中探校活动',
          activity_cover: 'https://placehold.co/400x200/2563EB/white?text=探校活动',
          activity_type: 'visit',
          start_time: '2024-04-15 09:00',
          end_time: '2024-04-15 12:00',
          address: '北京市西城区北京四中',
          location_type: 'offline',
          status: 'confirmed',
          verification_code: 'ACT20240415001',
          is_verified: false,
          amount: 99,
          created_at: '2024-04-10 14:30'
        },
        {
          id: 2,
          activity_id: 2,
          activity_title: '新高考政策解读讲座',
          activity_cover: 'https://placehold.co/400x200/10B981/white?text=政策讲座',
          activity_type: 'lecture',
          start_time: '2024-04-20 14:00',
          end_time: '2024-04-20 16:00',
          address: '线上直播',
          location_type: 'online',
          status: 'confirmed',
          verification_code: 'ACT20240420002',
          is_verified: false,
          amount: 29,
          created_at: '2024-04-12 10:15'
        },
        {
          id: 3,
          activity_id: 3,
          activity_title: '家庭教育方法分享会',
          activity_cover: 'https://placehold.co/400x200/8B5CF6/white?text=家庭讲座',
          activity_type: 'lecture',
          start_time: '2024-03-20 14:00',
          end_time: '2024-03-20 16:00',
          address: '线上直播',
          location_type: 'online',
          status: 'attended',
          verification_code: 'ACT20240320003',
          is_verified: true,
          verified_at: '2024-03-20 14:05',
          amount: 0,
          created_at: '2024-03-15 09:20'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const showVerificationCode = (registration: ActivityRegistration) => {
    Taro.showModal({
      title: '活动核销码',
      content: `活动：${registration.activity_title}\n核销码：${registration.verification_code}\n\n请活动现场出示此核销码进行核销`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '复制核销码',
      success: (res) => {
        if (res.confirm) {
          Taro.setClipboardData({
            data: registration.verification_code,
            success: () => {
              Taro.showToast({ title: '已复制', icon: 'success' })
            }
          })
        }
      }
    })
  }

  const handleCancel = (registration: ActivityRegistration) => {
    Taro.showModal({
      title: '取消报名',
      content: `确定要取消"${registration.activity_title}"的报名吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/activities/${registration.activity_id}/cancel`,
              method: 'POST'
            })
            Taro.showToast({ title: '已取消报名', icon: 'success' })
            loadRegistrations()
          } catch (error) {
            Taro.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  }

  const getTypeTag = (type: ActivityRegistration['activity_type']) => {
    const typeMap = {
      visit: { label: '探校', color: 'bg-blue-100 text-blue-600' },
      training: { label: '研修', color: 'bg-green-100 text-green-600' },
      lecture: { label: '讲座', color: 'bg-purple-100 text-purple-600' },
      other: { label: '活动', color: 'bg-gray-100 text-gray-600' },
    }
    return typeMap[type]
  }

  const getStatusBadge = (status: ActivityRegistration['status'], isVerified: boolean) => {
    if (isVerified) {
      return <Badge className="bg-green-100 text-green-600"><Text className="text-xs">已核销</Text></Badge>
    }
    
    const statusMap = {
      pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-600' },
      confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-600' },
      attended: { label: '已参加', color: 'bg-green-100 text-green-600' },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
    }
    return <Badge className={statusMap[status].color}><Text className="text-xs">{statusMap[status].label}</Text></Badge>
  }

  const isActivityEnded = (endTime: string) => {
    return new Date(endTime) < new Date()
  }

  const filteredRegistrations = registrations.filter(r => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return !isActivityEnded(r.end_time) && r.status !== 'cancelled'
    if (activeTab === 'ended') return isActivityEnded(r.end_time) || r.status === 'cancelled'
    return true
  })

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex">
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Text className={activeTab === 'all' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              全部
            </Text>
          </View>
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Text className={activeTab === 'upcoming' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              进行中
            </Text>
          </View>
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'ended' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('ended')}
          >
            <Text className={activeTab === 'ended' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              已结束
            </Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 50px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredRegistrations.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Ticket size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无活动记录</Text>
            <Button 
              className="mt-4" 
              onClick={() => Taro.navigateTo({ url: '/pages/activities/index' })}
            >
              <Text className="text-white">浏览活动</Text>
            </Button>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {filteredRegistrations.map((registration) => {
              const typeTag = getTypeTag(registration.activity_type)
              const isEnded = isActivityEnded(registration.end_time)
              
              return (
                <Card 
                  key={registration.id}
                  className="bg-white overflow-hidden"
                  onClick={() => Taro.navigateTo({ url: `/pages/activity-detail/index?id=${registration.activity_id}` })}
                >
                  <View className="flex flex-row">
                    <Image 
                      src={registration.activity_cover}
                      className="w-24 h-24"
                      mode="aspectFill"
                    />
                    <View className="flex-1 p-3">
                      <View className="flex flex-row items-center gap-2 mb-1">
                        <Badge className={typeTag.color}>
                          <Text className="text-xs">{typeTag.label}</Text>
                        </Badge>
                        {registration.location_type === 'offline' && (
                          <Badge className="bg-orange-100 text-orange-600">
                            <Text className="text-xs">线下</Text>
                          </Badge>
                        )}
                        {registration.location_type === 'online' && (
                          <Badge className="bg-blue-100 text-blue-600">
                            <Text className="text-xs">线上</Text>
                          </Badge>
                        )}
                        {getStatusBadge(registration.status, registration.is_verified)}
                      </View>
                      
                      <Text className="text-base font-semibold line-clamp-1">{registration.activity_title}</Text>
                      
                      <View className="flex flex-row items-center gap-1 mt-1">
                        <Calendar size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500">{registration.start_time.split(' ')[0]}</Text>
                        <Clock size={12} color="#9CA3AF" className="ml-2" />
                        <Text className="text-xs text-gray-500">{registration.start_time.split(' ')[1]}</Text>
                      </View>
                      
                      <View className="flex flex-row items-center gap-1 mt-1">
                        <MapPin size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500 line-clamp-1">{registration.address}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* 核销码信息 */}
                  {!isEnded && registration.location_type === 'offline' && !registration.is_verified && (
                    <CardContent className="p-3 bg-orange-50 border-t border-orange-100">
                      <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row items-center gap-2">
                          <QrCode size={16} color="#F59E0B" />
                          <View>
                            <Text className="text-xs text-orange-600">核销码</Text>
                            <Text className="text-sm font-semibold text-orange-700">{registration.verification_code}</Text>
                          </View>
                        </View>
                        <Button 
                          size="sm" 
                          className="bg-orange-500"
                          onClick={(e) => { e.stopPropagation(); showVerificationCode(registration) }}
                        >
                          <Text className="text-white text-xs">查看</Text>
                        </Button>
                      </View>
                    </CardContent>
                  )}
                  
                  {/* 已核销信息 */}
                  {registration.is_verified && (
                    <CardContent className="p-3 bg-green-50 border-t border-green-100">
                      <View className="flex flex-row items-center gap-2">
                        <CircleCheck size={16} color="#10B981" />
                        <View>
                          <Text className="text-xs text-green-600">已核销</Text>
                          <Text className="text-xs text-green-500">核销时间：{registration.verified_at}</Text>
                        </View>
                      </View>
                    </CardContent>
                  )}
                  
                  {/* 操作按钮 */}
                  {!isEnded && registration.status !== 'cancelled' && !registration.is_verified && (
                    <CardContent className="p-3 border-t border-gray-100">
                      <View className="flex flex-row gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); handleCancel(registration) }}
                        >
                          <Text className="text-gray-600 text-xs">取消报名</Text>
                        </Button>
                        {registration.location_type === 'offline' && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); showVerificationCode(registration) }}
                          >
                            <Text className="text-white text-xs">出示核销码</Text>
                          </Button>
                        )}
                      </View>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </View>
        )}
        
        <View className="h-5" />
      </ScrollView>
    </View>
  )
}
