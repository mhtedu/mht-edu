import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { FileText, Video, Music, Image as ImageIcon, Download, Eye, Clock, DollarSign, Package, TrendingUp, ChevronRight } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import './my.css'

interface Resource {
  id: number
  title: string
  description: string
  category_id: number
  category_name: string
  type: string
  cover_image: string
  price: number
  is_free: number
  file_ext: string
  file_size: number
  view_count: number
  download_count: number
  purchase_count: number
  total_earnings: number
  status: number
  created_at: string
}

interface Stats {
  total_resources: number
  total_earnings: number
  total_purchases: number
  total_downloads: number
}

const MyResourcePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'uploaded' | 'purchased'>('uploaded')
  const [uploadedResources, setUploadedResources] = useState<Resource[]>([])
  const [purchasedResources, setPurchasedResources] = useState<Resource[]>([])
  const [stats, setStats] = useState<Stats>({
    total_resources: 0,
    total_earnings: 0,
    total_purchases: 0,
    total_downloads: 0
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { isLoggedIn } = useUserStore()

  useLoad(() => {
    console.log('My resource page loaded.')
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          } else {
            Taro.navigateBack()
          }
        }
      })
      return
    }
  })

  useDidShow(() => {
    if (isLoggedIn) {
      loadStats()
      loadResources(true)
    }
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadResources(false)
    }
  })

  usePullDownRefresh(() => {
    loadStats()
    loadResources(true).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadStats = async () => {
    try {
      console.log('加载资源统计请求:', { url: '/api/resources/my/stats' })
      const res = await Network.request({
        url: '/api/resources/my/stats'
      })
      console.log('加载资源统计响应:', res.data)
      setStats(res.data || stats)
    } catch (error) {
      console.error('加载统计失败:', error)
      // 模拟数据
      setStats({
        total_resources: 12,
        total_earnings: 1258.5,
        total_purchases: 48,
        total_downloads: 156
      })
    }
  }

  const loadResources = async (refresh: boolean = true) => {
    if (loading && !refresh) return

    setLoading(true)
    const currentPage = refresh ? 1 : page
    const url = activeTab === 'uploaded' ? '/api/resources/my/uploaded' : '/api/resources/my/purchased'

    try {
      console.log(`加载${activeTab === 'uploaded' ? '已上传' : '已购买'}资源请求:`, { url, data: { page: currentPage, pageSize: 20 } })
      const res = await Network.request({
        url,
        data: { page: currentPage, pageSize: 20 }
      })
      console.log(`加载${activeTab === 'uploaded' ? '已上传' : '已购买'}资源响应:`, res.data)

      const list = Array.isArray(res.data) ? res.data : res.data.list || []

      if (activeTab === 'uploaded') {
        if (refresh) {
          setUploadedResources(list)
          setPage(2)
        } else {
          setUploadedResources([...uploadedResources, ...list])
          setPage(currentPage + 1)
        }
      } else {
        if (refresh) {
          setPurchasedResources(list)
          setPage(2)
        } else {
          setPurchasedResources([...purchasedResources, ...list])
          setPage(currentPage + 1)
        }
      }

      setHasMore(list.length >= 20)
    } catch (error) {
      console.error('加载资源失败:', error)
      // 模拟数据
      const mockUploaded: Resource[] = [
        {
          id: 1,
          title: '高二数学必修五课件合集',
          description: '包含高二数学必修五全部章节课件',
          category_id: 1,
          category_name: '课件PPT',
          type: 'document',
          cover_image: '',
          price: 29.9,
          is_free: 0,
          file_ext: 'pptx',
          file_size: 15728640,
          view_count: 256,
          download_count: 89,
          purchase_count: 45,
          total_earnings: 1345.5,
          status: 1,
          created_at: '2025-01-10 10:30:00'
        },
        {
          id: 2,
          title: '初中英语语法教案设计',
          description: '初中英语语法全套教案设计',
          category_id: 2,
          category_name: '教案设计',
          type: 'document',
          cover_image: '',
          price: 0,
          is_free: 1,
          file_ext: 'docx',
          file_size: 2097152,
          view_count: 128,
          download_count: 56,
          purchase_count: 0,
          total_earnings: 0,
          status: 1,
          created_at: '2025-01-08 15:20:00'
        },
      ]

      const mockPurchased: Resource[] = [
        {
          id: 3,
          title: '高考物理压轴题精讲视频',
          description: '近5年高考物理压轴题详细讲解',
          category_id: 4,
          category_name: '教学视频',
          type: 'video',
          cover_image: '',
          price: 99.9,
          is_free: 0,
          file_ext: 'mp4',
          file_size: 524288000,
          view_count: 512,
          download_count: 178,
          purchase_count: 0,
          total_earnings: 0,
          status: 1,
          created_at: '2025-01-12 09:15:00'
        },
      ]

      if (activeTab === 'uploaded') {
        setUploadedResources(mockUploaded)
      } else {
        setPurchasedResources(mockPurchased)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'uploaded' | 'purchased') => {
    if (tab !== activeTab) {
      setActiveTab(tab)
      setTimeout(() => loadResources(true), 100)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/resource/detail?id=${id}` })
  }

  const goToUpload = () => {
    Taro.navigateTo({ url: '/pages/resource/upload' })
  }

  const goToEarnings = () => {
    Taro.navigateTo({ url: '/pages/resource/earnings' })
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
    if (type === 'video' || ext === 'mp4' || ext === 'avi') return <Video size={18} color="#F59E0B" />
    if (type === 'audio' || ext === 'mp3' || ext === 'wav') return <Music size={18} color="#8B5CF6" />
    if (type === 'image' || ext === 'jpg' || ext === 'png') return <ImageIcon size={18} color="#10B981" />
    return <FileText size={18} color="#2563EB" />
  }

  const getStatusText = (status: number): string => {
    switch (status) {
      case 0: return '待审核'
      case 1: return '已发布'
      case 2: return '已拒绝'
      case 3: return '已下架'
      default: return '未知'
    }
  }

  const getStatusClass = (status: number): string => {
    switch (status) {
      case 0: return 'pending'
      case 1: return 'published'
      case 2: return 'rejected'
      case 3: return 'offline'
      default: return ''
    }
  }

  const currentResources = activeTab === 'uploaded' ? uploadedResources : purchasedResources

  return (
    <View className="my-page">
      {/* 统计卡片 */}
      <View className="stats-card">
        <View className="stat-item main">
          <Text className="stat-value">¥{stats.total_earnings.toFixed(2)}</Text>
          <Text className="stat-label">总收益</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item" onClick={goToEarnings}>
          <Package size={18} color="#6B7280" />
          <Text className="stat-value">{stats.total_resources}</Text>
          <Text className="stat-label">已上传</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <TrendingUp size={18} color="#6B7280" />
          <Text className="stat-value">{stats.total_purchases}</Text>
          <Text className="stat-label">已售出</Text>
        </View>
        <View className="stat-divider" />
        <View className="stat-item">
          <Download size={18} color="#6B7280" />
          <Text className="stat-value">{stats.total_downloads}</Text>
          <Text className="stat-label">下载量</Text>
        </View>
      </View>

      {/* 标签切换 */}
      <View className="tabs">
        <View
          className={`tab-item ${activeTab === 'uploaded' ? 'active' : ''}`}
          onClick={() => handleTabChange('uploaded')}
        >
          <Text className="tab-text">已上传</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'purchased' ? 'active' : ''}`}
          onClick={() => handleTabChange('purchased')}
        >
          <Text className="tab-text">已购买</Text>
        </View>
      </View>

      {/* 资源列表 */}
      <ScrollView scrollY className="resource-scroll">
        {currentResources.length === 0 && !loading && (
          <View className="empty-wrap">
            <Package size={48} color="#D1D5DB" />
            <Text className="empty-text">
              {activeTab === 'uploaded' ? '还没有上传资源' : '还没有购买资源'}
            </Text>
            {activeTab === 'uploaded' && (
              <Button className="upload-btn" onClick={goToUpload}>
                <Text className="upload-btn-text">上传资源</Text>
              </Button>
            )}
          </View>
        )}

        {currentResources.map((resource) => (
          <View
            key={resource.id}
            className="resource-card"
            onClick={() => goToDetail(resource.id)}
          >
            <View className="resource-main">
              <View className="resource-icon">
                {getTypeIcon(resource.type, resource.file_ext)}
              </View>
              <View className="resource-info">
                <View className="resource-title-row">
                  <Text className="resource-title">{resource.title}</Text>
                  {activeTab === 'uploaded' && resource.status !== 1 && (
                    <View className={`status-tag ${getStatusClass(resource.status)}`}>
                      <Text className="status-text">{getStatusText(resource.status)}</Text>
                    </View>
                  )}
                </View>
                <Text className="resource-desc">{resource.description}</Text>
                <View className="resource-meta">
                  <Text className="meta-text">{resource.category_name}</Text>
                  <Text className="meta-text">{resource.file_ext.toUpperCase()}</Text>
                  <Text className="meta-text">{formatFileSize(resource.file_size)}</Text>
                </View>
                <View className="resource-stats">
                  <View className="stat-row">
                    <Eye size={12} color="#9CA3AF" />
                    <Text className="stat-text">{resource.view_count}</Text>
                  </View>
                  <View className="stat-row">
                    <Download size={12} color="#9CA3AF" />
                    <Text className="stat-text">{resource.download_count}</Text>
                  </View>
                  {activeTab === 'uploaded' && !resource.is_free && (
                    <View className="stat-row earnings">
                      <DollarSign size={12} color="#10B981" />
                      <Text className="stat-text earnings">¥{resource.total_earnings.toFixed(2)}</Text>
                    </View>
                  )}
                  <View className="stat-row">
                    <Clock size={12} color="#9CA3AF" />
                    <Text className="stat-text">{formatDate(resource.created_at)}</Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </View>
          </View>
        ))}

        {loading && (
          <View className="loading-wrap">
            <Text className="loading-text">加载中...</Text>
          </View>
        )}

        {!hasMore && currentResources.length > 0 && (
          <View className="no-more">
            <Text className="no-more-text">没有更多了</Text>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <Button className="upload-btn full" onClick={goToUpload}>
          <Text className="upload-btn-text">上传新资源</Text>
        </Button>
      </View>
    </View>
  )
}

export default MyResourcePage
