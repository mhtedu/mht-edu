import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Clock, Calendar, Users, Check, X, Play,
  Plus, FileText
} from 'lucide-react-taro'

interface Course {
  id: number
  parent_name: string
  student_name: string
  subject: string
  scheduled_time: string
  duration: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  address: string
  notes: string
}

interface Stats {
  today_count: number
  week_count: number
  month_hours: number
  pending_confirm: number
}

/**
 * 教师端课时管理工具页面
 */
export default function CourseManagePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({
    today_count: 0,
    week_count: 0,
    month_hours: 0,
    pending_confirm: 0
  })
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useDidShow(() => {
    loadCourses()
    loadStats()
  })

  const loadCourses = () => {
    // 模拟数据
    const mockCourses: Course[] = [
      {
        id: 1,
        parent_name: '王家长',
        student_name: '王小明',
        subject: '高中数学',
        scheduled_time: '2024-03-21 14:00',
        duration: 2,
        status: 'confirmed',
        address: '朝阳区望京西园四区',
        notes: '上次留的作业已完成'
      },
      {
        id: 2,
        parent_name: '李家长',
        student_name: '李小红',
        subject: '初中英语',
        scheduled_time: '2024-03-22 10:00',
        duration: 2,
        status: 'pending',
        address: '海淀区中关村软件园',
        notes: ''
      },
      {
        id: 3,
        parent_name: '张家长',
        student_name: '张小华',
        subject: '高中物理',
        scheduled_time: '2024-03-21 09:00',
        duration: 2,
        status: 'completed',
        address: '西城区金融街',
        notes: '讲解电磁感应'
      }
    ]
    setCourses(mockCourses)
  }

  const loadStats = () => {
    setStats({
      today_count: 3,
      week_count: 12,
      month_hours: 48,
      pending_confirm: 2
    })
  }

  const getStatusBadge = (status: Course['status']) => {
    const config = {
      pending: { label: '待确认', className: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
      in_progress: { label: '进行中', className: 'bg-green-100 text-green-700' },
      completed: { label: '已完成', className: 'bg-gray-100 text-gray-600' },
      cancelled: { label: '已取消', className: 'bg-red-100 text-red-600' }
    }
    return config[status]
  }

  const handleStartCourse = (course: Course) => {
    Taro.showModal({
      title: '开始上课',
      content: `确认开始为 ${course.student_name} 上课？`,
      success: (res) => {
        if (res.confirm) {
          // 更新状态为进行中
          const updated = courses.map(c => 
            c.id === course.id ? { ...c, status: 'in_progress' as const } : c
          )
          setCourses(updated)
          Taro.showToast({ title: '已开始上课', icon: 'success' })
        }
      }
    })
  }

  const handleCompleteCourse = (course: Course) => {
    Taro.showModal({
      title: '完成上课',
      content: `确认完成本次课程？课时时长：${course.duration}小时`,
      success: (res) => {
        if (res.confirm) {
          const updated = courses.map(c => 
            c.id === course.id ? { ...c, status: 'completed' as const } : c
          )
          setCourses(updated)
          Taro.showToast({ title: '已完成', icon: 'success' })
        }
      }
    })
  }

  const handleConfirmCourse = (course: Course, action: 'accept' | 'reject') => {
    const updated = courses.map(c => 
      c.id === course.id ? { ...c, status: action === 'accept' ? 'confirmed' as const : 'cancelled' as const } : c
    )
    setCourses(updated)
    Taro.showToast({ 
      title: action === 'accept' ? '已确认' : '已拒绝', 
      icon: 'success' 
    })
  }

  const handleViewDetail = (course: Course) => {
    setSelectedCourse(course)
    setShowDetailDialog(true)
  }

  const filteredCourses = courses.filter(c => 
    activeTab === 'upcoming' 
      ? ['pending', 'confirmed', 'in_progress'].includes(c.status)
      : ['completed', 'cancelled'].includes(c.status)
  )

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 统计卡片 */}
      <View className="p-4">
        <View className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
            <CardContent className="p-4">
              <View className="flex items-center gap-2">
                <Calendar size={20} color="white" />
                <Text className="text-white text-opacity-80 text-sm">今日课程</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">{stats.today_count}</Text>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
            <CardContent className="p-4">
              <View className="flex items-center gap-2">
                <Clock size={20} color="white" />
                <Text className="text-white text-opacity-80 text-sm">本月课时</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">{stats.month_hours}h</Text>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600">
            <CardContent className="p-4">
              <View className="flex items-center gap-2">
                <Users size={20} color="white" />
                <Text className="text-white text-opacity-80 text-sm">本周学员</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">{stats.week_count}</Text>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600">
            <CardContent className="p-4">
              <View className="flex items-center gap-2">
                <FileText size={20} color="white" />
                <Text className="text-white text-opacity-80 text-sm">待确认</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">{stats.pending_confirm}</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="flex bg-white border-b border-gray-200">
        <View 
          className={`flex-1 py-3 text-center ${activeTab === 'upcoming' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <Text className={activeTab === 'upcoming' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
            即将上课
          </Text>
        </View>
        <View 
          className={`flex-1 py-3 text-center ${activeTab === 'history' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Text className={activeTab === 'history' ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
            历史记录
          </Text>
        </View>
      </View>

      {/* 课程列表 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 280px)' }}>
        {filteredCourses.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Calendar size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无{activeTab === 'upcoming' ? '待上' : '历史'}课程</Text>
          </View>
        ) : (
          filteredCourses.map((course) => {
            const statusConfig = getStatusBadge(course.status)
            return (
              <Card key={course.id} className="mb-3">
                <CardContent className="p-4">
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <Text className="font-semibold">{course.student_name}</Text>
                      <Badge className={statusConfig.className}>
                        <Text className="text-xs">{statusConfig.label}</Text>
                      </Badge>
                    </View>
                    <Text className="text-sm text-gray-500">{course.subject}</Text>
                  </View>
                  
                  <View className="space-y-2 text-sm text-gray-600">
                    <View className="flex items-center gap-2">
                      <Clock size={14} color="#6B7280" />
                      <Text>{course.scheduled_time}</Text>
                      <Text className="text-gray-400">· {course.duration}小时</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <Users size={14} color="#6B7280" />
                      <Text>{course.parent_name}</Text>
                    </View>
                  </View>

                  {course.status === 'pending' && (
                    <View className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-500"
                        onClick={() => handleConfirmCourse(course, 'accept')}
                      >
                        <Check size={14} color="white" />
                        <Text className="text-white ml-1">确认</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-red-500"
                        onClick={() => handleConfirmCourse(course, 'reject')}
                      >
                        <X size={14} color="#EF4444" />
                        <Text className="text-red-500 ml-1">拒绝</Text>
                      </Button>
                    </View>
                  )}

                  {course.status === 'confirmed' && (
                    <View className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleStartCourse(course)}
                      >
                        <Play size={14} color="white" />
                        <Text className="text-white ml-1">开始上课</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewDetail(course)}
                      >
                        <Text>详情</Text>
                      </Button>
                    </View>
                  )}

                  {course.status === 'in_progress' && (
                    <View className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-500"
                        onClick={() => handleCompleteCourse(course)}
                      >
                        <Check size={14} color="white" />
                        <Text className="text-white ml-1">完成上课</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewDetail(course)}
                      >
                        <Text>详情</Text>
                      </Button>
                    </View>
                  )}

                  {(course.status === 'completed' || course.status === 'cancelled') && (
                    <View className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewDetail(course)}
                      >
                        <Text>查看详情</Text>
                      </Button>
                    </View>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <Button className="w-full" onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>
          <Plus size={18} color="white" />
          <Text className="text-white ml-2">新增课时安排</Text>
        </Button>
      </View>

      {/* 课程详情弹窗 */}
      {showDetailDialog && selectedCourse && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>课程详情</DialogTitle>
            </DialogHeader>
            <View className="mt-4 space-y-4">
              <View className="flex justify-between">
                <Text className="text-gray-500">学员姓名</Text>
                <Text className="font-semibold">{selectedCourse.student_name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">家长姓名</Text>
                <Text>{selectedCourse.parent_name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">学科</Text>
                <Text>{selectedCourse.subject}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">上课时间</Text>
                <Text>{selectedCourse.scheduled_time}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">课时时长</Text>
                <Text>{selectedCourse.duration}小时</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">上课地点</Text>
                <Text>{selectedCourse.address}</Text>
              </View>
              {selectedCourse.notes && (
                <View>
                  <Text className="text-gray-500 mb-1">备注</Text>
                  <View className="bg-gray-50 p-3 rounded-lg">
                    <Text>{selectedCourse.notes}</Text>
                  </View>
                </View>
              )}
              <Button className="w-full mt-4" onClick={() => setShowDetailDialog(false)}>
                <Text className="text-white">关闭</Text>
              </Button>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  )
}
