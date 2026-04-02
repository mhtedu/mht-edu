import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { FileText, Video, Music, Image as ImageIcon, Download, Eye, Search } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import './index.css'

interface Category {
  id: number
  name: string
  icon: string
}

interface Resource {
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
  cover_image: string
  price: number
  is_free: number
  file_ext: string
  file_size: number
  view_count: number
  download_count: number
  has_purchased: boolean
  tags: string[]
}

const ResourceListPage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedPriceType, setSelectedPriceType] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<string>('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { isLoggedIn } = useUserStore()

  useLoad(() => {
    console.log('Resource list page loaded.')
  })

  useDidShow(() => {
    loadCategories()
    loadResources(true)
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      loadResources(false)
    }
  })

  usePullDownRefresh(() => {
    loadResources(true).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadCategories = async () => {
    try {
      console.log('加载资源分类请求:', { url: '/api/resources/categories' })
      const res = await Network.request({
        url: '/api/resources/categories'
      })
      console.log('加载资源分类响应:', res.data)
      if (res.data && Array.isArray(res.data)) {
        setCategories([{ id: 0, name: '全部', icon: '' }, ...res.data])
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      setCategories([
        { id: 0, name: '全部', icon: '' },
        { id: 1, name: '课件PPT', icon: 'ppt' },
        { id: 2, name: '教案设计', icon: 'file-text' },
        { id: 3, name: '习题试卷', icon: 'file-question' },
        { id: 4, name: '教学视频', icon: 'video' },
        { id: 5, name: '音频素材', icon: 'audio' },
        { id: 6, name: '图片素材', icon: 'image' },
        { id: 7, name: '教学工具', icon: 'tool' },
        { id: 8, name: '其他资源', icon: 'folder' },
      ])
    }
  }

  const loadResources = async (refresh: boolean = false) => {
    if (loading && !refresh) return

    setLoading(true)
    const currentPage = refresh ? 1 : page

    try {
      const params: Record<string, any> = {
        page: currentPage,
        pageSize: 20,
      }
      if (selectedCategory && selectedCategory > 0) {
        params.category = selectedCategory
      }
      if (selectedPriceType !== 'all') {
        params.priceType = selectedPriceType
      }
      if (selectedSort !== 'newest') {
        params.sort = selectedSort
      }

      console.log('加载资源列表请求:', { url: '/api/resources/list', params })
      const res = await Network.request({
        url: '/api/resources/list',
        data: params
      })
      console.log('加载资源列表响应:', res.data)

      const list = Array.isArray(res.data) ? res.data : res.data.list || []
      
      if (refresh) {
        setResources(list)
        setPage(2)
      } else {
        setResources([...resources, ...list])
        setPage(currentPage + 1)
      }

      setHasMore(list.length >= 20)
    } catch (error) {
      console.error('加载资源列表失败:', error)
      // 模拟数据
      const mockResources: Resource[] = [
        {
          id: 1,
          title: '高二数学必修五课件合集',
          description: '包含高二数学必修五全部章节课件，共15个PPT文件',
          category_id: 1,
          category_name: '课件PPT',
          type: 'document',
          author_id: 1,
          author_name: '张老师',
          author_avatar: '',
          author_real_name: '张明',
          cover_image: '',
          price: 29.9,
          is_free: 0,
          file_ext: 'pptx',
          file_size: 15728640,
          view_count: 256,
          download_count: 89,
          has_purchased: false,
          tags: ['数学', '高二', '必修五']
        },
        {
          id: 2,
          title: '初中英语语法教案设计',
          description: '初中英语语法全套教案设计，包含时态、从句等重点语法',
          category_id: 2,
          category_name: '教案设计',
          type: 'document',
          author_id: 2,
          author_name: '李老师',
          author_avatar: '',
          author_real_name: '李芳',
          cover_image: '',
          price: 0,
          is_free: 1,
          file_ext: 'docx',
          file_size: 2097152,
          view_count: 128,
          download_count: 56,
          has_purchased: true,
          tags: ['英语', '初中', '语法']
        },
        {
          id: 3,
          title: '高考物理压轴题精讲视频',
          description: '近5年高考物理压轴题详细讲解，共20个视频课程',
          category_id: 4,
          category_name: '教学视频',
          type: 'video',
          author_id: 3,
          author_name: '王老师',
          author_avatar: '',
          author_real_name: '王强',
          cover_image: '',
          price: 99.9,
          is_free: 0,
          file_ext: 'mp4',
          file_size: 524288000,
          view_count: 512,
          download_count: 178,
          has_purchased: false,
          tags: ['物理', '高考', '压轴题']
        },
      ]

      if (refresh) {
        setResources(mockResources)
        setPage(2)
      } else {
        setResources([...resources, ...mockResources])
        setPage(currentPage + 1)
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/resource/detail?id=${id}` })
  }

  const goToUpload = () => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }
    Taro.navigateTo({ url: '/pages/resource/upload' })
  }

  const goToMyResources = () => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }
    Taro.navigateTo({ url: '/pages/resource/my' })
  }

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId)
    setTimeout(() => loadResources(true), 100)
  }

  const handlePriceTypeChange = (priceType: string) => {
    setSelectedPriceType(priceType)
    setTimeout(() => loadResources(true), 100)
  }

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort)
    setTimeout(() => loadResources(true), 100)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
  }

  const getTypeIcon = (type: string, ext: string) => {
    if (type === 'video' || ext === 'mp4' || ext === 'avi') return <Video size={18} color="#F59E0B" />
    if (type === 'audio' || ext === 'mp3' || ext === 'wav') return <Music size={18} color="#8B5CF6" />
    if (type === 'image' || ext === 'jpg' || ext === 'png') return <ImageIcon size={18} color="#10B981" />
    return <FileText size={18} color="#2563EB" />
  }

  return (
    <View className="resource-list-page">
      {/* 顶部搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrap">
          <Search size={16} color="#9CA3AF" />
          <View className="search-input">
            <Text className="search-placeholder">搜索资源...</Text>
          </View>
        </View>
        <View className="action-btn" onClick={goToUpload}>
          <Text className="action-text">上传</Text>
        </View>
      </View>

      {/* 分类筛选 */}
      <ScrollView scrollX className="category-scroll">
        {categories.map((cat) => (
          <View
            key={cat.id}
            className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <Text className="category-text">{cat.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 筛选栏 */}
      <View className="filter-bar">
        <View className="filter-group">
          <View
            className={`filter-item ${selectedPriceType === 'all' ? 'active' : ''}`}
            onClick={() => handlePriceTypeChange('all')}
          >
            <Text className="filter-text">全部</Text>
          </View>
          <View
            className={`filter-item ${selectedPriceType === 'free' ? 'active' : ''}`}
            onClick={() => handlePriceTypeChange('free')}
          >
            <Text className="filter-text">免费</Text>
          </View>
          <View
            className={`filter-item ${selectedPriceType === 'paid' ? 'active' : ''}`}
            onClick={() => handlePriceTypeChange('paid')}
          >
            <Text className="filter-text">付费</Text>
          </View>
        </View>
        <View className="filter-group">
          <View
            className={`filter-item ${selectedSort === 'newest' ? 'active' : ''}`}
            onClick={() => handleSortChange('newest')}
          >
            <Text className="filter-text">最新</Text>
          </View>
          <View
            className={`filter-item ${selectedSort === 'popular' ? 'active' : ''}`}
            onClick={() => handleSortChange('popular')}
          >
            <Text className="filter-text">热门</Text>
          </View>
        </View>
      </View>

      {/* 资源列表 */}
      <ScrollView scrollY className="resource-scroll">
        {resources.map((resource) => (
          <View key={resource.id} className="resource-card" onClick={() => goToDetail(resource.id)}>
            <View className="resource-main">
              <View className="resource-icon">
                {getTypeIcon(resource.type, resource.file_ext)}
              </View>
              <View className="resource-info">
                <View className="resource-title-row">
                  <Text className="resource-title">{resource.title}</Text>
                  {resource.is_free ? (
                    <View className="price-tag free">
                      <Text className="price-text">免费</Text>
                    </View>
                  ) : (
                    <View className="price-tag paid">
                      <Text className="price-text">¥{resource.price}</Text>
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
                  <View className="stat-item">
                    <Eye size={12} color="#9CA3AF" />
                    <Text className="stat-text">{resource.view_count}</Text>
                  </View>
                  <View className="stat-item">
                    <Download size={12} color="#9CA3AF" />
                    <Text className="stat-text">{resource.download_count}</Text>
                  </View>
                  <Text className="author-text">{resource.author_real_name || resource.author_name}</Text>
                </View>
              </View>
            </View>
            {resource.has_purchased && (
              <View className="purchased-tag">
                <Text className="purchased-text">已购买</Text>
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View className="loading-wrap">
            <Text className="loading-text">加载中...</Text>
          </View>
        )}

        {!loading && resources.length === 0 && (
          <View className="empty-wrap">
            <Text className="empty-text">暂无资源</Text>
            <Button className="upload-btn" onClick={goToUpload}>上传资源</Button>
          </View>
        )}

        {!hasMore && resources.length > 0 && (
          <View className="no-more">
            <Text className="no-more-text">没有更多了</Text>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <View className="bottom-item" onClick={goToMyResources}>
          <Text className="bottom-text">我的资源</Text>
        </View>
        <View className="bottom-item primary" onClick={goToUpload}>
          <Text className="bottom-text">上传资源</Text>
        </View>
      </View>
    </View>
  )
}

export default ResourceListPage
