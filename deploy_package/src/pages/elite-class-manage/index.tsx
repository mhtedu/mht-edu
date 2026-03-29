import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Users, Clock, MapPin, Plus, Eye } from 'lucide-react-taro'

interface EliteClass {
  id: number
  class_name: string
  subject: string
  start_time: string
  total_lessons: number
  current_lesson: number
  address: string
  hourly_rate: number
  max_students: number
  current_students: number
  status: number
  created_at: string
  actual_students?: number
}

export default function EliteClassManage() {
  const [classes, setClasses] = useState<EliteClass[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  useEffect(() => {
    loadClasses()
  }, [statusFilter])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/elite-class/teacher-classes',
        method: 'GET',
        data: statusFilter !== undefined ? { status: statusFilter } : {}
      })
      setClasses((res as any).data || [])
    } catch (error) {
      console.error('加载牛师班列表失败:', error)
      // 使用模拟数据
      setClasses([
        {
          id: 1,
          class_name: '中考数学冲刺班',
          subject: '数学',
          start_time: '2025-01-20 14:00:00',
          total_lessons: 20,
          current_lesson: 3,
          address: '北京市朝阳区望京西园四区',
          hourly_rate: 180,
          max_students: 10,
          current_students: 5,
          status: 1,
          created_at: '2025-01-10',
          actual_students: 5
        },
        {
          id: 2,
          class_name: '奥数竞赛班',
          subject: '数学',
          start_time: '2025-02-01 10:00:00',
          total_lessons: 30,
          current_lesson: 0,
          address: '北京市西城区金融街',
          hourly_rate: 250,
          max_students: 15,
          current_students: 8,
          status: 0,
          created_at: '2025-01-08',
          actual_students: 8
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const goToCreate = () => {
    Taro.navigateTo({ url: '/pages/create-elite-class/index' })
  }

  const goToDetail = (classId: number) => {
    Taro.navigateTo({ url: `/pages/elite-class-detail/index?id=${classId}` })
  }

  const goToStudents = (classId: number) => {
    Taro.navigateTo({ url: `/pages/students/index?classId=${classId}` })
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
      case 3: return <Badge className="bg-red-100 text-red-600">已取消</Badge>
      default: return null
    }
  }

  const getStatusText = (status: number | undefined) => {
    if (status === undefined) return '全部'
    switch (status) {
      case 0: return '全部'
      case 1: return '进行中'
      case 2: return '已结束'
      default: return '全部'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部统计 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-semibold text-gray-800">我的牛师班</Text>
            <Text className="text-xs text-gray-500 mt-1">共 {classes.length} 个班级</Text>
          </View>
          <Button className="bg-blue-600 text-white" onClick={goToCreate}>
            <Plus size={16} color="#fff" className="mr-1" />
            创建牛师班
          </Button>
        </View>
      </View>

      {/* 状态筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Tabs
          value={getStatusText(statusFilter)}
          onValueChange={(v) => {
            if (v === '全部') setStatusFilter(undefined)
            else if (v === '进行中') setStatusFilter(1)
            else if (v === '已结束') setStatusFilter(2)
          }}
        >
          <TabsList className="flex flex-row gap-2">
            <TabsTrigger value="全部" className="px-4 py-2 text-sm">全部</TabsTrigger>
            <TabsTrigger value="招生中" className="px-4 py-2 text-sm">招生中</TabsTrigger>
            <TabsTrigger value="进行中" className="px-4 py-2 text-sm">进行中</TabsTrigger>
            <TabsTrigger value="已结束" className="px-4 py-2 text-sm">已结束</TabsTrigger>
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
            <Button className="mt-4 bg-blue-600 text-white" onClick={goToCreate}>
              立即创建
            </Button>
          </View>
        ) : (
          <View className="flex flex-col gap-4">
            {classes.map((item) => (
              <Card key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <CardContent className="p-4">
                  {/* 头部 */}
                  <View className="flex flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <View className="flex flex-row items-center gap-2 mb-1">
                        <Text className="text-base font-semibold text-gray-800">{item.class_name}</Text>
                        {getStatusBadge(item.status)}
                      </View>
                      <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                    </View>
                    <View className="text-right">
                      <Text className="text-lg font-bold text-blue-600">¥{item.hourly_rate}</Text>
                      <Text className="text-xs text-gray-400">/课时</Text>
                    </View>
                  </View>

                  {/* 进度条 */}
                  {item.status === 1 && (
                    <View className="mb-3">
                      <View className="flex flex-row justify-between items-center mb-1">
                        <Text className="text-xs text-gray-500">课程进度</Text>
                        <Text className="text-xs text-blue-600">{item.current_lesson}/{item.total_lessons}课时</Text>
                      </View>
                      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(item.current_lesson / item.total_lessons) * 100}%` }}
                        />
                      </View>
                    </View>
                  )}

                  {/* 详情信息 */}
                  <View className="flex flex-col gap-2 mb-3">
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <Clock size={14} color="#999" />
                      <Text>开课：{formatDate(item.start_time)}</Text>
                    </View>
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <MapPin size={14} color="#999" />
                      <Text className="flex-1 truncate">{item.address}</Text>
                    </View>
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <Users size={14} color="#999" />
                      <Text>
                        已报名 <Text className="text-blue-600 font-semibold">{item.current_students}</Text>/{item.max_students}人
                      </Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-2 pt-3 border-t border-gray-100">
                    <View className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => goToDetail(item.id)}
                      >
                        <Eye size={14} color="#666" className="mr-1" />
                        查看详情
                      </Button>
                    </View>
                    <View className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => goToStudents(item.id)}
                      >
                        <Users size={14} color="#666" className="mr-1" />
                        学员管理
                      </Button>
                    </View>
                    {item.status === 1 && (
                      <View className="flex-1">
                        <Button 
                          className="w-full bg-blue-600 text-white"
                          onClick={() => Taro.navigateTo({ url: `/pages/elite-class-detail/index?id=${item.id}&mode=progress` })}
                        >
                          更新进度
                        </Button>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
