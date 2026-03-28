import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, Clock, Phone, MessageCircle, 
  BookOpen, MapPin, ChevronRight
} from 'lucide-react-taro'

interface Student {
  id: number
  name: string
  avatar: string
  grade: string
  subject: string
  parent_name: string
  parent_phone: string
  address: string
  start_date: string
  total_hours: number
  remaining_hours: number
  weekly_schedule: string[]
  progress_notes: string
  status: 'active' | 'paused' | 'completed'
}

interface Stats {
  total_students: number
  active_students: number
  total_hours: number
  month_hours: number
}

/**
 * 学员管理页面（教师端）
 */
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<Stats>({
    total_students: 0,
    active_students: 0,
    total_hours: 0,
    month_hours: 0
  })
  const [loading, setLoading] = useState(true)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useDidShow(() => {
    loadStudents()
  })

  const loadStudents = () => {
    setLoading(true)
    // 模拟数据
    const mockStudents: Student[] = [
      {
        id: 1,
        name: '王小明',
        avatar: 'https://placehold.co/100/2563EB/white?text=王',
        grade: '高二',
        subject: '数学',
        parent_name: '王家长',
        parent_phone: '138****8888',
        address: '朝阳区望京西园四区',
        start_date: '2024-01-15',
        total_hours: 48,
        remaining_hours: 32,
        weekly_schedule: ['周一 14:00-16:00', '周三 14:00-16:00'],
        progress_notes: '数学基础较好，正在学习导数和函数综合',
        status: 'active'
      },
      {
        id: 2,
        name: '李小红',
        avatar: 'https://placehold.co/100/EC4899/white?text=李',
        grade: '初二',
        subject: '英语',
        parent_name: '李家长',
        parent_phone: '139****9999',
        address: '海淀区中关村软件园',
        start_date: '2024-02-20',
        total_hours: 24,
        remaining_hours: 18,
        weekly_schedule: ['周六 10:00-12:00'],
        progress_notes: '英语语法需要加强，口语进步明显',
        status: 'active'
      },
      {
        id: 3,
        name: '张小华',
        avatar: 'https://placehold.co/100/10B981/white?text=张',
        grade: '高三',
        subject: '物理',
        parent_name: '张家长',
        parent_phone: '137****7777',
        address: '西城区金融街',
        start_date: '2023-09-01',
        total_hours: 60,
        remaining_hours: 8,
        weekly_schedule: ['周日 14:00-16:00', '周日 16:00-18:00'],
        progress_notes: '高考冲刺阶段，重点复习力学和电磁学',
        status: 'active'
      }
    ]
    setStudents(mockStudents)
    setStats({
      total_students: 3,
      active_students: 3,
      total_hours: 132,
      month_hours: 28
    })
    setLoading(false)
  }

  const getStatusBadge = (status: Student['status']) => {
    const config = {
      active: { label: '进行中', className: 'bg-green-100 text-green-700' },
      paused: { label: '已暂停', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: '已完成', className: 'bg-gray-100 text-gray-600' }
    }
    return config[status]
  }

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailDialog(true)
  }

  const handleCall = (student: Student) => {
    // 检查会员状态
    const isMember = Taro.getStorageSync('member_expire_role_1')
    if (!isMember) {
      Taro.showModal({
        title: '会员特权',
        content: '开通会员后可查看家长联系方式',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' })
          }
        }
      })
      return
    }
    Taro.makePhoneCall({ phoneNumber: student.parent_phone.replace(/\*+/g, '0000') })
  }

  const handleChat = (student: Student) => {
    Taro.navigateTo({ url: `/pages/chat/index?id=${student.id}&type=parent` })
  }

  const handleAddProgress = () => {
    Taro.showModal({
      title: '添加教学记录',
      content: '请输入本次课程的教学内容和进度',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已保存', icon: 'success' })
        }
      }
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 统计卡片 */}
      <View className="p-4">
        <View className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
            <CardContent className="p-4">
              <View className="flex items-center gap-2">
                <Users size={20} color="white" />
                <Text className="text-white text-opacity-80 text-sm">在教学生</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">{stats.active_students}</Text>
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
        </View>
      </View>

      {/* 学生列表 */}
      <ScrollView scrollY className="px-4" style={{ height: 'calc(100vh - 180px)' }}>
        {students.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Users size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无学员</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {students.map((student) => {
              const statusConfig = getStatusBadge(student.status)
              return (
                <Card key={student.id} className="bg-white">
                  <CardContent className="p-4">
                    {/* 学生基本信息 */}
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center">
                        <Image src={student.avatar} className="w-12 h-12 rounded-full" />
                        <View className="ml-3">
                          <View className="flex items-center">
                            <Text className="font-semibold">{student.name}</Text>
                            <Badge className={`ml-2 ${statusConfig.className}`}>
                              <Text className="text-xs">{statusConfig.label}</Text>
                            </Badge>
                          </View>
                          <View className="flex items-center mt-1">
                            <BookOpen size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {student.grade} · {student.subject}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <ChevronRight 
                        size={20} 
                        color="#9CA3AF" 
                        onClick={() => handleViewDetail(student)}
                      />
                    </View>

                    {/* 课时进度 */}
                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                      <View className="flex justify-between items-center mb-2">
                        <Text className="text-sm text-gray-600">课时进度</Text>
                        <Text className="text-sm font-semibold">
                          剩余 <Text className="text-orange-500">{student.remaining_hours}</Text> / {student.total_hours} 小时
                        </Text>
                      </View>
                      <View className="bg-gray-200 rounded-full h-2">
                        <View 
                          className="bg-orange-500 rounded-full h-2"
                          style={{ width: `${((student.total_hours - student.remaining_hours) / student.total_hours) * 100}%` }}
                        />
                      </View>
                    </View>

                    {/* 上课时间 */}
                    <View className="mb-3">
                      <Text className="text-xs text-gray-500 mb-1">上课安排</Text>
                      <View className="flex flex-wrap gap-1">
                        {student.weekly_schedule.map((schedule, idx) => (
                          <Badge key={idx} className="bg-blue-50 text-blue-600">
                            <Text className="text-xs">{schedule}</Text>
                          </Badge>
                        ))}
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleCall(student)}
                      >
                        <Phone size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">联系家长</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleChat(student)}
                      >
                        <MessageCircle size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">发消息</Text>
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddProgress()}
                      >
                        <Text className="text-white">记录进度</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 学生详情弹窗 */}
      {showDetailDialog && selectedStudent && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="w-80 max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>学员详情</DialogTitle>
            </DialogHeader>
            <View className="mt-4 space-y-4">
              <View className="flex items-center">
                <Image src={selectedStudent.avatar} className="w-16 h-16 rounded-full" />
                <View className="ml-3">
                  <Text className="text-lg font-bold">{selectedStudent.name}</Text>
                  <Text className="text-sm text-gray-500">{selectedStudent.grade} · {selectedStudent.subject}</Text>
                </View>
              </View>
              
              <View className="flex justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">家长姓名</Text>
                <Text>{selectedStudent.parent_name}</Text>
              </View>
              <View className="flex justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">开始日期</Text>
                <Text>{selectedStudent.start_date}</Text>
              </View>
              <View className="flex justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">总课时</Text>
                <Text>{selectedStudent.total_hours}小时</Text>
              </View>
              <View className="flex justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-500">剩余课时</Text>
                <Text className="text-orange-500 font-semibold">{selectedStudent.remaining_hours}小时</Text>
              </View>
              <View className="py-2 border-b border-gray-100">
                <Text className="text-gray-500 mb-1">上课地址</Text>
                <View className="flex items-center">
                  <MapPin size={14} color="#6B7280" />
                  <Text className="ml-1">{selectedStudent.address}</Text>
                </View>
              </View>
              <View>
                <Text className="text-gray-500 mb-1">学习进度</Text>
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-sm">{selectedStudent.progress_notes}</Text>
                </View>
              </View>
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
