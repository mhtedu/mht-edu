import { View, Text, Video as TaroVideo } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { Network } from '@/network'
import { ImagePlus, Video, X, Loader } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import './index.css'

const PublishMomentPage: FC = () => {
  const [content, setContent] = useState('')
  const [mediaList, setMediaList] = useState<{ type: 'image' | 'video', path: string, key?: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 最多支持9张图片或视频
  const maxMediaCount = 9
  const canAddMore = mediaList.length < maxMediaCount

  // 选择图片
  const handleChooseImage = async () => {
    if (!canAddMore) {
      Taro.showToast({ title: `最多上传${maxMediaCount}张`, icon: 'none' })
      return
    }

    try {
      const res = await Taro.chooseImage({
        count: maxMediaCount - mediaList.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const newMedia = res.tempFilePaths.map(path => ({
        type: 'image' as const,
        path
      }))

      setMediaList([...mediaList, ...newMedia])
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  // 选择视频
  const handleChooseVideo = async () => {
    if (!canAddMore) {
      Taro.showToast({ title: `最多上传${maxMediaCount}个`, icon: 'none' })
      return
    }

    try {
      const res = await Taro.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        compressed: true
      })

      setMediaList([...mediaList, { type: 'video', path: res.tempFilePath }])
    } catch (error) {
      console.error('选择视频失败', error)
    }
  }

  // 删除媒体
  const handleRemoveMedia = (index: number) => {
    setMediaList(mediaList.filter((_, i) => i !== index))
  }

  // 上传单个文件到对象存储
  const uploadFile = async (filePath: string): Promise<string> => {
    const res = await Network.uploadFile({
      url: '/api/moments/upload',
      filePath,
      name: 'file'
    })

    console.log('上传结果:', res)
    
    // Network.uploadFile 返回 Taro.uploadFile 的结果
    // res.data 是 string 类型，需要解析
    let data: any = res.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error('解析响应失败', e)
        throw new Error('上传失败：响应格式错误')
      }
    }
    
    // 后端返回格式：{ code: 200, msg: 'success', data: { key: 'xxx', url: 'xxx' } }
    if (data?.code === 200 && data?.data?.key) {
      return data.data.key
    }
    
    throw new Error(data?.msg || '上传失败')
  }

  // 提交发布
  const handleSubmit = async () => {
    if (!content.trim() && mediaList.length === 0) {
      Taro.showToast({ title: '请输入内容或添加图片/视频', icon: 'none' })
      return
    }

    setIsSubmitting(true)

    try {
      // 上传所有媒体文件
      const uploadedMedia: { type: 'image' | 'video', key: string }[] = []
      
      for (const media of mediaList) {
        const key = await uploadFile(media.path)
        uploadedMedia.push({ type: media.type, key })
      }

      // 发布动态
      const res = await Network.request({
        url: '/api/moments',
        method: 'POST',
        data: {
          content: content.trim(),
          media: uploadedMedia
        }
      })

      console.log('发布结果:', res)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '发布成功', icon: 'success' })
        
        // 延迟返回上一页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        throw new Error(res.data?.msg || '发布失败')
      }
    } catch (error: any) {
      console.error('发布失败', error)
      Taro.showToast({ 
        title: error.message || '发布失败，请重试', 
        icon: 'none' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View className="publish-moment-page">
      {/* 内容输入 */}
      <View className="content-section">
        <Textarea
          className="content-input"
          placeholder="分享你的教学心得、课堂趣事..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={500}
        />
        <Text className="char-count">{content.length}/500</Text>
      </View>

      {/* 媒体展示 */}
      <View className="media-section">
        <View className="media-grid">
          {mediaList.map((media, index) => (
            <View key={index} className="media-item">
              {media.type === 'image' ? (
                <View className="media-image" style={{ backgroundImage: `url(${media.path})` }} />
              ) : (
                <View className="media-video">
                  <TaroVideo className="w-full h-full" src={media.path} />
                </View>
              )}
              <View 
                className="remove-btn"
                onClick={() => handleRemoveMedia(index)}
              >
                <X size={14} color="#fff" />
              </View>
            </View>
          ))}
          
          {/* 添加按钮 */}
          {canAddMore && (
            <View className="add-media-grid">
              <View className="add-btn" onClick={handleChooseImage}>
                <ImagePlus size={24} color="#999" />
                <Text className="add-text">图片</Text>
              </View>
              <View className="add-btn" onClick={handleChooseVideo}>
                <Video size={24} color="#999" />
                <Text className="add-text">视频</Text>
              </View>
            </View>
          )}
        </View>
        <Text className="media-tip">最多上传{maxMediaCount}张图片或视频</Text>
      </View>

      {/* 提交按钮 */}
      <View className="submit-section">
        <Button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader size={18} color="#fff" className="animate-spin mr-2" />
              <Text>发布中...</Text>
            </>
          ) : (
            <Text>发布</Text>
          )}
        </Button>
      </View>
    </View>
  )
}

export default PublishMomentPage
