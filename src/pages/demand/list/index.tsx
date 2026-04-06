import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { MapPin } from 'lucide-react-taro'
import { useUserStore } from '@/stores/user'
import './index.css'

interface DemandItem {
  id: number
  subject: string
  student_grade: string
  gender?: number
  hourly_rate: number
  description: string
  address: string
  distance_text: string
  status: number
  created_at: string
  user?: {
    id: number
    nickname: string
    avatar?: string
  }
}

const subjectOptions = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

/**
 * 需求列表页面
 */
export default function DemandListPage() {
  const [demands, setDemands] = useState<DemandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('全部')

  const { isLoggedIn, location } = useUserStore()

  useDidShow(() => {
    loadDemands()
  })

  usePullDownRefresh(() => {
    loadDemands().finally(() => Taro.stopPullDownRefresh())
  })

  const loadDemands = async (pageNum = 1) => {
    setLoading(true)
    try {
      const params: string[] = [`page=${pageNum}`, `pageSize=20`, `radius=50`]
      if (location) {
        params.push(`latitude=${location.latitude}`)
        params.push(`longitude=${location.longitude}`)
      }
      if (selectedSubject !== '全部') {
        params.push(`subject=${encodeURIComponent(selectedSubject)}`)
      }

      const res = await Network.request({
        url: `/api/order/nearby?${params.join('&')}`
      })

      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        const formattedList = list.map((item: any) => ({
          ...item,
          distance_text: item.distance_text || (item.distance ?
            (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`)
            : '')
        }))

        if (pageNum === 1) {
          setDemands(formattedList)
        } else {
          setDemands(prev => [...prev, ...formattedList])
        }
      }
    } catch (error) {
      console.error('加载需求列表失败:', error)
      // 模拟数据
      const mockData: DemandItem[] = [
        { id: 1, subject: '数学', student_grade: '高二', hourly_rate: 180, description: '需要数学辅导，目标提高30分，每周两次课', address: '朝阳区望京', distance_text: '1.5km', status: 0, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: 2, subject: '英语', student_grade: '初三', hourly_rate: 150, description: '英语口语和写作辅导，准备中考', address: '海淀区中关村', distance_text: '2.8km', status: 0, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: 3, subject: '物理', student_grade: '高一', hourly_rate: 200, description: '物理基础薄弱，需要从基础开始辅导', address: '西城区金融街', distance_text: '3.2km', status: 0, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
      ]
      setDemands(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    loadDemands(1)
  }

  const handleGrabOrder = (demand: DemandItem) => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录后再抢单', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }

    const userRole = Taro.getStorageSync('userRole')
    if (userRole !== 1 && userRole !== '1') {
      Taro.showToast({ title: '仅牛师端可以抢单', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认抢单',
      content: `科目：${demand.subject}\n年级：${demand.student_grade}\n预算：¥${demand.hourly_rate}/小时`,
      confirmText: '确认抢单',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '抢单中...' })
          Network.request({
            url: `/api/teacher/orders/${demand.id}/grab`,
            method: 'POST'
          }).then(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '抢单成功', icon: 'success' })
            loadDemands(1)
          }).catch(() => {
            Taro.hideLoading()
            Taro.showToast({ title: '抢单失败，请重试', icon: 'none' })
          })
        }
      }
    })
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 头部筛选 */}
      <View className="bg-white sticky top-0 z-10">
        <ScrollView scrollX className="whitespace-nowrap px-4 py-3">
          {subjectOptions.map((subject, idx) => (
            <View
              key={idx}
              className={`inline-block px-3 py-1 mr-2 rounded-full ${selectedSubject === subject ? 'bg-blue-600' : 'bg-gray-100'}`}
              onClick={() => handleSubjectChange(subject)}
            >
              <Text className={`block text-sm ${selectedSubject === subject ? 'text-white' : 'text-gray-500'}`}>{subject}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 需求列表 */}
      <ScrollView scrollY className="h-screen">
        <View className="p-4">
          {loading && demands.length === 0 ? (
            <View className="py-20 text-center">
              <Text className="block text-sm text-gray-400">加载中...</Text>
            </View>
          ) : demands.length === 0 ? (
            <View className="py-20 text-center">
              <Text className="block text-sm text-gray-400">暂无需求</Text>
            </View>
          ) : (
            demands.map((demand) => (
              <Card key={demand.id} className="mb-3" onClick={() => goToDetail(demand.id)}>
                <CardContent className="p-4">
                  <View className="flex flex-row items-center justify-between mb-2">
                    <View className="bg-blue-600 px-3 py-1 rounded">
                      <Text className="block text-sm font-semibold text-white">{demand.subject}</Text>
                    </View>
                    <View className="bg-blue-100 px-2 py-1 rounded">
                      <Text className="block text-xs text-blue-600">待抢单</Text>
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="flex flex-row items-center justify-between mb-1">
                      <Text className="block text-base font-semibold text-blue-600">¥{demand.hourly_rate}/小时</Text>
                      <Text className="block text-xs text-gray-400">{formatTime(demand.created_at)}</Text>
                    </View>
                    <Text className="block text-xs text-gray-500">{demand.student_grade}</Text>
                  </View>

                  <Text className="block text-sm text-gray-700 mb-3 line-clamp-2">{demand.description}</Text>

                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center">
                      <MapPin size={14} color="#9CA3AF" />
                      <Text className="block text-xs text-gray-500 ml-1">{demand.address}</Text>
                      <Text className="block text-xs text-blue-600 ml-2">{demand.distance_text}</Text>
                    </View>
                  </View>

                  <View className="flex flex-row justify-end mt-3 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleGrabOrder(demand) }}
                    >
                      <Text className="block text-sm text-white">立即抢单</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}
