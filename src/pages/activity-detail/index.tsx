import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { autoLockOnPageLoad } from '@/utils/referral-lock'
import { useSiteConfig } from '@/store'
import { 
  Calendar, Clock, MapPin, Users, Phone, CircleCheck
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
  location_type: 'online' | 'offline'
  verification_code?: string
}

/**
 * 活动详情页面
 */
export default function ActivityDetailPage() {
  const router = useRouter()
  const siteName = useSiteConfig(state => state.getSiteName)()
  const activityId = router.params.id ? parseInt(router.params.id) : 0
  
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    // 尝试通过分享链接锁定分销关系
    autoLockOnPageLoad(router.params).then(() => {
      console.log('[活动详情] 分销锁定处理完成')
    })
    loadActivity()
    checkRegistration()
  })

  const loadActivity = async () => {
    setLoading(true)
    try {
      console.log('加载活动详情请求:', { url: `/api/activities/${activityId}` })
      const res = await Network.request({
        url: `/api/activities/${activityId}`
      })
      console.log('加载活动详情响应:', res.data)
      if (res.data) {
        setActivity(res.data)
      } else {
        // 使用模拟数据
        setActivity({
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
          organizer: siteName,
          schedule: ['09:00-09:15 签到入场', '09:15-10:15 校园参观', '10:15-10:45 学校介绍', '10:45-11:15 招生解读', '11:15-12:00 互动答疑'],
          location_type: 'offline'
        })
      }
    } catch (error) {
      console.error('加载活动详情失败:', error)
      // 使用模拟数据
      setActivity({
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
        organizer: siteName,
        schedule: ['09:00-09:15 签到入场', '09:15-10:15 校园参观', '10:15-10:45 学校介绍', '10:45-11:15 招生解读', '11:15-12:00 互动答疑'],
        location_type: 'offline'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkRegistration = async () => {
    try {
      const res = await Network.request({
        url: `/api/activities/${activityId}/registration`
      })
      if (res.data && res.data.is_registered) {
        setIsRegistered(true)
        if (activity) {
          setActivity({ ...activity, verification_code: res.data.verification_code })
        }
      }
    } catch (error) {
      console.log('检查报名状态失败:', error)
      setIsRegistered(false)
    }
  }

  const handleRegister = async () => {
    if (!activity) return
    
    const price = activity.location_type === 'online' ? activity.online_price : activity.offline_price
    
    Taro.showModal({
      title: '确认报名',
      content: `活动：${activity.title}\n时间：${activity.start_time}\n地点：${activity.address}\n费用：${price === 0 ? '免费' : `¥${price}`}`,
      confirmText: price > 0 ? '去支付' : '确认报名',
      success: async (res) => {
        if (res.confirm) {
          if (price > 0) {
            // 付费活动 - 跳转支付
            Taro.showLoading({ title: '创建订单...' })
            try {
              const orderRes = await Network.request({
                url: '/api/activity-orders',
                method: 'POST',
                data: {
                  activity_id: activityId,
                  amount: price,
                  location_type: activity.location_type
                }
              })
              Taro.hideLoading()
              
              if (orderRes.data && orderRes.data.order_id) {
                // 跳转到支付页面
                Taro.navigateTo({ 
                  url: `/pages/pay/index?order_id=${orderRes.data.order_id}&type=activity`
                })
              }
            } catch (error) {
              Taro.hideLoading()
              Taro.showToast({ title: '创建订单失败', icon: 'none' })
            }
          } else {
            // 免费活动 - 直接报名
            Taro.showLoading({ title: '报名中...' })
            try {
              await Network.request({
                url: `/api/activities/${activityId}/register`,
                method: 'POST',
                data: { location_type: activity.location_type }
              })
              Taro.hideLoading()
              setIsRegistered(true)
              Taro.showToast({ title: '报名成功', icon: 'success' })
              
              // 如果是线下活动，提示查看核销码
              if (activity.location_type === 'offline') {
                setTimeout(() => {
                  Taro.showModal({
                    title: '报名成功',
                    content: '您已成功报名！请保存核销码，活动当天出示核销。',
                    confirmText: '查看核销码',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        Taro.navigateTo({ url: '/pages/my-activities/index' })
                      }
                    }
                  })
                }, 1500)
              }
            } catch (error) {
              Taro.hideLoading()
              Taro.showToast({ title: '报名失败', icon: 'none' })
            }
          }
        }
      }
    })
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

  if (loading || !activity) {
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
          {activity.location_type === 'online' && (
            <Badge className="bg-blue-100 text-blue-600">
              <Text className="text-xs">线上</Text>
            </Badge>
          )}
          {activity.location_type === 'offline' && (
            <Badge className="bg-orange-100 text-orange-600">
              <Text className="text-xs">线下</Text>
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

      {/* 已报名提示（线下活动显示核销码入口） */}
      {isRegistered && activity.location_type === 'offline' && (
        <Card className="mx-4 mt-4 bg-green-50">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center gap-2">
                <CircleCheck size={20} color="#10B981" />
                <Text className="font-semibold text-green-700">已报名成功</Text>
              </View>
              <Button 
                size="sm" 
                onClick={() => Taro.navigateTo({ url: '/pages/my-activities/index' })}
              >
                <Text className="text-white text-sm">查看核销码</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}

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
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
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
            {activity.location_type === 'online' && activity.online_price === 0 ? '免费' : 
             activity.location_type === 'offline' && activity.offline_price === 0 ? '免费' : 
             `¥${activity.location_type === 'online' ? activity.online_price : activity.offline_price}`}
          </Text>
        </View>
        <View className="flex-1">
          <Button 
            className="w-full" 
            disabled={isRegistered || activity.status !== 'upcoming'}
            onClick={handleRegister}
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
