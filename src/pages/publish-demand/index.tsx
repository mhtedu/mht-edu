import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { getLocation } from '@/utils'
import { 
  BookOpen, User, Clock, MapPin, DollarSign, 
  FileText, Phone, ChevronDown, Info
} from 'lucide-react-taro'

// 学科选项
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '其他']

// 年级选项
const gradeOptions = ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', 
  '初一', '初二', '初三', '高一', '高二', '高三']

// 辅导时间选项
const timeSlots = ['工作日上午', '工作日下午', '工作日晚上', '周末上午', '周末下午', '周末晚上', '随时']

// 频次选项
const frequencyOptions = ['每周1次', '每周2次', '每周3次', '每周4次', '每周5次以上', '协商确定']

// 预算范围
const budgetRanges = ['50-100元/小时', '100-150元/小时', '150-200元/小时', '200-300元/小时', '300元以上/小时', '面议']

interface FormData {
  subject: string
  student_grade: string
  student_gender: number // 0: 男, 1: 女
  time_slots: string[]
  frequency: string
  budget: string
  address: string
  latitude: number
  longitude: number
  description: string
  contact_name: string
  contact_phone: string
}

/**
 * 发布需求页面 - 家长端核心功能
 */
const PublishDemandPage: FC = () => {
  const { isLoggedIn, userInfo } = useUserStore()
  
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    student_grade: '',
    student_gender: 0,
    time_slots: [],
    frequency: '',
    budget: '',
    address: '',
    latitude: 0,
    longitude: 0,
    description: '',
    contact_name: '',
    contact_phone: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  
  // 学科选择器状态
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false)
  const [gradePickerVisible, setGradePickerVisible] = useState(false)
  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false)
  const [budgetPickerVisible, setBudgetPickerVisible] = useState(false)

  useDidShow(() => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再发布需求',
        showCancel: false,
        success: () => Taro.navigateBack()
      })
      return
    }
    
    // 预填充用户信息
    if (userInfo) {
      setFormData(prev => ({
        ...prev,
        contact_name: userInfo.nickname || '',
        contact_phone: userInfo.mobile || ''
      }))
    }
  })

  // 定位
  const handleLocation = async () => {
    setLocationLoading(true)
    try {
      const location = await getLocation()
      if (location) {
        setFormData(prev => ({
          ...prev,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude
        }))
        Taro.showToast({ title: '定位成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '定位失败', icon: 'none' })
      }
    } catch (error) {
      console.error('定位失败:', error)
      Taro.showToast({ title: '定位失败', icon: 'none' })
    } finally {
      setLocationLoading(false)
    }
  }

  // 切换时间段选择
  const toggleTimeSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.includes(slot)
        ? prev.time_slots.filter(s => s !== slot)
        : [...prev.time_slots, slot]
    }))
  }

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.subject) {
      Taro.showToast({ title: '请选择辅导科目', icon: 'none' })
      return false
    }
    if (!formData.student_grade) {
      Taro.showToast({ title: '请选择学生年级', icon: 'none' })
      return false
    }
    if (formData.time_slots.length === 0) {
      Taro.showToast({ title: '请选择辅导时间', icon: 'none' })
      return false
    }
    if (!formData.frequency) {
      Taro.showToast({ title: '请选择辅导频次', icon: 'none' })
      return false
    }
    if (!formData.budget) {
      Taro.showToast({ title: '请选择预算范围', icon: 'none' })
      return false
    }
    if (!formData.address) {
      Taro.showToast({ title: '请定位上课地址', icon: 'none' })
      return false
    }
    if (!formData.description) {
      Taro.showToast({ title: '请填写详细描述', icon: 'none' })
      return false
    }
    if (!formData.contact_phone) {
      Taro.showToast({ title: '请填写联系电话', icon: 'none' })
      return false
    }
    return true
  }

  // 提交发布
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    Taro.showModal({
      title: '确认发布',
      content: '需求发布后，附近的牛师将可以看到并抢单，确认发布吗？',
      success: async (res) => {
        if (res.confirm) {
          setLoading(true)
          try {
            // 构造后端需要的参数格式
            const submitData = {
              subject: formData.subject,
              grade: formData.student_grade,
              student_info: formData.student_gender === 0 ? '男生' : '女生',
              schedule: `${formData.time_slots.join('、')}，${formData.frequency}`,
              address: formData.address,
              latitude: formData.latitude,
              longitude: formData.longitude,
              budget: parseFloat(formData.budget.replace(/[^0-9]/g, '')) || 0,
              requirement: formData.description,
            }
            console.log('发布需求请求:', { url: '/api/order/create', data: submitData })
            const result = await Network.request({
              url: '/api/order/create',
              method: 'POST',
              data: submitData
            })
            console.log('发布需求响应:', result.data)
            
            Taro.showToast({ title: '发布成功', icon: 'success' })
            
            // 跳转到订单列表或返回
            setTimeout(() => {
              Taro.showModal({
                title: '发布成功',
                content: '需求已发布，等待牛师抢单。您可以前往"我的需求"查看进度。',
                confirmText: '查看需求',
                cancelText: '继续发布',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    Taro.navigateTo({ url: '/pages/orders/index' })
                  } else {
                    // 重置表单
                    setFormData({
                      subject: '',
                      student_grade: '',
                      student_gender: 0,
                      time_slots: [],
                      frequency: '',
                      budget: '',
                      address: '',
                      latitude: 0,
                      longitude: 0,
                      description: '',
                      contact_name: formData.contact_name,
                      contact_phone: formData.contact_phone
                    })
                  }
                }
              })
            }, 1500)
          } catch (error) {
            console.error('发布需求失败:', error)
            Taro.showToast({ title: '发布失败，请重试', icon: 'none' })
          } finally {
            setLoading(false)
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="pb-20">
        {/* 提示信息 */}
        <View className="bg-blue-50 px-4 py-3 flex flex-row items-start gap-2">
          <Info size={16} color="#2563EB" className="mt-1 shrink-0" />
          <Text className="text-xs text-blue-700 flex-1">
            发布需求后，附近的牛师将可以看到您的需求并抢单，您可以从中选择合适的牛师。
          </Text>
        </View>

        {/* 基本信息 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">基本信息</Text>
            
            {/* 辅导科目 */}
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <BookOpen size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">辅导科目 *</Text>
                </View>
              </Label>
              <View 
                className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                onClick={() => setSubjectPickerVisible(true)}
              >
                <Text className={formData.subject ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.subject || '请选择科目'}
                </Text>
                <ChevronDown size={16} color="#9CA3AF" />
              </View>
              {subjectPickerVisible && (
                <View className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {subjectOptions.map((subject, idx) => (
                    <View 
                      key={idx}
                      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${formData.subject === subject ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, subject }))
                        setSubjectPickerVisible(false)
                      }}
                    >
                      <Text className={formData.subject === subject ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                        {subject}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 学生年级 */}
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <User size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">学生年级 *</Text>
                </View>
              </Label>
              <View 
                className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                onClick={() => setGradePickerVisible(true)}
              >
                <Text className={formData.student_grade ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.student_grade || '请选择年级'}
                </Text>
                <ChevronDown size={16} color="#9CA3AF" />
              </View>
              {gradePickerVisible && (
                <View className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
                  {gradeOptions.map((grade, idx) => (
                    <View 
                      key={idx}
                      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${formData.student_grade === grade ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, student_grade: grade }))
                        setGradePickerVisible(false)
                      }}
                    >
                      <Text className={formData.student_grade === grade ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                        {grade}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 学生性别 */}
            <View className="mb-4">
              <Label className="mb-2">
                <Text className="text-sm text-gray-700">学生性别</Text>
              </Label>
              <View className="flex flex-row gap-3">
                <View 
                  className={`flex-1 rounded-lg px-4 py-3 text-center ${formData.student_gender === 0 ? 'bg-blue-600' : 'bg-gray-100'}`}
                  onClick={() => setFormData(prev => ({ ...prev, student_gender: 0 }))}
                >
                  <Text className={formData.student_gender === 0 ? 'text-white' : 'text-gray-600'}>男</Text>
                </View>
                <View 
                  className={`flex-1 rounded-lg px-4 py-3 text-center ${formData.student_gender === 1 ? 'bg-blue-600' : 'bg-gray-100'}`}
                  onClick={() => setFormData(prev => ({ ...prev, student_gender: 1 }))}
                >
                  <Text className={formData.student_gender === 1 ? 'text-white' : 'text-gray-600'}>女</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 辅导安排 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">辅导安排</Text>
            
            {/* 辅导时间 */}
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">辅导时间 *</Text>
                </View>
              </Label>
              <View className="flex flex-wrap gap-2">
                {timeSlots.map((slot, idx) => (
                  <View 
                    key={idx}
                    className={`px-3 py-2 rounded-lg ${formData.time_slots.includes(slot) ? 'bg-blue-600' : 'bg-gray-100'}`}
                    onClick={() => toggleTimeSlot(slot)}
                  >
                    <Text className={`text-sm ${formData.time_slots.includes(slot) ? 'text-white' : 'text-gray-600'}`}>
                      {slot}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 辅导频次 */}
            <View className="mb-4">
              <Label className="mb-2">
                <Text className="text-sm text-gray-700">辅导频次 *</Text>
              </Label>
              <View 
                className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                onClick={() => setFrequencyPickerVisible(true)}
              >
                <Text className={formData.frequency ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.frequency || '请选择频次'}
                </Text>
                <ChevronDown size={16} color="#9CA3AF" />
              </View>
              {frequencyPickerVisible && (
                <View className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {frequencyOptions.map((freq, idx) => (
                    <View 
                      key={idx}
                      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${formData.frequency === freq ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, frequency: freq }))
                        setFrequencyPickerVisible(false)
                      }}
                    >
                      <Text className={formData.frequency === freq ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                        {freq}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 预算与地址 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">预算与地址</Text>
            
            {/* 预算范围 */}
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <DollarSign size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">预算范围 *</Text>
                </View>
              </Label>
              <View 
                className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                onClick={() => setBudgetPickerVisible(true)}
              >
                <Text className={formData.budget ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.budget || '请选择预算范围'}
                </Text>
                <ChevronDown size={16} color="#9CA3AF" />
              </View>
              {budgetPickerVisible && (
                <View className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {budgetRanges.map((budget, idx) => (
                    <View 
                      key={idx}
                      className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${formData.budget === budget ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, budget }))
                        setBudgetPickerVisible(false)
                      }}
                    >
                      <Text className={formData.budget === budget ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                        {budget}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 上课地址 */}
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <MapPin size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">上课地址 *</Text>
                </View>
              </Label>
              <View className="flex flex-row gap-2">
                <View className="flex-1 bg-gray-50 rounded-lg px-4 py-3">
                  <Text className={formData.address ? 'text-gray-900 text-sm' : 'text-gray-400 text-sm'}>
                    {formData.address || '请定位上课地址'}
                  </Text>
                </View>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleLocation}
                  disabled={locationLoading}
                >
                  <MapPin size={14} color="#2563EB" />
                  <Text className="text-blue-600 ml-1">{locationLoading ? '定位中' : '定位'}</Text>
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 详细描述 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">详细描述</Text>
            
            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <FileText size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">需求描述 *</Text>
                </View>
              </Label>
              <View className="bg-gray-50 rounded-xl p-4">
                <textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent', fontSize: '14px' }}
                  placeholder="请详细描述您的辅导需求，例如：&#10;1. 学生的学习情况和薄弱环节&#10;2. 希望牛师具备的教学特点&#10;3. 特殊的时间安排要求&#10;4. 其他需要说明的事项"
                  value={formData.description}
                  onInput={(e: any) => setFormData(prev => ({ ...prev, description: e.detail.value }))}
                  maxLength={500}
                />
                <View className="flex justify-end mt-2">
                  <Text className="text-xs text-gray-400">{formData.description.length}/500</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <Text className="text-base font-semibold mb-4">联系方式</Text>
            
            <View className="mb-4">
              <Label className="mb-2">
                <Text className="text-sm text-gray-700">联系人</Text>
              </Label>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入联系人姓名"
                  value={formData.contact_name}
                  onInput={(e) => setFormData(prev => ({ ...prev, contact_name: e.detail.value }))}
                />
              </View>
            </View>

            <View className="mb-4">
              <Label className="mb-2">
                <View className="flex flex-row items-center gap-1">
                  <Phone size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-700">联系电话 *</Text>
                </View>
              </Label>
              <View className="bg-gray-50 rounded-lg px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入联系电话"
                  value={formData.contact_phone}
                  onInput={(e) => setFormData(prev => ({ ...prev, contact_phone: e.detail.value }))}
                />
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 温馨提示 */}
        <View className="mx-4 mt-4 mb-4 bg-amber-50 rounded-lg p-4">
          <Text className="text-sm text-amber-800 font-medium mb-2">温馨提示</Text>
          <Text className="text-xs text-amber-700 leading-relaxed">
            1. 请确保联系方式准确，以便牛师与您联系{'\n'}
            2. 详细的需求描述有助于匹配到更合适的牛师{'\n'}
            3. 您可以随时在&ldquo;我的需求&rdquo;中查看和管理发布的需求{'\n'}
            4. 牛师抢单后，您可以选择接受或拒绝
          </Text>
        </View>
      </ScrollView>

      {/* 底部提交按钮 */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
        <Button 
          variant="outline"
          className="flex-1"
          onClick={() => Taro.navigateBack()}
        >
          <Text className="text-gray-600">取消</Text>
        </Button>
        <Button 
          className="flex-1"
          disabled={loading}
          onClick={handleSubmit}
        >
          <Text className="text-white">{loading ? '发布中...' : '发布需求'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default PublishDemandPage
