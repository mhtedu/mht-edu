import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { autoLockOnPageLoad } from '@/utils/referral-lock'
import { getInviteCode, generateSharePath, recordShareAction, DEFAULT_SHARE_IMAGES } from '@/utils/share'
import { useSiteConfig } from '@/store'
import { FileText, Video, Music, Image as ImageIcon, Download, Eye, Star, Share2, User, Calendar, Tag, File, Coins } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import './detail.css'

interface ResourceDetail {
  id: number
  title: string
  description: string
  category_id: number
  category_name: string
  type: string
  author_id: number
  author_name: string
  author_avatar: string
  author_real_name: string
  author_intro: string
  cover_image: string
  price: number
  is_free: number
  file_ext: string
  file_size: number
  file_url: string
  view_count: number
  download_count: number
  has_purchased: boolean
  tags: string[]
  content: string
  created_at: string
}

interface Review {
  id: number
  user_id: number
  user_name: string
  user_avatar: string
  rating: number
  content: string
  created_at: string
}

const ResourceDetailPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const router = useRouter()
  const { id } = router.params
  const { isLoggedIn } = useUserStore()
  const siteName = useSiteConfig(state => state.getSiteName)()
  const resourceId = id ? parseInt(id) : 0
  const [inviteCode, setInviteCode] = useState('')

  useLoad(() => {
    console.log('Resource detail page loaded, id:', id)
    // 获取邀请码
    getInviteCode().then(code => setInviteCode(code))
    // 尝试通过分享链接锁定分销关系
    autoLockOnPageLoad(router.params).then(() => {
      console.log('[资源详情] 分销锁定处理完成')
    })
  })

  // 配置分享给好友
  useShareAppMessage(() => {
    let path = `/pages/resource/detail?id=${resourceId}`
    if (inviteCode) {
      path = generateSharePath(path, inviteCode) + `&from=share&type=resource&source_id=${resourceId}`
    }
    
    // 记录分享行为
    recordShareAction('resource', resourceId)
    
    return {
      title: `【${resource?.title || '学习资料'}】${resource?.is_free ? '免费' : `¥${resource?.price}`} - ${siteName}`,
      path,
      imageUrl: resource?.cover_image || DEFAULT_SHARE_IMAGES.resource,
    }
  })

  // 配置分享到朋友圈
  useShareTimeline(() => {
    let query = `id=${resourceId}`
    if (inviteCode) {
      query += `&invite_code=${inviteCode}&from=share&type=resource&source_id=${resourceId}`
    }
    
    return {
      title: `【${resource?.title || '学习资料'}】${resource?.is_free ? '免费' : `¥${resource?.price}`} - ${siteName}`,
      query,
      imageUrl: resource?.cover_image || DEFAULT_SHARE_IMAGES.resource,
    }
  })

  useEffect(() => {
    if (id) {
      loadResourceDetail()
      loadReviews()
    }
  }, [id])

  const loadResourceDetail = async () => {
    setLoading(true)
    try {
      console.log('加载资源详情请求:', { url: `/api/resources/${id}` })
      const res = await Network.request({
        url: `/api/resources/${id}`
      })
      console.log('加载资源详情响应:', res.data)
      setResource(res.data)
    } catch (error) {
      console.error('加载资源详情失败:', error)
      // 模拟数据
      setResource({
        id: Number(id),
        title: '高二数学必修五课件合集',
        description: '包含高二数学必修五全部章节课件，共15个PPT文件，涵盖数列、不等式、解三角形等重点内容，每个课件都经过精心设计，包含丰富的例题和练习。',
        category_id: 1,
        category_name: '课件PPT',
        type: 'document',
        author_id: 1,
        author_name: '张老师',
        author_avatar: '',
        author_real_name: '张明',
        author_intro: '高级教师，从教15年，擅长数学教学，多次获得省市级教学比赛一等奖。',
        cover_image: '',
        price: 29.9,
        is_free: 0,
        file_ext: 'pptx',
        file_size: 15728640,
        file_url: '',
        view_count: 256,
        download_count: 89,
        has_purchased: false,
        tags: ['数学', '高二', '必修五'],
        content: '这是一个包含15个PPT文件的高二数学课件合集，内容覆盖必修五全部章节：\n\n1. 数列（数列的概念、等差数列、等比数列）\n2. 不等式（一元二次不等式、基本不等式）\n3. 解三角形（正弦定理、余弦定理）\n\n每个课件都包含详细的讲解、典型例题、练习题和拓展思考。',
        created_at: '2025-01-10 10:30:00'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    if (loadingReviews) return
    setLoadingReviews(true)

    try {
      console.log('加载资源评论请求:', { url: `/api/resources/${id}/reviews`, data: { pageSize: 10 } })
      const res = await Network.request({
        url: `/api/resources/${id}/reviews`,
        data: { pageSize: 10 }
      })
      console.log('加载资源评论响应:', res.data)

      const list = Array.isArray(res.data) ? res.data : res.data.list || []
      setReviews(list)
    } catch (error) {
      console.error('加载评论失败:', error)
      // 模拟数据
      const mockReviews: Review[] = [
        {
          id: 1,
          user_id: 10,
          user_name: '学生家长',
          user_avatar: '',
          rating: 5,
          content: '课件制作非常精美，孩子看了之后对数学更有兴趣了，感谢张老师！',
          created_at: '2025-01-12 15:20:00'
        },
        {
          id: 2,
          user_id: 11,
          user_name: '王老师',
          user_avatar: '',
          rating: 4,
          content: '内容很全面，例题选择很典型，适合课堂教学使用。',
          created_at: '2025-01-11 09:15:00'
        }
      ]
      setReviews(mockReviews)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }

    if (!resource) return

    if (resource.has_purchased) {
      handleDownload()
      return
    }

    Taro.showModal({
      title: '确认购买',
      content: `您将以 ¥${resource.price} 购买此资源`,
      confirmText: '立即购买',
      success: async (res) => {
        if (res.confirm) {
          try {
            Taro.showLoading({ title: '购买中...' })
            console.log('购买资源请求:', { url: `/api/resources/${id}/purchase`, method: 'POST' })
            const result = await Network.request({
              url: `/api/resources/${id}/purchase`,
              method: 'POST'
            })
            console.log('购买资源响应:', result.data)
            Taro.hideLoading()
            Taro.showToast({ title: '购买成功', icon: 'success' })
            setResource({ ...resource, has_purchased: true })
          } catch (error) {
            Taro.hideLoading()
            console.error('购买失败:', error)
            Taro.showToast({ title: '购买失败', icon: 'error' })
          }
        }
      }
    })
  }

  const handleDownload = async () => {
    if (!resource) return

    try {
      Taro.showLoading({ title: '下载中...' })
      console.log('下载资源请求:', { url: `/api/resources/${id}/download` })
      const result = await Network.request({
        url: `/api/resources/${id}/download`
      })
      console.log('下载资源响应:', result.data)

      if (result.data && result.data.download_url) {
        const downloadRes = await Network.downloadFile({
          url: result.data.download_url
        })
        if (downloadRes && downloadRes.tempFilePath) {
          Taro.hideLoading()
          Taro.showToast({ title: '下载完成', icon: 'success' })
          Taro.openDocument({
            filePath: downloadRes.tempFilePath,
            fail: () => {
              Taro.showToast({ title: '打开文件失败', icon: 'error' })
            }
          })
        }
      } else {
        Taro.hideLoading()
        Taro.showToast({ title: '下载失败', icon: 'error' })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('下载失败:', error)
      Taro.showToast({ title: '下载失败', icon: 'error' })
    }
  }

  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true
    } as any)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
  }

  const formatDate = (dateStr: string): string => {
    return dateStr.split(' ')[0]
  }

  const getTypeIcon = (type: string, ext: string) => {
    if (type === 'video' || ext === 'mp4' || ext === 'avi') return <Video size={24} color="#F59E0B" />
    if (type === 'audio' || ext === 'mp3' || ext === 'wav') return <Music size={24} color="#8B5CF6" />
    if (type === 'image' || ext === 'jpg' || ext === 'png') return <ImageIcon size={24} color="#10B981" />
    return <FileText size={24} color="#2563EB" />
  }

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={14} color={i <= rating ? "#F59E0B" : "#E5E7EB"} />
    ))
  }

  if (loading) {
    return (
      <View className="detail-page loading-state">
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  if (!resource) {
    return (
      <View className="detail-page error-state">
        <Text className="error-text">资源不存在或已删除</Text>
      </View>
    )
  }

  return (
    <View className="detail-page">
      <ScrollView scrollY className="detail-scroll">
        {/* 资源头部 */}
        <View className="resource-header">
          <View className="header-icon">
            {getTypeIcon(resource.type, resource.file_ext)}
          </View>
          <View className="header-info">
            <Text className="resource-title">{resource.title}</Text>
            <View className="header-meta">
              <View className="meta-item">
                <Eye size={14} color="#9CA3AF" />
                <Text className="meta-text">{resource.view_count}</Text>
              </View>
              <View className="meta-item">
                <Download size={14} color="#9CA3AF" />
                <Text className="meta-text">{resource.download_count}</Text>
              </View>
              <View className="meta-item">
                <Calendar size={14} color="#9CA3AF" />
                <Text className="meta-text">{formatDate(resource.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 价格和标签 */}
        <View className="price-section">
          <View className="price-row">
            {resource.is_free ? (
              <Text className="price free">免费</Text>
            ) : (
              <Text className="price paid">¥{resource.price}</Text>
            )}
            {resource.has_purchased && (
              <View className="purchased-badge">
                <Text className="badge-text">已购买</Text>
              </View>
            )}
          </View>
          <View className="tags-row">
            <View className="tag-item">
              <Tag size={14} color="#6B7280" />
              <Text className="tag-text">{resource.category_name}</Text>
            </View>
            {resource.tags && resource.tags.map((tag, index) => (
              <View key={index} className="tag-item small">
                <Text className="tag-text">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 作者信息 */}
        <View className="author-section">
          <View className="author-avatar">
            {resource.author_avatar ? (
              <Image src={resource.author_avatar} className="avatar-img" />
            ) : (
              <User size={24} color="#9CA3AF" />
            )}
          </View>
          <View className="author-info">
            <Text className="author-name">{resource.author_real_name || resource.author_name}</Text>
            {resource.author_intro && (
              <Text className="author-intro">{resource.author_intro}</Text>
            )}
          </View>
        </View>

        {/* 文件信息 */}
        <View className="file-section">
          <Text className="section-title">文件信息</Text>
          <View className="file-info">
            <View className="info-row">
              <File size={16} color="#6B7280" />
              <Text className="info-text">格式：{resource.file_ext.toUpperCase()}</Text>
            </View>
            <View className="info-row">
              <Coins size={16} color="#6B7280" />
              <Text className="info-text">大小：{formatFileSize(resource.file_size)}</Text>
            </View>
          </View>
        </View>

        {/* 资源介绍 */}
        <View className="content-section">
          <Text className="section-title">资源介绍</Text>
          <Text className="content-text">{resource.content || resource.description}</Text>
        </View>

        {/* 评论区 */}
        <View className="reviews-section">
          <Text className="section-title">用户评价</Text>
          {reviews.length === 0 ? (
            <View className="empty-reviews">
              <Text className="empty-text">暂无评价</Text>
            </View>
          ) : (
            <View className="reviews-list">
              {reviews.map((review) => (
                <View key={review.id} className="review-item">
                  <View className="review-header">
                    <View className="review-user">
                      <View className="user-avatar small">
                        {review.user_avatar ? (
                          <Image src={review.user_avatar} className="avatar-img" />
                        ) : (
                          <User size={16} color="#9CA3AF" />
                        )}
                      </View>
                      <Text className="user-name">{review.user_name}</Text>
                    </View>
                    <View className="review-rating">
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <Text className="review-content">{review.content}</Text>
                  <Text className="review-time">{formatDate(review.created_at)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <View className="action-item" onClick={handleShare}>
          <Share2 size={20} color="#6B7280" />
          <Text className="action-text">分享</Text>
        </View>
        <View className="purchase-btn-wrap">
          <Button
            className={`purchase-btn ${resource.has_purchased ? 'download' : ''}`}
            onClick={handlePurchase}
          >
            <Text className="purchase-text">
              {resource.is_free
                ? '免费下载'
                : resource.has_purchased
                  ? '立即下载'
                  : `¥${resource.price} 购买`
              }
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ResourceDetailPage
