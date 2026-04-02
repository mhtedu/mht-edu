import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network } from '@/network'
import {
  Calendar, Users, MapPin, Plus, Eye, Pencil, Trash2,
  QrCode, Clock, CircleAlert
} from 'lucide-react-taro'

interface Activity {
  id: number
  title: string
  type: 'visit' | 'training' | 'lecture' | 'other'
  cover_image: string
  start_time: string
  end_time: string
  address: string
  location_type: 'online' | 'offline' | 'both'
  max_participants: number
  current_participants: number
  online_price: number
  offline_price: number
  status: 'draft' | 'pending' | 'published' | 'ongoing' | 'ended'
  created_at: string
}

interface Stats {
  total: number
  draft: number
  pending: number
  published: number
  ongoing: number
  ended: number
}

/**
 * 活动管理页面（机构端）
 */
const ActivityManagePage: FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0, draft: 0, pending: 0, published: 0, ongoing: 0, ended: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  useDidShow(() => {
    loadActivities()
  })

  usePullDownRefresh(() => {
    loadActivities().then(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadActivities = async () => {
    setLoading(true)
    try {
      console.log('加载活动列表请求:', { url: '/api/activities/manage', params: { status: activeTab } })
      const res = await Network.request({
        url: '/api/activities/manage',
        method: 'GET',
        data: activeTab !== 'all' ? { status: activeTab } : {}
      })
      console.log('加载活动列表响应:', res.data)
      
      if (res.data) {
        setActivities(res.data.list || res.data)
        setStats(res.data.stats || stats)
      }
    } catch (error) {
      console.error('加载活动列表失败:', error)
      // 使用模拟数据
      setActivities([
        {
          id: 1,
          title: '北京四中探校活动',
          type: 'visit',
          cover_image: 'https://placehold.co/200/2563EB/white?text=探校',
          start_time: '2024-04-15 09:00',
          end_time: '2024-04-15 12:00',
          address: '北京市西城区北京四中',
          location_type: 'offline',
          max_participants: 50,
          current_participants: 32,
          online_price: 0,
          offline_price: 99,
          status: 'published',
          created_at: '2024-04-01'
        },
        {
          id: 2,
          title: '高考志愿填报讲座',
          type: 'training',
          cover_image: 'https://placehold.co/200/10B981/white?text=讲座',
          start_time: '2024-04-20 14:00',
          end_time: '2024-04-20 16:00',
          address: '线上直播',
          location_type: 'online',
          max_participants: 200,
          current_participants: 156,
          online_price: 0,
          offline_price: 0,
          status: 'pending',
          created_at: '2024-04-05'
        },
        {
          id: 3,
          title: '小升初政策解读',
          type: 'lecture',
          cover_image: 'https://placehold.co/200/F59E0B/white?text=政策',
          start_time: '2024-03-10 10:00',
          end_time: '2024-03-10 12:00',
          address: '海淀区中关村',
          location_type: 'offline',
          max_participants: 100,
          current_participants: 85,
          online_price: 0,
          offline_price: 0,
          status: 'ended',
          created_at: '2024-03-01'
        }
      ])
      setStats({
        total: 3,
        draft: 0,
        pending: 1,
        published: 1,
        ongoing: 0,
        ended: 1
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Activity['status']) => {
    const config = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      pending: { label: '审核中', className: 'bg-yellow-100 text-yellow-700' },
      published: { label: '已发布', className: 'bg-blue-100 text-blue-700' },
      ongoing: { label: '进行中', className: 'bg-green-100 text-green-700' },
      ended: { label: '已结束', className: 'bg-gray-100 text-gray-500' }
    }
    return config[status]
  }

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/create-activity/index' })
  }

  const handleView = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity-detail/index?id=${id}` })
  }

  const handleEdit = (id: number) => {
    Taro.navigateTo({ url: `/pages/create-activity/index?id=${id}&mode=edit` })
  }

  const handleDelete = (activity: Activity) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除活动"${activity.title}"吗？此操作不可恢复。`,
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/activities/${activity.id}`,
              method: 'DELETE'
            })
            Taro.showToast({ title: '删除成功', icon: 'success' })
            loadActivities()
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleQRCode = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity-qrcode/index?id=${id}` })
  }

  const handleViewParticipants = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity-participants/index?id=${id}` })
  }

  const filteredActivities = activeTab === 'all' 
    ? activities 
    : activities.filter(a => a.status === activeTab)

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 统计卡片 */}
      <View className="p-4 bg-white">
        <View className="grid grid-cols-4 gap-2">
          <View className="text-center">
            <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
            <Text className="text-xs text-gray-500">全部</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-blue-600">{stats.published}</Text>
            <Text className="text-xs text-gray-500">已发布</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-yellow-600">{stats.pending}</Text>
            <Text className="text-xs text-gray-500">审核中</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-gray-400">{stats.ended}</Text>
            <Text className="text-xs text-gray-500">已结束</Text>
          </View>
        </View>
      </View>

      {/* 标签筛选 */}
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="published">已发布</TabsTrigger>
            <TabsTrigger value="pending">审核中</TabsTrigger>
            <TabsTrigger value="ended">已结束</TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* 活动列表 */}
      <ScrollView scrollY className="p-4" style={{ height: 'calc(100vh - 180px)' }}>
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <CircleAlert size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无活动数据</Text>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus size={16} color="white" className="mr-1" />
              <Text className="text-white">创建活动</Text>
            </Button>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredActivities.map((activity) => {
              const statusConfig = getStatusBadge(activity.status)
              return (
                <Card key={activity.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <View className="flex flex-row">
                      {/* 封面图 */}
                      <View className="w-24 h-24 bg-gray-100 shrink-0">
                        <Image 
                          src={activity.cover_image} 
                          className="w-full h-full"
                          mode="aspectFill"
                        />
                      </View>
                      
                      {/* 内容 */}
                      <View className="flex-1 p-3">
                        <View className="flex items-start justify-between mb-1">
                          <Text className="font-semibold text-sm line-clamp-1 flex-1 mr-2">
                            {activity.title}
                          </Text>
                          <Badge className={statusConfig.className}>
                            <Text className="text-xs">{statusConfig.label}</Text>
                          </Badge>
                        </View>
                        
                        <View className="flex items-center text-gray-500 text-xs mb-1">
                          <Calendar size={12} color="#9CA3AF" className="mr-1" />
                          <Text>{activity.start_time.split(' ')[0]}</Text>
                          <Clock size={12} color="#9CA3AF" className="ml-2 mr-1" />
                          <Text>{activity.start_time.split(' ')[1]}</Text>
                        </View>
                        
                        <View className="flex items-center text-gray-500 text-xs mb-1">
                          <MapPin size={12} color="#9CA3AF" className="mr-1" />
                          <Text className="line-clamp-1">{activity.address}</Text>
                        </View>
                        
                        <View className="flex items-center text-gray-500 text-xs">
                          <Users size={12} color="#9CA3AF" className="mr-1" />
                          <Text>{activity.current_participants}/{activity.max_participants}人</Text>
                          {activity.offline_price > 0 && (
                            <Text className="ml-2 text-orange-500">¥{activity.offline_price}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    {/* 操作按钮 */}
                    <View className="flex flex-row border-t border-gray-100">
                      <View 
                        className="flex-1 flex items-center justify-center py-2 border-r border-gray-100"
                        onClick={() => handleView(activity.id)}
                      >
                        <Eye size={14} color="#2563EB" />
                        <Text className="text-xs text-blue-600 ml-1">预览</Text>
                      </View>
                      <View 
                        className="flex-1 flex items-center justify-center py-2 border-r border-gray-100"
                        onClick={() => handleViewParticipants(activity.id)}
                      >
                        <Users size={14} color="#10B981" />
                        <Text className="text-xs text-green-600 ml-1">报名</Text>
                      </View>
                      {activity.status !== 'ended' && (
                        <View 
                          className="flex-1 flex items-center justify-center py-2 border-r border-gray-100"
                          onClick={() => handleEdit(activity.id)}
                        >
                          <Pencil size={14} color="#F59E0B" />
                          <Text className="text-xs text-amber-600 ml-1">编辑</Text>
                        </View>
                      )}
                      {activity.location_type === 'offline' && activity.status !== 'ended' && (
                        <View 
                          className="flex-1 flex items-center justify-center py-2 border-r border-gray-100"
                          onClick={() => handleQRCode(activity.id)}
                        >
                          <QrCode size={14} color="#8B5CF6" />
                          <Text className="text-xs text-purple-600 ml-1">核销</Text>
                        </View>
                      )}
                      <View 
                        className="flex-1 flex items-center justify-center py-2"
                        onClick={() => handleDelete(activity)}
                      >
                        <Trash2 size={14} color="#EF4444" />
                        <Text className="text-xs text-red-500 ml-1">删除</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 创建按钮 */}
      <View 
        className="fixed right-4 bottom-20 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
        onClick={handleCreate}
      >
        <Plus size={24} color="white" />
      </View>
    </View>
  )
}

export default ActivityManagePage
