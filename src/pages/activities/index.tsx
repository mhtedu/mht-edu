import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { 
  Calendar, Clock, MapPin, Users
} from 'lucide-react-taro'

interface Activity {
  id: number
  title: string
  type: string
  cover_image: string
  start_time: string
  end_time: string
  address: string
  is_online: number
  online_price: string
  offline_price: string
  max_participants: number
  current_participants: number
  target_roles: number[] | string[]
  status: number
  is_active: number
}

/**
 * 活动列表页面
 */
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'ended'>('all')
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    loadActivities()
  })

  const loadActivities = async () => {
    setLoading(true)
    try {
      console.log('加载活动列表请求:', { url: '/api/activities/list' })
      const res = await Network.request({
        url: '/api/activities/list',
        data: { page: 1, pageSize: 50 },
        method: 'GET'
      })
      console.log('加载活动列表响应:', res.data)
      
      if (res.data && res.data.list) {
        setActivities(res.data.list)
      } else if (Array.isArray(res.data)) {
        setActivities(res.data)
      } else {
        setActivities([])
      }
    } catch (error) {
      console.error('加载活动失败:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      visit: { label: '探校', color: 'bg-blue-100 text-blue-600' },
      training: { label: '研修', color: 'bg-green-100 text-green-600' },
      lecture: { label: '讲座', color: 'bg-purple-100 text-purple-600' },
      activity: { label: '活动', color: 'bg-orange-100 text-orange-600' },
      promotion: { label: '促销', color: 'bg-red-100 text-red-600' },
      other: { label: '其他', color: 'bg-gray-100 text-gray-600' },
    }
    return typeMap[type] || typeMap.other
  }

  const getActivityStatus = (startTime: string, endTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    return 'ended'
  }

  const filteredActivities = activities.filter(a => {
    const status = getActivityStatus(a.start_time, a.end_time)
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return status === 'upcoming' || status === 'ongoing'
    if (activeTab === 'ended') return status === 'ended'
    return true
  })

  const handleActivityClick = (activityId: number) => {
    Taro.navigateTo({ url: `/pages/activity-detail/index?id=${activityId}` })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* Tab 切换 */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex flex-row">
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Text className={`text-base ${activeTab === 'all' ? 'text-blue-500 font-semibold' : 'text-gray-600'}`}>
              全部活动
            </Text>
          </View>
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Text className={`text-base ${activeTab === 'upcoming' ? 'text-blue-500 font-semibold' : 'text-gray-600'}`}>
              即将开始
            </Text>
          </View>
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'ended' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('ended')}
          >
            <Text className={`text-base ${activeTab === 'ended' ? 'text-blue-500 font-semibold' : 'text-gray-600'}`}>
              已结束
            </Text>
          </View>
        </View>
      </View>

      {/* 活动列表 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 50px)' }}>
        {loading ? (
          <View className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <View key={i} className="bg-white rounded-lg overflow-hidden">
                <Skeleton className="w-full h-40" />
                <View className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </View>
              </View>
            ))}
          </View>
        ) : filteredActivities.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Calendar size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4 text-lg">暂无活动</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {filteredActivities.map((activity) => {
              const typeTag = getTypeTag(activity.type)
              const status = getActivityStatus(activity.start_time, activity.end_time)
              const price = activity.is_online ? parseFloat(activity.online_price) : parseFloat(activity.offline_price)
              
              // 格式化时间
              const startDate = new Date(activity.start_time)
              const formatDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
              const formatTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
              
              return (
                <Card 
                  key={activity.id}
                  className="bg-white overflow-hidden"
                  onClick={() => handleActivityClick(activity.id)}
                >
                  {activity.cover_image && (
                    <Image 
                      src={activity.cover_image}
                      className="w-full h-40"
                      mode="aspectFill"
                    />
                  )}
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Badge className={typeTag.color}>
                        <Text className="text-xs">{typeTag.label}</Text>
                      </Badge>
                      {activity.is_online === 1 && (
                        <Badge className="bg-blue-100 text-blue-600">
                          <Text className="text-xs">线上</Text>
                        </Badge>
                      )}
                      <Badge className={status === 'upcoming' ? 'bg-green-100 text-green-600' : status === 'ongoing' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}>
                        <Text className="text-xs">{status === 'upcoming' ? '即将开始' : status === 'ongoing' ? '进行中' : '已结束'}</Text>
                      </Badge>
                    </View>
                    
                    <Text className="text-lg font-semibold">{activity.title}</Text>
                    
                    <View className="flex flex-row items-center gap-4 mt-2">
                      <View className="flex flex-row items-center gap-1">
                        <Calendar size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{formatDate}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-1">
                        <Clock size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{formatTime}</Text>
                      </View>
                    </View>
                    
                    {activity.address && (
                      <View className="flex flex-row items-center gap-1 mt-1">
                        <MapPin size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{activity.address}</Text>
                      </View>
                    )}
                    
                    <View className="flex flex-row items-center justify-between mt-3">
                      <View className="flex flex-row items-center gap-1">
                        <Users size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-500">
                          {activity.current_participants}/{activity.max_participants || '不限'}人已报名
                        </Text>
                      </View>
                      <Text className="text-orange-500 font-semibold">
                        {price === 0 ? '免费' : `¥${price}`}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
