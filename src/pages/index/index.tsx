import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { getLocation } from '@/utils'
import { MapPin, ChevronDown, ChevronRight, Briefcase, GraduationCap, Share2, Wallet, Users } from 'lucide-react-taro'
import './index.css'

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

// 学科选项
const subjectOptions = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [currentRole, setCurrentRole] = useState(1) // 0: 家长端, 1: 教师端
  const [selectedSubject, setSelectedSubject] = useState('全部')
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

      // 加载需求数据
      await loadNearbyDemands(loc)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载附近需求（教师端抢单）
  const loadNearbyDemands = async (loc?: { latitude: number; longitude: number } | null) => {
    setListLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10, radius: 50 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      if (selectedSubject !== '全部') {
        params.subject = selectedSubject
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
          description: '需要数学辅导，目标提高30分，每周两次课',
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
          description: '英语口语和写作辅导，准备中考',
          address: '海淀区中关村',
          distance_text: '2.8km',
          status: 0,
          created_at: new Date(Date.now() - 5 * 3600000).toISOString()
        },
        {
          id: 3,
          subject: '物理',
          student_grade: '高一',
          gender: 1,
          hourly_rate: 200,
          description: '物理基础薄弱，需要从基础开始辅导',
          address: '西城区金融街',
          distance_text: '3.2km',
          status: 0,
          created_at: new Date(Date.now() - 8 * 3600000).toISOString()
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
      loadNearbyDemands(loc)
      Taro.showToast({ title: '定位成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    }
  }

  const handleSwitchRole = () => {
    const newRole = currentRole === 0 ? 1 : 0
    setCurrentRole(newRole)
    loadNearbyDemands(location)
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    loadNearbyDemands(location)
  }

  const goToMember = () => {
    Taro.navigateTo({ url: '/pages/member/index' })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleGrabOrder = (id: number) => {
    Taro.showModal({
      title: '确认抢单',
      content: '确定要接这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          Network.request({
            url: `/api/demands/${id}/grab`,
            method: 'POST'
          }).then(() => {
            Taro.showToast({ title: '抢单成功', icon: 'success' })
            loadNearbyDemands(location)
          }).catch(() => {
            Taro.showToast({ title: '抢单失败', icon: 'none' })
          })
        }
      }
    })
  }

  // 格式化时间
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

  // 教师端功能入口
  const teacherEntries = [
    { icon: <Briefcase size={22} color="#10B981" />, text: '工作台', bgColor: '#D1FAE5', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <GraduationCap size={22} color="#8B5CF6" />, text: '创建牛师班', bgColor: '#EDE9FE', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Share2 size={22} color="#F59E0B" />, text: '转发赚钱', bgColor: '#FEF3C7', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Wallet size={22} color="#2563EB" />, text: '收益中心', bgColor: '#DBEAFE', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
  ]

  const entries = teacherEntries

  return (
    <View className="home-page">
      {/* 顶部导航栏 */}
      <View className="top-nav">
        <View className="nav-left" onClick={handleRefreshLocation}>
          <MapPin size={16} color="#2563EB" />
          <Text className="city-text">{location?.address?.split(' ')[0] || '北京'}</Text>
          <ChevronDown size={14} color="#2563EB" />
        </View>
        <Text className="nav-title">首页</Text>
        <View className="nav-right" onClick={handleSwitchRole}>
          <Text className="role-text">{currentRole === 0 ? '家长端' : '教师端'}</Text>
          <ChevronDown size={14} color="#2563EB" />
        </View>
      </View>

      <ScrollView scrollY className="home-scroll">
        {/* 轮播图区域 */}
        <View className="banner-area">
          <View className="banner-item banner-green">
            <Text className="banner-question">?</Text>
          </View>
          <View className="banner-dots">
            <View className="dot active" />
            <View className="dot" />
            <View className="dot" />
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="quick-entry">
          {entries.map((entry, idx) => (
            <View key={idx} className="entry-item" onClick={entry.action}>
              <View className="entry-icon" style={{ backgroundColor: entry.bgColor }}>
                {entry.icon}
              </View>
              <Text className="entry-text">{entry.text}</Text>
            </View>
          ))}
        </View>

        {/* 附近需求区域 */}
        <View className="demand-section">
          <View className="section-header">
            <Text className="section-title">附近需求</Text>
            <View className="section-more">
              <Text className="more-text">更多</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>

          {/* 学科分类标签 */}
          <ScrollView scrollX className="subject-tabs">
            {subjectOptions.map((subject, idx) => (
              <View 
                key={idx} 
                className={`subject-tab ${selectedSubject === subject ? 'active' : ''}`}
                onClick={() => handleSubjectChange(subject)}
              >
                <Text className={`subject-tab-text ${selectedSubject === subject ? 'active' : ''}`}>{subject}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 会员提示条 */}
          <View className="member-tip">
            <Text className="member-tip-text">开通会员可查看完整信息与联系方式</Text>
            <View className="member-tip-btn" onClick={goToMember}>
              <Text className="member-tip-btn-text">立即开通</Text>
            </View>
          </View>

          {/* 需求列表 */}
          {loading || listLoading ? (
            <View className="loading-area">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : demands.length > 0 ? (
            demands.map((demand) => (
              <View key={demand.id} className="demand-card">
                <View className="demand-header">
                  <View className="demand-subject-tag">
                    <Text className="demand-subject-text">{demand.subject}</Text>
                  </View>
                  <View className="demand-status">
                    <Text className="demand-status-text">待抢单</Text>
                  </View>
                </View>

                <View className="demand-content">
                  <View className="demand-row">
                    <Text className="demand-price">¥{demand.hourly_rate}/小时</Text>
                    <Text className="demand-time">{formatTime(demand.created_at)}</Text>
                  </View>
                  <View className="demand-row">
                    <Text className="demand-info">{demand.student_grade}</Text>
                    <Text className="demand-info">{demand.gender === 1 ? '男' : '女'}</Text>
                    <Text className="demand-distance">{demand.distance_text}</Text>
                  </View>
                  <Text className="demand-desc">{demand.description}</Text>
                  <View className="demand-address">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="demand-address-text">{demand.address}</Text>
                  </View>
                </View>

                <View className="demand-actions">
                  <View className="action-share">
                    <Share2 size={14} color="#6B7280" />
                    <Text className="action-share-text">分享</Text>
                  </View>
                  <View className="action-grab" onClick={() => handleGrabOrder(demand.id)}>
                    <Text className="action-grab-text">抢单</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="empty-area">
              <Text className="empty-text">暂无附近需求</Text>
            </View>
          )}

          {/* 优秀教师推荐卡片 */}
          <View className="recommend-card">
            <View className="recommend-left">
              <View className="recommend-tag">
                <Text className="recommend-tag-text">优秀教师</Text>
              </View>
              <Text className="recommend-title">优秀教师推荐</Text>
              <Text className="recommend-desc">查看平台精选优质教师</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>

          {/* 新用户福利卡片 */}
          <View className="welfare-card">
            <View className="welfare-left">
              <View className="welfare-tag">
                <Text className="welfare-tag-text">新用户福利</Text>
              </View>
              <Text className="welfare-title">首次抢单立减优惠</Text>
              <Text className="welfare-desc">新用户专享特权</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>

        {/* 热门活动区域 */}
        <View className="activity-section">
          <View className="section-header">
            <Text className="section-title">热门活动</Text>
            <View className="section-more">
              <Text className="more-text">更多</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>

          <ScrollView scrollX className="activity-list">
            <View className="activity-card activity-green">
              <View className="activity-tag">
                <Text className="activity-tag-text">限时活动</Text>
              </View>
              <Text className="activity-title">新人专属礼包</Text>
              <View className="activity-users">
                <Users size={12} color="#fff" />
                <Text className="activity-users-text">128人参与</Text>
              </View>
            </View>
            <View className="activity-card activity-pink">
              <View className="activity-tag">
                <Text className="activity-tag-text">会员专享</Text>
              </View>
              <Text className="activity-title">会员日特惠</Text>
              <View className="activity-users">
                <Users size={12} color="#fff" />
                <Text className="activity-users-text">256人参与</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* 未登录提示 */}
        {!isLoggedIn && (
          <View className="login-tip">
            <Text className="login-tip-text">登录后可查看更多个性化推荐</Text>
            <View className="login-tip-btn" onClick={goToLogin}>
              <Text className="login-tip-btn-text">立即登录</Text>
            </View>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default HomePage
