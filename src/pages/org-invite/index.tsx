import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  UserPlus, Copy, Check, Share2, Crown, Gift,
  Users, Star, Shield, Zap
} from 'lucide-react-taro'
import './index.css'

/**
 * 机构端 - 邀请牛师页面（增强版 - 突出会员共享价值）
 */
export default function OrgInvitePage() {
  const [inviteLink] = useState('https://edu.example.com/invite/org123')
  const [inviteCode] = useState('ORG123XYZ')
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false)

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
      Taro.showToast({ title: '邀请短信已发送', icon: 'success' })
      setPhone('')
    } catch (error) {
      Taro.showToast({ title: '发送失败', icon: 'none' })
    }
  }

  // 教师加入机构的好处
  const teacherBenefits = [
    {
      icon: Crown,
      title: '会员资格免费继承',
      desc: '加入机构即享会员权益，无需单独购买',
      highlight: true
    },
    {
      icon: Users,
      title: '稳定生源',
      desc: '机构统一派单，告别抢单焦虑',
      highlight: false
    },
    {
      icon: Shield,
      title: '品牌背书',
      desc: '机构认证加持，家长更信任',
      highlight: false
    },
    {
      icon: Zap,
      title: '专属培训',
      desc: '教学技能培训，提升竞争力',
      highlight: false
    },
    {
      icon: Gift,
      title: '营销支持',
      desc: '优惠券、活动推广助力招生',
      highlight: false
    },
    {
      icon: Star,
      title: '数据洞察',
      desc: '学员管理工具，精准服务',
      highlight: false
    }
  ]

  return (
    <View className="org-invite-page">
      {/* 会员共享价值卡片 */}
      <Card className="m-4 bg-gradient-to-r from-purple-500 to-blue-500">
        <CardContent className="p-4">
          <View className="flex items-center gap-2 mb-3">
            <Crown size={24} color="#FFD700" />
            <Text className="text-white font-bold text-lg">邀请牛师 = 赠送会员</Text>
          </View>
          <Text className="text-white text-opacity-90 text-sm">
            您的机构已开通专业版会员，邀请的教师加入后自动获得会员资格，无需单独购买！
          </Text>
          <View className="flex items-center justify-between mt-3 pt-3 border-t border-white border-opacity-20">
            <View>
              <Text className="text-white text-opacity-80 text-xs">剩余名额</Text>
              <Text className="text-white text-xl font-bold">12/20</Text>
            </View>
            <Button 
              size="sm" 
              className="bg-white"
              onClick={() => setShowBenefitsDialog(true)}
            >
              <Text className="text-purple-600">查看教师权益</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

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
                牛师注册时填写此邀请码即可加入您的机构，自动获得会员资格
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
                系统将发送邀请短信，牛师点击链接即可注册并自动获得会员资格
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 入驻流程 */}
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
                <Text className="font-semibold flex items-center gap-1">
                  自动获得会员资格
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <Crown size={10} color="#A16207" />
                    <Text className="text-xs ml-1">重点</Text>
                  </Badge>
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  审核通过后自动继承机构会员，享受全部会员权益
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
                  牛师正式成为机构成员，可开始接单赚钱
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 教师收益说明 */}
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={20} color="#F59E0B" />
            <Text>教师加入您机构的收益</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex flex-col gap-3">
            {teacherBenefits.map((benefit, idx) => (
              <View 
                key={idx} 
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  benefit.highlight ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                }`}
              >
                <View 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    benefit.highlight ? 'bg-purple-100' : 'bg-gray-100'
                  }`}
                >
                  <benefit.icon size={20} color={benefit.highlight ? '#7C3AED' : '#6B7280'} />
                </View>
                <View className="flex-1">
                  <View className="flex items-center gap-2">
                    <Text className={`font-semibold ${benefit.highlight ? 'text-purple-700' : ''}`}>
                      {benefit.title}
                    </Text>
                    {benefit.highlight && (
                      <Badge className="bg-purple-500">
                        <Text className="text-white text-xs">核心</Text>
                      </Badge>
                    )}
                  </View>
                  <Text className="text-sm text-gray-500 mt-1">{benefit.desc}</Text>
                </View>
              </View>
            ))}
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
                <Badge className="bg-purple-100 text-purple-600 text-xs">
                  <Crown size={10} color="#7C3AED" />
                  <Text className="ml-1">会员</Text>
                </Badge>
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

      {/* 教师权益弹窗 */}
      <Dialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog}>
        <DialogContent className="w-80 max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown size={20} color="#7C3AED" />
              <Text>教师会员权益</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="mt-4">
            <Text className="text-sm text-gray-500 mb-4">
              加入您机构的教师将自动获得以下会员权益：
            </Text>
            <View className="space-y-3">
              <View className="flex items-center gap-2">
                <Check size={16} color="#10B981" />
                <Text className="text-sm">无限制抢单，不再受次数限制</Text>
              </View>
              <View className="flex items-center gap-2">
                <Check size={16} color="#10B981" />
                <Text className="text-sm">查看家长联系方式，直接沟通</Text>
              </View>
              <View className="flex items-center gap-2">
                <Check size={16} color="#10B981" />
                <Text className="text-sm">专属会员标识，提升信任度</Text>
              </View>
              <View className="flex items-center gap-2">
                <Check size={16} color="#10B981" />
                <Text className="text-sm">优先展示，获得更多机会</Text>
              </View>
              <View className="flex items-center gap-2">
                <Check size={16} color="#10B981" />
                <Text className="text-sm">数据统计，了解经营情况</Text>
              </View>
            </View>
            <View className="mt-4 p-3 bg-purple-50 rounded-lg">
              <Text className="text-sm text-purple-700">
                💡 教师无需支付任何费用，会员资格由您的机构统一提供
              </Text>
            </View>
            <Button className="w-full mt-4" onClick={() => setShowBenefitsDialog(false)}>
              <Text className="text-white">我知道了</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}
