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
  User, GraduationCap, Award, FileText, Camera, Check,
  CircleAlert, Upload, ChevronRight, Clock
} from 'lucide-react-taro'

interface AuthStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  reason?: string
  submitted_at?: string
}

/**
 * 牛师认证页面
 */
const TeacherAuthPage: FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: 'none' })
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    real_name: '',
    gender: '男',
    phone: '',
    education: '本科',
    school: '',
    major: '',
    teaching_years: '',
    subjects: [] as string[],
    introduction: '',
    certifications: [] as string[],
  })

  const genderOptions = ['男', '女']
  const [genderIndex, setGenderIndex] = useState(0)

  const educationOptions = ['大专', '本科', '硕士', '博士']
  const [educationIndex, setEducationIndex] = useState(1)

  const subjectOptions = ['数学', '英语', '物理', '化学', '语文', '生物', '历史', '地理', '政治']
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  useDidShow(() => {
    loadAuthStatus()
  })

  const loadAuthStatus = async () => {
    try {
      const res = await Network.request({
        url: '/api/teacher-auth/status',
        method: 'GET'
      })
      console.log('认证状态:', res.data)
      
      if (res.data && res.data.data) {
        setAuthStatus({
          status: res.data.data.status || 'none',
          reason: res.data.data.reason,
          submitted_at: res.data.data.submitted_at
        })
        
        // 如果有已提交的数据，填充表单
        if (res.data.data.form_data) {
          setFormData(res.data.data.form_data)
          setSelectedSubjects(res.data.data.form_data.subjects || [])
        }
      }
    } catch (error) {
      console.error('加载认证状态失败:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenderChange = (e) => {
    const index = e.detail.value
    setGenderIndex(index)
    setFormData(prev => ({ ...prev, gender: genderOptions[index] }))
  }

  const handleEducationChange = (e) => {
    const index = e.detail.value
    setEducationIndex(index)
    setFormData(prev => ({ ...prev, education: educationOptions[index] }))
  }

  const toggleSubject = (subject: string) => {
    const newSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject]
    setSelectedSubjects(newSubjects)
    setFormData(prev => ({ ...prev, subjects: newSubjects }))
  }

  const handleUploadImage = (type: 'id_card' | 'cert') => {
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
            if (type === 'cert') {
              setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, url]
              }))
            }
            Taro.showToast({ title: '上传成功', icon: 'success' })
          }
        } catch (error) {
          console.error('上传失败:', error)
          Taro.showToast({ title: '上传失败', icon: 'none' })
        }
      }
    })
  }

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.real_name.trim()) {
      Taro.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }
    if (!formData.phone.trim()) {
      Taro.showToast({ title: '请输入手机号码', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!formData.school.trim()) {
      Taro.showToast({ title: '请输入毕业院校', icon: 'none' })
      return
    }
    if (!formData.major.trim()) {
      Taro.showToast({ title: '请输入专业', icon: 'none' })
      return
    }
    if (!formData.teaching_years || parseInt(formData.teaching_years) < 0) {
      Taro.showToast({ title: '请输入教龄', icon: 'none' })
      return
    }
    if (selectedSubjects.length === 0) {
      Taro.showToast({ title: '请选择教授科目', icon: 'none' })
      return
    }
    if (!formData.introduction.trim() || formData.introduction.length < 50) {
      Taro.showToast({ title: '个人简介至少50字', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      const submitData = {
        ...formData,
        subjects: selectedSubjects
      }
      
      console.log('提交认证:', submitData)
      
      const res = await Network.request({
        url: '/api/teacher-auth/submit',
        method: 'POST',
        data: submitData
      })
      
      console.log('提交结果:', res.data)
      
      if (res.data && res.data.code === 0) {
        Taro.showToast({ title: '提交成功', icon: 'success' })
        setAuthStatus({ status: 'pending', submitted_at: new Date().toISOString() })
      } else {
        Taro.showToast({ title: res.data?.msg || '提交失败', icon: 'none' })
      }
    } catch (error) {
      console.error('提交认证失败:', error)
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  // 待审核状态
  if (authStatus.status === 'pending') {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Clock size={40} color="#F59E0B" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">审核中</Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          您的认证申请已提交，{'\n'}工作人员将在1-3个工作日内完成审核
        </Text>
        <Text className="text-xs text-gray-400">
          提交时间：{authStatus.submitted_at || '刚刚'}
        </Text>
        <Button variant="outline" className="mt-6" onClick={() => Taro.navigateBack()}>
          返回
        </Button>
      </View>
    )
  }

  // 已通过状态
  if (authStatus.status === 'approved') {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <View className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check size={40} color="#10B981" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">认证通过</Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          恭喜您已通过牛师认证！{'\n'}现在可以开始接单授课了
        </Text>
        <Button className="mb-3" onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
          去抢单
        </Button>
        <Button variant="outline" onClick={() => Taro.navigateTo({ url: '/pages/teacher-workbench/index' })}>
          进入工作台
        </Button>
      </View>
    )
  }

  // 已拒绝状态
  if (authStatus.status === 'rejected') {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <View className="flex flex-col items-center py-8">
          <View className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <CircleAlert size={40} color="#EF4444" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">认证未通过</Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
            很抱歉，您的认证申请未通过审核
          </Text>
          {authStatus.reason && (
            <Card className="w-full mb-4">
              <CardContent className="p-4">
                <Text className="text-sm text-gray-600">拒绝原因：{authStatus.reason}</Text>
              </CardContent>
            </Card>
          )}
          <Button onClick={() => setAuthStatus({ status: 'none' })}>
            重新申请
          </Button>
        </View>
      </View>
    )
  }

  // 表单状态
  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="h-screen">
        {/* 认证须知 */}
        <View className="bg-blue-50 px-4 py-3">
          <View className="flex flex-row items-start gap-2">
            <CircleAlert size={16} color="#2563EB" className="mt-1 shrink-0" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-900">认证须知</Text>
              <Text className="text-xs text-blue-700 mt-1">
                请填写真实信息，上传清晰证件照片。认证通过后可享受：无限抢单、优先展示、高收益分成等权益。
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          {/* 基本信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User size={18} color="#2563EB" className="mr-2" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">真实姓名 *</Text>
                <Input
                  placeholder="请输入身份证上的姓名"
                  value={formData.real_name}
                  onInput={(e) => handleInputChange('real_name', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">性别</Text>
                <Picker mode="selector" range={genderOptions} value={genderIndex} onChange={handleGenderChange}>
                  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <Text>{genderOptions[genderIndex]}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">手机号码 *</Text>
                <Input
                  type="number"
                  placeholder="请输入手机号码"
                  value={formData.phone}
                  maxlength={11}
                  onInput={(e) => handleInputChange('phone', e.detail.value)}
                />
              </View>
            </CardContent>
          </Card>

          {/* 学历信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap size={18} color="#10B981" className="mr-2" />
                学历信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">最高学历</Text>
                <Picker mode="selector" range={educationOptions} value={educationIndex} onChange={handleEducationChange}>
                  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <Text>{educationOptions[educationIndex]}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">毕业院校 *</Text>
                <Input
                  placeholder="请输入毕业院校名称"
                  value={formData.school}
                  onInput={(e) => handleInputChange('school', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">专业 *</Text>
                <Input
                  placeholder="请输入所学专业"
                  value={formData.major}
                  onInput={(e) => handleInputChange('major', e.detail.value)}
                />
              </View>
            </CardContent>
          </Card>

          {/* 教学信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award size={18} color="#F59E0B" className="mr-2" />
                教学信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">教龄（年） *</Text>
                <Input
                  type="number"
                  placeholder="请输入教龄"
                  value={formData.teaching_years}
                  onInput={(e) => handleInputChange('teaching_years', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">教授科目 *</Text>
                <View className="flex flex-row flex-wrap gap-2">
                  {subjectOptions.map((subject) => (
                    <Badge
                      key={subject}
                      variant={selectedSubjects.includes(subject) ? 'default' : 'outline'}
                      className="mb-2"
                      onClick={() => toggleSubject(subject)}
                    >
                      <Text className={selectedSubjects.includes(subject) ? 'text-white' : 'text-gray-600'}>
                        {subject}
                      </Text>
                    </Badge>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">个人简介 *（至少50字）</Text>
                <Textarea
                  placeholder="请介绍您的教学经历、教学特点、教学成果等..."
                  value={formData.introduction}
                  onInput={(e) => handleInputChange('introduction', e.detail.value)}
                  maxlength={500}
                  className="bg-gray-50 rounded-lg p-3 min-h-24"
                />
                <Text className="text-xs text-gray-400 text-right mt-1">
                  {formData.introduction.length}/500
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 证件上传 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText size={18} color="#EC4899" className="mr-2" />
                证件上传
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-2">身份证照片</Text>
                <View className="flex flex-row gap-3">
                  <View
                    className="flex-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center h-28"
                    onClick={() => handleUploadImage('id_card')}
                  >
                    <Camera size={24} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 mt-2">身份证正面</Text>
                  </View>
                  <View
                    className="flex-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center h-28"
                    onClick={() => handleUploadImage('id_card')}
                  >
                    <Camera size={24} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 mt-2">身份证反面</Text>
                  </View>
                </View>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2">教师资格证/其他证书</Text>
                <View
                  className="flex flex-row items-center justify-center bg-gray-50 rounded-lg p-4 h-28"
                  onClick={() => handleUploadImage('cert')}
                >
                  {formData.certifications.length > 0 ? (
                    <View className="flex flex-row gap-2">
                      {formData.certifications.map((_certUrl, idx) => (
                        <View key={idx} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          <Text className="text-xs text-center mt-6">证书{idx + 1}</Text>
                        </View>
                      ))}
                      <View className="w-16 h-16 border border-dashed border-gray-300 rounded flex items-center justify-center">
                        <Upload size={20} color="#9CA3AF" />
                      </View>
                    </View>
                  ) : (
                    <View className="flex flex-col items-center">
                      <Upload size={24} color="#9CA3AF" />
                      <Text className="text-xs text-gray-400 mt-2">点击上传证书</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-400 mt-1">
                  支持上传教师资格证、学历证书、获奖证书等
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 温馨提示 */}
          <View className="bg-amber-50 rounded-lg p-3 mb-4">
            <Text className="text-xs text-amber-700">
              温馨提示：请确保填写的信息真实有效，上传的证件照片清晰可见。虚假信息将导致认证失败或账号封禁。
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
          {submitting ? '提交中...' : '提交认证'}
        </Button>
      </View>
    </View>
  )
}

export default TeacherAuthPage
