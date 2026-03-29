import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { autoLockOnPageLoad } from '@/utils/referral-lock'
import {
  MapPin, Star, MessageSquare, ThumbsUp, Video, Image as ImageIcon,
  Phone, MessageCircle, Award, Clock, GraduationCap,
} from 'lucide-react-taro'
import './index.css'

interface TeacherInfo {
  id: number
  nickname: string
  avatar: string
  city_name: string
  membership_type: number
  wechat_id?: string
  real_name?: string
  one_line_intro?: string
  subjects?: string[]
  hourly_rate_min?: number
  hourly_rate_max?: number
  rating?: number
  review_count?: number
  success_count?: number
  view_count?: number
  teaching_years?: number
  education?: string
  intro?: string
  photos?: string[]
  videos?: string[]
  cover_photo?: string
  contact_unlocked?: boolean
  wechat_unlocked?: boolean
}

interface Moment {
  id: number
  content: string
  images: string[]
  video_url?: string
  like_count: number
  comment_count: number
  created_at: string
}

interface Review {
  id: number
  rating: number
  content: string
  tags: string[]
  reply?: string
  created_at: string
  parent_nickname: string
  parent_avatar?: string
}

export default function TeacherDetailPage() {
  const router = useRouter()
  const teacherId = router.params.id ? parseInt(router.params.id) : 0

  const [teacher, setTeacher] = useState<TeacherInfo | null>(null)
  const [moments, setMoments] = useState<Moment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState('intro')
  const [loading, setLoading] = useState(true)
  const [momentsLoading, setMomentsLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // 获取教师信息
  useDidShow(() => {
    // 尝试通过分享链接锁定分销关系
    autoLockOnPageLoad(router.params).then(() => {
      console.log('[教师详情] 分销锁定处理完成')
    })
    fetchTeacherInfo()
  })

  const fetchTeacherInfo = async () => {
    if (!teacherId) return

    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/teacher-profile/${teacherId}`,
        method: 'GET',
      })

      console.log('教师信息:', res.data)
      if (res.data?.data) {
        setTeacher(res.data.data)
      }
    } catch (error) {
      console.error('获取教师信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMoments = async () => {
    if (!teacherId) return

    try {
      setMomentsLoading(true)
      const res = await Network.request({
        url: `/api/teacher-profile/${teacherId}/moments`,
        method: 'GET',
      })

      console.log('教师动态:', res.data)
      if (res.data?.data?.list) {
        setMoments(res.data.data.list)
      }
    } catch (error) {
      console.error('获取动态失败:', error)
    } finally {
      setMomentsLoading(false)
    }
  }

  const fetchReviews = async () => {
    if (!teacherId) return

    try {
      setReviewsLoading(true)
      const res = await Network.request({
        url: `/api/teacher-profile/${teacherId}/reviews`,
        method: 'GET',
      })

      console.log('教师评价:', res.data)
      if (res.data?.data?.list) {
        setReviews(res.data.data.list)
      }
    } catch (error) {
      console.error('获取评价失败:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)

    if (tab === 'moments' && moments.length === 0) {
      fetchMoments()
    } else if (tab === 'reviews' && reviews.length === 0) {
      fetchReviews()
    }
  }

  // 点赞动态
  const handleLikeMoment = async (momentId: number) => {
    try {
      const res = await Network.request({
        url: `/api/teacher-profile/moments/${momentId}/like`,
        method: 'POST',
      })

      console.log('点赞结果:', res.data)
      // 更新点赞状态
      setMoments(moments.map(m => {
        if (m.id === momentId) {
          return {
            ...m,
            like_count: res.data.data.liked ? m.like_count + 1 : m.like_count - 1,
          }
        }
        return m
      }))
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  // 解锁联系方式
  const handleUnlockContact = async (unlockType: number) => {
    if (!teacher) return

    try {
      const res = await Network.request({
        url: '/api/teacher-profile/unlock-contact',
        method: 'POST',
        data: {
          targetUserId: teacher.id,
          unlockType, // 1手机 2微信 3全部
        },
      })

      console.log('解锁结果:', res.data)
      if (res.data?.data) {
        // 更新教师信息
        setTeacher({
          ...teacher,
          contact_unlocked: [1, 3].includes(unlockType),
          wechat_unlocked: [2, 3].includes(unlockType),
          wechat_id: res.data.data.wechat_id,
        })

        Taro.showToast({
          title: '解锁成功',
          icon: 'success',
        })
      }
    } catch (error) {
      console.error('解锁失败:', error)
      Taro.showToast({
        title: '解锁失败',
        icon: 'error',
      })
    }
  }

  // 预览图片
  const handlePreviewImage = (urls: string[], current: number) => {
    Taro.previewImage({
      urls,
      current: urls[current],
    })
  }

  // 渲染加载骨架屏
  const renderSkeleton = () => (
    <View className="teacher-detail-page">
      <View className="cover-skeleton">
        <Skeleton className="w-full h-48" />
      </View>
      <View className="p-4">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4 mb-4" />
        <View className="flex gap-2 mb-4">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-20 h-6 rounded-full" />
        </View>
      </View>
    </View>
  )

  if (loading) {
    return renderSkeleton()
  }

  if (!teacher) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-gray-500">教师不存在</Text>
      </View>
    )
  }

  return (
    <View className="teacher-detail-page">
      {/* 封面照片 */}
      <View className="relative">
        <Image
          src={teacher.cover_photo || teacher.avatar}
          className="w-full h-48 object-cover"
          mode="aspectFill"
        />
        <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <Text className="text-white text-lg font-bold">{teacher.nickname}</Text>
          {teacher.one_line_intro && (
            <Text className="text-gray-200 text-sm mt-1">{teacher.one_line_intro}</Text>
          )}
        </View>
      </View>

      {/* 教师基本信息 */}
      <View className="p-4 bg-white">
        <View className="flex items-center gap-3 mb-4">
          <Image
            src={teacher.avatar}
            className="w-16 h-16 rounded-full border-2 border-blue-500"
          />
          <View className="flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-lg font-bold">{teacher.real_name || teacher.nickname}</Text>
              {teacher.membership_type === 1 && (
                <Badge className="bg-yellow-500">VIP</Badge>
              )}
            </View>
            <View className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <MapPin size={14} color="#6B7280" />
              <Text>{teacher.city_name || '未设置城市'}</Text>
            </View>
          </View>
        </View>

        {/* 统计数据 */}
        <View className="flex justify-around py-3 bg-gray-50 rounded-lg mb-4">
          <View className="flex flex-col items-center">
            <View className="flex items-center gap-1 text-yellow-500">
              <Star size={16} color="#EAB308" />
              <Text className="font-bold">{teacher.rating?.toFixed(1) || '5.0'}</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">评分</Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-blue-600">{teacher.view_count || 0}</Text>
            <Text className="text-xs text-gray-500 mt-1">浏览</Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-blue-600">{teacher.success_count || 0}</Text>
            <Text className="text-xs text-gray-500 mt-1">成功案例</Text>
          </View>
          <View className="flex flex-col items-center">
            <Text className="font-bold text-blue-600">{teacher.review_count || 0}</Text>
            <Text className="text-xs text-gray-500 mt-1">评价</Text>
          </View>
        </View>

        {/* 标签 */}
        {teacher.subjects && teacher.subjects.length > 0 && (
          <View className="flex flex-wrap gap-2 mb-4">
            {teacher.subjects.map((subject, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-600">
                {subject}
              </Badge>
            ))}
          </View>
        )}

        {/* 时薪范围 */}
        <View className="flex items-center justify-between p-3 bg-orange-50 rounded-lg mb-4">
          <Text className="text-gray-600">时薪范围</Text>
          <Text className="text-orange-600 font-bold">
            ¥{teacher.hourly_rate_min || 0} - ¥{teacher.hourly_rate_max || 0}/小时
          </Text>
        </View>
      </View>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="sticky top-0 bg-white z-10">
          <TabsTrigger value="intro">简介</TabsTrigger>
          <TabsTrigger value="photos">相册</TabsTrigger>
          <TabsTrigger value="moments">动态</TabsTrigger>
          <TabsTrigger value="reviews">评价</TabsTrigger>
        </TabsList>

        {/* 简介Tab */}
        <TabsContent value="intro" className="p-4 bg-white">
          {/* 基本信息 */}
          <View className="mb-4">
            <Text className="font-bold text-gray-800 mb-2">基本信息</Text>
            <View className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} color="#6B7280" />
              <Text className="text-gray-600">学历：{teacher.education || '未填写'}</Text>
            </View>
            <View className="flex items-center gap-2 mb-2">
              <Clock size={16} color="#6B7280" />
              <Text className="text-gray-600">教龄：{teacher.teaching_years || 0}年</Text>
            </View>
            <View className="flex items-center gap-2">
              <Award size={16} color="#6B7280" />
              <Text className="text-gray-600">成功案例：{teacher.success_count || 0}个</Text>
            </View>
          </View>

          {/* 个人介绍 */}
          <View className="mb-4">
            <Text className="font-bold text-gray-800 mb-2">个人介绍</Text>
            <Text className="text-gray-600 leading-relaxed">
              {teacher.intro || '暂无介绍'}
            </Text>
          </View>

          {/* 视频展示 */}
          {teacher.videos && teacher.videos.length > 0 && (
            <View className="mb-4">
              <Text className="font-bold text-gray-800 mb-2">教学视频</Text>
              <ScrollView scrollX className="flex gap-2">
                {teacher.videos.map((video, index) => (
                  <View key={index} className="relative flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden">
                    <Image src={video} className="w-full h-full object-cover" mode="aspectFill" />
                    <View className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Video size={32} color="white" />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </TabsContent>

        {/* 相册Tab */}
        <TabsContent value="photos" className="p-4 bg-white">
          {teacher.photos && teacher.photos.length > 0 ? (
            <View className="grid grid-cols-3 gap-2">
              {teacher.photos.map((photo, index) => (
                <View
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden"
                  onClick={() => handlePreviewImage(teacher.photos!, index)}
                >
                  <Image
                    src={photo}
                    className="w-full h-full object-cover"
                    mode="aspectFill"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ImageIcon size={48} color="#9CA3AF" />
              <Text className="mt-2">暂无照片</Text>
            </View>
          )}
        </TabsContent>

        {/* 动态Tab */}
        <TabsContent value="moments" className="bg-white">
          {momentsLoading ? (
            <View className="p-4">
              <Skeleton className="w-full h-32 mb-4" />
              <Skeleton className="w-full h-32" />
            </View>
          ) : moments.length > 0 ? (
            moments.map((moment) => (
              <View key={moment.id} className="p-4 border-b border-gray-100">
                <Text className="text-gray-800 mb-2">{moment.content}</Text>
                {moment.images && moment.images.length > 0 && (
                  <View className="grid grid-cols-3 gap-2 mb-2">
                    {moment.images.map((img, idx) => (
                      <View
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden"
                        onClick={() => handlePreviewImage(moment.images, idx)}
                      >
                        <Image src={img} className="w-full h-full object-cover" mode="aspectFill" />
                      </View>
                    ))}
                  </View>
                )}
                <View className="flex items-center justify-between text-gray-500 text-sm">
                  <Text>{moment.created_at}</Text>
                  <View className="flex items-center gap-4">
                    <View
                      className="flex items-center gap-1"
                      onClick={() => handleLikeMoment(moment.id)}
                    >
                      <ThumbsUp size={16} color="#6B7280" />
                      <Text>{moment.like_count}</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <MessageSquare size={16} color="#6B7280" />
                      <Text>{moment.comment_count}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare size={48} color="#9CA3AF" />
              <Text className="mt-2">暂无动态</Text>
            </View>
          )}
        </TabsContent>

        {/* 评价Tab */}
        <TabsContent value="reviews" className="bg-white">
          {reviewsLoading ? (
            <View className="p-4">
              <Skeleton className="w-full h-24 mb-4" />
              <Skeleton className="w-full h-24" />
            </View>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} className="p-4 border-b border-gray-100">
                <View className="flex items-center gap-2 mb-2">
                  <Image
                    src={review.parent_avatar || ''}
                    className="w-8 h-8 rounded-full"
                  />
                  <Text className="font-medium">{review.parent_nickname}</Text>
                  <View className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} color="#EAB308" />
                    <Text className="text-sm">{review.rating}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 mb-2">{review.content}</Text>
                {review.tags && review.tags.length > 0 && (
                  <View className="flex flex-wrap gap-1 mb-2">
                    {review.tags.map((tag, idx) => (
                      <Badge key={idx} className="bg-gray-100 text-gray-600 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </View>
                )}
                {review.reply && (
                  <View className="bg-gray-50 p-2 rounded mt-2">
                    <Text className="text-xs text-gray-500">教师回复：</Text>
                    <Text className="text-sm text-gray-700">{review.reply}</Text>
                  </View>
                )}
                <Text className="text-xs text-gray-400 mt-2">{review.created_at}</Text>
              </View>
            ))
          ) : (
            <View className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare size={48} color="#9CA3AF" />
              <Text className="mt-2">暂无评价</Text>
            </View>
          )}
        </TabsContent>
      </Tabs>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-50">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => handleUnlockContact(1)}
        >
          <Phone size={16} color="#2563EB" />
          <Text>{teacher.contact_unlocked ? '查看手机' : '解锁手机'}</Text>
        </Button>
        <Button
          className="flex-1 bg-blue-600"
          onClick={() => handleUnlockContact(2)}
        >
          <MessageCircle size={16} color="white" />
          <Text>{teacher.wechat_unlocked ? '查看微信' : '解锁微信'}</Text>
        </Button>
      </View>

      {/* 底部占位 */}
      <View className="h-20" />
    </View>
  )
}
