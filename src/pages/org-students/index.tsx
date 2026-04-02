import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, Phone, MessageCircle, Plus, Search,
  Clock, FileText
} from 'lucide-react-taro'

interface Student {
  id: number
  student_name: string
  parent_name: string
  parent_phone: string
  grade: string
  subjects: string[]
  teacher_id: number
  teacher_name: string
  source: string
  status: number
  total_hours: number
  remaining_hours: number
  total_amount: number
  last_contact_at: string
  next_follow_at: string
  notes: string
  created_at: string
}

interface Stats {
  total: number
  intention: number
  trial: number
  studying: number
  paused: number
}

/**
 * 机构学员CRM管理页面
 */
export default function OrgStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0, intention: 0, trial: 0, studying: 0, paused: 0
  })
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // 新增学员表单
  const [formData, setFormData] = useState({
    student_name: '',
    parent_name: '',
    parent_phone: '',
    grade: '',
    subjects: [] as string[],
    notes: ''
  })

  useDidShow(() => {
    loadStudents()
  })

  const loadStudents = () => {
    setLoading(true)
    // 模拟数据
    const mockStudents: Student[] = [
      {
        id: 1, student_name: '王小明', parent_name: '王家长', parent_phone: '138****8888',
        grade: '高二', subjects: ['数学', '物理'], teacher_id: 1, teacher_name: '张老师',
        source: 'platform', status: 3, total_hours: 48, remaining_hours: 32,
        total_amount: 8640, last_contact_at: '2024-03-20', next_follow_at: '2024-03-25',
        notes: '数学基础较好，正在学习导数', created_at: '2024-01-15'
      },
      {
        id: 2, student_name: '李小红', parent_name: '李家长', parent_phone: '139****9999',
        grade: '初二', subjects: ['英语'], teacher_id: 2, teacher_name: '李老师',
        source: 'referral', status: 2, total_hours: 24, remaining_hours: 24,
        total_amount: 3600, last_contact_at: '2024-03-19', next_follow_at: '',
        notes: '试听课已安排', created_at: '2024-03-15'
      },
      {
        id: 3, student_name: '张小华', parent_name: '张家长', parent_phone: '137****7777',
        grade: '高三', subjects: ['物理'], teacher_id: 1, teacher_name: '张老师',
        source: 'activity', status: 3, total_hours: 60, remaining_hours: 8,
        total_amount: 12000, last_contact_at: '2024-03-18', next_follow_at: '',
        notes: '高考冲刺阶段', created_at: '2023-09-01'
      }
    ]

    setStudents(mockStudents)
    setStats({
      total: mockStudents.length,
      intention: mockStudents.filter(s => s.status === 1).length,
      trial: mockStudents.filter(s => s.status === 2).length,
      studying: mockStudents.filter(s => s.status === 3).length,
      paused: mockStudents.filter(s => s.status === 4).length
    })
    setLoading(false)
  }

  const getStatusConfig = (status: number) => {
    const configs = {
      1: { label: '意向', className: 'bg-yellow-100 text-yellow-700' },
      2: { label: '试听', className: 'bg-blue-100 text-blue-700' },
      3: { label: '在读', className: 'bg-green-100 text-green-700' },
      4: { label: '停课', className: 'bg-gray-100 text-gray-600' },
      5: { label: '结课', className: 'bg-purple-100 text-purple-700' }
    }
    return configs[status as keyof typeof configs] || configs[1]
  }

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailDialog(true)
  }

  const handleCall = (student: Student) => {
    Taro.makePhoneCall({ phoneNumber: student.parent_phone.replace(/\*+/g, '0000') })
  }

  const handleChat = (student: Student) => {
    Taro.navigateTo({ url: `/pages/chat/index?id=${student.parent_phone}` })
  }

  const handleAddStudent = () => {
    if (!formData.student_name) {
      Taro.showToast({ title: '请输入学员姓名', icon: 'none' })
      return
    }
    
    // 模拟添加
    Taro.showToast({ title: '添加成功', icon: 'success' })
    setShowAddDialog(false)
    setFormData({
      student_name: '', parent_name: '', parent_phone: '',
      grade: '', subjects: [], notes: ''
    })
    loadStudents()
  }

  const filteredStudents = students.filter(s => {
    if (statusFilter !== null && s.status !== statusFilter) return false
    if (keyword && !s.student_name.includes(keyword) && !s.parent_phone.includes(keyword)) return false
    return true
  })

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
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-6 pb-8">
        <View className="flex items-center justify-between mb-4">
          <View className="flex items-center gap-2">
            <Users size={24} color="white" />
            <Text className="text-white text-xl font-bold">学员管理</Text>
          </View>
          <Button 
            size="sm" 
            className="bg-white bg-opacity-20"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={16} color="white" />
            <Text className="text-white ml-1">添加学员</Text>
          </Button>
        </View>

        <View className="grid grid-cols-4 gap-2">
          <View className="text-center">
            <Text className="text-white text-2xl font-bold">{stats.total}</Text>
            <Text className="text-white text-opacity-80 text-xs">全部</Text>
          </View>
          <View className="text-center">
            <Text className="text-white text-2xl font-bold">{stats.intention}</Text>
            <Text className="text-white text-opacity-80 text-xs">意向</Text>
          </View>
          <View className="text-center">
            <Text className="text-white text-2xl font-bold">{stats.trial}</Text>
            <Text className="text-white text-opacity-80 text-xs">试听</Text>
          </View>
          <View className="text-center">
            <Text className="text-white text-2xl font-bold">{stats.studying}</Text>
            <Text className="text-white text-opacity-80 text-xs">在读</Text>
          </View>
        </View>
      </View>

      {/* 搜索和筛选 */}
      <View className="px-4 -mt-4">
        <Card className="mb-4">
          <CardContent className="p-3">
            <View className="flex items-center gap-2">
              <View className="flex-1 bg-gray-50 rounded-lg px-3 py-2 flex items-center">
                <Search size={16} color="#9CA3AF" />
                <Input
                  className="ml-2 bg-transparent text-sm"
                  placeholder="搜索学员姓名/电话"
                  value={keyword}
                  onInput={(e) => setKeyword(e.detail.value)}
                />
              </View>
            </View>
            <View className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant={statusFilter === null ? 'default' : 'outline'}
                onClick={() => setStatusFilter(null)}
              >
                <Text className={statusFilter === null ? 'text-white' : ''}>全部</Text>
              </Button>
              <Button 
                size="sm" 
                variant={statusFilter === 1 ? 'default' : 'outline'}
                onClick={() => setStatusFilter(1)}
              >
                <Text className={statusFilter === 1 ? 'text-white' : ''}>意向</Text>
              </Button>
              <Button 
                size="sm" 
                variant={statusFilter === 2 ? 'default' : 'outline'}
                onClick={() => setStatusFilter(2)}
              >
                <Text className={statusFilter === 2 ? 'text-white' : ''}>试听</Text>
              </Button>
              <Button 
                size="sm" 
                variant={statusFilter === 3 ? 'default' : 'outline'}
                onClick={() => setStatusFilter(3)}
              >
                <Text className={statusFilter === 3 ? 'text-white' : ''}>在读</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 学员列表 */}
      <ScrollView scrollY className="px-4" style={{ height: 'calc(100vh - 280px)' }}>
        {filteredStudents.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Users size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无学员数据</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {filteredStudents.map((student) => {
              const statusConfig = getStatusConfig(student.status)
              return (
                <Card key={student.id} className="bg-white">
                  <CardContent className="p-4">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <Text className="font-bold text-lg">{student.student_name}</Text>
                        <Badge className={statusConfig.className}>
                          <Text className="text-xs">{statusConfig.label}</Text>
                        </Badge>
                      </View>
                      <Text className="text-sm text-gray-500">{student.grade}</Text>
                    </View>

                    <View className="flex flex-wrap gap-1 mb-3">
                      {student.subjects.map((subject, idx) => (
                        <Badge key={idx} className="bg-blue-50 text-blue-600">
                          <Text className="text-xs">{subject}</Text>
                        </Badge>
                      ))}
                    </View>

                    <View className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-2">
                      <View className="text-center">
                        <Text className="text-lg font-bold text-blue-600">{student.total_hours}</Text>
                        <Text className="text-xs text-gray-500">总课时</Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-lg font-bold text-orange-500">{student.remaining_hours}</Text>
                        <Text className="text-xs text-gray-500">剩余</Text>
                      </View>
                      <View className="text-center">
                        <Text className="text-lg font-bold text-green-600">¥{student.total_amount}</Text>
                        <Text className="text-xs text-gray-500">消费</Text>
                      </View>
                    </View>

                    <View className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <View className="flex items-center gap-1">
                        <Users size={12} color="#6B7280" />
                        <Text>{student.teacher_name}</Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Clock size={12} color="#6B7280" />
                        <Text>最近: {student.last_contact_at}</Text>
                      </View>
                    </View>

                    <View className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleCall(student)}
                      >
                        <Phone size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">联系</Text>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleChat(student)}
                      >
                        <MessageCircle size={14} color="#2563EB" />
                        <Text className="text-blue-600 ml-1">沟通</Text>
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetail(student)}
                      >
                        <FileText size={14} color="white" />
                        <Text className="text-white ml-1">详情</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 添加学员弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-80 max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加学员</DialogTitle>
          </DialogHeader>
          <View className="mt-4 space-y-4">
            <View>
              <Text className="text-sm text-gray-500 mb-1">学员姓名 *</Text>
              <Input
                placeholder="请输入学员姓名"
                value={formData.student_name}
                onInput={(e) => setFormData({ ...formData, student_name: e.detail.value })}
              />
            </View>
            <View>
              <Text className="text-sm text-gray-500 mb-1">家长姓名</Text>
              <Input
                placeholder="请输入家长姓名"
                value={formData.parent_name}
                onInput={(e) => setFormData({ ...formData, parent_name: e.detail.value })}
              />
            </View>
            <View>
              <Text className="text-sm text-gray-500 mb-1">联系电话</Text>
              <Input
                type="number"
                placeholder="请输入联系电话"
                value={formData.parent_phone}
                onInput={(e) => setFormData({ ...formData, parent_phone: e.detail.value })}
              />
            </View>
            <View>
              <Text className="text-sm text-gray-500 mb-1">年级</Text>
              <Input
                placeholder="请输入年级"
                value={formData.grade}
                onInput={(e) => setFormData({ ...formData, grade: e.detail.value })}
              />
            </View>
            <View>
              <Text className="text-sm text-gray-500 mb-1">备注</Text>
              <Input
                placeholder="备注信息"
                value={formData.notes}
                onInput={(e) => setFormData({ ...formData, notes: e.detail.value })}
              />
            </View>
            <Button className="w-full mt-4" onClick={handleAddStudent}>
              <Text className="text-white">确认添加</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 学员详情弹窗 */}
      {showDetailDialog && selectedStudent && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="w-80 max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>学员详情</DialogTitle>
            </DialogHeader>
            <View className="mt-4 space-y-3">
              <View className="flex justify-between">
                <Text className="text-gray-500">学员姓名</Text>
                <Text className="font-semibold">{selectedStudent.student_name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">家长姓名</Text>
                <Text>{selectedStudent.parent_name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">联系电话</Text>
                <Text>{selectedStudent.parent_phone}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">年级</Text>
                <Text>{selectedStudent.grade}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">科目</Text>
                <View className="flex gap-1">
                  {selectedStudent.subjects.map((s, idx) => (
                    <Badge key={idx} className="bg-blue-50 text-blue-600">
                      <Text className="text-xs">{s}</Text>
                    </Badge>
                  ))}
                </View>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">授课教师</Text>
                <Text>{selectedStudent.teacher_name}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">总课时</Text>
                <Text>{selectedStudent.total_hours}小时</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">剩余课时</Text>
                <Text className="text-orange-500 font-semibold">{selectedStudent.remaining_hours}小时</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-gray-500">累计消费</Text>
                <Text className="text-green-600">¥{selectedStudent.total_amount}</Text>
              </View>
              <View>
                <Text className="text-gray-500 mb-1">备注</Text>
                <View className="bg-gray-50 p-2 rounded-lg">
                  <Text className="text-sm">{selectedStudent.notes || '无'}</Text>
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
