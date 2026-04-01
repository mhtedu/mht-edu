import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { Network } from '@/network'
import { getLocation, formatPrice } from '@/utils'
import { MapPin, Search, Star, Users, GraduationCap, Building, ChevronRight, RefreshCw } from 'lucide-react-taro'
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

interface OrgItem {
  id: number
  name: string
  logo: string
  description: string
  teacher_count: number
  rating: number
  review_count: number
  address: string
}

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [recommendLoading, setRecommendLoading] = useState(false)

  const { isLoggedIn, setLocation: setUserLocation } = useUserStore()
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

      // 并行加载推荐数据
      await Promise.all([loadRecommendTeachers(loc), loadRecommendOrgs()])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendTeachers = async (loc?: { latitude: number; longitude: number } | null) => {
    setRecommendLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 5 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      console.log('加载推荐教师请求:', { url: '/api/user/teachers/list', params })
      const res = await Network.request({
        url: '/api/user/teachers/list',
        data: params
      })
      console.log('加载推荐教师响应:', res.data)
      if (res.data) {
        setTeachers(Array.isArray(res.data) ? res.data : res.data.list || [])
      }
    } catch (error) {
      console.error('加载推荐教师失败:', error)
      // 使用模拟数据
      setTeachers([
        {
          id: 1,
          nickname: '李老师',
          avatar: '',
          real_name: '李明',
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
      setRecommendLoading(false)
    }
  }

  const loadRecommendOrgs = async () => {
    try {
      console.log('加载推荐机构请求:', { url: '/api/org/list', data: { page: 1, pageSize: 3 } })
      const res = await Network.request({
        url: '/api/org/list',
        data: { page: 1, pageSize: 3 }
      })
      console.log('加载推荐机构响应:', res.data)
      if (res.data) {
        setOrgs(Array.isArray(res.data) ? res.data : res.data.list || [])
      }
    } catch (error) {
      console.error('加载推荐机构失败:', error)
      // 使用模拟数据
      setOrgs([
        {
          id: 1,
          name: '优学教育',
          logo: '',
          description: '专注中小学全科辅导，师资力量雄厚',
          teacher_count: 50,
          rating: 4.7,
          review_count: 256,
          address: '市中心校区'
        }
      ])
    }
  }

  const handleRefreshLocation = async () => {
    Taro.showLoading({ title: '定位中...' })
    const loc = await getLocation()
    Taro.hideLoading()
    if (loc) {
      setLocation(loc)
      setUserLocation(loc)
      loadRecommendTeachers(loc)
      Taro.showToast({ title: '定位成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    }
  }

  const goToTeacherDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  }

  const goToOrgDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/org/detail?id=${id}` })
  }

  const goToTeacherList = () => {
    Taro.switchTab({ url: '/pages/teacher/list' })
  }

  const goToOrgList = () => {
    Taro.switchTab({ url: '/pages/org/list' })
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  return (
    <View className="home-page">
      {/* 顶部定位栏 */}
      <View className="location-bar">
        <MapPin size={18} color="#2563EB" />
        <Text className="location-text">{location?.address || '定位中...'}</Text>
        <View className="location-refresh" onClick={handleRefreshLocation}>
          <RefreshCw size={16} color="#6B7280" />
        </View>
      </View>

      <ScrollView scrollY className="home-scroll">
        {/* 搜索栏 */}
        <View className="search-bar">
          <View className="search-input">
            <Search size={18} color="#9CA3AF" />
            <Text className="search-placeholder">搜索老师、科目、机构...</Text>
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="quick-entry">
          <View className="entry-item" onClick={goToTeacherList}>
            <View className="entry-icon teacher">
              <GraduationCap size={24} color="#2563EB" />
            </View>
            <Text className="entry-text">找老师</Text>
          </View>
          <View className="entry-item" onClick={goToOrgList}>
            <View className="entry-icon org">
              <Building size={24} color="#10B981" />
            </View>
            <Text className="entry-text">找机构</Text>
          </View>
          <View className="entry-item">
            <View className="entry-icon demand">
              <Users size={24} color="#F59E0B" />
            </View>
            <Text className="entry-text">发布需求</Text>
          </View>
          <View className="entry-item">
            <View className="entry-icon activity">
              <Star size={24} color="#EF4444" />
            </View>
            <Text className="entry-text">热门活动</Text>
          </View>
        </View>

        {/* 推荐老师 */}
        <Card className="section-card">
          <CardHeader className="section-header">
            <CardTitle className="section-title">
              <Star size={18} color="#F59E0B" />
              附近好老师
            </CardTitle>
            <View className="section-more" onClick={goToTeacherList}>
              <Text className="more-text">更多</Text>
              <ChevronRight size={16} color="#6B7280" />
            </View>
          </CardHeader>
          <CardContent className="section-content">
            {loading || recommendLoading ? (
              <>
                <Skeleton className="h-24 rounded-lg mb-3" />
                <Skeleton className="h-24 rounded-lg" />
              </>
            ) : teachers.length > 0 ? (
              teachers.map((teacher) => (
                <View
                  key={teacher.id}
                  className="teacher-item"
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
                      <View className="teacher-rating">
                        <Star size={12} color="#F59E0B" />
                        <Text className="rating-text">{teacher.rating}</Text>
                      </View>
                    </View>
                    <Text className="teacher-intro">{teacher.one_line_intro}</Text>
                    <View className="teacher-tags">
                      {teacher.subjects?.slice(0, 2).map((subject, idx) => (
                        <Badge key={idx} variant="secondary" className="tag">{subject}</Badge>
                      ))}
                      <Text className="teacher-exp">{teacher.teaching_years}年教龄</Text>
                    </View>
                    <View className="teacher-bottom">
                      <Text className="teacher-price">
                        {formatPrice(teacher.hourly_rate_min, teacher.hourly_rate_max)}
                      </Text>
                      <Text className="teacher-distance">{teacher.distance_text}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">暂无推荐老师</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 推荐机构 */}
        <Card className="section-card">
          <CardHeader className="section-header">
            <CardTitle className="section-title">
              <Building size={18} color="#10B981" />
              优质机构
            </CardTitle>
            <View className="section-more" onClick={goToOrgList}>
              <Text className="more-text">更多</Text>
              <ChevronRight size={16} color="#6B7280" />
            </View>
          </CardHeader>
          <CardContent className="section-content">
            {loading ? (
              <Skeleton className="h-20 rounded-lg" />
            ) : orgs.length > 0 ? (
              orgs.map((org) => (
                <View
                  key={org.id}
                  className="org-item"
                  onClick={() => goToOrgDetail(org.id)}
                >
                  <View className="org-logo">
                    {org.logo ? (
                      <Image src={org.logo} className="logo-img" mode="aspectFill" />
                    ) : (
                      <View className="logo-placeholder">
                        <Building size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View className="org-info">
                    <Text className="org-name">{org.name}</Text>
                    <Text className="org-desc">{org.description}</Text>
                    <View className="org-meta">
                      <Text className="org-teachers">{org.teacher_count}位老师</Text>
                      <View className="org-rating">
                        <Star size={12} color="#F59E0B" />
                        <Text className="rating-text">{org.rating}</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text className="empty-text">暂无推荐机构</Text>
              </View>
            )}
          </CardContent>
        </Card>

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
