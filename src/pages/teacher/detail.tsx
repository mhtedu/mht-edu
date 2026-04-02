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
import { Star, MessageCircle, Phone, Award, BookOpen, Users, Heart, MessageSquare, Eye, Play, Plus, Camera, Film, Pencil } from 'lucide-react-taro'
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

// 动态类型
interface MomentItem {
  id: number
  type: 'text' | 'image' | 'video'
  content: string
  media_urls?: string[]
  video_cover?: string
  likes_count: number
  comments_count: number
  views_count: number
  is_liked: boolean
  created_at: string
}

const TeacherDetailPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [moments, setMoments] = useState<MomentItem[]>([])
  const [momentsLoading, setMomentsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'moments'>('info')

  const router = useRouter()
  const { isLoggedIn, userInfo } = useUserStore()

  useLoad(() => {
    const { id } = router.params
    if (id) {
      loadTeacherDetail(parseInt(id))
      loadMoments(parseInt(id))
    }
  })

  const loadTeacherDetail = async (id: number) => {
    setLoading(true)
    try {
      console.log('加载牛师详情请求:', { url: `/api/teacher/${id}` })
      const res = await Network.request({
        url: `/api/teacher/${id}`
      })
      console.log('加载牛师详情响应:', res.data)
      
      if (res.data) {
        const data = res.data
        // 字段映射：后端字段 -> 前端字段
        setTeacher({
          id: data.id,
          nickname: data.nickname,
          avatar: data.avatar,
          real_name: data.real_name,
          gender: data.gender,
          education: data.education,
          school: data.school || '未填写',
          subjects: data.subjects || [],
          grades: data.grades || [],
          teaching_years: data.teaching_years || 0,
          hourly_rate_min: data.hourly_rate_min || 100,
          hourly_rate_max: data.hourly_rate_max || 300,
          bio: data.intro || data.bio || '暂无简介',
          one_line_intro: data.one_line_intro || `${data.education || ''} · ${data.teaching_years || 0}年教学经验`,
          rating: parseFloat(data.rating) || 5.0,
          review_count: data.review_count || data.rating_count || 0,
          view_count: data.view_count || 0,
          success_count: data.success_count || data.order_count || 0,
          distance_text: data.distance_text || '',
          address: data.address || '未填写授课地点',
          teaching_mode: data.teaching_mode || '线上/线下',
          available_time: data.available_time || '请咨询老师',
          certificates: data.certificates || []
        })
      }
    } catch (error) {
      console.error('加载牛师详情失败:', error)
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
        certificates: ['牛师资格证', '高级牛师职称']
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMoments = async (teacherId: number) => {
    setMomentsLoading(true)
    try {
      const res = await Network.request({
        url: `/api/teacher/${teacherId}/moments`,
        data: { page: 1, pageSize: 10 }
      })
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setMoments(list)
      }
    } catch (error) {
      console.error('加载动态失败:', error)
      // 使用模拟数据
      setMoments([
        {
          id: 1,
          type: 'image',
          content: '今天给学生讲解三角函数，发现用单位圆的方式更容易理解。分享一个教学小技巧~',
          media_urls: [
            'https://picsum.photos/400/300?random=1',
            'https://picsum.photos/400/300?random=2',
            'https://picsum.photos/400/300?random=3'
          ],
          likes_count: 56,
          comments_count: 12,
          views_count: 328,
          is_liked: false,
          created_at: new Date(Date.now() - 2 * 3600000).toISOString()
        },
        {
          id: 2,
          type: 'video',
          content: '录制了一道高考数学压轴题的解题思路，希望对大家有帮助！',
          media_urls: ['https://example.com/video.mp4'],
          video_cover: 'https://picsum.photos/400/300?random=4',
          likes_count: 128,
          comments_count: 34,
          views_count: 892,
          is_liked: true,
          created_at: new Date(Date.now() - 24 * 3600000).toISOString()
        },
        {
          id: 3,
          type: 'text',
          content: '恭喜我的学生小王在期中考试中数学考了142分！从期初的85分进步了57分，为你的努力点赞👍',
          likes_count: 89,
          comments_count: 23,
          views_count: 456,
          is_liked: false,
          created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
        },
        {
          id: 4,
          type: 'image',
          content: '周末带孩子去北大校园逛了逛，感受学术氛围~',
          media_urls: [
            'https://picsum.photos/400/300?random=5',
            'https://picsum.photos/400/300?random=6'
          ],
          likes_count: 72,
          comments_count: 15,
          views_count: 234,
          is_liked: false,
          created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
        }
      ])
    } finally {
      setMomentsLoading(false)
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

  const handleLikeMoment = (momentId: number) => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setMoments(prev => prev.map(m => 
      m.id === momentId ? {
        ...m,
        is_liked: !m.is_liked,
        likes_count: m.is_liked ? m.likes_count - 1 : m.likes_count + 1
      } : m
    ))
  }

  const handlePreviewImage = (urls: string[], current: number) => {
    Taro.previewImage({
      urls: urls,
      current: urls[current]
    })
  }

  const handlePlayVideo = (videoUrl: string) => {
    Taro.navigateTo({ url: `/pages/video-player/index?url=${encodeURIComponent(videoUrl)}` })
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(diff / 86400000)
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  // 判断是否是牛师本人
  const isSelf = userInfo?.id === teacher?.id

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
        <Text className="empty-text">牛师不存在或已下架</Text>
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

        {/* Tab 切换 */}
        <View className="tab-bar">
          <View 
            className={`tab-item ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Text className="tab-text">基本信息</Text>
          </View>
          <View 
            className={`tab-item ${activeTab === 'moments' ? 'active' : ''}`}
            onClick={() => setActiveTab('moments')}
          >
            <Text className="tab-text">个人动态</Text>
            <View className="moments-count">
              <Text className="count-text">{moments.length}</Text>
            </View>
          </View>
        </View>

        {/* 基本信息Tab */}
        {activeTab === 'info' && (
          <>
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
          </>
        )}

        {/* 个人动态Tab */}
        {activeTab === 'moments' && (
          <View className="moments-section">
            {/* 发布入口（仅牛师本人可见） */}
            {isSelf && (
              <View className="publish-entry" onClick={() => Taro.navigateTo({ url: '/pages/publish-moment/index' })}>
                <View className="publish-icons">
                  <View className="publish-icon">
                    <Camera size={20} color="#2563EB" />
                    <Text className="icon-text">发图片</Text>
                  </View>
                  <View className="publish-icon">
                    <Film size={20} color="#2563EB" />
                    <Text className="icon-text">发视频</Text>
                  </View>
                  <View className="publish-icon">
                    <Pencil size={20} color="#2563EB" />
                    <Text className="icon-text">写文字</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 动态列表 */}
            {momentsLoading ? (
              <View className="loading-area">
                <Text className="loading-text">加载中...</Text>
              </View>
            ) : moments.length > 0 ? (
              moments.map((moment) => (
                <View key={moment.id} className="moment-card">
                  {/* 动态内容 */}
                  <Text className="moment-content">{moment.content}</Text>
                  
                  {/* 媒体内容 */}
                  {moment.type === 'image' && moment.media_urls && moment.media_urls.length > 0 && (
                    <View className={`moment-images ${moment.media_urls.length === 1 ? 'single' : ''}`}>
                      {moment.media_urls.map((url, idx) => (
                        <View 
                          key={idx} 
                          className="moment-image-wrap"
                          onClick={() => handlePreviewImage(moment.media_urls!, idx)}
                        >
                          <Image 
                            src={url} 
                            className="moment-image" 
                            mode="aspectFill"
                            lazyLoad
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {moment.type === 'video' && (
                    <View 
                      className="moment-video-wrap"
                      onClick={() => moment.media_urls && handlePlayVideo(moment.media_urls[0])}
                    >
                      <Image 
                        src={moment.video_cover || ''} 
                        className="moment-video-cover" 
                        mode="aspectFill"
                      />
                      <View className="play-btn">
                        <Play size={32} color="#fff" />
                      </View>
                    </View>
                  )}

                  {/* 时间和互动 */}
                  <View className="moment-footer">
                    <Text className="moment-time">{formatTime(moment.created_at)}</Text>
                    <View className="moment-actions">
                      <View className="action-item" onClick={() => handleLikeMoment(moment.id)}>
                        <Heart 
                          size={16} 
                          color={moment.is_liked ? '#EF4444' : '#6B7280'} 
                        />
                        <Text className={`action-count ${moment.is_liked ? 'liked' : ''}`}>{moment.likes_count}</Text>
                      </View>
                      <View className="action-item">
                        <MessageSquare size={16} color="#6B7280" />
                        <Text className="action-count">{moment.comments_count}</Text>
                      </View>
                      <View className="action-item">
                        <Eye size={16} color="#6B7280" />
                        <Text className="action-count">{moment.views_count}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-moments">
                <Text className="empty-text">暂无动态</Text>
                {isSelf && (
                  <Button className="publish-btn" onClick={() => Taro.navigateTo({ url: '/pages/publish-moment/index' })}>
                    <Plus size={16} color="#fff" />
                    <Text className="publish-btn-text">发布第一条动态</Text>
                  </Button>
                )}
              </View>
            )}
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid #E5E7EB', boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)', zIndex: 100, width: '100%', boxSizing: 'border-box' }}>
        <View className="flex-1">
          <Text className="text-xs text-gray-500">课时费</Text>
          <Text className="text-lg font-semibold text-red-500">{formatPrice(teacher.hourly_rate_min, teacher.hourly_rate_max)}</Text>
        </View>
        <View className="flex flex-row gap-3">
          <Button variant="outline" className="flex flex-row items-center py-2 px-4 rounded-full border border-blue-600" onClick={handleSendMessage}>
            <MessageCircle size={18} color="#2563EB" />
            <Text className="text-sm text-blue-600 ml-2">咨询</Text>
          </Button>
          <Button className="flex flex-row items-center py-2 px-4 rounded-full bg-blue-600" onClick={handleContact}>
            <Phone size={18} color="#fff" />
            <Text className="text-sm text-white ml-2">联系老师</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default TeacherDetailPage
