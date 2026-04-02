import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, MapPin, Clock, Users, Search } from 'lucide-react-taro'

export default function EliteClassList() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('定位中...')

  const subjects = ['全部', '数学', '英语', '物理', '化学', '语文', '生物']

  useEffect(() => {
    loadClasses()
    // 获取定位
    Taro.getLocation({ type: 'gcj02' }).then(() => {
      // 根据坐标获取城市名（简化处理）
      setCity('北京')
    }).catch(() => {
      setCity('北京')
    })
  }, [subject, city])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/elite-class/list',
        method: 'GET',
        data: {
          subject: subject === '全部' ? undefined : subject,
          keyword,
          city,
          page: 1,
          pageSize: 20,
        }
      })
      const data = (res as any).data && (res as any).data.data || []
      console.log('牛师班列表:', data)
      setClasses(data)
    } catch (error) {
      console.error('加载牛师班列表失败:', error)
      // 使用模拟数据
      setClasses([
        {
          id: 1,
          class_name: '中考数学冲刺班',
          subject: '数学',
          teacher_nickname: '张老师',
          teacher_avatar: '',
          teacher_rating: 4.9,
          teaching_years: 8,
          start_time: '2025-01-15 14:00:00',
          total_lessons: 20,
          current_lesson: 0,
          address: '北京市朝阳区望京西园四区',
          hourly_rate: 180,
          max_students: 10,
          current_students: 3,
          distance: 2.5,
          distance_text: '2.5km',
          remaining_seats: 7,
          status: 0,
          description: '针对中考数学重点难点，系统讲解函数、几何、方程等核心知识点。'
        },
        {
          id: 2,
          class_name: '英语口语提升班',
          subject: '英语',
          teacher_nickname: '李老师',
          teacher_avatar: '',
          teacher_rating: 4.8,
          teaching_years: 6,
          start_time: '2025-01-18 10:00:00',
          total_lessons: 15,
          current_lesson: 0,
          address: '北京市海淀区中关村南大街',
          hourly_rate: 150,
          max_students: 8,
          current_students: 2,
          distance: 3.2,
          distance_text: '3.2km',
          remaining_seats: 6,
          status: 0,
          description: '外教口语互动，提升英语口语表达能力。'
        },
        {
          id: 3,
          class_name: '高考物理冲刺班',
          subject: '物理',
          teacher_nickname: '王老师',
          teacher_avatar: '',
          teacher_rating: 4.95,
          teaching_years: 12,
          start_time: '2025-01-22 15:00:00',
          total_lessons: 25,
          current_lesson: 0,
          address: '北京市东城区东直门',
          hourly_rate: 220,
          max_students: 12,
          current_students: 4,
          distance: 4.1,
          distance_text: '4.1km',
          remaining_seats: 8,
          status: 0,
          description: '高校牛师主讲，深入浅出讲解高中物理重点难点。'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (classId: number) => {
    Taro.navigateTo({ url: `/pages/elite-class-detail/index?id=${classId}` })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <Badge className="bg-green-100 text-green-700">招生中</Badge>
      case 1: return <Badge className="bg-blue-100 text-blue-700">进行中</Badge>
      case 2: return <Badge className="bg-gray-100 text-gray-600">已结束</Badge>
      default: return null
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex flex-row items-center gap-2">
          <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex flex-row items-center gap-2">
            <Search size={18} color="#999" />
            <Input
              className="flex-1 bg-transparent text-sm"
              placeholder="搜索班级名称、牛师"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />
          </View>
          <Button size="sm" className="bg-blue-600 text-white" onClick={loadClasses}>
            搜索
          </Button>
        </View>
      </View>

      {/* 科目筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Tabs value={subject} onValueChange={setSubject}>
          <TabsList className="flex flex-row gap-2 overflow-x-auto">
            {subjects.map(s => (
              <TabsTrigger
                key={s}
                value={s}
                className="px-4 py-2 text-sm whitespace-nowrap"
              >
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>

      {/* 班级列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-8">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : classes.length === 0 ? (
          <View className="text-center py-8">
            <GraduationCap size={48} color="#ccc" className="mx-auto mb-3" />
            <Text className="text-gray-400 block">暂无牛师班</Text>
            <Text className="text-gray-300 block text-sm mt-1">换个筛选条件试试</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {classes.map((item) => (
              <Card
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
                onClick={() => goToDetail(item.id)}
              >
                <CardContent className="p-4">
                  {/* 头部：班级名和状态 */}
                  <View className="flex flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <View className="flex flex-row items-center gap-2 mb-1">
                        <Text className="text-base font-semibold text-gray-800">{item.class_name}</Text>
                        {getStatusBadge(item.status)}
                      </View>
                      <Badge variant="outline" className="text-xs">
                        {item.subject}
                      </Badge>
                    </View>
                    <View className="text-right">
                      <Text className="text-lg font-bold text-blue-600">¥{item.hourly_rate}</Text>
                      <Text className="text-xs text-gray-400">/课时</Text>
                    </View>
                  </View>

                  {/* 牛师信息 */}
                  <View className="flex flex-row items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                    <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Text className="text-blue-600 font-semibold text-sm">
                        {item.teacher_nickname && item.teacher_nickname.charAt(0) || '师'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex flex-row items-center gap-2">
                        <Text className="text-sm font-medium text-gray-700">{item.teacher_nickname}</Text>
                        <Text className="text-xs text-yellow-600">⭐ {item.teacher_rating}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">教龄{item.teaching_years}年</Text>
                    </View>
                  </View>

                  {/* 详情信息 */}
                  <View className="flex flex-col gap-2">
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <Clock size={14} color="#999" />
                      <Text>开课：{formatDate(item.start_time)} · 共{item.total_lessons}课时</Text>
                    </View>
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <MapPin size={14} color="#999" />
                      <Text className="flex-1 truncate">{item.address}</Text>
                      {item.distance_text && (
                        <Text className="text-blue-600">{item.distance_text}</Text>
                      )}
                    </View>
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <Users size={14} color="#999" />
                      <Text>
                        已报名 <Text className="text-blue-600 font-semibold">{item.current_students}</Text>/{item.max_students}人
                      </Text>
                      {item.remaining_seats <= 3 && item.remaining_seats > 0 && (
                        <Badge className="bg-red-50 text-red-600 text-xs">
                          仅剩{item.remaining_seats}席
                        </Badge>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 底部提示 */}
      {!loading && classes.length > 0 && (
        <View className="text-center py-4">
          <Text className="text-gray-400 text-xs">— 没有更多了 —</Text>
        </View>
      )}
    </View>
  )
}
