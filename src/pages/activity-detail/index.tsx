import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, Clock, MapPin, Users, Phone
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
  description: string
  status: 'upcoming' | 'ongoing' | 'ended'
  contact_phone: string
  organizer: string
  schedule: string[]
}

/**
 * 活动详情页面
 */
export default function ActivityDetailPage() {
  const router = useRouter()
  const activityId = router.params.id ? parseInt(router.params.id) : 0
  
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  useDidShow(() => {
    loadActivity()
    checkRegistration()
  })

  const loadActivity = async () => {
    // 模拟数据
    const mockActivity: Activity = {
      id: activityId,
      title: '北京四中探校活动',
      type: 'visit',
      cover_image: 'https://placehold.co/750x400/2563EB/white?text=探校活动',
      start_time: '2024-04-15 09:00',
      end_time: '2024-04-15 12:00',
      address: '北京市西城区北京四中',
      is_online: false,
      online_price: 0,
      offline_price: 99,
      max_participants: 50,
      current_participants: 32,
      target_roles: [0],
      description: '带领家长深入参观北京四中校园环境，了解学校办学理念、师资力量、教学设施等。活动包含：\n\n1. 校园参观（约1小时）\n2. 学校介绍宣讲（约30分钟）\n3. 招生政策解读（约30分钟）\n4. 家长互动答疑（约30分钟）\n\n名额有限，报名从速！',
      status: 'upcoming',
      contact_phone: '400-888-8888',
      organizer: '棉花糖教育',
      schedule: ['09:00-09:15 签到入场', '09:15-10:15 校园参观', '10:15-10:45 学校介绍', '10:45-11:15 招生解读', '11:15-12:00 互动答疑']
    }
    setActivity(mockActivity)
  }

  const checkRegistration = async () => {
    // 检查是否已报名
    setIsRegistered(false)
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

  if (!activity) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  const typeTag = getTypeTag(activity.type)
  const remainingSpots = activity.max_participants - activity.current_participants

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50 pb-24">
      {/* 封面图 */}
      <Image 
        src={activity.cover_image}
        className="w-full h-52"
        mode="aspectFill"
      />

      {/* 活动信息 */}
      <View className="bg-white p-4">
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
        
        <Text className="text-xl font-bold">{activity.title}</Text>
        
        <View className="flex flex-row items-center gap-4 mt-3">
          <View className="flex flex-row items-center gap-1">
            <Calendar size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600">{activity.start_time.split(' ')[0]}</Text>
          </View>
          <View className="flex flex-row items-center gap-1">
            <Clock size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600">{activity.start_time.split(' ')[1]}</Text>
          </View>
        </View>
        
        <View className="flex flex-row items-center gap-1 mt-2">
          <MapPin size={14} color="#6B7280" />
          <Text className="text-sm text-gray-600">{activity.address}</Text>
        </View>
      </View>

      {/* 报名信息 */}
      <Card className="mx-4 mt-4">
        <CardContent className="p-4">
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Users size={20} color="#2563EB" />
              <Text className="font-semibold">报名人数</Text>
            </View>
            <Text className="text-orange-500 font-semibold">{activity.current_participants}/{activity.max_participants}</Text>
          </View>
          <View className="bg-gray-100 rounded-full h-2 mt-2">
            <View 
              className="bg-orange-500 rounded-full h-2"
              style={{ width: `${(activity.current_participants / activity.max_participants) * 100}%` }}
            />
          </View>
          <Text className="text-xs text-gray-500 mt-2">剩余 {remainingSpots} 个名额</Text>
        </CardContent>
      </Card>

      {/* 活动详情 */}
      <Card className="mx-4 mt-4">
        <CardContent className="p-4">
          <Text className="font-semibold mb-3">活动详情</Text>
          <Text className="text-sm text-gray-600 whitespace-pre-line">{activity.description}</Text>
        </CardContent>
      </Card>

      {/* 活动流程 */}
      {activity.schedule.length > 0 && (
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="font-semibold mb-3">活动流程</Text>
            {activity.schedule.map((item, idx) => (
              <View key={idx} className="flex flex-row items-start gap-3 py-2">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Text className="text-xs text-blue-600">{idx + 1}</Text>
                </View>
                <Text className="text-sm text-gray-600 flex-1">{item}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 联系方式 */}
      <Card className="mx-4 mt-4 mb-4">
        <CardContent className="p-4">
          <Text className="font-semibold mb-3">联系主办方</Text>
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-2">
              <Phone size={16} color="#6B7280" />
              <Text className="text-sm text-gray-600">{activity.contact_phone}</Text>
            </View>
            <Button size="sm" variant="outline" onClick={() => Taro.makePhoneCall({ phoneNumber: activity.contact_phone })}>
              <Text className="text-blue-600">拨打电话</Text>
            </Button>
          </View>
          <View className="flex flex-row items-center gap-2 mt-2">
            <Text className="text-sm text-gray-500">主办方：</Text>
            <Text className="text-sm text-gray-700">{activity.organizer}</Text>
          </View>
        </CardContent>
      </Card>

      {/* 底部报名按钮 */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', zIndex: 50 }}>
        <View className="flex-1">
          <Text className="text-sm text-gray-500">费用</Text>
          <Text className="text-xl font-bold text-orange-500">
            {activity.is_online && activity.online_price === 0 ? '免费' : 
             !activity.is_online && activity.offline_price === 0 ? '免费' : 
             `¥${activity.is_online ? activity.online_price : activity.offline_price}`}
          </Text>
        </View>
        <View className="flex-1">
          <Button 
            className="w-full" 
            disabled={isRegistered || activity.status !== 'upcoming'}
            onClick={() => {
              if (!activity) return
              const p = activity.is_online ? activity.online_price : activity.offline_price
              Taro.showModal({
                title: '确认报名',
                content: `活动：${activity.title}\n时间：${activity.start_time}\n费用：${p === 0 ? '免费' : `¥${p}`}`,
                confirmText: p > 0 ? '去支付' : '确认报名',
                success: (res) => {
                  if (res.confirm) {
                    if (p > 0) {
                      Taro.showToast({ title: '跳转支付...', icon: 'loading' })
                      setTimeout(() => {
                        setIsRegistered(true)
                        Taro.showToast({ title: '报名成功', icon: 'success' })
                      }, 1500)
                    } else {
                      setIsRegistered(true)
                      Taro.showToast({ title: '报名成功', icon: 'success' })
                    }
                  }
                }
              })
            }}
          >
            <Text className="text-white">
              {isRegistered ? '已报名' : activity.status !== 'upcoming' ? '活动已结束' : '立即报名'}
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}
