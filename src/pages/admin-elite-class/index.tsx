import { View, Text, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Users, Clock, MapPin, Search, SlidersHorizontal, CircleCheck, CircleX } from 'lucide-react-taro'

interface EliteClass {
  id: number
  teacher_id: number
  org_id?: number
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
  audit_status: number
  teacher_nickname: string
  teacher_real_name: string
  org_name?: string
}

export default function AdminEliteClass() {
  const [classes, setClasses] = useState<EliteClass[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState(0)
  const [auditFilter, setAuditFilter] = useState(0)

  const statusOptions = ['全部状态', '招生中', '进行中', '已结束', '已取消']
  const auditOptions = ['全部', '待审核', '已通过', '已驳回']

  useEffect(() => {
    loadClasses()
  }, [statusFilter, auditFilter])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/admin/elite-classes',
        method: 'GET',
        data: {
          keyword,
          status: statusFilter > 0 ? statusFilter - 1 : undefined,
          audit_status: auditFilter > 0 ? auditFilter - 1 : undefined
        }
      })
      setClasses((res as any).data || [])
    } catch (error) {
      console.error('加载牛师班列表失败:', error)
      // 使用模拟数据
      setClasses([
        {
          id: 1,
          teacher_id: 100,
          org_id: 1,
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
          audit_status: 1,
          teacher_nickname: '张老师',
          teacher_real_name: '张伟',
          org_name: '望京教育'
        },
        {
          id: 2,
          teacher_id: 106,
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
          audit_status: 0,
          teacher_nickname: '赵老师',
          teacher_real_name: '赵敏'
        },
        {
          id: 3,
          teacher_id: 101,
          org_id: 2,
          class_name: '英语口语提升班',
          subject: '英语',
          start_time: '2025-02-15 10:00:00',
          total_lessons: 15,
          current_lesson: 0,
          address: '北京市海淀区中关村',
          hourly_rate: 150,
          max_students: 8,
          current_students: 3,
          status: 0,
          audit_status: 1,
          teacher_nickname: '李老师',
          teacher_real_name: '李芳',
          org_name: '海淀教育'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAudit = async (classId: number, approve: boolean) => {
    try {
      await Network.request({
        url: `/api/admin/elite-class/${classId}/audit`,
        method: 'POST',
        data: { status: approve ? 1 : 2 }
      })
      Taro.showToast({ title: approve ? '已通过' : '已驳回', icon: 'success' })
      loadClasses()
    } catch (error) {
      console.error('审核失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleSearch = () => {
    loadClasses()
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

  const getAuditBadge = (status: number) => {
    switch (status) {
      case 0: return <Badge className="bg-yellow-100 text-yellow-700">待审核</Badge>
      case 1: return <Badge className="bg-green-100 text-green-700">已通过</Badge>
      case 2: return <Badge className="bg-red-100 text-red-600">已驳回</Badge>
      default: return null
    }
  }

  // 统计数据
  const stats = {
    total: classes.length,
    pending: classes.filter(c => c.audit_status === 0).length,
    approved: classes.filter(c => c.audit_status === 1).length,
    rejected: classes.filter(c => c.audit_status === 2).length
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 统计卡片 */}
      <View className="bg-blue-600 px-4 py-4">
        <Text className="text-white text-lg font-semibold block mb-3">牛师班审核管理</Text>
        <View className="flex flex-row justify-between">
          <View className="flex-1 text-center">
            <Text className="text-xl font-bold text-white">{stats.total}</Text>
            <Text className="text-xs text-blue-100 block">总申请</Text>
          </View>
          <View className="flex-1 text-center">
            <Text className="text-xl font-bold text-yellow-300">{stats.pending}</Text>
            <Text className="text-xs text-blue-100 block">待审核</Text>
          </View>
          <View className="flex-1 text-center">
            <Text className="text-xl font-bold text-green-300">{stats.approved}</Text>
            <Text className="text-xs text-blue-100 block">已通过</Text>
          </View>
          <View className="flex-1 text-center">
            <Text className="text-xl font-bold text-red-300">{stats.rejected}</Text>
            <Text className="text-xs text-blue-100 block">已驳回</Text>
          </View>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex flex-row items-center gap-2 mb-3">
          <View className="flex-1 bg-gray-100 rounded-lg px-3 py-2 flex flex-row items-center">
            <Search size={16} color="#999" />
            <Input
              className="flex-1 bg-transparent text-sm ml-2"
              placeholder="搜索班级名称、教师"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />
          </View>
          <Button className="bg-blue-600 text-white" onClick={handleSearch}>搜索</Button>
        </View>
        <View className="flex flex-row gap-2">
          <Picker mode="selector" range={auditOptions} value={auditFilter} onChange={(e) => setAuditFilter(parseInt(e.detail.value as string))}>
            <View className="bg-gray-100 rounded-lg px-3 py-2 flex flex-row items-center gap-1">
              <SlidersHorizontal size={14} color="#666" />
              <Text className="text-sm">{auditOptions[auditFilter]}</Text>
            </View>
          </Picker>
          <Picker mode="selector" range={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(parseInt(e.detail.value as string))}>
            <View className="bg-gray-100 rounded-lg px-3 py-2 flex flex-row items-center gap-1">
              <Text className="text-sm">{statusOptions[statusFilter]}</Text>
            </View>
          </Picker>
        </View>
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
                        {getAuditBadge(item.audit_status)}
                      </View>
                      <Badge variant="outline" className="text-xs">{item.subject}</Badge>
                    </View>
                    <View className="text-right">
                      <Text className="text-lg font-bold text-blue-600">¥{item.hourly_rate}</Text>
                      <Text className="text-xs text-gray-400">/课时</Text>
                    </View>
                  </View>

                  {/* 教师和机构信息 */}
                  <View className="flex flex-row items-center justify-between mb-3 py-2 border-y border-gray-100">
                    <View className="flex flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Text className="text-blue-600 text-sm">{item.teacher_real_name && item.teacher_real_name.charAt(0) || '师'}</Text>
                      </View>
                      <View>
                        <Text className="text-sm font-medium">{item.teacher_real_name || item.teacher_nickname}</Text>
                        {item.org_name && <Text className="text-xs text-gray-400">{item.org_name}</Text>}
                      </View>
                    </View>
                    <Text className="text-xs text-gray-400">ID: {item.id}</Text>
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
                    </View>
                    <View className="flex flex-row items-center gap-2 text-gray-500 text-xs">
                      <Users size={14} color="#999" />
                      <Text>学员 {item.current_students}/{item.max_students}人</Text>
                    </View>
                  </View>

                  {/* 审核操作 */}
                  {item.audit_status === 0 && (
                    <View className="flex flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
                      <View className="flex-1">
                        <Button 
                          variant="outline" 
                          className="w-full text-red-600 border-red-200"
                          onClick={() => handleAudit(item.id, false)}
                        >
                          <CircleX size={14} color="#dc2626" className="mr-1" />
                          驳回
                        </Button>
                      </View>
                      <View className="flex-1">
                        <Button 
                          className="w-full bg-green-600 text-white"
                          onClick={() => handleAudit(item.id, true)}
                        >
                          <CircleCheck size={14} color="#fff" className="mr-1" />
                          通过
                        </Button>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
