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
import { Star, MessageCircle, Phone, Award, Building, Users, ChevronRight } from 'lucide-react-taro'
import './detail.css'

interface OrgDetail {
  id: number
  name: string
  logo: string
  description: string
  address: string
  contact_phone: string
  contact_name: string
  teacher_count: number
  rating: number
  review_count: number
  view_count: number
  latitude: number
  longitude: number
  intro: string
  subjects: string[]
  grades: string[]
}

interface OrgTeacher {
  id: number
  nickname: string
  avatar: string
  real_name: string
  subjects: string[]
  rating: number
}

const OrgDetailPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])

  const router = useRouter()
  const { isLoggedIn } = useUserStore()

  useLoad(() => {
    const { id } = router.params
    if (id) {
      loadOrgDetail(parseInt(id))
    }
  })

  const loadOrgDetail = async (id: number) => {
    setLoading(true)
    try {
      console.log('加载机构详情请求:', { url: `/api/org/${id}` })
      const res = await Network.request({
        url: `/api/org/${id}`
      })
      console.log('加载机构详情响应:', res.data)
      
      if (res.data) {
        setOrg(res.data)
        if (res.data.teachers) {
          setTeachers(res.data.teachers)
        }
      }
    } catch (error) {
      console.error('加载机构详情失败:', error)
      // 使用模拟数据
      setOrg({
        id: id,
        name: '优学教育',
        logo: '',
        description: '专注中小学全科辅导，师资力量雄厚，教学环境优良',
        address: '北京市海淀区中关村大街1号',
        contact_phone: '400-123-4567',
        contact_name: '张老师',
        teacher_count: 50,
        rating: 4.7,
        review_count: 256,
        view_count: 3256,
        latitude: 39.98,
        longitude: 116.31,
        intro: '优学教育成立于2010年，是一家专注于中小学全科辅导的教育机构。我们拥有一支经验丰富的师资团队，采用科学的教学方法，帮助无数学子实现了学业进步。机构环境优雅，设施齐全，是您孩子学习的理想选择。',
        subjects: ['数学', '语文', '英语', '物理', '化学'],
        grades: ['小学', '初中', '高中']
      })
      setTeachers([
        { id: 1, nickname: '李老师', avatar: '', real_name: '李明', subjects: ['数学', '物理'], rating: 4.9 },
        { id: 2, nickname: '王老师', avatar: '', real_name: '王芳', subjects: ['英语'], rating: 4.8 },
        { id: 3, nickname: '张老师', avatar: '', real_name: '张伟', subjects: ['语文'], rating: 4.7 },
      ])
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

  const goToTeacherDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  }

  if (loading) {
    return (
      <View className="org-detail-page">
        <Skeleton className="h-48" />
        <View className="p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </View>
      </View>
    )
  }

  if (!org) {
    return (
      <View className="org-detail-page empty-state">
        <Text className="empty-text">机构不存在或已下架</Text>
        <Button onClick={() => Taro.navigateBack()}>返回</Button>
      </View>
    )
  }

  return (
    <View className="org-detail-page">
      <ScrollView scrollY className="detail-scroll">
        {/* 头部信息 */}
        <View className="org-header">
          <View className="header-bg" />
          <View className="header-content">
            <View className="org-logo">
              {org.logo ? (
                <Image src={org.logo} className="logo-img" mode="aspectFill" />
              ) : (
                <View className="logo-placeholder">
                  <Building size={32} color="#10B981" />
                </View>
              )}
            </View>
            <View className="org-basic">
              <Text className="org-name">{org.name}</Text>
              <View className="rating-row">
                <Star size={16} color="#F59E0B" />
                <Text className="rating-text">{org.rating}</Text>
                <Text className="review-count">({org.review_count}条评价)</Text>
              </View>
              <Text className="org-address">{org.address}</Text>
            </View>
          </View>
        </View>

        {/* 统计数据 */}
        <View className="stats-row">
          <View className="stat-item">
            <Text className="stat-value">{org.view_count}</Text>
            <Text className="stat-label">浏览</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{org.teacher_count}</Text>
            <Text className="stat-label">入驻老师</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{org.review_count}</Text>
            <Text className="stat-label">评价</Text>
          </View>
        </View>

        {/* 机构简介 */}
        <Card className="info-card">
          <CardHeader className="card-header">
            <CardTitle className="card-title">
              <Building size={18} color="#10B981" />
              机构简介
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content">
            <Text className="intro-text">{org.intro}</Text>
          </CardContent>
        </Card>

        {/* 开设课程 */}
        <Card className="info-card">
          <CardHeader className="card-header">
            <CardTitle className="card-title">
              <Award size={18} color="#10B981" />
              开设课程
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content">
            <View className="tag-list">
              {org.subjects && org.subjects.map((subject, idx) => (
                <Badge key={idx} className="subject-tag">{subject}</Badge>
              ))}
            </View>
            <View className="grade-row">
              <Text className="grade-label">授课年级：</Text>
              <Text className="grade-value">{org.grades && org.grades.join('、')}</Text>
            </View>
          </CardContent>
        </Card>

        {/* 入驻老师 */}
        {teachers.length > 0 && (
          <Card className="info-card">
            <CardHeader className="card-header">
              <CardTitle className="card-title">
                <Users size={18} color="#10B981" />
                入驻老师
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content">
              {teachers.map((teacher) => (
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
                        <Text className="avatar-text">{teacher.real_name && teacher.real_name[0]}</Text>
                      </View>
                    )}
                  </View>
                  <View className="teacher-info">
                    <Text className="teacher-name">{teacher.real_name}</Text>
                    <View className="teacher-subjects">
                      {teacher.subjects && teacher.subjects.map((s, idx) => (
                        <Badge key={idx} variant="secondary" className="tag">{s}</Badge>
                      ))}
                    </View>
                  </View>
                  <View className="teacher-rating">
                    <Star size={14} color="#F59E0B" />
                    <Text className="rating-text">{teacher.rating}</Text>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 联系方式 */}
        <Card className="info-card">
          <CardHeader className="card-header">
            <CardTitle className="card-title">
              <Phone size={18} color="#10B981" />
              联系方式
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content">
            <View className="contact-item">
              <Text className="contact-label">联系人</Text>
              <Text className="contact-value">{org.contact_name}</Text>
            </View>
            <View className="contact-item">
              <Text className="contact-label">联系电话</Text>
              <Text className="contact-value">{org.contact_phone}</Text>
            </View>
          </CardContent>
        </Card>

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <View className="action-buttons">
          <Button variant="outline" className="action-btn" onClick={handleContact}>
            <MessageCircle size={18} color="#10B981" />
            <Text className="btn-text">在线咨询</Text>
          </Button>
          <Button className="action-btn contact" onClick={handleContact}>
            <Phone size={18} color="#fff" />
            <Text className="btn-text-light">联系电话</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default OrgDetailPage
