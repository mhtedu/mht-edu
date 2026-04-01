import { View, Text, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { Network } from '@/network'
import { getLocation } from '@/utils'
import { 
  MapPin, Plus, GraduationCap, Heart, Crown, Star, Lock, User
} from 'lucide-react-taro'
import './index.css'

interface TeacherItem {
  id: number
  nickname: string
  avatar: string
  real_name: string
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

// 学科筛选标签
const SUBJECT_FILTERS = ['全部', '语文', '数学', '英语', '物理', '化学']

// 角色名称映射
const ROLE_NAMES: Record<number, string> = {
  0: '家长端',
  1: '教师端',
  2: '机构端'
}

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [recommendLoading, setRecommendLoading] = useState(false)
  const [activeSubject, setActiveSubject] = useState('全部')

  const { currentRole, setLocation: setUserLocation } = useUserStore()
  const { siteConfig, loadSiteConfig } = useConfigStore()

  useLoad(() => {
    console.log('Home page loaded.')
  })

  // 动态设置导航栏标题
  useEffect(() => {
    if (siteConfig.site_name) {
      Taro.setNavigationBarTitle({ title: siteConfig.site_name })
    }
  }, [siteConfig.site_name])

  useDidShow(() => {
    loadSiteConfig()
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

      // 加载推荐教师
      await loadRecommendTeachers(loc)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendTeachers = async (loc?: { latitude: number; longitude: number } | null) => {
    setRecommendLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      if (activeSubject !== '全部') {
        params.subject = activeSubject
      }

      const res = await Network.request({
        url: '/api/teacher-profile/recommend',
        method: 'GET',
        data: params
      })

      if (res.data && res.data.data && res.data.data.list) {
        setTeachers(res.data.data.list)
      } else if (res.data && res.data.list) {
        setTeachers(res.data.list)
      }
    } catch (error) {
      console.error('获取推荐教师失败:', error)
      // 使用模拟数据
      setTeachers([
        {
          id: 1,
          nickname: '张明',
          avatar: '',
          real_name: '张明',
          subjects: ['数学', '物理'],
          grades: ['初中', '高中'],
          teaching_years: 8,
          hourly_rate_min: 150,
          hourly_rate_max: 200,
          rating: 4.9,
          review_count: 56,
          one_line_intro: '8年教学经验，擅长中考数学提分，帮助学生快速掌握解题技巧',
          distance_text: '2.5km'
        },
        {
          id: 2,
          nickname: '李老师',
          avatar: '',
          real_name: '李芳',
          subjects: ['英语'],
          grades: ['小学', '初中'],
          teaching_years: 5,
          hourly_rate_min: 120,
          hourly_rate_max: 150,
          rating: 4.8,
          review_count: 32,
          one_line_intro: '英语专业八级，擅长培养英语学习兴趣，提升口语表达能力',
          distance_text: '3.2km'
        }
      ])
    } finally {
      setRecommendLoading(false)
    }
  }

  // 刷新位置
  const handleRefreshLocation = async () => {
    Taro.showLoading({ title: '定位中...' })
    try {
      const loc = await getLocation()
      if (loc) {
        setLocation(loc)
        setUserLocation(loc)
        Taro.showToast({ title: '定位成功', icon: 'success' })
      }
    } catch (error) {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    } finally {
      Taro.hideLoading()
    }
  }

  // 获取城市名称
  const getCityName = () => {
    if (location && location.address) {
      // 从地址中提取城市
      const match = location.address.match(/(.+?市)/)
      return match ? match[1].replace('市', '') : location.address.substring(0, 4)
    }
    return '定位中...'
  }

  // 跳转到教师详情
  const goToTeacherDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${id}` })
  }

  // 跳转到角色切换
  const goToRoleSwitch = () => {
    Taro.navigateTo({ url: '/pages/role-switch/index' })
  }

  // 功能入口跳转
  const goTopublish = () => Taro.navigateTo({ url: '/pages/publish/index' })
  const goToEliteClass = () => Taro.switchTab({ url: '/pages/elite-class/index' })
  const goToFavorites = () => Taro.navigateTo({ url: '/pages/favorites/index' })
  const goToMembership = () => Taro.navigateTo({ url: '/pages/membership/index' })

  // 学科筛选
  const handleSubjectFilter = (subject: string) => {
    setActiveSubject(subject)
    loadRecommendTeachers(location)
  }

  return (
    <View className="home-page">
      {/* 顶部栏：城市 + 标题 + 角色切换 */}
      <View className="top-bar">
        <View className="location-area" onClick={handleRefreshLocation}>
          <MapPin size={16} color="#2563EB" />
          <Text className="city-name">{getCityName()}</Text>
        </View>
        <Text className="page-title">首页</Text>
        <View className="role-switch-btn" onClick={goToRoleSwitch}>
          <User size={16} color="#2563EB" />
          <Text className="role-text">{ROLE_NAMES[currentRole] || '家长端'}</Text>
        </View>
      </View>

      <ScrollView scrollY className="home-scroll">
        {/* 功能入口栏 */}
        <View className="quick-entry-bar">
          <View className="entry-item" onClick={goTopublish}>
            <View className="entry-icon publish">
              <Plus size={24} color="#fff" />
            </View>
            <Text className="entry-text">发布需求</Text>
          </View>
          <View className="entry-item" onClick={goToEliteClass}>
            <View className="entry-icon elite">
              <GraduationCap size={24} color="#fff" />
            </View>
            <Text className="entry-text">牛师班</Text>
          </View>
          <View className="entry-item" onClick={goToFavorites}>
            <View className="entry-icon favorite">
              <Heart size={24} color="#fff" />
            </View>
            <Text className="entry-text">收藏教师</Text>
          </View>
          <View className="entry-item" onClick={goToMembership}>
            <View className="entry-icon member">
              <Crown size={24} color="#fff" />
            </View>
            <Text className="entry-text">会员中心</Text>
          </View>
        </View>

        {/* 轮播图区域 */}
        <View className="banner-section">
          <Swiper 
            className="banner-swiper" 
            indicatorDots 
            autoplay 
            circular
            indicatorColor="rgba(255,255,255,0.5)"
            indicatorActiveColor="#fff"
          >
            <SwiperItem>
              <View className="banner-item banner-1">
                <Text className="banner-title">优质教师推荐</Text>
                <Text className="banner-desc">严选认证教师，放心选择</Text>
              </View>
            </SwiperItem>
            <SwiperItem>
              <View className="banner-item banner-2">
                <Text className="banner-title">牛师班招生中</Text>
                <Text className="banner-desc">名师小班课，名额有限</Text>
              </View>
            </SwiperItem>
            <SwiperItem>
              <View className="banner-item banner-3">
                <Text className="banner-title">会员专享特权</Text>
                <Text className="banner-desc">开通会员，解锁更多权益</Text>
              </View>
            </SwiperItem>
          </Swiper>
        </View>

        {/* 附近教师模块 */}
        <View className="teacher-section">
          <View className="section-header">
            <Text className="section-title">附近教师</Text>
          </View>

          {/* 学科筛选标签 */}
          <View className="filter-tabs">
            {SUBJECT_FILTERS.map((subject) => (
              <View
                key={subject}
                className={`filter-tab ${activeSubject === subject ? 'active' : ''}`}
                onClick={() => handleSubjectFilter(subject)}
              >
                <Text className="filter-text">{subject}</Text>
              </View>
            ))}
          </View>

          {/* 会员提示栏 */}
          <View className="member-tip-bar">
            <View className="tip-left">
              <Lock size={14} color="#F59E0B" />
              <Text className="tip-text">开通会员可查看完整信息与联系方式</Text>
            </View>
            <Button size="sm" className="tip-btn" onClick={goToMembership}>
              立即开通
            </Button>
          </View>

          {/* 教师列表 */}
          <View className="teacher-list">
            {loading || recommendLoading ? (
              <>
                <Skeleton className="h-32 rounded-lg mb-3" />
                <Skeleton className="h-32 rounded-lg" />
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
                        <Text className="avatar-text">{((teacher.real_name || teacher.nickname) && (teacher.real_name || teacher.nickname)[0]) || ''}</Text>
                      </View>
                    )}
                  </View>
                  <View className="teacher-info">
                    <View className="teacher-header">
                      <View className="name-row">
                        <Text className="teacher-name">{teacher.real_name || teacher.nickname}</Text>
                        <Text className="teacher-gender">男</Text>
                      </View>
                      <View className="rating-row">
                        <Star size={12} color="#F59E0B" />
                        <Text className="rating-text">{teacher.rating}</Text>
                      </View>
                    </View>
                    <Text className="teacher-edu">北京大学·硕士</Text>
                    <View className="teacher-subjects">
                      {teacher.subjects && teacher.subjects.slice(0, 2).map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="subject-tag">{subject}</Badge>
                      ))}
                    </View>
                    <Text className="teacher-price">
                      ¥{teacher.hourly_rate_min} - {teacher.hourly_rate_max}/小时
                    </Text>
                    <Text className="teacher-intro">{teacher.one_line_intro}</Text>
                    <Button size="sm" className="detail-btn">
                      查看详情
                    </Button>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">暂无推荐教师</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default HomePage
