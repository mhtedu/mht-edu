import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { Upload, FileText, DollarSign, ChevronRight, Check } from 'lucide-react-taro'
import { useUserStore } from '@/stores/user'
import './index.css'

interface Category {
  id: number
  name: string
}

/**
 * 资源上传页面
 */
export default function ResourceUploadPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; path: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const { isLoggedIn } = useUserStore()

  useDidShow(() => {
    loadCategories()
  })

  const loadCategories = async () => {
    try {
      const res = await Network.request({
        url: '/api/resources/categories'
      })
      if (res.data) {
        setCategories(res.data)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      setCategories([
        { id: 1, name: '语文' },
        { id: 2, name: '数学' },
        { id: 3, name: '英语' },
        { id: 4, name: '物理' },
        { id: 5, name: '化学' },
      ])
    }
  }

  const handleChooseFile = () => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar'],
      success: (res) => {
        const file = res.tempFiles[0]
        setFileInfo({
          name: file.name,
          size: file.size,
          path: file.path
        })
      },
      fail: () => {
        Taro.showToast({ title: '选择文件失败', icon: 'none' })
      }
    })
  }

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录', confirmText: '去登录', success: (res) => { if (res.confirm) Taro.navigateTo({ url: '/pages/login/index' }) } })
      return
    }

    if (!title.trim()) {
      Taro.showToast({ title: '请输入资源标题', icon: 'none' })
      return
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入资源描述', icon: 'none' })
      return
    }

    if (!fileInfo) {
      Taro.showToast({ title: '请选择文件', icon: 'none' })
      return
    }

    if (categoryId === 0) {
      Taro.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    setUploading(true)
    try {
      // 上传文件
      const uploadRes = await Network.uploadFile({
        url: '/api/upload',
        filePath: fileInfo.path,
        name: 'file'
      })

      const fileUrl = (uploadRes as any).data?.url || ''

      // 创建资源
      const res = await Network.request({
        url: '/api/resources/create',
        method: 'POST',
        data: {
          title,
          description,
          price: parseFloat(price) || 0,
          categoryId,
          fileUrl,
          fileType: fileInfo.name.split('.').pop() || 'unknown',
          fileSize: fileInfo.size
        }
      })

      if (res.data) {
        Taro.showToast({ title: '上传成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      }
    } catch (error) {
      console.error('上传失败:', error)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size}B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
    return `${(size / 1024 / 1024).toFixed(1)}MB`
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  return (
    <View className="min-h-screen bg-gray-100">
      <ScrollView scrollY className="h-screen pb-24">
        <Card className="m-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-2">资源标题 *</Text>
            <View className="bg-gray-50 rounded-lg px-3 py-2">
              <Input
                className="w-full"
                placeholder="请输入资源标题"
                value={title}
                onInput={(e) => setTitle(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-2">资源描述 *</Text>
            <View className="bg-gray-50 rounded-lg p-3">
              <Textarea
                className="w-full"
                style={{ minHeight: '100px', backgroundColor: 'transparent' }}
                placeholder="请详细描述资源内容、适用对象等"
                value={description}
                onInput={(e) => setDescription(e.detail.value)}
                maxlength={500}
              />
            </View>
            <Text className="block text-xs text-gray-400 text-right mt-1">{description.length}/500</Text>
          </CardContent>
        </Card>

        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-2">分类 *</Text>
            <View
              className="bg-gray-50 rounded-lg px-3 py-3 flex flex-row items-center justify-between"
              onClick={() => setShowCategoryPicker(true)}
            >
              <Text className={`block text-sm ${selectedCategory ? 'text-gray-900' : 'text-gray-400'}`}>
                {selectedCategory?.name || '请选择分类'}
              </Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>

        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-2">价格（元）</Text>
            <View className="bg-gray-50 rounded-lg px-3 py-2 flex flex-row items-center">
              <DollarSign size={18} color="#6B7280" />
              <Input
                className="flex-1 ml-2"
                type="digit"
                placeholder="0为免费"
                value={price}
                onInput={(e) => setPrice(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        <Card className="mx-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-gray-700 mb-2">上传文件 *</Text>
            {fileInfo ? (
              <View className="bg-blue-50 rounded-lg p-3 flex flex-row items-center">
                <FileText size={24} color="#2563EB" />
                <View className="flex-1 ml-3">
                  <Text className="block text-sm text-gray-900">{fileInfo.name}</Text>
                  <Text className="block text-xs text-gray-500">{formatFileSize(fileInfo.size)}</Text>
                </View>
                <View
                  onClick={() => setFileInfo(null)}
                  className="text-red-500 text-sm"
                >
                  <Text className="block text-red-500 text-sm">删除</Text>
                </View>
              </View>
            ) : (
              <View
                className="border-2 border-dashed border-gray-300 rounded-lg py-8 flex flex-col items-center justify-center"
                onClick={handleChooseFile}
              >
                <Upload size={32} color="#9CA3AF" />
                <Text className="block text-sm text-gray-500 mt-2">点击选择文件</Text>
                <Text className="block text-xs text-gray-400 mt-1">支持 PDF、Word、PPT、Excel、压缩包</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {/* 分类选择弹窗 */}
      {showCategoryPicker && (
        <View className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" onClick={() => setShowCategoryPicker(false)}>
          <View className="bg-white w-full rounded-t-xl" style={{ maxHeight: '50vh' }} onClick={(e) => e.stopPropagation()}>
            <View className="p-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <Text className="block text-base font-medium">选择分类</Text>
              <Text className="block text-blue-600" onClick={() => setShowCategoryPicker(false)}>完成</Text>
            </View>
            <ScrollView scrollY style={{ maxHeight: '40vh' }}>
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  className="px-4 py-3 flex flex-row items-center justify-between border-b border-gray-50"
                  onClick={() => { setCategoryId(cat.id); setShowCategoryPicker(false) }}
                >
                  <Text className="block text-sm">{cat.name}</Text>
                  {categoryId === cat.id && <Check size={18} color="#2563EB" />}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* 底部提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button className="w-full" onClick={handleSubmit} disabled={uploading}>
          <Text className="block text-white">{uploading ? '上传中...' : '提交审核'}</Text>
        </Button>
      </View>
    </View>
  )
}
