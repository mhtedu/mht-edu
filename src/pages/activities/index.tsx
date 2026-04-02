import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Clock, MapPin, Users
} from 'lucide-react-taro'

interface Activity {
  id: number
  title: string
  type: 'visit' | 'training' | 'lecture' | 'other'
  cover_image: string
  start_time: string
  end_time: string
  address: string
  is_online: boolean
  online_price: number
  offline_price: number
  max_participants: number
  current_participants: number
  target_roles: number[]
  status: 'upcoming' | 'ongoing' | 'ended'
}

/**
 * 活动列表页面
 */
export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'ended'>('all')
  const [userRole, setUserRole] = useState(0)

  useDidShow(() => {
    const savedRole = Taro.getStorageSync('userRole')
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0)
    setUserRole(role)
    loadActivities()
  })

  const loadActivities = async () => {
    // 模拟数据
    const mockActivities: Activity[] = [
      {
        id: 1,
        title: '北京四中探校活动',
        type: 'visit',
        cover_image: 'https://placehold.co/400x200/2563EB/white?text=探校活动',
        start_time: '2024-04-15 09:00',
        end_time: '2024-04-15 12:00',
        address: '北京市西城区北京四中',
        is_online: false,
        online_price: 0,
        offline_price: 99,
        max_participants: 50,
        current_participants: 32,
        target_roles: [0],
        status: 'upcoming',
      },
      {
        id: 2,
        title: '新高考政策解读讲座',
        type: 'lecture',
        cover_image: 'https://placehold.co/400x200/10B981/white?text=政策讲座',
        start_time: '2024-04-20 14:00',
        end_time: '2024-04-20 16:00',
        address: '线上直播',
        is_online: true,
        online_price: 29,
        offline_price: 0,
        max_participants: 200,
        current_participants: 156,
        target_roles: [0, 1],
        status: 'upcoming',
      },
      {
        id: 3,
        title: '牛师教学技能提升研修',
        type: 'training',
        cover_image: 'https://placehold.co/400x200/EC4899/white?text=牛师研修',
        start_time: '2024-04-25 09:00',
        end_time: '2024-04-26 17:00',
        address: '海淀区牛师进修学校',
        is_online: false,
        online_price: 0,
        offline_price: 299,
        max_participants: 30,
        current_participants: 28,
        target_roles: [1],
        status: 'upcoming',
      },
      {
        id: 4,
        title: '家庭教育方法分享会',
        type: 'lecture',
        cover_image: 'https://placehold.co/400x200/8B5CF6/white?text=家庭讲座',
        start_time: '2024-03-20 14:00',
        end_time: '2024-03-20 16:00',
        address: '线上直播',
        is_online: true,
        online_price: 0,
        offline_price: 0,
        max_participants: 100,
        current_participants: 98,
        target_roles: [0],
        status: 'ended',
      },
    ]
    
    // 过滤当前角色可见的活动
    const visibleActivities = mockActivities.filter(a => a.target_roles.includes(userRole))
    setActivities(visibleActivities)
  }

  const getTypeTag = (type: Activity['type']) => {
    const typeMap = {
      visit: { label: '探校', color: 'bg-blue-100 text-blue-600' },
      training: { label: '研修', color: 'bg-green-100 text-green-600' },
      lecture: { label: '讲座', color: 'bg-purple-100 text-purple-600' },
      other: { label: '活动', color: 'bg-gray-100 text-gray-600' },
    }
    return typeMap[type]
  }

  const filteredActivities = activities.filter(a => {
    if (activeTab === 'all') return true
    if (activeTab === 'upcoming') return a.status === 'upcoming' || a.status === 'ongoing'
    if (activeTab === 'ended') return a.status === 'ended'
    return true
  })

  const handleActivityClick = (activityId: number) => {
    Taro.navigateTo({ url: `/pages/activity-detail/index?id=${activityId}` })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* Tab 切换 */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex">
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Text className={activeTab === 'all' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              全部活动
            </Text>
          </View>
          <View 
            className={`flex-1 py-3 text-center ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Text className={activeTab === 'upcoming' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
              即将开始
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

      {/* 活动列表 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 50px)' }}>
        {filteredActivities.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Calendar size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无活动</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {filteredActivities.map((activity) => {
              const typeTag = getTypeTag(activity.type)
              const price = activity.is_online ? activity.online_price : activity.offline_price
              
              return (
                <Card 
                  key={activity.id}
                  className="bg-white overflow-hidden"
                  onClick={() => handleActivityClick(activity.id)}
                >
                  <Image 
                    src={activity.cover_image}
                    className="w-full h-40"
                    mode="aspectFill"
                  />
                  <CardContent className="p-4">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Badge className={typeTag.color}>
                        <Text className="text-xs">{typeTag.label}</Text>
                      </Badge>
                      {activity.is_online && (
                        <Badge className="bg-blue-100 text-blue-600">
                          <Text className="text-xs">线上</Text>
                        </Badge>
                      )}
                      <Badge className={activity.status === 'upcoming' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        <Text className="text-xs">{activity.status === 'upcoming' ? '即将开始' : activity.status === 'ongoing' ? '进行中' : '已结束'}</Text>
                      </Badge>
                    </View>
                    
                    <Text className="text-lg font-semibold">{activity.title}</Text>
                    
                    <View className="flex flex-row items-center gap-4 mt-2">
                      <View className="flex flex-row items-center gap-1">
                        <Calendar size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{activity.start_time.split(' ')[0]}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-1">
                        <Clock size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-600">{activity.start_time.split(' ')[1]}</Text>
                      </View>
                    </View>
                    
                    <View className="flex flex-row items-center gap-1 mt-1">
                      <MapPin size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-600">{activity.address}</Text>
                    </View>
                    
                    <View className="flex flex-row items-center justify-between mt-3">
                      <View className="flex flex-row items-center gap-1">
                        <Users size={14} color="#6B7280" />
                        <Text className="text-sm text-gray-500">
                          {activity.current_participants}/{activity.max_participants}人已报名
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
