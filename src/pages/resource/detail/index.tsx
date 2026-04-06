import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { FileText, Download, Star, User, Eye } from 'lucide-react-taro'
import { useUserStore } from '@/stores/user'
import './index.css'

interface Resource {
  id: number
  title: string
  description: string
  category: string
  file_url: string
  file_type: string
  file_size: number
  price: number
  downloads: number
  rating: number
  rating_count: number
  creator: {
    id: number
    nickname: string
    avatar?: string
  }
  created_at: string
  is_purchased: boolean
}

/**
 * 资源详情页面
 */
export default function ResourceDetailPage() {
  const router = useRouter()
  const resourceId = router.params.id ? parseInt(router.params.id) : 0

  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  const { isLoggedIn } = useUserStore()

  useDidShow(() => {
    if (resourceId > 0) {
      loadResource()
    }
  })

  const loadResource = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/resources/${resourceId}`
      })
      if (res.data) {
        setResource(res.data)
      }
    } catch (error) {
      console.error('加载资源详情失败:', error)
      // 模拟数据
      setResource({
        id: resourceId,
        title: '高考数学压轴题解题技巧',
        description: '本资源包含高考数学压轴题的解题技巧和方法，涵盖函数、导数、圆锥曲线等难点。通过典型例题分析，帮助学生掌握解题思路。',
        category: '数学',
        file_url: '',
        file_type: 'pdf',
        file_size: 2048,
        price: 99,
        downloads: 256,
        rating: 4.8,
        rating_count: 45,
        creator: { id: 1, nickname: '张老师', avatar: '' },
        created_at: new Date().toISOString(),
        is_purchased: false
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }

    if (!resource) return

    setPurchasing(true)
    try {
      const res = await Network.request({
        url: '/api/resources/purchase',
        method: 'POST',
        data: { resourceId: resource.id }
      })
      if (res.data) {
        Taro.showToast({ title: '购买成功', icon: 'success' })
        setResource({ ...resource, is_purchased: true })
      }
    } catch (error) {
      console.error('购买失败:', error)
      Taro.showToast({ title: '购买失败', icon: 'none' })
    } finally {
      setPurchasing(false)
    }
  }

  const handleDownload = async () => {
    if (!resource?.file_url) {
      Taro.showToast({ title: '暂无下载链接', icon: 'none' })
      return
    }
    try {
      await Network.downloadFile({ url: resource.file_url })
      Taro.showToast({ title: '下载成功', icon: 'success' })
    } catch {
      Taro.showToast({ title: '下载失败', icon: 'none' })
    }
  }

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / 1024 / 1024).toFixed(1)}MB`
  }

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Text className="block text-sm text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!resource) {
    return (
      <View className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Text className="block text-sm text-gray-400">资源不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-100">
      <ScrollView scrollY className="h-screen pb-24">
        {/* 资源信息 */}
        <Card className="m-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-start gap-3 mb-4">
              <View className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText size={32} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="block text-lg font-semibold text-gray-900">{resource.title}</Text>
                <View className="flex flex-row items-center gap-2 mt-1">
                  <Badge variant="secondary">{resource.category}</Badge>
                  <Badge variant="outline">{resource.file_type.toUpperCase()}</Badge>
                </View>
              </View>
            </View>

            <Text className="block text-sm text-gray-600 leading-relaxed">{resource.description}</Text>

            {/* 统计信息 */}
            <View className="flex flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <View className="flex flex-row items-center gap-4">
                <View className="flex flex-row items-center">
                  <Star size={14} color="#F59E0B" filled />
                  <Text className="block text-sm text-gray-600 ml-1">{resource.rating}</Text>
                </View>
                <View className="flex flex-row items-center">
                  <Download size={14} color="#6B7280" />
                  <Text className="block text-sm text-gray-600 ml-1">{resource.downloads}</Text>
                </View>
                <View className="flex flex-row items-center">
                  <Eye size={14} color="#6B7280" />
                  <Text className="block text-sm text-gray-600 ml-1">{resource.rating_count}评价</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 创作者信息 */}
        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-500 mb-3">创作者</Text>
            <View className="flex flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-medium text-gray-900">{resource.creator.nickname}</Text>
                <Text className="block text-xs text-gray-500">{formatTime(resource.created_at)} 发布</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 文件信息 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-500 mb-3">文件信息</Text>
            <View className="flex flex-row items-center justify-between py-2">
              <Text className="block text-sm text-gray-600">文件大小</Text>
              <Text className="block text-sm text-gray-900">{formatFileSize(resource.file_size)}</Text>
            </View>
            <View className="flex flex-row items-center justify-between py-2">
              <Text className="block text-sm text-gray-600">文件格式</Text>
              <Text className="block text-sm text-gray-900">{resource.file_type.toUpperCase()}</Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="block text-xs text-gray-500">价格</Text>
          <Text className="block text-xl font-bold text-blue-600">¥{resource.price}</Text>
        </View>
        {resource.is_purchased ? (
          <Button className="flex-1" onClick={handleDownload}>
            <Download size={18} color="#fff" className="mr-2" />
            <Text className="block text-white">下载资源</Text>
          </Button>
        ) : (
          <Button className="flex-1" onClick={handlePurchase} disabled={purchasing}>
            <Text className="block text-white">{purchasing ? '购买中...' : '立即购买'}</Text>
          </Button>
        )}
      </View>
    </View>
  )
}
