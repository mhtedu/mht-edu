import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Phone, MessageCircle, Star, MapPin, ChevronRight
} from 'lucide-react-taro'

interface ParentInfo {
  id: number
  nickname: string
  avatar: string
  phone: string
  wechat: string
  address: string
  student_count: number
  order_count: number
  total_hours: number
  rating: number
  created_at: string
  students: {
    name: string
    grade: string
    subjects: string[]
  }[]
  recent_orders: {
    id: number
    subject: string
    status: string
    created_at: string
  }[]
}

/**
 * 家长主页（教师端查看）
 */
export default function ParentProfilePage() {
  const router = useRouter()
  const parentId = router.params.id ? parseInt(router.params.id) : 0
  
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null)

  useDidShow(() => {
    loadParentInfo()
  })

  const loadParentInfo = async () => {
    // 模拟数据
    const mockInfo: ParentInfo = {
      id: parentId,
      nickname: '王家长',
      avatar: 'https://placehold.co/100/2563EB/white?text=王',
      phone: '138****8888',
      wechat: 'wang***',
      address: '北京市朝阳区望京',
      student_count: 2,
      order_count: 5,
      total_hours: 24,
      rating: 4.9,
      created_at: '2024-01-15',
      students: [
        { name: '王小明', grade: '高二', subjects: ['数学', '物理'] },
        { name: '王小红', grade: '初一', subjects: ['英语'] }
      ],
      recent_orders: [
        { id: 1, subject: '高中数学', status: 'in_progress', created_at: '2024-03-18' },
        { id: 2, subject: '初中英语', status: 'completed', created_at: '2024-03-15' }
      ]
    }
    setParentInfo(mockInfo)
  }

  if (!parentInfo) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50">
      {/* 头部信息 */}
      <View className="bg-gradient-to-b from-blue-500 to-blue-600 p-6 pb-20">
        <View className="flex items-center gap-4">
          <Image src={parentInfo.avatar} className="w-20 h-20 rounded-full border-2 border-white" />
          <View className="flex-1">
            <Text className="text-white text-xl font-semibold">{parentInfo.nickname}</Text>
            <View className="flex items-center gap-2 mt-1">
              <Star size={14} color="#FCD34D" />
              <Text className="text-white text-opacity-90 text-sm">{parentInfo.rating} 分</Text>
            </View>
            <Text className="text-white text-opacity-80 text-xs mt-1">
              注册于 {parentInfo.created_at}
            </Text>
          </View>
        </View>
      </View>

      {/* 统计卡片 */}
      <View className="mx-4 -mt-14">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <View className="grid grid-cols-3 gap-4">
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{parentInfo.student_count}</Text>
                <Text className="text-xs text-gray-500 mt-1">孩子</Text>
              </View>
              <View className="text-center border-x border-gray-100">
                <Text className="text-2xl font-bold text-blue-600">{parentInfo.order_count}</Text>
                <Text className="text-xs text-gray-500 mt-1">订单</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{parentInfo.total_hours}</Text>
                <Text className="text-xs text-gray-500 mt-1">课时</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 联系方式 */}
      <View className="mx-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <Text className="font-semibold mb-3">联系方式</Text>
            <View className="space-y-3">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Phone size={16} color="#6B7280" />
                  <Text className="text-gray-600">手机号</Text>
                </View>
                <Text>{parentInfo.phone}</Text>
              </View>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <MessageCircle size={16} color="#6B7280" />
                  <Text className="text-gray-600">微信号</Text>
                </View>
                <Text>{parentInfo.wechat}</Text>
              </View>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="text-gray-600">地址</Text>
                </View>
                <Text className="text-gray-900">{parentInfo.address}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 孩子信息 */}
      <View className="mx-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <Text className="font-semibold mb-3">孩子信息</Text>
            {parentInfo.students.map((student, idx) => (
              <View key={idx} className="border-b border-gray-100 last:border-0 py-3 last:py-0 first:pt-0">
                <View className="flex items-center justify-between mb-2">
                  <Text className="font-medium">{student.name}</Text>
                  <Badge className="bg-blue-100 text-blue-700">
                    <Text className="text-xs">{student.grade}</Text>
                  </Badge>
                </View>
                <View className="flex gap-2 flex-wrap">
                  {student.subjects.map((subject, sIdx) => (
                    <Badge key={sIdx} className="bg-gray-100 text-gray-600">
                      <Text className="text-xs">{subject}</Text>
                    </Badge>
                  ))}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 最近订单 */}
      <View className="mx-4 mt-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="font-semibold">最近订单</Text>
              <View 
                className="flex items-center"
                onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}
              >
                <Text className="text-sm text-gray-500">全部</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
            {parentInfo.recent_orders.map((order) => (
              <View 
                key={order.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })}
              >
                <View>
                  <Text className="font-medium">{order.subject}</Text>
                  <Text className="text-xs text-gray-400 mt-1">{order.created_at}</Text>
                </View>
                <Badge className={
                  order.status === 'in_progress' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }
                >
                  <Text className="text-xs">
                    {order.status === 'in_progress' ? '进行中' : '已完成'}
                  </Text>
                </Badge>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>

      {/* 底部操作栏 */}
      <View 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => Taro.navigateTo({ url: `/pages/chat/index?id=${parentId}&type=parent` })}
        >
          <MessageCircle size={18} color="#2563EB" />
          <Text className="text-blue-600 ml-1">发消息</Text>
        </Button>
        <Button className="flex-1" onClick={() => Taro.makePhoneCall({ phoneNumber: parentInfo.phone })}>
          <Phone size={18} color="white" />
          <Text className="text-white ml-1">打电话</Text>
        </Button>
      </View>
    </ScrollView>
  )
}
