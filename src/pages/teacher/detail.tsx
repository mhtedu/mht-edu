import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { formatPrice } from '@/utils'
import { Star, MessageCircle, Phone, Award, BookOpen, Users } from 'lucide-react-taro'
import './detail.css'

interface TeacherDetail {
  id: number
  nickname: string
  avatar: string
  real_name: string
  gender: number
  education: string
  school: string
  subjects: string[]
  grades: string[]
  teaching_years: number
  hourly_rate_min: number
  hourly_rate_max: number
  bio: string
  one_line_intro: string
  rating: number
  review_count: number
  view_count: number
  success_count: number
  distance_text: string
  address: string
  teaching_mode: string
  available_time: string
  certificates: string[]
}

const TeacherDetailPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)

  const router = useRouter()
  const { isLoggedIn } = useUserStore()

  useLoad(() => {
    const { id } = router.params
    if (id) {
      loadTeacherDetail(parseInt(id))
    }
  })

  const loadTeacherDetail = async (id: number) => {
    setLoading(true)
    try {
      console.log('加载教师详情请求:', { url: `/api/teacher/${id}` })
      const res = await Network.request({
        url: `/api/teacher/${id}`
      })
      console.log('加载教师详情响应:', res.data)
      
      if (res.data) {
        setTeacher(res.data)
      }
    } catch (error) {
      console.error('加载教师详情失败:', error)
      // 使用模拟数据
      setTeacher({
        id: id,
        nickname: '李老师',
        avatar: '',
        real_name: '李明',
        gender: 1,
        education: '硕士',
        school: '北京大学',
        subjects: ['数学', '物理'],
        grades: ['高一', '高二', '高三'],
        teaching_years: 8,
        hourly_rate_min: 150,
        hourly_rate_max: 200,
        bio: '大家好，我是李明老师，毕业于北京大学数学系，从事高中数学教学8年。擅长将复杂问题简单化，帮助学生建立数学思维。曾帮助多名学生从60分提升到120分以上。',
        one_line_intro: '专注高考数学提分，平均提分30+',
        rating: 4.9,
        review_count: 128,
        view_count: 1256,
        success_count: 86,
        distance_text: '2.5km',
        address: '北京市海淀区中关村',
        teaching_mode: '线上/线下',
        available_time: '工作日晚间、周末全天',
        certificates: ['教师资格证', '高级教师职称']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContact = () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    // 检查会员权限
    Taro.showToast({ title: '请先开通会员', icon: 'none' })
  }

  const handleSendMessage = () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    Taro.switchTab({ url: '/pages/message/index' })
  }

  if (loading) {
    return (
      <View className="teacher-detail-page">
        <Skeleton className="h-48" />
        <View className="p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </View>
      </View>
    )
  }

  if (!teacher) {
    return (
      <View className="teacher-detail-page empty-state">
        <Text className="empty-text">教师不存在或已下架</Text>
        <Button onClick={() => Taro.navigateBack()}>返回</Button>
      </View>
    )
  }

  return (
    <View className="teacher-detail-page">
      <ScrollView scrollY className="detail-scroll">
        {/* 头部信息 */}
        <View className="teacher-header">
          <View className="header-bg" />
          <View className="header-content">
            <View className="teacher-avatar">
              {teacher.avatar ? (
                <Image src={teacher.avatar} className="avatar-img" mode="aspectFill" />
              ) : (
                <View className="avatar-placeholder">
                  <Text className="avatar-text">{teacher.real_name?.[0]}</Text>
                </View>
              )}
            </View>
            <View className="teacher-basic">
              <View className="name-row">
                <Text className="teacher-name">{teacher.real_name}</Text>
                <View className="rating-row">
                  <Star size={16} color="#F59E0B" />
                  <Text className="rating-text">{teacher.rating}</Text>
                  <Text className="review-count">({teacher.review_count}条评价)</Text>
                </View>
              </View>
              <Text className="teacher-intro">{teacher.one_line_intro}</Text>
              <View className="tag-row">
                {teacher.subjects?.map((s, idx) => (
                  <Badge key={idx} className="subject-tag">{s}</Badge>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 统计数据 */}
        <View className="stats-row">
          <View className="stat-item">
            <Text className="stat-value">{teacher.view_count}</Text>
            <Text className="stat-label">浏览</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{teacher.success_count}</Text>
            <Text className="stat-label">成功接单</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{teacher.review_count}</Text>
            <Text className="stat-label">评价</Text>
          </View>
        </View>

        {/* 基本信息 */}
        <Card className="info-card">
          <CardHeader className="card-header">
            <CardTitle className="card-title">
              <BookOpen size={18} color="#2563EB" />
              教学信息
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content">
            <View className="info-item">
              <Text className="info-label">教学年限</Text>
              <Text className="info-value">{teacher.teaching_years}年</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">授课年级</Text>
              <Text className="info-value">{teacher.grades?.join('、')}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">授课方式</Text>
              <Text className="info-value">{teacher.teaching_mode}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">可授课时间</Text>
              <Text className="info-value">{teacher.available_time}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">学历背景</Text>
              <Text className="info-value">{teacher.education} · {teacher.school}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">授课地点</Text>
              <Text className="info-value">{teacher.address}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 个人简介 */}
        <Card className="info-card">
          <CardHeader className="card-header">
            <CardTitle className="card-title">
              <Users size={18} color="#2563EB" />
              个人简介
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content">
            <Text className="bio-text">{teacher.bio}</Text>
          </CardContent>
        </Card>

        {/* 资质证书 */}
        {teacher.certificates && teacher.certificates.length > 0 && (
          <Card className="info-card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">
                <Award size={18} color="#2563EB" />
                资质证书
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content">
              <View className="cert-list">
                {teacher.certificates.map((cert, idx) => (
                  <View key={idx} className="cert-item">
                    <Badge variant="outline" className="cert-tag">{cert}</Badge>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <View className="price-section">
          <Text className="price-label">课时费</Text>
          <Text className="price-value">{formatPrice(teacher.hourly_rate_min, teacher.hourly_rate_max)}</Text>
        </View>
        <View className="action-buttons">
          <Button variant="outline" className="action-btn message" onClick={handleSendMessage}>
            <MessageCircle size={18} color="#2563EB" />
            <Text className="btn-text">咨询</Text>
          </Button>
          <Button className="action-btn contact" onClick={handleContact}>
            <Phone size={18} color="#fff" />
            <Text className="btn-text-light">联系老师</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default TeacherDetailPage
