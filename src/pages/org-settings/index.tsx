import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Phone, Mail, Clock,
  Camera, Pencil, Save, ChevronRight
} from 'lucide-react-taro'
import './index.css'

/**
 * 机构端 - 机构设置页面
 */
export default function OrgSettingsPage() {
  const [editing, setEditing] = useState(false)
  const [orgInfo, setOrgInfo] = useState({
    name: '阳光教育培训中心',
    logo: 'https://placehold.co/200/7C3AED/white?text=阳光',
    description: '专注中小学全科辅导，拥有资深教师团队，累计服务学生超过1000人。',
    address: '北京市朝阳区望京SOHO T1-1001',
    contactPhone: '010-12345678',
    contactEmail: 'contact@sunshine-edu.com',
    businessHours: '周一至周日 9:00-21:00',
    license: '教民1101057000001号',
    commissionRate: 10,
    subjects: ['数学', '英语', '物理', '化学'],
    city: '北京',
  })

  const handleSave = async () => {
    try {
      // await Network.request({
      //   url: '/api/org/settings',
      //   method: 'PUT',
      //   data: orgInfo
      // })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setEditing(false)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleChooseLogo = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 上传图片并更新logo
        setOrgInfo({ ...orgInfo, logo: tempFilePath })
      }
    })
  }

  return (
    <View className="org-settings-page">
      {/* 基本信息 */}
      <Card className="m-4">
        <CardHeader>
          <View className="flex items-center justify-between">
            <CardTitle>基本信息</CardTitle>
            <Button 
              size="sm" 
              variant={editing ? 'default' : 'outline'}
              onClick={() => editing ? handleSave() : setEditing(true)}
            >
              {editing ? (
                <>
                  <Save size={14} color="white" />
                  <Text className="text-white ml-1">保存</Text>
                </>
              ) : (
                <>
                  <Pencil size={14} color="#2563EB" />
                  <Text className="text-blue-500 ml-1">编辑</Text>
                </>
              )}
            </Button>
          </View>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            {/* Logo */}
            <View className="flex items-center gap-4">
              <View className="relative" onClick={editing ? handleChooseLogo : undefined}>
                <Image
                  src={orgInfo.logo}
                  className="w-16 h-16 rounded-lg"
                  mode="aspectFill"
                />
                {editing && (
                  <View className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                    <Camera size={20} color="white" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                {editing ? (
                  <Input
                    value={orgInfo.name}
                    onInput={(e) => setOrgInfo({ ...orgInfo, name: e.detail.value })}
                    placeholder="机构名称"
                  />
                ) : (
                  <Text className="text-lg font-semibold">{orgInfo.name}</Text>
                )}
                <View className="flex items-center gap-1 mt-1">
                  <MapPin size={12} color="#6B7280" />
                  <Text className="text-sm text-gray-500">{orgInfo.city}</Text>
                </View>
              </View>
            </View>

            {/* 简介 */}
            <View>
              <Text className="text-sm text-gray-500 mb-1">机构简介</Text>
              {editing ? (
                <View className="bg-gray-50 rounded-lg p-2">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    value={orgInfo.description}
                    onInput={(e) => setOrgInfo({ ...orgInfo, description: e.detail.value })}
                    placeholder="请输入机构简介"
                    maxlength={200}
                  />
                </View>
              ) : (
                <Text className="text-sm text-gray-700">{orgInfo.description}</Text>
              )}
            </View>

            {/* 辅导科目 */}
            <View>
              <Text className="text-sm text-gray-500 mb-2">辅导科目</Text>
              <View className="flex flex-wrap gap-2">
                {orgInfo.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 联系信息 */}
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>联系方式</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Phone size={16} color="#6B7280" />
                <Text className="text-sm text-gray-500">联系电话</Text>
              </View>
              {editing ? (
                <Input
                  className="w-48 text-right"
                  value={orgInfo.contactPhone}
                  onInput={(e) => setOrgInfo({ ...orgInfo, contactPhone: e.detail.value })}
                />
              ) : (
                <Text className="text-sm">{orgInfo.contactPhone}</Text>
              )}
            </View>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Mail size={16} color="#6B7280" />
                <Text className="text-sm text-gray-500">联系邮箱</Text>
              </View>
              {editing ? (
                <Input
                  className="w-48 text-right"
                  value={orgInfo.contactEmail}
                  onInput={(e) => setOrgInfo({ ...orgInfo, contactEmail: e.detail.value })}
                />
              ) : (
                <Text className="text-sm">{orgInfo.contactEmail}</Text>
              )}
            </View>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <MapPin size={16} color="#6B7280" />
                <Text className="text-sm text-gray-500">机构地址</Text>
              </View>
              {editing ? (
                <Input
                  className="w-48 text-right"
                  value={orgInfo.address}
                  onInput={(e) => setOrgInfo({ ...orgInfo, address: e.detail.value })}
                />
              ) : (
                <Text className="text-sm truncate max-w-48">{orgInfo.address}</Text>
              )}
            </View>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Clock size={16} color="#6B7280" />
                <Text className="text-sm text-gray-500">营业时间</Text>
              </View>
              {editing ? (
                <Input
                  className="w-48 text-right"
                  value={orgInfo.businessHours}
                  onInput={(e) => setOrgInfo({ ...orgInfo, businessHours: e.detail.value })}
                />
              ) : (
                <Text className="text-sm">{orgInfo.businessHours}</Text>
              )}
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 资质信息 */}
      <Card className="mx-4 mt-4">
        <CardHeader>
          <CardTitle>资质信息</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-3">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-gray-500">办学许可证</Text>
              <Text className="text-sm">{orgInfo.license}</Text>
            </View>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-gray-500">平台抽成比例</Text>
              <Text className="text-sm text-orange-500">{orgInfo.commissionRate}%</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 操作入口 */}
      <Card className="mx-4 mt-4">
        <CardContent className="p-0">
          <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/org-teachers/index' })}>
            <Text>教师管理</Text>
            <ChevronRight size={16} color="#9CA3AF" />
          </View>
          <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/org-courses/index' })}>
            <Text>课程管理</Text>
            <ChevronRight size={16} color="#9CA3AF" />
          </View>
          <View className="setting-item" onClick={() => Taro.navigateTo({ url: '/pages/org-invite/index' })}>
            <Text>邀请教师</Text>
            <ChevronRight size={16} color="#9CA3AF" />
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
