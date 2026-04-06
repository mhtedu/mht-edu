import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { FileText, Download, Star, Plus } from 'lucide-react-taro'
import { useUserStore } from '@/stores/user'
import './index.css'

interface Resource {
  id: number
  title: string
  category: string
  file_type: string
  price: number
  downloads: number
  rating: number
  status: number
  created_at: string
}

const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: '待审核', variant: 'secondary' },
  1: { label: '已上架', variant: 'default' },
  2: { label: '已下架', variant: 'outline' },
  3: { label: '审核拒绝', variant: 'destructive' },
}

/**
 * 我的资源页面
 */
export default function MyResourcePage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [purchasedResources, setPurchasedResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my' | 'purchased'>('my')

  const { isLoggedIn } = useUserStore()

  useDidShow(() => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }
    loadData()
  })

  usePullDownRefresh(() => {
    loadData().finally(() => Taro.stopPullDownRefresh())
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [myRes, purchasedRes] = await Promise.all([
        Network.request({ url: '/api/resources/my' }),
        Network.request({ url: '/api/resources/purchased' })
      ])

      if (myRes.data) {
        setResources(Array.isArray(myRes.data) ? myRes.data : myRes.data.list || [])
      }
      if (purchasedRes.data) {
        setPurchasedResources(Array.isArray(purchasedRes.data) ? purchasedRes.data : purchasedRes.data.list || [])
      }
    } catch (error) {
      console.error('加载资源失败:', error)
      // 模拟数据
      setResources([
        { id: 1, title: '高考数学压轴题解题技巧', category: '数学', file_type: 'pdf', price: 99, downloads: 256, rating: 4.8, status: 1, created_at: new Date().toISOString() },
        { id: 2, title: '英语语法大全', category: '英语', file_type: 'docx', price: 49, downloads: 128, rating: 4.5, status: 0, created_at: new Date().toISOString() },
      ])
      setPurchasedResources([
        { id: 3, title: '物理竞赛入门指南', category: '物理', file_type: 'pdf', price: 199, downloads: 89, rating: 4.9, status: 1, created_at: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/resource/detail?id=${id}` })
  }

  const goToUpload = () => {
    Taro.navigateTo({ url: '/pages/resource/upload' })
  }

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const currentList = activeTab === 'my' ? resources : purchasedResources

  return (
    <View className="min-h-screen bg-gray-100">
      {/* Tab切换 */}
      <View className="bg-white sticky top-0 z-10 flex flex-row border-b border-gray-100">
        <View
          className={`flex-1 py-3 text-center ${activeTab === 'my' ? 'border-b-2 border-blue-600' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <Text className={`block text-sm ${activeTab === 'my' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            我上传的 ({resources.length})
          </Text>
        </View>
        <View
          className={`flex-1 py-3 text-center ${activeTab === 'purchased' ? 'border-b-2 border-blue-600' : ''}`}
          onClick={() => setActiveTab('purchased')}
        >
          <Text className={`block text-sm ${activeTab === 'purchased' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            我购买的 ({purchasedResources.length})
          </Text>
        </View>
      </View>

      {/* 资源列表 */}
      <ScrollView scrollY className="h-screen">
        {loading ? (
          <View className="py-20 text-center">
            <Text className="block text-sm text-gray-400">加载中...</Text>
          </View>
        ) : currentList.length === 0 ? (
          <View className="py-20 text-center">
            <FileText size={48} color="#9CA3AF" className="mx-auto mb-4" />
            <Text className="block text-sm text-gray-400 mb-4">
              {activeTab === 'my' ? '暂无上传的资源' : '暂无购买的资源'}
            </Text>
            {activeTab === 'my' && (
              <Button size="sm" onClick={goToUpload}>
                <Plus size={16} color="#fff" className="mr-1" />
                <Text className="block text-white text-sm">上传资源</Text>
              </Button>
            )}
          </View>
        ) : (
          <View className="p-4">
            {currentList.map((resource) => (
              <Card key={resource.id} className="mb-3" onClick={() => goToDetail(resource.id)}>
                <CardContent className="p-4">
                  <View className="flex flex-row items-start gap-3">
                    <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={24} color="#2563EB" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex flex-row items-center justify-between mb-1">
                        <Text className="block text-sm font-medium text-gray-900 truncate flex-1">
                          {resource.title}
                        </Text>
                        {activeTab === 'my' && statusMap[resource.status] && (
                          <Badge variant={statusMap[resource.status].variant}>
                            {statusMap[resource.status].label}
                          </Badge>
                        )}
                      </View>
                      <View className="flex flex-row items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{resource.category}</Badge>
                        <Text className="block text-xs text-gray-400">{resource.file_type.toUpperCase()}</Text>
                      </View>
                      <View className="flex flex-row items-center justify-between mt-2">
                        <View className="flex flex-row items-center gap-3">
                          <View className="flex flex-row items-center">
                            <Download size={12} color="#9CA3AF" />
                            <Text className="block text-xs text-gray-500 ml-1">{resource.downloads}</Text>
                          </View>
                          <View className="flex flex-row items-center">
                            <Star size={12} color="#F59E0B" filled />
                            <Text className="block text-xs text-gray-500 ml-1">{resource.rating}</Text>
                          </View>
                        </View>
                        <Text className="block text-sm font-medium text-blue-600">¥{resource.price}</Text>
                      </View>
                      <Text className="block text-xs text-gray-400 mt-2">{formatTime(resource.created_at)}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 上传按钮 */}
      {activeTab === 'my' && (
        <View
          className="fixed right-4 bottom-20 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
          onClick={goToUpload}
        >
          <Plus size={28} color="#fff" />
        </View>
      )}
    </View>
  )
}
