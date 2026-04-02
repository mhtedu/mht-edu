import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import {
  Calendar, Clock, MapPin, Users, Phone, Camera,
  Plus, Trash2, ChevronRight, CircleAlert, DollarSign
} from 'lucide-react-taro'

interface ScheduleItem {
  time: string
  content: string
}

/**
 * 活动创建页面（机构端）
 */
const CreateActivityPage: FC = () => {
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    type: 'visit',
    cover_image: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location_type: 'offline',
    address: '',
    online_link: '',
    max_participants: '',
    target_roles: [] as string[],
    online_price: '0',
    offline_price: '0',
    description: '',
    contact_phone: '',
  })

  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { time: '', content: '' }
  ])

  const activityTypes = [
    { value: 'visit', label: '探校活动' },
    { value: 'training', label: '培训讲座' },
    { value: 'lecture', label: '公开课' },
    { value: 'other', label: '其他活动' }
  ]
  const [typeIndex, setTypeIndex] = useState(0)

  const locationTypes = [
    { value: 'offline', label: '线下活动' },
    { value: 'online', label: '线上活动' },
    { value: 'both', label: '线上+线下' }
  ]
  const [locationIndex, setLocationIndex] = useState(0)

  const targetRoleOptions = [
    { value: 'parent', label: '家长' },
    { value: 'teacher', label: '牛师' },
    { value: 'org', label: '机构' }
  ]

  useDidShow(() => {
    // 检查机构认证状态
    checkOrgAuth()
  })

  const checkOrgAuth = async () => {
    try {
      const res = await Network.request({
        url: '/api/org-auth/status',
        method: 'GET'
      })
      if (res.data && res.data.data && res.data.data.status !== 'approved') {
        Taro.showModal({
          title: '提示',
          content: '您还未完成机构认证，无法创建活动',
          confirmText: '去认证',
          success: (modalRes) => {
            if (modalRes.confirm) {
              Taro.navigateTo({ url: '/pages/org-auth/index' })
            } else {
              Taro.navigateBack()
            }
          }
        })
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTypeChange = (e) => {
    const index = e.detail.value
    setTypeIndex(index)
    setFormData(prev => ({ ...prev, type: activityTypes[index].value }))
  }

  const handleLocationChange = (e) => {
    const index = e.detail.value
    setLocationIndex(index)
    setFormData(prev => ({ ...prev, location_type: locationTypes[index].value }))
  }

  const toggleTargetRole = (role: string) => {
    const newRoles = formData.target_roles.includes(role)
      ? formData.target_roles.filter(r => r !== role)
      : [...formData.target_roles, role]
    setFormData(prev => ({ ...prev, target_roles: newRoles }))
  }

  const handleChooseLocation = () => {
    Taro.chooseLocation({
      success: (res) => {
        setFormData(prev => ({
          ...prev,
          address: res.address || res.name || ''
        }))
      },
      fail: () => {
        Taro.showToast({ title: '获取位置失败', icon: 'none' })
      }
    })
  }

  const handleUploadCover = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        Taro.showToast({ title: '上传中...', icon: 'loading' })
        
        try {
          const uploadRes = await Network.uploadFile({
            url: '/api/upload',
            filePath: tempFilePath,
            name: 'file'
          })
          console.log('上传结果:', uploadRes)
          
          const respData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
          const url = respData?.url || respData?.data?.url
          if (url) {
            setFormData(prev => ({ ...prev, cover_image: url }))
            Taro.showToast({ title: '上传成功', icon: 'success' })
          }
        } catch (error) {
          console.error('上传失败:', error)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    })
  }

  const addSchedule = () => {
    setSchedules([...schedules, { time: '', content: '' }])
  }

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index))
    }
  }

  const updateSchedule = (index: number, field: 'time' | 'content', value: string) => {
    const newSchedules = [...schedules]
    newSchedules[index][field] = value
    setSchedules(newSchedules)
  }

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.title.trim()) {
      Taro.showToast({ title: '请输入活动标题', icon: 'none' })
      return
    }
    if (!formData.start_date || !formData.start_time) {
      Taro.showToast({ title: '请选择活动开始时间', icon: 'none' })
      return
    }
    if (!formData.end_date || !formData.end_time) {
      Taro.showToast({ title: '请选择活动结束时间', icon: 'none' })
      return
    }
    if (formData.location_type !== 'online' && !formData.address.trim()) {
      Taro.showToast({ title: '请输入活动地址', icon: 'none' })
      return
    }
    if (!formData.max_participants || parseInt(formData.max_participants) <= 0) {
      Taro.showToast({ title: '请输入最大参与人数', icon: 'none' })
      return
    }
    if (formData.target_roles.length === 0) {
      Taro.showToast({ title: '请选择目标人群', icon: 'none' })
      return
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      Taro.showToast({ title: '活动描述至少50字', icon: 'none' })
      return
    }
    if (!formData.contact_phone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = {
        ...formData,
        schedules: schedules.filter(s => s.time && s.content),
        start_time: `${formData.start_date} ${formData.start_time}`,
        end_time: `${formData.end_date} ${formData.end_time}`
      }
      
      console.log('提交活动:', submitData)
      
      const res = await Network.request({
        url: '/api/activities',
        method: 'POST',
        data: submitData
      })
      
      console.log('提交结果:', res.data)
      
      if (res.data && res.data.code === 0) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateTo({ url: '/pages/activity-manage/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: res.data?.msg || '创建失败', icon: 'none' })
      }
    } catch (error) {
      console.error('创建活动失败:', error)
      Taro.showToast({ title: '创建失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-screen">
        <View className="p-4">
          {/* 基本信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar size={18} color="#2563EB" className="mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">活动标题 *</Text>
                <Input
                  placeholder="请输入活动标题"
                  value={formData.title}
                  onInput={(e) => handleInputChange('title', e.detail.value)}
                  maxlength={50}
                />
                <Text className="text-xs text-gray-400 text-right mt-1">
                  {formData.title.length}/50
                </Text>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">活动类型</Text>
                <Picker mode="selector" range={activityTypes.map(t => t.label)} value={typeIndex} onChange={handleTypeChange}>
                  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <Text>{activityTypes[typeIndex].label}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">封面图片</Text>
                <View
                  className="flex flex-col items-center justify-center bg-gray-50 rounded-lg h-40"
                  onClick={handleUploadCover}
                >
                  {formData.cover_image ? (
                    <View className="relative w-full h-full">
                      <Text className="text-sm text-green-600 text-center mt-16">已上传封面</Text>
                    </View>
                  ) : (
                    <>
                      <Camera size={32} color="#9CA3AF" />
                      <Text className="text-xs text-gray-400 mt-2">点击上传封面图片</Text>
                      <Text className="text-xs text-gray-300 mt-1">建议尺寸 750x400</Text>
                    </>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 时间地点 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock size={18} color="#10B981" className="mr-2" />
                时间地点
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">开始时间 *</Text>
                <View className="flex flex-row gap-2">
                  <Picker mode="date" value={formData.start_date} onChange={(e) => handleInputChange('start_date', e.detail.value)}>
                    <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                      <Text className={formData.start_date ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.start_date || '选择日期'}
                      </Text>
                    </View>
                  </Picker>
                  <Picker mode="time" value={formData.start_time} onChange={(e) => handleInputChange('start_time', e.detail.value)}>
                    <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                      <Text className={formData.start_time ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.start_time || '选择时间'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">结束时间 *</Text>
                <View className="flex flex-row gap-2">
                  <Picker mode="date" value={formData.end_date} onChange={(e) => handleInputChange('end_date', e.detail.value)}>
                    <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                      <Text className={formData.end_date ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.end_date || '选择日期'}
                      </Text>
                    </View>
                  </Picker>
                  <Picker mode="time" value={formData.end_time} onChange={(e) => handleInputChange('end_time', e.detail.value)}>
                    <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                      <Text className={formData.end_time ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.end_time || '选择时间'}
                      </Text>
                    </View>
                  </Picker>
                </View>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">活动形式</Text>
                <Picker mode="selector" range={locationTypes.map(t => t.label)} value={locationIndex} onChange={handleLocationChange}>
                  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <Text>{locationTypes[locationIndex].label}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Picker>
              </View>

              {formData.location_type !== 'online' && (
                <View>
                  <Text className="text-sm text-gray-600 mb-1">活动地址 *</Text>
                  <View
                    className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    onClick={handleChooseLocation}
                  >
                    <Text className={formData.address ? 'text-gray-900' : 'text-gray-400'}>
                      {formData.address || '点击选择地址'}
                    </Text>
                    <MapPin size={16} color="#9CA3AF" />
                  </View>
                </View>
              )}

              {formData.location_type !== 'offline' && (
                <View>
                  <Text className="text-sm text-gray-600 mb-1">线上链接</Text>
                  <Input
                    placeholder="请输入线上活动链接（如腾讯会议、Zoom等）"
                    value={formData.online_link}
                    onInput={(e) => handleInputChange('online_link', e.detail.value)}
                  />
                </View>
              )}
            </CardContent>
          </Card>

          {/* 参与设置 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users size={18} color="#F59E0B" className="mr-2" />
                参与设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">最大参与人数 *</Text>
                <Input
                  type="number"
                  placeholder="请输入最大参与人数"
                  value={formData.max_participants}
                  onInput={(e) => handleInputChange('max_participants', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">目标人群 *</Text>
                <View className="flex flex-row flex-wrap gap-2">
                  {targetRoleOptions.map((role) => (
                    <Badge
                      key={role.value}
                      variant={formData.target_roles.includes(role.value) ? 'default' : 'outline'}
                      className="mb-2"
                      onClick={() => toggleTargetRole(role.value)}
                    >
                      <Text className={formData.target_roles.includes(role.value) ? 'text-white' : 'text-gray-600'}>
                        {role.label}
                      </Text>
                    </Badge>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 费用设置 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign size={18} color="#EC4899" className="mr-2" />
                费用设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.location_type !== 'offline' && (
                <View>
                  <Text className="text-sm text-gray-600 mb-1">线上参与费用</Text>
                  <Input
                    type="digit"
                    placeholder="0表示免费"
                    value={formData.online_price}
                    onInput={(e) => handleInputChange('online_price', e.detail.value)}
                  />
                  <Text className="text-xs text-gray-400 mt-1">元/人，0表示免费</Text>
                </View>
              )}

              {formData.location_type !== 'online' && (
                <View>
                  <Text className="text-sm text-gray-600 mb-1">线下参与费用</Text>
                  <Input
                    type="digit"
                    placeholder="0表示免费"
                    value={formData.offline_price}
                    onInput={(e) => handleInputChange('offline_price', e.detail.value)}
                  />
                  <Text className="text-xs text-gray-400 mt-1">元/人，0表示免费</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* 活动详情 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CircleAlert size={18} color="#8B5CF6" className="mr-2" />
                活动详情
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">活动描述 *（至少50字）</Text>
                <Textarea
                  placeholder="请详细描述活动内容、亮点、注意事项等..."
                  value={formData.description}
                  onInput={(e) => handleInputChange('description', e.detail.value)}
                  maxlength={2000}
                  className="bg-gray-50 rounded-lg p-3 min-h-32"
                />
                <Text className="text-xs text-gray-400 text-right mt-1">
                  {formData.description.length}/2000
                </Text>
              </View>

              <View>
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-gray-600">活动日程</Text>
                  <View className="flex flex-row items-center" onClick={addSchedule}>
                    <Plus size={16} color="#2563EB" />
                    <Text className="text-sm text-blue-600 ml-1">添加日程</Text>
                  </View>
                </View>
                {schedules.map((schedule, index) => (
                  <View key={index} className="flex flex-row gap-2 mb-2">
                    <Input
                      placeholder="时间"
                      value={schedule.time}
                      onInput={(e) => updateSchedule(index, 'time', e.detail.value)}
                      className="w-24"
                    />
                    <Input
                      placeholder="日程内容"
                      value={schedule.content}
                      onInput={(e) => updateSchedule(index, 'content', e.detail.value)}
                      className="flex-1"
                    />
                    {schedules.length > 1 && (
                      <View className="flex items-center justify-center px-2" onClick={() => removeSchedule(index)}>
                        <Trash2 size={18} color="#EF4444" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* 联系方式 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone size={18} color="#06B6D4" className="mr-2" />
                联系方式
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View>
                <Text className="text-sm text-gray-600 mb-1">联系电话 *</Text>
                <Input
                  type="number"
                  placeholder="请输入联系电话"
                  value={formData.contact_phone}
                  maxlength={11}
                  onInput={(e) => handleInputChange('contact_phone', e.detail.value)}
                />
                <Text className="text-xs text-gray-400 mt-1">用于活动咨询和紧急联系</Text>
              </View>
            </CardContent>
          </Card>

          {/* 温馨提示 */}
          <View className="bg-amber-50 rounded-lg p-3 mb-4">
            <Text className="text-xs text-amber-700">
              提示：活动创建后将进入审核状态，审核通过后会在活动列表展示。请确保信息真实有效。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <Button
          className="w-full"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? '创建中...' : '创建活动'}
        </Button>
      </View>
    </View>
  )
}

export default CreateActivityPage
