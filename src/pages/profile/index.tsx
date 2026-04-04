import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useMemo } from 'react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUserStore, CurrentView } from '@/stores/user'
import { Network } from '@/network'
import {
  User, Settings, Star, CreditCard,
  ChevronRight, LogOut, Award, Bell, Info, Calendar,
  Users, Briefcase, Wallet, ClipboardList, Building2, BookOpen,
  GraduationCap, Plus, Store
} from 'lucide-react-taro'

interface MembershipInfo {
  is_member: boolean
  expire_at: string
  remaining_days: number
}

// 家长端菜单
const parentMenuItems = [
  { icon: User, title: '个人资料', path: '/pages/profile-edit/index', color: '#2563EB' },
  { icon: Star, title: '我的收藏', path: '/pages/favorites/index', color: '#F59E0B' },
  { icon: CreditCard, title: '我的订单', path: '/pages/orders/index', color: '#10B981' },
  { icon: Calendar, title: '我的活动', path: '/pages/my-activities/index', color: '#EC4899' },
]

const parentSettingItems = [
  { icon: Settings, title: '账号设置', path: '/pages/settings/index', color: '#6B7280' },
  { icon: Bell, title: '消息设置', path: '/pages/settings/index', color: '#F59E0B' },
  { icon: Info, title: '帮助中心', path: '/pages/settings/index', color: '#3B82F6' },
]

// 牛师端菜单
const teacherMenuItems = [
  { icon: Users, title: '学员管理', path: '/pages/students/index', color: '#10B981' },
  { icon: GraduationCap, title: '牛师班管理', path: '/pages/elite-class-manage/index', color: '#8B5CF6' },
  { icon: Wallet, title: '收益中心', path: '/pages/earnings/index', color: '#F59E0B' },
  { icon: Briefcase, title: '牛师工作台', path: '/pages/teacher-workbench/index', color: '#2563EB' },
]

const teacherSettingItems = [
  { icon: ClipboardList, title: '抢单记录', path: '/pages/orders/index', color: '#EC4899' },
  { icon: Award, title: '认证信息', path: '/pages/teacher-auth/index', color: '#10B981' },
  { icon: Settings, title: '账号设置', path: '/pages/settings/index', color: '#6B7280' },
  { icon: Bell, title: '消息设置', path: '/pages/settings/index', color: '#F59E0B' },
  { icon: Info, title: '帮助中心', path: '/pages/settings/index', color: '#3B82F6' },
]

// 机构端菜单
const orgMenuItems = [
  { icon: Building2, title: '机构管理', path: '/pages/org-dashboard/index', color: '#8B5CF6' },
  { icon: BookOpen, title: '课程管理', path: '/pages/course-manage/index', color: '#10B981' },
  { icon: Users, title: '牛师管理', path: '/pages/org-teachers/index', color: '#F59E0B' },
  { icon: Store, title: '活动管理', path: '/pages/activity-manage/index', color: '#EC4899' },
]

const orgSettingItems = [
  { icon: ClipboardList, title: '订单管理', path: '/pages/orders/index', color: '#2563EB' },
  { icon: Plus, title: '创建活动', path: '/pages/create-activity/index', color: '#10B981' },
  { icon: GraduationCap, title: '创建牛师班', path: '/pages/create-elite-class/index', color: '#8B5CF6' },
  { icon: Settings, title: '机构设置', path: '/pages/org-settings/index', color: '#6B7280' },
  { icon: Bell, title: '消息设置', path: '/pages/settings/index', color: '#F59E0B' },
  { icon: Info, title: '帮助中心', path: '/pages/settings/index', color: '#3B82F6' },
]

const ProfilePage: FC = () => {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null)

  const { isLoggedIn, userInfo, logout, currentView } = useUserStore()

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
      // 根据角色类型获取会员信息（不同角色会员不互通）
      const roleType = currentView === 'teacher' ? 'teacher' : currentView === 'org' ? 'org' : 'parent'
      console.log('加载会员信息请求:', { url: `/api/user/membership?role_type=${roleType}` })
      const res = await Network.request({
        url: `/api/user/membership?role_type=${roleType}`
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

  const goToRoleSwitch = () => Taro.navigateTo({ url: '/pages/role-switch/index' })

  // 根据当前视角获取菜单项
  const menuItems = useMemo(() => {
    switch (currentView) {
      case 'teacher':
        return teacherMenuItems
      case 'org':
        return orgMenuItems
      default:
        return parentMenuItems
    }
  }, [currentView])

  const settingItems = useMemo(() => {
    switch (currentView) {
      case 'teacher':
        return teacherSettingItems
      case 'org':
        return orgSettingItems
      default:
        return parentSettingItems
    }
  }, [currentView])

  // 获取视角名称（用于显示）
  const getViewName = (view?: CurrentView) => {
    switch (view) {
      case 'parent':
        return '家长'
      case 'teacher':
        return '牛师'
      case 'org':
        return '机构'
      default:
        return '用户'
    }
  }

  return (
    <View className="min-h-screen bg-gray-100">
      <ScrollView scrollY className="h-screen box-border">
        {/* 用户信息卡片 */}
        <View className="bg-gradient-to-b from-blue-600 to-blue-500 pt-8 px-4 pb-5">
          {isLoggedIn ? (
            <View className="flex flex-row items-center" onClick={() => goToPage('/pages/settings/index')}>
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
                <View className="mt-2 flex flex-row items-center gap-2">
                  <Badge variant="outline">
                    {getViewName(currentView)}
                  </Badge>
                  <Text className="text-xs text-white opacity-80" onClick={(e) => { e.stopPropagation(); goToRoleSwitch(); }}>
                    切换角色 ›
                  </Text>
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

        {/* 会员卡片 - 家长端和牛师端显示 */}
        {isLoggedIn && currentView !== 'org' && (
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
            <View className="flex flex-row justify-around flex-wrap">
              {menuItems.map((item, idx) => (
                <View
                  key={idx}
                  className="flex flex-col items-center w-1/4 mb-4"
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
