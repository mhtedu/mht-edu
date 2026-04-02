import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import {
  User, Settings, Star, CreditCard,
  ChevronRight, LogOut, Award, FileText, Bell, Info, Calendar
} from 'lucide-react-taro'

interface MembershipInfo {
  is_member: boolean
  expire_at: string
  remaining_days: number
}

const ProfilePage: FC = () => {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null)

  const { isLoggedIn, userInfo, logout } = useUserStore()

  useLoad(() => {
    console.log('Profile page loaded.')
  })

  useDidShow(() => {
    if (isLoggedIn) {
      loadMembershipInfo()
    }
  })

  const loadMembershipInfo = async () => {
    try {
      console.log('加载会员信息请求:', { url: '/api/user/membership' })
      const res = await Network.request({
        url: '/api/user/membership'
      })
      console.log('加载会员信息响应:', res.data)
      if (res.data) {
        setMembershipInfo(res.data)
      }
    } catch (error) {
      console.error('加载会员信息失败:', error)
    }
  }

  const goToLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  const goToPage = (page: string) => {
    if (!isLoggedIn) {
      goToLogin()
      return
    }
    Taro.navigateTo({ url: page })
  }

  const goToMember = () => Taro.navigateTo({ url: '/pages/member/index' })

  const menuItems = [
    { icon: Star, title: '我的收藏', path: '/pages/profile/favorites', color: '#F59E0B' },
    { icon: FileText, title: '我的需求', path: '/pages/profile/demands', color: '#10B981' },
    { icon: Calendar, title: '我的活动', path: '/pages/my-activities/index', color: '#EC4899' },
    { icon: CreditCard, title: '我的订单', path: '/pages/profile/orders', color: '#2563EB' },
  ]

  const settingItems = [
    { icon: Award, title: '牛师认证', path: '/pages/profile/teacher-auth', color: '#10B981' },
    { icon: Settings, title: '账号设置', path: '/pages/profile/settings', color: '#6B7280' },
    { icon: Bell, title: '消息设置', path: '/pages/profile/notification', color: '#F59E0B' },
    { icon: Info, title: '帮助中心', path: '/pages/profile/help', color: '#3B82F6' },
  ]

  return (
    <View className="min-h-screen bg-gray-100">
      <ScrollView scrollY className="h-screen box-border">
        {/* 用户信息卡片 */}
        <View className="bg-gradient-to-b from-blue-600 to-blue-500 pt-8 px-4 pb-5">
          {isLoggedIn ? (
            <View className="flex flex-row items-center" onClick={() => goToPage('/pages/profile/edit')}>
              <View className="w-16 h-16 rounded-full bg-white overflow-hidden flex items-center justify-center">
                {userInfo?.avatar ? (
                  <Image src={userInfo.avatar} className="w-16 h-16" mode="aspectFill" />
                ) : (
                  <View className="w-16 h-16 bg-blue-100 flex items-center justify-center">
                    <User size={24} color="#2563EB" />
                  </View>
                )}
              </View>
              <View className="flex-1 ml-4">
                <Text className="block text-lg font-semibold text-white">{userInfo?.nickname || '用户'}</Text>
                <View className="mt-2">
                  <Badge variant="outline">
                    {userInfo?.role === 'parent' ? '家长' : userInfo?.role === 'teacher' ? '牛师' : userInfo?.role === 'org' ? '机构' : '用户'}
                  </Badge>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          ) : (
            <View className="flex flex-row items-center" onClick={goToLogin}>
              <View className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <User size={24} color="#9CA3AF" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="block text-lg font-semibold text-white">点击登录</Text>
                <Text className="block text-sm text-white opacity-80 mt-1">登录享受更多服务</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* 会员卡片 */}
        {isLoggedIn && (
          <Card className="-mt-5 mx-3 mb-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200">
            <CardContent className="flex flex-row items-center justify-between p-4">
              <View className="flex flex-row items-center">
                <View className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Award size={24} color="#F59E0B" />
                </View>
                <View className="ml-3">
                  {membershipInfo?.is_member ? (
                    <>
                      <Text className="block text-base font-semibold text-amber-900">会员有效</Text>
                      <Text className="block text-xs text-amber-700 mt-1">剩余{membershipInfo.remaining_days}天</Text>
                    </>
                  ) : (
                    <>
                      <Text className="block text-base font-semibold text-amber-900">开通会员</Text>
                      <Text className="block text-xs text-amber-700 mt-1">解锁更多权益</Text>
                    </>
                  )}
                </View>
              </View>
              <Button size="sm" className="bg-amber-500 text-white" onClick={goToMember}>
                {membershipInfo?.is_member ? '续费' : '立即开通'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 功能菜单 */}
        <Card className="mx-3 mb-3 rounded-xl">
          <CardContent className="p-4">
            <View className="flex flex-row justify-around">
              {menuItems.map((item, idx) => (
                <View
                  key={idx}
                  className="flex flex-col items-center"
                  onClick={() => goToPage(item.path)}
                >
                  <View 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon size={22} color={item.color} />
                  </View>
                  <Text className="block text-sm text-gray-700">{item.title}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 设置菜单 */}
        <Card className="mx-3 mb-3 rounded-xl">
          <CardContent className="py-2">
            {settingItems.map((item, idx) => (
              <View
                key={idx}
                className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-100 last:border-b-0"
                onClick={() => goToPage(item.path)}
              >
                <View className="flex flex-row items-center">
                  <item.icon size={20} color={item.color} />
                  <Text className="block text-base text-gray-700 ml-3">{item.title}</Text>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 退出登录 */}
        {isLoggedIn && (
          <View className="px-4 py-5">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut size={18} color="#EF4444" />
              <Text className="text-red-500 ml-2">退出登录</Text>
            </Button>
          </View>
        )}

        <View className="h-5" />
      </ScrollView>
    </View>
  )
}

export default ProfilePage
