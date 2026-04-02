import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, Plus, Phone, Star, 
  Check, X,
  GraduationCap, Users
} from 'lucide-react-taro'
import './index.css'

interface Teacher {
  id: number
  nickname: string
  avatar: string
  real_name: string
  gender: number
  education: string
  subjects: string[]
  hourly_rate_min: number
  hourly_rate_max: number
  order_count: number
  rating: number
  status: number // 0待审核 1正常 2禁用
  join_time: string
  mobile: string
}

/**
 * 机构端 - 牛师管理页面
 */
export default function OrgTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    disabled: 0
  })

  useDidShow(() => {
    loadTeachers()
  })

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: '/api/org/teachers',
        method: 'GET',
        data: {
          keyword: searchKeyword,
          status: activeTab === 'all' ? undefined : activeTab === 'pending' ? 0 : activeTab === 'active' ? 1 : 2,
        },
      })

      console.log('牛师列表:', res.data)
      if (res.data?.data) {
        setTeachers(res.data.data.list || [])
        setStats(res.data.data.stats || stats)
      }
    } catch (error) {
      console.error('加载牛师列表失败:', error)
      // 使用模拟数据
      setTeachers(getMockTeachers())
      setStats({ total: 12, active: 8, pending: 2, disabled: 2 })
    } finally {
      setLoading(false)
    }
  }

  const getMockTeachers = (): Teacher[] => [
    {
      id: 1, nickname: '张老师', avatar: 'https://placehold.co/100/2563EB/white?text=张',
      real_name: '张明', gender: 1, education: '北京大学·硕士',
      subjects: ['数学', '物理'], hourly_rate_min: 150, hourly_rate_max: 200,
      order_count: 32, rating: 4.9, status: 1, join_time: '2024-01-15', mobile: '138****8888'
    },
    {
      id: 2, nickname: '李老师', avatar: 'https://placehold.co/100/EC4899/white?text=李',
      real_name: '李芳', gender: 2, education: '清华大学·本科',
      subjects: ['英语', '语文'], hourly_rate_min: 120, hourly_rate_max: 180,
      order_count: 28, rating: 4.8, status: 1, join_time: '2024-02-20', mobile: '139****6666'
    },
    {
      id: 3, nickname: '王老师', avatar: 'https://placehold.co/100/10B981/white?text=王',
      real_name: '王强', gender: 1, education: '北京师范大学·博士',
      subjects: ['化学', '生物'], hourly_rate_min: 200, hourly_rate_max: 300,
      order_count: 18, rating: 5.0, status: 1, join_time: '2024-03-01', mobile: '137****5555'
    },
    {
      id: 4, nickname: '赵老师', avatar: 'https://placehold.co/100/F59E0B/white?text=赵',
      real_name: '赵敏', gender: 2, education: '中国人民大学·硕士',
      subjects: ['历史', '地理'], hourly_rate_min: 100, hourly_rate_max: 150,
      order_count: 0, rating: 0, status: 0, join_time: '2024-03-20', mobile: '136****4444'
    },
  ]

  const handleSearch = () => {
    loadTeachers()
  }

  const handleApprove = async (teacherId: number) => {
    try {
      await Network.request({
        url: `/api/org/teachers/${teacherId}/approve`,
        method: 'POST',
      })
      Taro.showToast({ title: '已通过', icon: 'success' })
      loadTeachers()
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleReject = async (teacherId: number) => {
    Taro.showModal({
      title: '确认拒绝',
      content: '确定要拒绝该牛师的入驻申请吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/org/teachers/${teacherId}/reject`,
              method: 'POST',
            })
            Taro.showToast({ title: '已拒绝', icon: 'success' })
            loadTeachers()
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleToggleStatus = async (teacherId: number, currentStatus: number) => {
    const action = currentStatus === 1 ? '禁用' : '启用'
    Taro.showModal({
      title: `确认${action}`,
      content: `确定要${action}该牛师吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/org/teachers/${teacherId}/status`,
              method: 'POST',
              data: { status: currentStatus === 1 ? 2 : 1 },
            })
            Taro.showToast({ title: `已${action}`, icon: 'success' })
            loadTeachers()
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  const handleViewDetail = (teacherId: number) => {
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacherId}` })
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-yellow-100 text-yellow-600">待审核</Badge>
      case 1:
        return <Badge className="bg-green-100 text-green-600">正常</Badge>
      case 2:
        return <Badge className="bg-red-100 text-red-600">已禁用</Badge>
      default:
        return null
    }
  }

  const filteredTeachers = teachers.filter(t => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return t.status === 0
    if (activeTab === 'active') return t.status === 1
    if (activeTab === 'disabled') return t.status === 2
    return true
  })

  return (
    <View className="org-teachers-page">
      {/* 统计卡片 */}
      <View className="grid grid-cols-4 gap-2 p-4 bg-white">
        <View className="stat-card" onClick={() => setActiveTab('all')}>
          <Text className="stat-value">{stats.total}</Text>
          <Text className="stat-label">全部</Text>
        </View>
        <View className="stat-card active" onClick={() => setActiveTab('active')}>
          <Text className="stat-value text-green-500">{stats.active}</Text>
          <Text className="stat-label">正常</Text>
        </View>
        <View className="stat-card" onClick={() => setActiveTab('pending')}>
          <Text className="stat-value text-yellow-500">{stats.pending}</Text>
          <Text className="stat-label">待审核</Text>
        </View>
        <View className="stat-card" onClick={() => setActiveTab('disabled')}>
          <Text className="stat-value text-red-500">{stats.disabled}</Text>
          <Text className="stat-label">已禁用</Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="p-4 bg-white border-t border-gray-100">
        <View className="flex items-center gap-2">
          <View className="flex-1 relative">
            <Input
              className="pl-8"
              placeholder="搜索牛师姓名/手机号"
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value)}
            />
            <Search size={16} color="#9CA3AF" className="search-icon" />
          </View>
          <Button size="sm" onClick={handleSearch}>
            <Text className="text-white">搜索</Text>
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => Taro.navigateTo({ url: '/pages/org-invite/index' })}
          >
            <Plus size={16} color="#2563EB" />
          </Button>
        </View>
      </View>

      {/* 牛师列表 */}
      <ScrollView scrollY className="teacher-list">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : filteredTeachers.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Users size={48} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2">暂无牛师数据</Text>
          </View>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="teacher-card">
              <CardContent className="p-4">
                <View className="flex items-start gap-3">
                  {/* 头像 */}
                  <Image
                    src={teacher.avatar}
                    className="w-12 h-12 rounded-full"
                    mode="aspectFill"
                  />
                  
                  {/* 信息 */}
                  <View className="flex-1">
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-2">
                        <Text className="font-semibold">{teacher.real_name}</Text>
                        <Text className="text-xs text-gray-500">
                          {teacher.gender === 1 ? '男' : '女'}
                        </Text>
                        {getStatusBadge(teacher.status)}
                      </View>
                      {teacher.status === 1 && teacher.rating > 0 && (
                        <View className="flex items-center gap-1">
                          <Star size={14} color="#EAB308" />
                          <Text className="text-sm text-yellow-600">{teacher.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex items-center gap-1 mt-1">
                      <GraduationCap size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500">{teacher.education}</Text>
                    </View>

                    {/* 学科标签 */}
                    <View className="flex flex-wrap gap-1 mt-2">
                      {teacher.subjects.map((s, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      <Text className="text-xs text-orange-500 ml-2">
                        ¥{teacher.hourly_rate_min}-{teacher.hourly_rate_max}/时
                      </Text>
                    </View>

                    {/* 统计 */}
                    <View className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <Text>接单 {teacher.order_count} 次</Text>
                      <Text>入驻 {teacher.join_time}</Text>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex items-center gap-2 mt-3">
                      {teacher.status === 0 ? (
                        // 待审核状态
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-500"
                            onClick={() => handleApprove(teacher.id)}
                          >
                            <Check size={14} color="white" />
                            <Text className="text-white ml-1">通过</Text>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-500"
                            onClick={() => handleReject(teacher.id)}
                          >
                            <X size={14} color="#EF4444" />
                            <Text className="text-red-500 ml-1">拒绝</Text>
                          </Button>
                        </>
                      ) : (
                        // 正常/禁用状态
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleViewDetail(teacher.id)}
                          >
                            <Text>查看详情</Text>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => Taro.makePhoneCall({ phoneNumber: teacher.mobile.replace(/\*/g, '0') })}
                          >
                            <Phone size={14} color="#2563EB" />
                            <Text className="text-blue-500 ml-1">联系</Text>
                          </Button>
                          <Button
                            size="sm"
                            variant={teacher.status === 1 ? 'outline' : 'default'}
                            className={teacher.status === 1 ? 'border-red-500' : 'bg-green-500'}
                            onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                          >
                            <Text className={teacher.status === 1 ? 'text-red-500' : 'text-white'}>
                              {teacher.status === 1 ? '禁用' : '启用'}
                            </Text>
                          </Button>
                        </>
                      )}
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
