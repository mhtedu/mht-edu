import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, Plus, Clock, Users, MapPin,
  Calendar, DollarSign, Pencil
} from 'lucide-react-taro'
import './index.css'

interface Course {
  id: number
  title: string
  subject: string
  teacher_id: number
  teacher_name: string
  teacher_avatar: string
  student_count: number
  total_hours: number
  price_per_hour: number
  status: number // 0下架 1上架 2已满
  schedule: string
  address: string
  description: string
  cover_image: string
  created_at: string
}

/**
 * 机构端 - 课程管理页面
 */
export default function OrgCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    revenue: 0
  })

  useDidShow(() => {
    loadCourses()
  })

  const loadCourses = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/org/courses',
        method: 'GET',
        data: { keyword: searchKeyword },
      })

      console.log('课程列表:', res.data)
      if (res.data?.data) {
        setCourses(res.data.data.list || [])
        setStats(res.data.data.stats || stats)
      }
    } catch (error) {
      console.error('加载课程列表失败:', error)
      // 使用模拟数据
      setCourses(getMockCourses())
      setStats({ total: 15, active: 12, students: 156, revenue: 89600 })
    } finally {
      setLoading(false)
    }
  }

  const getMockCourses = (): Course[] => [
    {
      id: 1, title: '中考数学冲刺班', subject: '数学',
      teacher_id: 1, teacher_name: '张老师', teacher_avatar: 'https://placehold.co/100/2563EB/white?text=张',
      student_count: 12, total_hours: 20, price_per_hour: 180,
      status: 1, schedule: '周六 14:00-16:00', address: '望京校区',
      description: '针对中考数学重点难点进行系统复习', cover_image: '',
      created_at: '2024-01-15'
    },
    {
      id: 2, title: '高考英语专项提升', subject: '英语',
      teacher_id: 2, teacher_name: '李老师', teacher_avatar: 'https://placehold.co/100/EC4899/white?text=李',
      student_count: 8, total_hours: 30, price_per_hour: 150,
      status: 1, schedule: '周日 09:00-11:00', address: '中关村校区',
      description: '高考英语听说读写全面提升', cover_image: '',
      created_at: '2024-02-20'
    },
    {
      id: 3, title: '物理竞赛入门班', subject: '物理',
      teacher_id: 1, teacher_name: '张老师', teacher_avatar: 'https://placehold.co/100/2563EB/white?text=张',
      student_count: 6, total_hours: 40, price_per_hour: 200,
      status: 2, schedule: '周三 18:00-20:00', address: '望京校区',
      description: '物理竞赛基础知识讲解', cover_image: '',
      created_at: '2024-03-01'
    },
    {
      id: 4, title: '初中化学基础班', subject: '化学',
      teacher_id: 3, teacher_name: '王老师', teacher_avatar: 'https://placehold.co/100/10B981/white?text=王',
      student_count: 0, total_hours: 25, price_per_hour: 160,
      status: 0, schedule: '周六 09:00-11:00', address: '望京校区',
      description: '初中化学基础知识系统学习', cover_image: '',
      created_at: '2024-03-10'
    },
  ]

  const handleSearch = () => {
    loadCourses()
  }

  const handleToggleStatus = async (courseId: number, currentStatus: number) => {
    const action = currentStatus === 1 ? '下架' : '上架'
    Taro.showModal({
      title: `确认${action}`,
      content: `确定要${action}该课程吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/org/courses/${courseId}/status`,
              method: 'POST',
              data: { status: currentStatus === 1 ? 0 : 1 },
            })
            Taro.showToast({ title: `已${action}`, icon: 'success' })
            loadCourses()
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleEditCourse = (courseId: number) => {
    Taro.navigateTo({ url: `/pages/org-course-edit/index?id=${courseId}` })
  }

  const handleCreateCourse = () => {
    Taro.navigateTo({ url: '/pages/org-course-edit/index' })
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-gray-100 text-gray-600">已下架</Badge>
      case 1:
        return <Badge className="bg-green-100 text-green-600">进行中</Badge>
      case 2:
        return <Badge className="bg-orange-100 text-orange-600">已满员</Badge>
      default:
        return null
    }
  }

  return (
    <View className="org-courses-page">
      {/* 统计卡片 */}
      <View className="grid grid-cols-4 gap-2 p-4 bg-white">
        <View className="stat-card">
          <Text className="stat-value">{stats.total}</Text>
          <Text className="stat-label">全部课程</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value text-green-500">{stats.active}</Text>
          <Text className="stat-label">进行中</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value text-blue-500">{stats.students}</Text>
          <Text className="stat-label">在读学生</Text>
        </View>
        <View className="stat-card">
          <Text className="stat-value text-orange-500">¥{(stats.revenue / 10000).toFixed(1)}万</Text>
          <Text className="stat-label">本月营收</Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="p-4 bg-white border-t border-gray-100">
        <View className="flex items-center gap-2">
          <View className="flex-1 relative">
            <Input
              className="pl-8"
              placeholder="搜索课程名称/教师"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
            />
            <Search size={16} color="#9CA3AF" className="search-icon" />
          </View>
          <Button size="sm" onClick={handleSearch}>
            <Text className="text-white">搜索</Text>
          </Button>
          <Button size="sm" onClick={handleCreateCourse}>
            <Plus size={16} color="white" />
          </Button>
        </View>
      </View>

      {/* 课程列表 */}
      <ScrollView scrollY className="course-list">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Calendar size={48} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2">暂无课程数据</Text>
            <Button size="sm" className="mt-4" onClick={handleCreateCourse}>
              <Plus size={16} color="white" />
              <Text className="text-white ml-1">创建课程</Text>
            </Button>
          </View>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="course-card">
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  {/* 课程封面 */}
                  <View className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                    <Text className="text-white text-xl font-bold">{course.subject[0]}</Text>
                  </View>
                  
                  {/* 课程信息 */}
                  <View className="flex-1">
                    <View className="flex items-center justify-between">
                      <Text className="font-semibold text-base">{course.title}</Text>
                      {getStatusBadge(course.status)}
                    </View>

                    <View className="flex items-center gap-2 mt-2">
                      <Image
                        src={course.teacher_avatar}
                        className="w-5 h-5 rounded-full"
                      />
                      <Text className="text-sm text-gray-600">{course.teacher_name}</Text>
                      <Badge variant="secondary" className="text-xs">
                        {course.subject}
                      </Badge>
                    </View>

                    <View className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <View className="flex items-center gap-1">
                        <Clock size={12} color="#6B7280" />
                        <Text>{course.schedule}</Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <MapPin size={12} color="#6B7280" />
                        <Text>{course.address}</Text>
                      </View>
                    </View>

                    <View className="flex items-center justify-between mt-2">
                      <View className="flex items-center gap-4 text-xs">
                        <View className="flex items-center gap-1">
                          <Users size={12} color="#6B7280" />
                          <Text>{course.student_count}人</Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <DollarSign size={12} color="#F59E0B" />
                          <Text className="text-orange-500">¥{course.price_per_hour}/时</Text>
                        </View>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditCourse(course.id)}
                      >
                        <Pencil size={14} color="#2563EB" />
                        <Text className="text-blue-500 ml-1">编辑</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => Taro.navigateTo({ url: `/pages/org-course-students/index?id=${course.id}` })}
                      >
                        <Users size={14} color="#2563EB" />
                        <Text className="text-blue-500 ml-1">学员</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant={course.status === 1 ? 'outline' : 'default'}
                        className={course.status === 1 ? 'flex-1 border-red-500' : 'flex-1 bg-green-500'}
                        onClick={() => handleToggleStatus(course.id, course.status)}
                      >
                        <Text className={course.status === 1 ? 'text-red-500' : 'text-white'}>
                          {course.status === 1 ? '下架' : '上架'}
                        </Text>
                      </Button>
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  )
}
