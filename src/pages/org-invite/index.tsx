import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, Copy, Check, Share2
} from 'lucide-react-taro'
import './index.css'

/**
 * 机构端 - 邀请牛师页面
 */
export default function OrgInvitePage() {
  const [inviteLink] = useState('https://edu.example.com/invite/org123')
  const [inviteCode] = useState('ORG123XYZ')
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    Taro.setClipboardData({
      data: inviteLink,
      success: () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        Taro.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  }

  const handleCopyCode = () => {
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  }

  const handleShare = () => {
    // 小程序分享
    Taro.showShareMenu({
      withShareTicket: true,
    })
  }

  const handleSendSms = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    try {
      // await Network.request({
      //   url: '/api/org/invite/sms',
      //   method: 'POST',
      //   data: { phone }
      // })
      Taro.showToast({ title: '邀请短信已发送', icon: 'success' })
      setPhone('')
    } catch (error) {
      Taro.showToast({ title: '发送失败', icon: 'none' })
    }
  }

  return (
    <View className="org-invite-page">
      {/* 邀请方式卡片 */}
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} color="#7C3AED" />
            <Text>邀请牛师入驻</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-6">
            {/* 方式1: 分享链接 */}
            <View>
              <View className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-500">方式一</Badge>
                <Text className="font-semibold">分享邀请链接</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <Text className="text-sm text-gray-600 flex-1 truncate">{inviteLink}</Text>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <Check size={14} color="#10B981" />
                  ) : (
                    <Copy size={14} color="#2563EB" />
                  )}
                </Button>
              </View>
              <Button className="w-full mt-3" onClick={handleShare}>
                <Share2 size={16} color="white" />
                <Text className="text-white ml-1">分享给好友</Text>
              </Button>
            </View>

            {/* 方式2: 邀请码 */}
            <View>
              <View className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">方式二</Badge>
                <Text className="font-semibold">邀请码入驻</Text>
              </View>
              <View className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-center">
                <Text className="text-white text-sm">机构专属邀请码</Text>
                <Text className="text-white text-3xl font-bold mt-2 tracking-wider">{inviteCode}</Text>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 bg-white border-white"
                  onClick={handleCopyCode}
                >
                  <Copy size={14} color="#7C3AED" />
                  <Text className="text-purple-500 ml-1">复制邀请码</Text>
                </Button>
              </View>
              <Text className="text-xs text-gray-500 mt-2 text-center">
                牛师注册时填写此邀请码即可加入您的机构
              </Text>
            </View>

            {/* 方式3: 短信邀请 */}
            <View>
              <View className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500">方式三</Badge>
                <Text className="font-semibold">短信邀请</Text>
              </View>
              <View className="flex items-center gap-2">
                <View className="flex-1">
                  <Input
                    type="number"
                    placeholder="输入牛师手机号"
                    value={phone}
                    onInput={(e) => setPhone(e.detail.value)}
                    maxlength={11}
                  />
                </View>
                <Button size="sm" onClick={handleSendSms}>
                  <Text className="text-white">发送</Text>
                </Button>
              </View>
              <Text className="text-xs text-gray-500 mt-2">
                系统将发送邀请短信，牛师点击链接即可注册
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 邀请说明 */}
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>入驻流程</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-4">
            <View className="flex items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Text className="text-white text-xs">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold">牛师接收邀请</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  通过分享链接、邀请码或短信邀请牛师
                </Text>
              </View>
            </View>
            <View className="flex items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Text className="text-white text-xs">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold">牛师注册认证</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  牛师完成注册并提交资质认证材料
                </Text>
              </View>
            </View>
            <View className="flex items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Text className="text-white text-xs">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold">机构审核</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  您在牛师管理中审核牛师入驻申请
                </Text>
              </View>
            </View>
            <View className="flex items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold">入驻成功</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  牛师正式成为机构成员，可开始接单
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 邀请记录 */}
      <Card className="m-4">
        <CardHeader>
          <CardTitle>最近邀请</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-3">
            <View className="flex items-center justify-between py-2 border-b border-gray-100">
              <View className="flex items-center gap-2">
                <Text className="text-sm">138****8888</Text>
                <Badge className="bg-green-100 text-green-600 text-xs">已注册</Badge>
              </View>
              <Text className="text-xs text-gray-400">2小时前</Text>
            </View>
            <View className="flex items-center justify-between py-2 border-b border-gray-100">
              <View className="flex items-center gap-2">
                <Text className="text-sm">139****6666</Text>
                <Badge className="bg-yellow-100 text-yellow-600 text-xs">待审核</Badge>
              </View>
              <Text className="text-xs text-gray-400">昨天</Text>
            </View>
            <View className="flex items-center justify-between py-2">
              <View className="flex items-center gap-2">
                <Text className="text-sm">137****5555</Text>
                <Badge className="bg-gray-100 text-gray-600 text-xs">待注册</Badge>
              </View>
              <Text className="text-xs text-gray-400">3天前</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}
