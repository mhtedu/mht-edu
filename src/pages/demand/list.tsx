import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { MapPin, Share2 } from 'lucide-react-taro'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import './list.css'

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
}

const subjectOptions = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const DemandListPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [demands, setDemands] = useState<DemandItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('全部')

  const { location } = useUserStore()

  useLoad(() => {
    console.log('Demand list page loaded.')
  })

  useDidShow(() => {
    loadDemands(true)
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadDemands(false)
    }
  })

  usePullDownRefresh(() => {
    loadDemands(true).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadDemands = async (refresh: boolean = false) => {
    if (loading && !refresh) return

    setLoading(true)
    const currentPage = refresh ? 1 : page

    try {
      const params: string[] = [`page=${currentPage}`, `pageSize=20`, `radius=50`]
      if (location) {
        params.push(`latitude=${location.latitude}`)
        params.push(`longitude=${location.longitude}`)
      }
      if (selectedSubject !== '全部') {
        params.push(`subject=${encodeURIComponent(selectedSubject)}`)
      }

      console.log('加载需求列表请求:', { url: '/api/order/nearby', params: params.join('&') })
      const res = await Network.request({
        url: `/api/order/nearby?${params.join('&')}`
      })
      console.log('加载需求列表响应:', res.data)

      const list = Array.isArray(res.data) ? res.data : res.data.list || []
      const formattedList = list.map((item: any) => ({
        ...item,
        distance_text: item.distance_text || (item.distance ? 
          (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`) 
          : '')
      }))

      if (refresh) {
        setDemands(formattedList)
        setPage(2)
      } else {
        setDemands([...demands, ...formattedList])
        setPage(currentPage + 1)
      }

      setHasMore(formattedList.length >= 20)
    } catch (error) {
      console.error('加载需求列表失败:', error)
      // 使用模拟数据
      const mockDemands: DemandItem[] = [
        { id: 1, subject: '数学', student_grade: '高二', gender: 1, hourly_rate: 180, description: '需要数学辅导，目标提高30分，每周两次课', address: '朝阳区望京', distance_text: '1.5km', status: 0, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: 2, subject: '英语', student_grade: '初三', gender: 2, hourly_rate: 150, description: '英语口语和写作辅导，准备中考', address: '海淀区中关村', distance_text: '2.8km', status: 0, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: 3, subject: '物理', student_grade: '高一', gender: 1, hourly_rate: 200, description: '物理基础薄弱，需要从基础开始辅导', address: '西城区金融街', distance_text: '3.2km', status: 0, created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
        { id: 4, subject: '化学', student_grade: '高三', gender: 2, hourly_rate: 220, description: '高考化学冲刺辅导', address: '东城区王府井', distance_text: '4.5km', status: 0, created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
        { id: 5, subject: '语文', student_grade: '初一', gender: 1, hourly_rate: 120, description: '作文写作辅导', address: '丰台区方庄', distance_text: '5.1km', status: 0, created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
      ]

      if (refresh) {
        setDemands(mockDemands)
        setPage(2)
      } else {
        setDemands([...demands, ...mockDemands])
        setPage(currentPage + 1)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleGrabOrder = (demand: DemandItem) => {
    const isLoggedIn = Taro.getStorageSync('token')
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录后再抢单', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }

    Taro.showModal({
      title: '确认抢单',
      content: `科目：${demand.subject}\n年级：${demand.student_grade}\n预算：¥${demand.hourly_rate}/小时\n距离：${demand.distance_text}`,
      confirmText: '确认抢单',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '抢单中...' })
          Network.request({ 
            url: `/api/teacher/orders/${demand.id}/grab`, 
            method: 'POST' 
          }).then((result) => {
            Taro.hideLoading()
            console.log('抢单响应:', result.data)
            Taro.showToast({ title: '抢单成功', icon: 'success' })
            loadDemands(true)
          }).catch((err) => {
            Taro.hideLoading()
            console.error('抢单失败:', err)
            Taro.showToast({ title: '抢单失败，请重试', icon: 'none' })
          })
        }
      }
    })
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    setTimeout(() => loadDemands(true), 100)
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
    <View className="demand-list-page">
      {/* 科目筛选 */}
      <View className="subject-filter">
        <ScrollView scrollX className="subject-scroll">
          {subjectOptions.map((subject) => (
            <View
              key={subject}
              className={`subject-item ${selectedSubject === subject ? 'active' : ''}`}
              onClick={() => handleSubjectChange(subject)}
            >
              <Text className="subject-text">{subject}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 需求列表 */}
      <ScrollView scrollY className="demand-scroll">
        {demands.map((demand) => (
          <Card key={demand.id} className="demand-card">
            <CardContent className="demand-content">
              <View className="demand-header">
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
                  <View className="flex flex-row items-center justify-between mb-1">
                    <Text className="block text-xs text-gray-500 mr-3">{demand.student_grade}</Text>
                    <Text className="block text-xs text-gray-500 mr-3">{demand.gender === 1 ? '男' : '女'}</Text>
                    <Text className="block text-xs text-blue-600">{demand.distance_text}</Text>
                  </View>
                  <Text className="block text-sm text-gray-700 leading-relaxed mb-1">{demand.description}</Text>
                  <View className="flex flex-row items-center">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="block text-xs text-gray-400 ml-1">{demand.address}</Text>
                  </View>
                </View>
                <View className="flex flex-row items-center justify-end gap-2 border-t border-gray-200 pt-3">
                  <View className="flex flex-row items-center px-3 py-1 border border-gray-200 rounded-full" onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '已分享', icon: 'success' }) }}>
                    <Share2 size={14} color="#6B7280" />
                    <Text className="block text-xs text-gray-500 ml-1">分享</Text>
                  </View>
                  <View className="bg-blue-600 px-5 py-1 rounded-full" onClick={(e) => { e.stopPropagation(); handleGrabOrder(demand) }}>
                    <Text className="block text-sm font-medium text-white">抢单</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        {loading && (
          <>
            <Skeleton className="h-32 rounded-lg mx-3 mb-3" />
            <Skeleton className="h-32 rounded-lg mx-3 mb-3" />
          </>
        )}

        {!loading && demands.length === 0 && (
          <View className="empty-state">
            <Text className="empty-text">暂无符合条件的订单</Text>
            <Button variant="outline" className="retry-btn" onClick={() => loadDemands(true)}>
              重新加载
            </Button>
          </View>
        )}

        {!hasMore && demands.length > 0 && (
          <View className="no-more">
            <Text className="no-more-text">没有更多了</Text>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default DemandListPage
