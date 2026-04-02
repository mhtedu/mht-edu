import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { getLocation } from '@/utils'
import { MapPin, ChevronDown, ChevronRight, Briefcase, GraduationCap, Share2, Wallet, Search, Building2, Plus, Crown, Star, Phone, Heart } from 'lucide-react-taro'
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

// 教师数据类型
interface TeacherItem {
  id: number
  name: string
  avatar?: string
  subjects: string[]
  hourly_rate: number
  rating: number
  order_count: number
  education: string
  experience: string
  distance_text: string
  tags: string[]
}

// 学科选项
const subjectOptions = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [currentRole, setCurrentRole] = useState(1) // 0: 家长端, 1: 教师端
  const [selectedSubject, setSelectedSubject] = useState('全部')
  const [demands, setDemands] = useState<DemandItem[]>([])
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
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
      if (currentRole === 1) {
        await loadNearbyDemands(loc)
      } else {
        await loadNearbyTeachers(loc)
      }
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

  // 加载附近教师（家长端选择）
  const loadNearbyTeachers = async (loc?: { latitude: number; longitude: number } | null) => {
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
      console.log('加载附近教师请求:', { url: '/api/teachers/nearby', params })
      const res = await Network.request({
        url: '/api/teachers/nearby',
        data: params
      })
      console.log('加载附近教师响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setTeachers(list.map((item: any) => ({
          ...item,
          distance_text: item.distance_text || (item.distance ? 
            (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`) 
            : '')
        })))
      }
    } catch (error) {
      console.error('加载附近教师失败:', error)
      // 使用模拟数据
      setTeachers([
        {
          id: 1,
          name: '张老师',
          subjects: ['数学', '物理'],
          hourly_rate: 200,
          rating: 4.9,
          order_count: 128,
          education: '北京大学硕士',
          experience: '8年教学经验',
          distance_text: '1.2km',
          tags: ['耐心细致', '提分快', '名校背景']
        },
        {
          id: 2,
          name: '李老师',
          subjects: ['英语'],
          hourly_rate: 180,
          rating: 4.8,
          order_count: 86,
          education: '北外硕士',
          experience: '6年教学经验',
          distance_text: '2.5km',
          tags: ['口语地道', '语法扎实', '留学背景']
        },
        {
          id: 3,
          name: '王老师',
          subjects: ['语文', '历史'],
          hourly_rate: 160,
          rating: 4.7,
          order_count: 95,
          education: '北师大本科',
          experience: '5年教学经验',
          distance_text: '3.0km',
          tags: ['亲和力强', '写作辅导', '文史兼修']
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
      if (currentRole === 1) {
        loadNearbyDemands(loc)
      } else {
        loadNearbyTeachers(loc)
      }
      Taro.showToast({ title: '定位成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    }
  }

  const handleSwitchRole = () => {
    const newRole = currentRole === 0 ? 1 : 0
    setCurrentRole(newRole)
    setSelectedSubject('全部')
    // 切换角色后加载对应数据
    if (newRole === 1) {
      loadNearbyDemands(location)
    } else {
      loadNearbyTeachers(location)
    }
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    if (currentRole === 1) {
      loadNearbyDemands(location)
    } else {
      loadNearbyTeachers(location)
    }
  }

  const goToMember = () => {
    Taro.navigateTo({ url: '/pages/member/index' })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goToTeacherDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  }

  const goToOrgList = () => {
    Taro.navigateTo({ url: '/pages/org/list' })
  }

  const goToPublishDemand = () => {
    Taro.navigateTo({ url: '/pages/publish-demand/index' })
  }

  const handleGrabOrder = (id: number) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再抢单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            goToLogin()
          }
        }
      })
      return
    }
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

  const handleContactTeacher = (teacher: TeacherItem) => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再联系教师',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            goToLogin()
          }
        }
      })
      return
    }
    Taro.showModal({
      title: '联系方式',
      content: `即将查看${teacher.name}的联系方式`,
      confirmText: '查看',
      success: (res) => {
        if (res.confirm) {
          // 跳转到教师详情页
          goToTeacherDetail(teacher.id)
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
    { icon: <Briefcase size={22} color="#10B981" />, text: '工作台', bgColor: '#D1FAE5', action: () => Taro.navigateTo({ url: '/pages/teacher-workbench/index' }) },
    { icon: <GraduationCap size={22} color="#8B5CF6" />, text: '创建牛师班', bgColor: '#EDE9FE', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Share2 size={22} color="#F59E0B" />, text: '转发赚钱', bgColor: '#FEF3C7', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Wallet size={22} color="#2563EB" />, text: '收益中心', bgColor: '#DBEAFE', action: () => Taro.navigateTo({ url: '/pages/earnings/index' }) },
  ]

  // 家长端功能入口
  const parentEntries = [
    { icon: <Search size={22} color="#2563EB" />, text: '找教师', bgColor: '#DBEAFE', action: () => Taro.navigateTo({ url: '/pages/teacher/list' }) },
    { icon: <Building2 size={22} color="#10B981" />, text: '找机构', bgColor: '#D1FAE5', action: () => goToOrgList() },
    { icon: <Plus size={22} color="#F59E0B" />, text: '发布需求', bgColor: '#FEF3C7', action: () => goToPublishDemand() },
    { icon: <Crown size={22} color="#8B5CF6" />, text: '会员中心', bgColor: '#EDE9FE', action: () => goToMember() },
  ]

  const entries = currentRole === 1 ? teacherEntries : parentEntries

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

        {/* 内容区域 - 根据角色显示不同内容 */}
        <View className="demand-section">
          <View className="section-header">
            <Text className="section-title">{currentRole === 1 ? '附近需求' : '附近教师'}</Text>
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

          {/* 教师端 - 需求列表 */}
          {currentRole === 1 && (loading || listLoading ? (
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
          ))}

          {/* 家长端 - 教师列表 */}
          {currentRole === 0 && (loading || listLoading ? (
            <View className="loading-area">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : teachers.length > 0 ? (
            teachers.map((teacher) => (
              <View key={teacher.id} className="teacher-card" onClick={() => goToTeacherDetail(teacher.id)}>
                <View className="teacher-header">
                  <View className="teacher-avatar">
                    <Text className="avatar-text">{teacher.name.charAt(0)}</Text>
                  </View>
                  <View className="teacher-info">
                    <View className="teacher-name-row">
                      <Text className="teacher-name">{teacher.name}</Text>
                      <View className="teacher-rating">
                        <Star size={12} color="#F59E0B" />
                        <Text className="rating-text">{teacher.rating}</Text>
                      </View>
                    </View>
                    <Text className="teacher-subjects">{teacher.subjects.join(' · ')}</Text>
                    <View className="teacher-tags">
                      {teacher.tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} className="teacher-tag">
                          <Text className="tag-text">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View className="teacher-detail">
                  <View className="detail-row">
                    <Text className="detail-item">{teacher.education}</Text>
                    <Text className="detail-item">{teacher.experience}</Text>
                    <Text className="detail-distance">{teacher.distance_text}</Text>
                  </View>
                  <View className="teacher-footer">
                    <Text className="teacher-price">¥{teacher.hourly_rate}/小时</Text>
                    <Text className="teacher-orders">已接单{teacher.order_count}单</Text>
                  </View>
                </View>

                <View className="teacher-actions">
                  <View className="action-favorite" onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '已收藏', icon: 'success' }) }}>
                    <Heart size={14} color="#6B7280" />
                    <Text className="action-favorite-text">收藏</Text>
                  </View>
                  <View className="action-contact" onClick={(e) => { e.stopPropagation(); handleContactTeacher(teacher) }}>
                    <Phone size={14} color="#fff" />
                    <Text className="action-contact-text">联系TA</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="empty-area">
              <Text className="empty-text">暂无附近教师</Text>
            </View>
          ))}

          {/* 推荐卡片 */}
          {currentRole === 1 && (
            <>
              {/* 优秀教师推荐卡片 - 教师端看机构推荐 */}
              <View className="recommend-card" onClick={goToOrgList}>
                <View className="recommend-left">
                  <View className="recommend-tag">
                    <Text className="recommend-tag-text">优质机构</Text>
                  </View>
                  <Text className="recommend-title">合作机构推荐</Text>
                  <Text className="recommend-desc">查看平台优质合作机构</Text>
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
            </>
          )}

          {currentRole === 0 && (
            <>
              {/* 家长端 - 发布需求引导 */}
              <View className="recommend-card" onClick={goToPublishDemand}>
                <View className="recommend-left">
                  <View className="recommend-tag">
                    <Text className="recommend-tag-text">快速匹配</Text>
                  </View>
                  <Text className="recommend-title">发布您的需求</Text>
                  <Text className="recommend-desc">让优质教师主动联系您</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>

              {/* 家长端 - 会员权益 */}
              <View className="welfare-card" onClick={goToMember}>
                <View className="welfare-left">
                  <View className="welfare-tag">
                    <Text className="welfare-tag-text">会员权益</Text>
                  </View>
                  <Text className="welfare-title">开通会员享更多权益</Text>
                  <Text className="welfare-desc">无限次查看联系方式</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </>
          )}
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
                <Briefcase size={12} color="#fff" />
                <Text className="activity-users-text">128人参与</Text>
              </View>
            </View>
            <View className="activity-card activity-pink">
              <View className="activity-tag">
                <Text className="activity-tag-text">会员专享</Text>
              </View>
              <Text className="activity-title">会员日特惠</Text>
              <View className="activity-users">
                <Crown size={12} color="#fff" />
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
