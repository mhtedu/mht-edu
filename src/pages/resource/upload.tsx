/* eslint-disable no-restricted-syntax */
import { View, Text, ScrollView, Image, Input as TaroInput, Textarea as TaroTextarea } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { Upload, X, Plus, FileText, Video, Music, Check, Image as ImageIcon } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import './upload.css'

interface Category {
  id: number
  name: string
}

const ResourceUploadPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: 0,
    type: 'document',
    price: '0',
    is_free: true,
    tags: [] as string[],
    cover_image: '',
    file_url: '',
    file_ext: '',
    file_size: 0,
  })
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)

  const { isLoggedIn } = useUserStore()

  useLoad(() => {
    console.log('Resource upload page loaded.')
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
    loadCategories()
  })

  const loadCategories = async () => {
    try {
      console.log('加载资源分类请求:', { url: '/api/resources/categories' })
      const res = await Network.request({
        url: '/api/resources/categories'
      })
      console.log('加载资源分类响应:', res.data)
      if (res.data && Array.isArray(res.data)) {
        setCategories(res.data)
      }
    } catch (error) {
      console.error('加载分类失败:', error)
      // 模拟数据
      setCategories([
        { id: 1, name: '课件PPT' },
        { id: 2, name: '教案设计' },
        { id: 3, name: '习题试卷' },
        { id: 4, name: '教学视频' },
        { id: 5, name: '音频素材' },
        { id: 6, name: '图片素材' },
        { id: 7, name: '教学工具' },
        { id: 8, name: '其他资源' },
      ])
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleUploadFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp4', 'mp3', 'jpg', 'png']
      })

      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        setUploading(true)
        Taro.showLoading({ title: '上传中...' })

        console.log('上传资源文件请求:', { url: '/api/resources/upload', file })
        const uploadRes = await Network.uploadFile({
          url: '/api/resources/upload',
          filePath: file.path,
          name: 'file'
        })
        console.log('上传资源文件响应:', uploadRes.data)

        const data = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data

        if (data && data.url) {
          const ext = file.name.split('.').pop() || ''
          let type = 'document'
          if (['mp4', 'avi', 'mov'].includes(ext)) type = 'video'
          else if (['mp3', 'wav', 'flac'].includes(ext)) type = 'audio'
          else if (['jpg', 'png', 'gif', 'jpeg'].includes(ext)) type = 'image'

          setFormData({
            ...formData,
            file_url: data.url,
            file_ext: ext,
            file_size: file.size,
            type: type
          })
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } else {
          throw new Error('上传失败')
        }
      }
    } catch (error: any) {
      console.error('上传文件失败:', error)
      if (error.errMsg !== 'chooseMessageFile:fail cancel') {
        Taro.showToast({ title: '上传失败', icon: 'error' })
      }
    } finally {
      setUploading(false)
      Taro.hideLoading()
    }
  }

  const handleUploadCover = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploading(true)
        Taro.showLoading({ title: '上传中...' })

        console.log('上传封面图请求:', { url: '/api/upload', file: res.tempFilePaths[0] })
        const uploadRes = await Network.uploadFile({
          url: '/api/upload',
          filePath: res.tempFilePaths[0],
          name: 'file'
        })
        console.log('上传封面图响应:', uploadRes.data)

        const data = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data

        if (data && data.url) {
          setFormData({ ...formData, cover_image: data.url })
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } else {
          throw new Error('上传失败')
        }
      }
    } catch (error: any) {
      console.error('上传封面失败:', error)
      if (error.errMsg !== 'chooseImage:fail cancel') {
        Taro.showToast({ title: '上传失败', icon: 'error' })
      }
    } finally {
      setUploading(false)
      Taro.hideLoading()
    }
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    if (formData.tags.includes(tagInput.trim())) {
      Taro.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    if (formData.tags.length >= 5) {
      Taro.showToast({ title: '最多添加5个标签', icon: 'none' })
      return
    }
    setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
    setTagInput('')
  }

  const handleRemoveTag = (index: number) => {
    const newTags = [...formData.tags]
    newTags.splice(index, 1)
    setFormData({ ...formData, tags: newTags })
  }

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.title.trim()) {
      Taro.showToast({ title: '请输入资源标题', icon: 'none' })
      return
    }
    if (!formData.category_id) {
      Taro.showToast({ title: '请选择资源分类', icon: 'none' })
      return
    }
    if (!formData.description.trim()) {
      Taro.showToast({ title: '请输入资源描述', icon: 'none' })
      return
    }
    if (!formData.file_url) {
      Taro.showToast({ title: '请上传资源文件', icon: 'none' })
      return
    }
    if (!formData.is_free && (!formData.price || parseFloat(formData.price) <= 0)) {
      Taro.showToast({ title: '请设置资源价格', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        price: formData.is_free ? 0 : parseFloat(formData.price)
      }

      console.log('提交资源请求:', { url: '/api/resources', method: 'POST', data: submitData })
      const res = await Network.request({
        url: '/api/resources',
        method: 'POST',
        data: submitData
      })
      console.log('提交资源响应:', res.data)

      Taro.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '提交失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB'
  }

  return (
    <View className="upload-page">
      <ScrollView scrollY className="upload-scroll">
        {/* 基本信息 */}
        <View className="form-section">
          <Text className="section-title">基本信息</Text>
          
          <View className="form-item">
            <Text className="label required">资源标题</Text>
            <View className="input-wrap">
              <TaroInput
                className="input"
                placeholder="请输入资源标题"
                value={formData.title}
                onInput={(e) => handleInputChange('title', e.detail.value)}
                maxlength={100}
              />
            </View>
          </View>

          <View className="form-item">
            <Text className="label required">资源分类</Text>
            <View className="category-list">
              {categories.map((cat) => (
                <View
                  key={cat.id}
                  className={`category-item ${formData.category_id === cat.id ? 'active' : ''}`}
                  onClick={() => handleInputChange('category_id', cat.id)}
                >
                  <Text className="category-text">{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="form-item">
            <Text className="label required">资源描述</Text>
            <View className="textarea-wrap">
              <TaroTextarea
                className="textarea"
                placeholder="请详细描述资源内容、适用范围、使用方法等"
                value={formData.description}
                onInput={(e) => handleInputChange('description', e.detail.value)}
                maxlength={500}
              />
              <Text className="word-count">{formData.description.length}/500</Text>
            </View>
          </View>
        </View>

        {/* 资源文件 */}
        <View className="form-section">
          <Text className="section-title">资源文件</Text>
          
          <View className="form-item">
            <Text className="label required">上传文件</Text>
            <View className="upload-area" onClick={handleUploadFile}>
              {formData.file_url ? (
                <View className="file-preview">
                  {formData.type === 'video' ? (
                    <Video size={32} color="#F59E0B" />
                  ) : formData.type === 'audio' ? (
                    <Music size={32} color="#8B5CF6" />
                  ) : formData.type === 'image' ? (
                    <ImageIcon size={32} color="#10B981" />
                  ) : (
                    <FileText size={32} color="#2563EB" />
                  )}
                  <Text className="file-name">{formData.file_ext.toUpperCase()} 文件</Text>
                  <Text className="file-size">{formatFileSize(formData.file_size)}</Text>
                  <View className="change-btn">
                    <Text className="change-text">更换文件</Text>
                  </View>
                </View>
              ) : (
                <View className="upload-placeholder">
                  <Upload size={32} color="#9CA3AF" />
                  <Text className="upload-text">点击上传文件</Text>
                  <Text className="upload-hint">支持 PDF、DOC、PPT、MP4、MP3 等格式</Text>
                </View>
              )}
            </View>
          </View>

          <View className="form-item">
            <Text className="label">封面图片</Text>
            <View className="cover-area">
              {formData.cover_image ? (
                <View className="cover-preview">
                  <Image src={formData.cover_image} className="cover-img" mode="aspectFill" />
                  <View className="cover-remove" onClick={() => handleInputChange('cover_image', '')}>
                    <X size={16} color="#fff" />
                  </View>
                </View>
              ) : (
                <View className="cover-upload" onClick={handleUploadCover}>
                  <Plus size={24} color="#9CA3AF" />
                  <Text className="cover-text">添加封面</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 价格设置 */}
        <View className="form-section">
          <Text className="section-title">价格设置</Text>
          
          <View className="price-type-list">
            <View
              className={`price-type-item ${formData.is_free ? 'active' : ''}`}
              onClick={() => handleInputChange('is_free', true)}
            >
              <View className="price-type-radio">
                {formData.is_free && <Check size={14} color="#2563EB" />}
              </View>
              <Text className="price-type-label">免费资源</Text>
            </View>
            <View
              className={`price-type-item ${!formData.is_free ? 'active' : ''}`}
              onClick={() => handleInputChange('is_free', false)}
            >
              <View className="price-type-radio">
                {!formData.is_free && <Check size={14} color="#2563EB" />}
              </View>
              <Text className="price-type-label">付费资源</Text>
            </View>
          </View>

          {!formData.is_free && (
            <View className="form-item">
              <Text className="label required">资源价格</Text>
              <View className="price-input-wrap">
                <Text className="price-symbol">¥</Text>
                <TaroInput
                  className="price-input"
                  type="digit"
                  placeholder="0.00"
                  value={formData.price}
                  onInput={(e) => handleInputChange('price', e.detail.value)}
                />
              </View>
              <Text className="price-hint">平台将抽取一定比例佣金，实际收益以购买后为准</Text>
            </View>
          )}
        </View>

        {/* 标签 */}
        <View className="form-section">
          <Text className="section-title">资源标签</Text>
          
          <View className="form-item">
            <View className="tag-input-wrap">
              <View className="tag-input-row">
                <TaroInput
                  className="tag-input"
                  placeholder="输入标签，按回车添加"
                  value={tagInput}
                  onInput={(e) => setTagInput(e.detail.value)}
                  onConfirm={handleAddTag}
                />
                <View className="tag-add-btn" onClick={handleAddTag}>
                  <Text className="tag-add-text">添加</Text>
                </View>
              </View>
              <View className="tag-list">
                {formData.tags.map((tag, index) => (
                  <View key={index} className="tag-item">
                    <Text className="tag-text">{tag}</Text>
                    <View className="tag-remove" onClick={() => handleRemoveTag(index)}>
                      <X size={12} color="#6B7280" />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="bottom-space" />
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <Button
          className="submit-btn"
          disabled={loading || uploading}
          onClick={handleSubmit}
        >
          <Text className="submit-text">{loading || uploading ? '提交中...' : '提交审核'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default ResourceUploadPage
