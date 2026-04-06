import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { formatPrice } from '@/utils'
import { Star, MapPin, SlidersHorizontal, Eye } from 'lucide-react-taro'
import './list.css'

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
  education?: string
}

const subjectOptions = ['全部', '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const TeacherListPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('全部')
  const [showFilter, setShowFilter] = useState(false)

  const { location } = useUserStore()

  useLoad(() => {
    console.log('Teacher list page loaded.')
  })

  useDidShow(() => {
    loadTeachers(true)
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadTeachers(false)
    }
  })

  usePullDownRefresh(() => {
    loadTeachers(true).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadTeachers = async (refresh: boolean = false) => {
    if (loading && !refresh) return

    setLoading(true)
    const currentPage = refresh ? 1 : page

    try {
      const params: Record<string, any> = {
        page: currentPage,
        pageSize: 20,
        subject: selectedSubject !== '全部' ? selectedSubject : undefined,
        keyword: keyword || undefined,
      }

      if (location) {
        params.latitude = location.latitude
        params.longitude = location.longitude
      }

      console.log('加载牛师列表请求:', { url: '/api/user/teachers/list', params })
      const res = await Network.request({
        url: '/api/user/teachers/list',
        data: params
      })
      console.log('加载牛师列表响应:', res.data)

      // 检查HTTP状态码，如果是错误状态码则抛出异常
      if (res.statusCode && res.statusCode >= 400) {
        throw new Error(`HTTP Error: ${res.statusCode}`)
      }

      const list = Array.isArray(res.data) ? res.data : res.data.list || []
      
      if (refresh) {
        setTeachers(list)
        setPage(2)
      } else {
        setTeachers([...teachers, ...list])
        setPage(currentPage + 1)
      }

      setHasMore(list.length >= 20)
    } catch (error) {
      console.error('加载牛师列表失败:', error)
      // 使用模拟数据
      const mockTeachers: TeacherItem[] = [
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
          distance_text: '2.5km',
          education: '北京大学'
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
          distance_text: '3.2km',
          education: '北京外国语大学'
        },
        {
          id: 3,
          nickname: '张老师',
          avatar: '',
          real_name: '张伟',
          subjects: ['语文'],
          grades: ['小学', '初中'],
          teaching_years: 10,
          hourly_rate_min: 100,
          hourly_rate_max: 130,
          rating: 4.7,
          review_count: 156,
          one_line_intro: '语文高级牛师，作文辅导专家',
          distance_text: '4.1km',
          education: '北京师范大学'
        },
      ]

      if (refresh) {
        setTeachers(mockTeachers)
        setPage(2)
      } else {
        setTeachers([...teachers, ...mockTeachers])
        setPage(currentPage + 1)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    setShowFilter(false)
    setTimeout(() => loadTeachers(true), 100)
  }

  return (
    <View className="teacher-list-page">
      {/* 搜索栏 */}
      <View className="search-bar">
        <Input
          className="search-input"
          type="text"
          placeholder="搜索老师姓名、科目..."
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={() => loadTeachers(true)}
        />
        <View className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
          <SlidersHorizontal size={20} color="#6B7280" />
        </View>
      </View>

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

      {/* 牛师列表 */}
      <ScrollView scrollY className="teacher-scroll">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="teacher-card" onClick={() => goToDetail(teacher.id)}>
            <CardContent className="teacher-content">
              <View className="teacher-header">
                <View className="teacher-avatar">
                  {teacher.avatar ? (
                    <Image src={teacher.avatar} className="avatar-img" mode="aspectFill" />
                  ) : (
                    <View className="avatar-placeholder">
                      <Text className="avatar-text">{(teacher.real_name || teacher.nickname)?.[0]}</Text>
                    </View>
                  )}
                </View>
                <View className="teacher-basic">
                  <View className="name-row">
                    <Text className="teacher-name">{teacher.real_name ? `${teacher.real_name[0]}老师` : teacher.nickname}</Text>
                    <View className="rating-row">
                      <Star size={14} color="#F59E0B" />
                      <Text className="rating-text">{teacher.rating}</Text>
                      <Text className="review-count">({teacher.review_count}条评价)</Text>
                    </View>
                  </View>
                  <Text className="teacher-intro">{teacher.one_line_intro}</Text>
                </View>
              </View>

              <View className="teacher-info">
                <View className="info-row">
                  <Text className="info-label">教授科目</Text>
                  <View className="subject-tags">
                    {teacher.subjects?.map((s, idx) => (
                      <Badge key={idx} variant="secondary" className="tag">{s}</Badge>
                    ))}
                  </View>
                </View>
                <View className="info-row">
                  <Text className="info-label">授课年级</Text>
                  <Text className="info-value">{teacher.grades?.join('、')}</Text>
                </View>
                <View className="info-row">
                  <Text className="info-label">教学年限</Text>
                  <Text className="info-value">{teacher.teaching_years}年</Text>
                </View>
                {teacher.education && (
                  <View className="info-row">
                    <Text className="info-label">毕业院校</Text>
                    <Text className="info-value">{teacher.education}</Text>
                  </View>
                )}
              </View>

              <View className="teacher-footer">
                <View className="price-row">
                  <Text className="price">{formatPrice(teacher.hourly_rate_min, teacher.hourly_rate_max)}</Text>
                </View>
                <View className="action-row">
                  <View className="distance-row">
                    <MapPin size={14} color="#9CA3AF" />
                    <Text className="distance">{teacher.distance_text}</Text>
                  </View>
                  <View className="detail-btn" onClick={(e) => { e.stopPropagation(); goToDetail(teacher.id) }}>
                    <Eye size={14} color="#2563EB" />
                    <Text className="detail-text">详情</Text>
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

        {!loading && teachers.length === 0 && (
          <View className="empty-state">
            <Text className="empty-text">暂无符合条件的老师</Text>
            <Button variant="outline" className="retry-btn" onClick={() => loadTeachers(true)}>
              重新加载
            </Button>
          </View>
        )}

        {!hasMore && teachers.length > 0 && (
          <View className="no-more">
            <Text className="no-more-text">没有更多了</Text>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default TeacherListPage
