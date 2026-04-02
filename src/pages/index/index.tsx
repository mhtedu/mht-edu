import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { getLocation } from '@/utils'
import { MapPin, ChevronRight, RefreshCw, BookOpen, Share2, Wallet, Heart, Crown, Briefcase, GraduationCap } from 'lucide-react-taro'
import './index.css'

// 教师数据类型
interface TeacherItem {
  id: number
  nickname: string
  avatar: string
  real_name: string
  gender?: number
  education?: string
  subjects: string[]
  grades: string[]
  teaching_years: number
  hourly_rate_min: number
  hourly_rate_max: number
  rating: number
  review_count: number
  one_line_intro: string
  distance_text: string
}

// 需求/订单数据类型
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

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [currentRole, setCurrentRole] = useState(0) // 0: 家长端, 1: 教师端
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [demands, setDemands] = useState<DemandItem[]>([])
  const [listLoading, setListLoading] = useState(false)

  const { isLoggedIn, setLocation: setUserLocation } = useUserStore()

  useLoad(() => {
    console.log('Home page loaded.')
  })

  useDidShow(() => {
    loadInitData()
  })

  usePullDownRefresh(() => {
    loadInitData().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadInitData = async () => {
    setLoading(true)
    try {
      // 获取位置
      const loc = await getLocation()
      if (loc) {
        setLocation(loc)
        setUserLocation(loc)
      }

      // 根据角色加载不同数据
      if (currentRole === 0) {
        await loadNearbyTeachers(loc)
      } else {
        await loadNearbyDemands(loc)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载附近教师（家长端）
  const loadNearbyTeachers = async (loc?: { latitude: number; longitude: number } | null) => {
    setListLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      console.log('加载附近教师请求:', { url: '/api/user/teachers/list', params })
      const res = await Network.request({
        url: '/api/user/teachers/list',
        data: params
      })
      console.log('加载附近教师响应:', res.data)
      if (res.data) {
        setTeachers(Array.isArray(res.data) ? res.data : res.data.list || [])
      }
    } catch (error) {
      console.error('加载附近教师失败:', error)
      // 使用模拟数据
      setTeachers([
        {
          id: 1,
          nickname: '李老师',
          avatar: '',
          real_name: '李明',
          gender: 1,
          education: '硕士',
          subjects: ['数学', '物理'],
          grades: ['高一', '高二', '高三'],
          teaching_years: 8,
          hourly_rate_min: 150,
          hourly_rate_max: 200,
          rating: 4.9,
          review_count: 128,
          one_line_intro: '专注高考数学提分，平均提分30+',
          distance_text: '2.5km'
        },
        {
          id: 2,
          nickname: '王老师',
          avatar: '',
          real_name: '王芳',
          gender: 2,
          education: '本科',
          subjects: ['英语'],
          grades: ['初一', '初二', '初三'],
          teaching_years: 6,
          hourly_rate_min: 120,
          hourly_rate_max: 150,
          rating: 4.8,
          review_count: 86,
          one_line_intro: '英语专业八级，擅长口语和写作',
          distance_text: '3.2km'
        }
      ])
    } finally {
      setListLoading(false)
    }
  }

  // 加载附近需求（教师端）
  const loadNearbyDemands = async (loc?: { latitude: number; longitude: number } | null) => {
    setListLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10, radius: 50 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      console.log('加载附近需求请求:', { url: '/api/order/nearby', params })
      const res = await Network.request({
        url: '/api/order/nearby',
        data: params
      })
      console.log('加载附近需求响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setDemands(list.map((item: any) => ({
          ...item,
          distance_text: item.distance_text || (item.distance ? 
            (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`) 
            : '')
        })))
      }
    } catch (error) {
      console.error('加载附近需求失败:', error)
      // 使用模拟数据
      setDemands([
        {
          id: 1,
          subject: '数学',
          student_grade: '高二',
          gender: 1,
          hourly_rate: 180,
          description: '需要数学辅导，目标提高30分',
          address: '朝阳区望京',
          distance_text: '1.5km',
          status: 0,
          created_at: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 2,
          subject: '英语',
          student_grade: '初三',
          gender: 2,
          hourly_rate: 150,
          description: '英语口语和写作辅导',
          address: '海淀区中关村',
          distance_text: '2.8km',
          status: 0,
          created_at: new Date(Date.now() - 5 * 3600000).toISOString()
        }
      ])
    } finally {
      setListLoading(false)
    }
  }

  const handleRefreshLocation = async () => {
    Taro.showLoading({ title: '定位中...' })
    const loc = await getLocation()
    Taro.hideLoading()
    if (loc) {
      setLocation(loc)
      setUserLocation(loc)
      if (currentRole === 0) {
        loadNearbyTeachers(loc)
      } else {
        loadNearbyDemands(loc)
      }
      Taro.showToast({ title: '定位成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    }
  }

  const handleSwitchRole = () => {
    const newRole = currentRole === 0 ? 1 : 0
    setCurrentRole(newRole)
    // 切换角色后重新加载数据
    if (newRole === 0) {
      loadNearbyTeachers(location)
    } else {
      loadNearbyDemands(location)
    }
  }

  const goToTeacherDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  }

  const goToDemandDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  // 格式化时间
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  // 家长端功能入口
  const parentEntries = [
    { icon: <BookOpen size={24} color="#10B981" />, text: '发布需求', action: () => Taro.navigateTo({ url: '/pages/publish-demand/index' }) },
    { icon: <GraduationCap size={24} color="#8B5CF6" />, text: '牛师班', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Heart size={24} color="#EF4444" />, text: '收藏教师', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Crown size={24} color="#2563EB" />, text: '会员中心', action: () => Taro.navigateTo({ url: '/pages/member/index' }) },
  ]

  // 教师端功能入口
  const teacherEntries = [
    { icon: <Briefcase size={24} color="#10B981" />, text: '工作台', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <GraduationCap size={24} color="#8B5CF6" />, text: '创建牛师班', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Share2 size={24} color="#F59E0B" />, text: '转发赚钱', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Wallet size={24} color="#2563EB" />, text: '收益中心', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
  ]

  const entries = currentRole === 0 ? parentEntries : teacherEntries

  return (
    <View className="home-page">
      {/* 顶部定位栏 */}
      <View className="location-bar">
        <View className="location-left" onClick={handleRefreshLocation}>
          <MapPin size={18} color="#2563EB" />
          <Text className="location-text">{location?.address || '定位中...'}</Text>
          <RefreshCw size={14} color="#6B7280" />
        </View>
        <View className="role-switch" onClick={handleSwitchRole}>
          <Text className="role-text">{currentRole === 0 ? '家长端' : '教师端'}</Text>
          <ChevronRight size={14} color="#2563EB" />
        </View>
      </View>

      <ScrollView scrollY className="home-scroll">
        {/* 轮播图区域 */}
        <View className="banner-area">
          <View className="banner-placeholder">
            <Text className="banner-text">活动轮播图</Text>
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="quick-entry">
          {entries.map((entry, idx) => (
            <View key={idx} className="entry-item" onClick={entry.action}>
              <View className="entry-icon">{entry.icon}</View>
              <Text className="entry-text">{entry.text}</Text>
            </View>
          ))}
        </View>

        {/* 家长端：附近教师列表 */}
        {currentRole === 0 && (
          <View className="section-container">
            <View className="section-header">
              <Text className="section-title">附近教师</Text>
              <View className="section-more">
                <Text className="more-text">更多</Text>
                <ChevronRight size={16} color="#6B7280" />
              </View>
            </View>
            
            {loading || listLoading ? (
              <>
                <Skeleton className="h-24 rounded-lg mb-3" />
                <Skeleton className="h-24 rounded-lg" />
              </>
            ) : teachers.length > 0 ? (
              teachers.map((teacher) => (
                <View
                  key={teacher.id}
                  className="teacher-card"
                  onClick={() => goToTeacherDetail(teacher.id)}
                >
                  <View className="teacher-avatar">
                    {teacher.avatar ? (
                      <Image src={teacher.avatar} className="avatar-img" mode="aspectFill" />
                    ) : (
                      <View className="avatar-placeholder">
                        <Text className="avatar-text">{(teacher.real_name || teacher.nickname)?.[0]}</Text>
                      </View>
                    )}
                  </View>
                  <View className="teacher-info">
                    <View className="teacher-name-row">
                      <Text className="teacher-name">{teacher.real_name || teacher.nickname}</Text>
                      {teacher.gender !== undefined && (
                        <Text className="teacher-gender">{teacher.gender === 1 ? '男' : '女'}</Text>
                      )}
                      {teacher.education && (
                        <Text className="teacher-education">{teacher.education}</Text>
                      )}
                    </View>
                    <View className="teacher-subjects">
                      {teacher.subjects?.slice(0, 3).map((subject, idx) => (
                        <View key={idx} className="subject-tag"><Text>{subject}</Text></View>
                      ))}
                    </View>
                    <Text className="teacher-intro">{teacher.one_line_intro}</Text>
                    <View className="teacher-bottom">
                      <Text className="teacher-price">¥{teacher.hourly_rate_min}-{teacher.hourly_rate_max}/小时</Text>
                      <View className="teacher-meta">
                        <Text className="teacher-exp">{teacher.teaching_years}年教龄</Text>
                        <Text className="teacher-distance">{teacher.distance_text}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="teacher-action">
                    <View className="action-btn">
                      <Text className="action-btn-text">查看详情</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">暂无附近教师</Text>
              </View>
            )}
          </View>
        )}

        {/* 教师端：附近需求列表 */}
        {currentRole === 1 && (
          <View className="section-container">
            <View className="section-header">
              <Text className="section-title">附近需求</Text>
              <View className="section-more">
                <Text className="more-text">更多</Text>
                <ChevronRight size={16} color="#6B7280" />
              </View>
            </View>
            
            {loading || listLoading ? (
              <>
                <Skeleton className="h-28 rounded-lg mb-3" />
                <Skeleton className="h-28 rounded-lg" />
              </>
            ) : demands.length > 0 ? (
              demands.map((demand) => (
                <View
                  key={demand.id}
                  className="demand-card"
                  onClick={() => goToDemandDetail(demand.id)}
                >
                  <View className="demand-header">
                    <View className="demand-subject">
                      <Text className="subject-text">{demand.subject}</Text>
                    </View>
                    <Badge variant="secondary" className="status-badge">
                      <Text className="status-text">待抢单</Text>
                    </Badge>
                  </View>
                  <View className="demand-info">
                    <View className="demand-row">
                      <Text className="demand-price">¥{demand.hourly_rate}/小时</Text>
                      <Text className="demand-time">{formatTime(demand.created_at)}</Text>
                    </View>
                    <View className="demand-row">
                      <Text className="demand-grade">{demand.student_grade}</Text>
                      {demand.gender !== undefined && (
                        <Text className="demand-gender">{demand.gender === 1 ? '男' : '女'}</Text>
                      )}
                      <Text className="demand-distance">{demand.distance_text}</Text>
                    </View>
                    <Text className="demand-desc">{demand.description}</Text>
                    <View className="demand-address">
                      <MapPin size={12} color="#6B7280" />
                      <Text className="address-text">{demand.address}</Text>
                    </View>
                  </View>
                  <View className="demand-actions">
                    <View className="action-btn-secondary">
                      <Share2 size={14} color="#6B7280" />
                      <Text className="action-btn-secondary-text">分享</Text>
                    </View>
                    <View className="action-btn-primary">
                      <Text className="action-btn-primary-text">抢单</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">暂无附近需求</Text>
              </View>
            )}
          </View>
        )}

        {/* 未登录提示 */}
        {!isLoggedIn && (
          <Card className="login-tip-card">
            <CardContent className="login-tip-content">
              <Text className="login-tip-text">登录后可查看更多个性化推荐</Text>
              <Button size="sm" onClick={goToLogin}>立即登录</Button>
            </CardContent>
          </Card>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default HomePage
