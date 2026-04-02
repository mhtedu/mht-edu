import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, MapPin, Star, Clock, BookOpen, Award, 
  MessageCircle, Phone
} from 'lucide-react-taro'

interface FavoriteTeacher {
  id: number
  name: string
  avatar: string
  subjects: string[]
  rating: number
  student_count: number
  teaching_years: number
  distance: number
  price_range: string
  education: string
  labels: string[]
  is_member: boolean
  favorited_at: string
}

/**
 * 收藏牛师页面（家长端）
 */
export default function FavoritesPage() {
  const [teachers, setTeachers] = useState<FavoriteTeacher[]>([])
  const [loading, setLoading] = useState(true)

  useDidShow(() => {
    loadFavorites()
  })

  const loadFavorites = () => {
    setLoading(true)
    // 模拟数据
    const mockTeachers: FavoriteTeacher[] = [
      {
        id: 1,
        name: '张老师',
        avatar: 'https://placehold.co/200/2563EB/white?text=张',
        subjects: ['高中数学', '高中物理'],
        rating: 4.9,
        student_count: 156,
        teaching_years: 8,
        distance: 1.2,
        price_range: '200-300',
        education: '北京大学硕士',
        labels: ['耐心细致', '提分快', '名校背景'],
        is_member: true,
        favorited_at: '2024-03-15'
      },
      {
        id: 2,
        name: '李老师',
        avatar: 'https://placehold.co/200/EC4899/white?text=李',
        subjects: ['初中英语', '小学英语'],
        rating: 4.8,
        student_count: 89,
        teaching_years: 5,
        distance: 2.5,
        price_range: '150-200',
        education: '北京外国语大学',
        labels: ['口语流利', '活泼有趣'],
        is_member: true,
        favorited_at: '2024-03-10'
      },
      {
        id: 3,
        name: '王老师',
        avatar: 'https://placehold.co/200/10B981/white?text=王',
        subjects: ['高中化学', '初中化学'],
        rating: 4.7,
        student_count: 67,
        teaching_years: 6,
        distance: 3.8,
        price_range: '180-250',
        education: '清华大学硕士',
        labels: ['重点高中牛师', '竞赛指导'],
        is_member: false,
        favorited_at: '2024-03-08'
      }
    ]
    setTeachers(mockTeachers)
    setLoading(false)
  }

  const handleRemoveFavorite = (teacher: FavoriteTeacher) => {
    Taro.showModal({
      title: '取消收藏',
      content: `确定取消收藏 ${teacher.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          setTeachers(teachers.filter(t => t.id !== teacher.id))
          Taro.showToast({ title: '已取消收藏', icon: 'success' })
        }
      }
    })
  }

  const handleViewDetail = (teacher: FavoriteTeacher) => {
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacher.id}` })
  }

  const handleChat = (teacher: FavoriteTeacher) => {
    Taro.navigateTo({ url: `/pages/chat/index?id=${teacher.id}&type=teacher` })
  }

  const handleCall = (_teacher: FavoriteTeacher) => {
    // 检查是否是会员或有匹配订单
    const isMember = Taro.getStorageSync('member_expire_role_0')
    if (!isMember) {
      Taro.showModal({
        title: '会员特权',
        content: '开通会员后可查看牛师联系方式',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' })
          }
        }
      })
      return
    }
    Taro.makePhoneCall({ phoneNumber: '138****8888' })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部统计 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex items-center justify-between">
          <View className="flex items-center">
            <Heart size={18} color="#EF4444" filled />
            <Text className="text-gray-600 ml-2">已收藏 {teachers.length} 位牛师</Text>
          </View>
        </View>
      </View>

      {/* 牛师列表 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 60px)' }}>
        {teachers.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Heart size={64} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无收藏的牛师</Text>
            <Button 
              className="mt-4"
              onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
            >
              <Text className="text-white">去发现牛师</Text>
            </Button>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="bg-white">
                <CardContent className="p-4">
                  {/* 牛师基本信息 */}
                  <View className="flex">
                    {/* 头像 */}
                    <View className="relative">
                      <Image 
                        src={teacher.avatar} 
                        className="w-20 h-20 rounded-xl"
                        mode="aspectFill"
                      />
                      {teacher.is_member && (
                        <Badge className="absolute -top-1 -right-1 bg-yellow-500">
                          <Text className="text-xs text-white">会员</Text>
                        </Badge>
                      )}
                    </View>

                    {/* 信息 */}
                    <View className="flex-1 ml-3">
                      <View className="flex items-center justify-between">
                        <View className="flex items-center">
                          <Text className="text-lg font-bold">{teacher.name}</Text>
                          <View className="flex items-center ml-2">
                            <Star size={14} color="#F59E0B" filled />
                            <Text className="text-sm text-yellow-600 ml-1">{teacher.rating}</Text>
                          </View>
                        </View>
                        <View 
                          className="p-2"
                          onClick={() => handleRemoveFavorite(teacher)}
                        >
                          <Heart size={20} color="#EF4444" filled />
                        </View>
                      </View>

                      <View className="flex items-center mt-1">
                        <MapPin size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{teacher.distance}km</Text>
                        <Text className="text-gray-300 mx-2">|</Text>
                        <Clock size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{teacher.teaching_years}年教龄</Text>
                        <Text className="text-gray-300 mx-2">|</Text>
                        <BookOpen size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{teacher.student_count}学生</Text>
                      </View>

                      <View className="flex flex-wrap gap-1 mt-2">
                        {teacher.subjects.map((subject, idx) => (
                          <Badge key={idx} className="bg-blue-50 text-blue-600">
                            <Text className="text-xs">{subject}</Text>
                          </Badge>
                        ))}
                      </View>

                      <View className="flex items-center mt-2">
                        <Award size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">{teacher.education}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 标签 */}
                  <View className="flex flex-wrap gap-2 mt-3">
                    {teacher.labels.map((label, idx) => (
                      <View key={idx} className="px-2 py-1 bg-gray-50 rounded">
                        <Text className="text-xs text-gray-600">{label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* 价格和操作 */}
                  <View className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <View>
                      <Text className="text-xs text-gray-400">课时费</Text>
                      <Text className="text-lg font-bold text-orange-500">¥{teacher.price_range}/h</Text>
                    </View>
                    <View className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCall(teacher)}
                      >
                        <Phone size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">电话</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleChat(teacher)}
                      >
                        <MessageCircle size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">咨询</Text>
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleViewDetail(teacher)}
                      >
                        <Text className="text-white">查看详情</Text>
                      </Button>
                    </View>
                  </View>

                  {/* 收藏时间 */}
                  <View className="mt-2 flex justify-end">
                    <Text className="text-xs text-gray-400">收藏于 {teacher.favorited_at}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
