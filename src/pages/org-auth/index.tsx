import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import {
  Building2, User, MapPin, FileText, Camera, Check,
  CircleAlert, Upload, ChevronRight, Clock
} from 'lucide-react-taro'

interface AuthStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected'
  reason?: string
  submitted_at?: string
}

/**
 * 机构认证页面
 */
const OrgAuthPage: FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: 'none' })
  const [submitting, setSubmitting] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    org_name: '',
    org_type: '教育培训机构',
    contact_person: '',
    contact_phone: '',
    province: '',
    city: '',
    address: '',
    introduction: '',
    business_license: '',
    school_license: '',
    id_card_front: '',
    id_card_back: '',
  })

  const orgTypeOptions = ['教育培训机构', '艺术培训机构', '语言培训机构', '科技培训机构', '其他']
  const [orgTypeIndex, setOrgTypeIndex] = useState(0)

  useDidShow(() => {
    loadAuthStatus()
  })

  const loadAuthStatus = async () => {
    try {
      const res = await Network.request({
        url: '/api/org-auth/status',
        method: 'GET'
      })
      console.log('机构认证状态:', res.data)
      
      if (res.data && res.data.data) {
        setAuthStatus({
          status: res.data.data.status || 'none',
          reason: res.data.data.reason,
          submitted_at: res.data.data.submitted_at
        })
        
        if (res.data.data.form_data) {
          setFormData(res.data.data.form_data)
        }
      }
    } catch (error) {
      console.error('加载认证状态失败:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOrgTypeChange = (e) => {
    const index = e.detail.value
    setOrgTypeIndex(index)
    setFormData(prev => ({ ...prev, org_type: orgTypeOptions[index] }))
  }

  const handleChooseLocation = () => {
    Taro.chooseLocation({
      success: (res) => {
        setFormData(prev => ({
          ...prev,
          address: res.address || '',
          province: res.name || ''
        }))
      },
      fail: () => {
        Taro.showToast({ title: '获取位置失败', icon: 'none' })
      }
    })
  }

  const handleUploadImage = (type: 'business_license' | 'school_license' | 'id_card_front' | 'id_card_back') => {
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
            setFormData(prev => ({ ...prev, [type]: url }))
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
    if (!formData.org_name.trim()) {
      Taro.showToast({ title: '请输入机构名称', icon: 'none' })
      return
    }
    if (!formData.contact_person.trim()) {
      Taro.showToast({ title: '请输入联系人姓名', icon: 'none' })
      return
    }
    if (!formData.contact_phone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.contact_phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!formData.address.trim()) {
      Taro.showToast({ title: '请输入机构地址', icon: 'none' })
      return
    }
    if (!formData.introduction.trim() || formData.introduction.length < 100) {
      Taro.showToast({ title: '机构简介至少100字', icon: 'none' })
      return
    }
    if (!formData.business_license) {
      Taro.showToast({ title: '请上传营业执照', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      console.log('提交机构认证:', formData)
      
      const res = await Network.request({
        url: '/api/org-auth/submit',
        method: 'POST',
        data: formData
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
          您的机构认证申请已提交，{'\n'}工作人员将在1-3个工作日内完成审核
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
          恭喜您的机构已通过认证！{'\n'}现在可以发布课程、招募牛师了
        </Text>
        <Button className="mb-3" onClick={() => Taro.navigateTo({ url: '/pages/org-dashboard/index' })}>
          进入机构后台
        </Button>
        <Button variant="outline" onClick={() => Taro.navigateBack()}>
          返回
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
            很抱歉，您的机构认证申请未通过审核
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
              <Text className="text-sm font-medium text-blue-900">机构认证须知</Text>
              <Text className="text-xs text-blue-700 mt-1">
                请填写真实有效的机构信息。认证通过后可享受：发布课程、招募牛师、学员管理等权益。
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          {/* 基本信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 size={18} color="#2563EB" className="mr-2" />
                机构基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">机构名称 *</Text>
                <Input
                  placeholder="请输入营业执照上的机构名称"
                  value={formData.org_name}
                  onInput={(e) => handleInputChange('org_name', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">机构类型</Text>
                <Picker mode="selector" range={orgTypeOptions} value={orgTypeIndex} onChange={handleOrgTypeChange}>
                  <View className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <Text>{orgTypeOptions[orgTypeIndex]}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">机构地址 *</Text>
                <View
                  className="flex flex-row items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  onClick={handleChooseLocation}
                >
                  <Text className={formData.address ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.address || '点击选择机构地址'}
                  </Text>
                  <MapPin size={16} color="#9CA3AF" />
                </View>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">详细地址</Text>
                <Input
                  placeholder="请输入详细地址（门牌号等）"
                  value={formData.province}
                  onInput={(e) => handleInputChange('province', e.detail.value)}
                />
              </View>
            </CardContent>
          </Card>

          {/* 联系人信息 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User size={18} color="#10B981" className="mr-2" />
                联系人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">联系人姓名 *</Text>
                <Input
                  placeholder="请输入联系人姓名"
                  value={formData.contact_person}
                  onInput={(e) => handleInputChange('contact_person', e.detail.value)}
                />
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-1">联系电话 *</Text>
                <Input
                  type="number"
                  placeholder="请输入联系电话"
                  value={formData.contact_phone}
                  maxlength={11}
                  onInput={(e) => handleInputChange('contact_phone', e.detail.value)}
                />
              </View>
            </CardContent>
          </Card>

          {/* 机构简介 */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText size={18} color="#F59E0B" className="mr-2" />
                机构简介
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="请介绍您的机构：办学理念、师资力量、教学特色、获奖情况等..."
                value={formData.introduction}
                onInput={(e) => handleInputChange('introduction', e.detail.value)}
                maxlength={1000}
                className="bg-gray-50 rounded-lg p-3 min-h-32"
              />
              <Text className="text-xs text-gray-400 text-right mt-1">
                {formData.introduction.length}/1000（至少100字）
              </Text>
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
              {/* 营业执照 */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">营业执照 *</Text>
                <View
                  className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 h-32"
                  onClick={() => handleUploadImage('business_license')}
                >
                  {formData.business_license ? (
                    <View className="flex flex-col items-center">
                      <Check size={32} color="#10B981" />
                      <Text className="text-sm text-green-600 mt-2">已上传</Text>
                    </View>
                  ) : (
                    <>
                      <Camera size={32} color="#9CA3AF" />
                      <Text className="text-xs text-gray-400 mt-2">点击上传营业执照</Text>
                    </>
                  )}
                </View>
              </View>

              {/* 办学许可证 */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">办学许可证（选填）</Text>
                <View
                  className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 h-32"
                  onClick={() => handleUploadImage('school_license')}
                >
                  {formData.school_license ? (
                    <View className="flex flex-col items-center">
                      <Check size={32} color="#10B981" />
                      <Text className="text-sm text-green-600 mt-2">已上传</Text>
                    </View>
                  ) : (
                    <>
                      <Upload size={32} color="#9CA3AF" />
                      <Text className="text-xs text-gray-400 mt-2">点击上传办学许可证</Text>
                    </>
                  )}
                </View>
              </View>

              {/* 负责人身份证 */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">负责人身份证</Text>
                <View className="flex flex-row gap-3">
                  <View
                    className="flex-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center h-24"
                    onClick={() => handleUploadImage('id_card_front')}
                  >
                    {formData.id_card_front ? (
                      <Check size={24} color="#10B981" />
                    ) : (
                      <Camera size={24} color="#9CA3AF" />
                    )}
                    <Text className="text-xs text-gray-400 mt-1">身份证正面</Text>
                  </View>
                  <View
                    className="flex-1 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center h-24"
                    onClick={() => handleUploadImage('id_card_back')}
                  >
                    {formData.id_card_back ? (
                      <Check size={24} color="#10B981" />
                    ) : (
                      <Camera size={24} color="#9CA3AF" />
                    )}
                    <Text className="text-xs text-gray-400 mt-1">身份证反面</Text>
                  </View>
                </View>
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

export default OrgAuthPage
