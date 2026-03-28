import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, Bell, Lock, Smartphone, Eye, EyeOff,
  ChevronRight, LogOut, Trash2, FileText
} from 'lucide-react-taro'

interface SettingItem {
  icon: typeof Shield
  title: string
  desc?: string
  action?: 'switch' | 'arrow' | 'text'
  value?: string | boolean
  onClick?: () => void
}

export default function SettingsPage() {
  const [userInfo] = useState({
    nickname: '用户昵称',
    phone: '138****8888',
    wechat: '未绑定'
  })
  const [notifications, setNotifications] = useState({
    order: true,
    message: true,
    system: false,
    marketing: false
  })
  const [privacy, setPrivacy] = useState({
    showPhone: false,
    showDistance: true
  })

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }
    })
  }

  const handleDeleteAccount = () => {
    Taro.showModal({
      title: '注销账号',
      content: '注销后所有数据将被清空且无法恢复，确定注销吗？',
      confirmText: '确认注销',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已提交注销申请', icon: 'success' })
          setTimeout(() => {
            Taro.clearStorageSync()
            Taro.redirectTo({ url: '/pages/login/index' })
          }, 1500)
        }
      }
    })
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
    Taro.showToast({ title: notifications[key] ? '已关闭' : '已开启', icon: 'success' })
  }

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy({ ...privacy, [key]: !privacy[key] })
  }

  const accountSettings: SettingItem[] = [
    { 
      icon: Smartphone, 
      title: '手机号', 
      desc: userInfo.phone,
      action: 'arrow',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    { 
      icon: Lock, 
      title: '修改密码', 
      action: 'arrow',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
  ]

  const notificationSettings: SettingItem[] = [
    { 
      icon: Bell, 
      title: '订单通知', 
      desc: '订单状态变更提醒',
      action: 'switch',
      value: notifications.order,
      onClick: () => toggleNotification('order')
    },
    { 
      icon: Bell, 
      title: '消息通知', 
      desc: '新消息提醒',
      action: 'switch',
      value: notifications.message,
      onClick: () => toggleNotification('message')
    },
    { 
      icon: Bell, 
      title: '系统通知', 
      desc: '系统公告和活动通知',
      action: 'switch',
      value: notifications.system,
      onClick: () => toggleNotification('system')
    },
  ]

  const privacySettings: SettingItem[] = [
    { 
      icon: Eye, 
      title: '公开手机号', 
      desc: '匹配成功后对方可见',
      action: 'switch',
      value: privacy.showPhone,
      onClick: () => togglePrivacy('showPhone')
    },
    { 
      icon: EyeOff, 
      title: '显示距离', 
      desc: '向对方展示距离',
      action: 'switch',
      value: privacy.showDistance,
      onClick: () => togglePrivacy('showDistance')
    },
  ]

  const otherSettings: SettingItem[] = [
    { 
      icon: FileText, 
      title: '用户协议', 
      action: 'arrow',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    { 
      icon: FileText, 
      title: '隐私政策', 
      action: 'arrow',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    { 
      icon: FileText, 
      title: '帮助与反馈', 
      action: 'arrow',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
  ]

  const renderSettingItem = (item: SettingItem, index: number, total: number) => (
    <View
      key={item.title}
      className={`flex items-center justify-between px-4 py-4 ${
        index !== total - 1 ? 'border-b border-gray-100' : ''
      }`}
      onClick={item.action !== 'switch' ? item.onClick : undefined}
    >
      <View className="flex items-center">
        <item.icon size={20} color="#6B7280" />
        <View className="ml-3">
          <Text className="text-gray-800">{item.title}</Text>
          {item.desc && (
            <Text className="text-gray-400 text-xs mt-1">{item.desc}</Text>
          )}
        </View>
      </View>
      {item.action === 'arrow' && <ChevronRight size={16} color="#9CA3AF" />}
      {item.action === 'text' && <Text className="text-gray-500 text-sm">{item.value}</Text>}
      {item.action === 'switch' && (
        <View 
          className={`w-12 h-6 rounded-full ${item.value ? 'bg-blue-500' : 'bg-gray-300'}`}
          onClick={item.onClick}
        >
          <View 
            className={`w-5 h-5 rounded-full bg-white mt-1 transition-all ${
              item.value ? 'ml-6' : 'ml-1'
            }`}
          />
        </View>
      )}
    </View>
  )

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      <ScrollView scrollY className="p-4">
        {/* 账号安全 */}
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-2 px-2">账号安全</Text>
          <Card>
            <CardContent className="p-0">
              {accountSettings.map((item, idx) => 
                renderSettingItem(item, idx, accountSettings.length)
              )}
            </CardContent>
          </Card>
        </View>

        {/* 通知设置 */}
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-2 px-2">通知设置</Text>
          <Card>
            <CardContent className="p-0">
              {notificationSettings.map((item, idx) => 
                renderSettingItem(item, idx, notificationSettings.length)
              )}
            </CardContent>
          </Card>
        </View>

        {/* 隐私设置 */}
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-2 px-2">隐私设置</Text>
          <Card>
            <CardContent className="p-0">
              {privacySettings.map((item, idx) => 
                renderSettingItem(item, idx, privacySettings.length)
              )}
            </CardContent>
          </Card>
        </View>

        {/* 其他 */}
        <View className="mb-4">
          <Text className="text-gray-500 text-sm mb-2 px-2">其他</Text>
          <Card>
            <CardContent className="p-0">
              {otherSettings.map((item, idx) => 
                renderSettingItem(item, idx, otherSettings.length)
              )}
            </CardContent>
          </Card>
        </View>

        {/* 退出登录 */}
        <Button 
          variant="outline" 
          className="w-full mb-4 border-red-500"
          onClick={handleLogout}
        >
          <LogOut size={16} color="#EF4444" className="mr-2" />
          <Text className="text-red-500">退出登录</Text>
        </Button>

        {/* 注销账号 */}
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={handleDeleteAccount}
        >
          <Trash2 size={16} color="#9CA3AF" className="mr-2" />
          <Text className="text-gray-400 text-sm">注销账号</Text>
        </Button>
      </ScrollView>
    </View>
  )
}
