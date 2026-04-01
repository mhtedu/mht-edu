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
  User, Settings, Star, CreditCard, Users,
  ChevronRight, LogOut, Award, FileText, Bell, Info, RefreshCw, BookOpen, Building2
} from 'lucide-react-taro'
import './index.css'

interface MembershipInfo {
  is_member: boolean
  expire_at: string
  remaining_days: number
}

// 角色配置
const roleConfig: Record<number, { name: string; icon: typeof User; color: string }> = {
  0: { name: '家长', icon: User, color: '#2563EB' },
  1: { name: '教师', icon: BookOpen, color: '#22C55E' },
  2: { name: '机构', icon: Building2, color: '#9333EA' },
}

const ProfilePage: FC = () => {
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null)
  const [currentRole, setCurrentRole] = useState(0)

  const { isLoggedIn, userInfo, logout } = useUserStore()

  useLoad(() => {
    console.log('Profile page loaded.')
  })

  useDidShow(() => {
    // 读取当前角色
    const savedRole = Taro.getStorageSync('userRole') || 0
    setCurrentRole(typeof savedRole === 'string' ? parseInt(savedRole, 10) : savedRole)
    
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

  const menuItems = [
    { icon: Star, title: '我的收藏', path: '/pages/profile/favorites', color: '#F59E0B' },
    { icon: FileText, title: '我的需求', path: '/pages/profile/demands', color: '#10B981' },
    { icon: CreditCard, title: '我的订单', path: '/pages/profile/orders', color: '#2563EB' },
    { icon: Users, title: '我的邀请', path: '/pages/profile/invite', color: '#8B5CF6' },
  ]

  const settingItems = [
    { icon: Award, title: '教师认证', path: '/pages/profile/teacher-auth', color: '#10B981' },
    { icon: Settings, title: '账号设置', path: '/pages/profile/settings', color: '#6B7280' },
    { icon: Bell, title: '消息设置', path: '/pages/profile/notification', color: '#F59E0B' },
    { icon: Info, title: '帮助中心', path: '/pages/profile/help', color: '#3B82F6' },
  ]

  return (
    <View className="profile-page">
      <ScrollView scrollY className="profile-scroll">
        {/* 用户信息卡片 */}
        <View className="user-header">
          {isLoggedIn ? (
            <View className="user-info" onClick={() => goToPage('/pages/profile/edit')}>
              <View className="user-avatar">
                {userInfo && userInfo.avatar ? (
                  <Image src={userInfo.avatar} className="avatar-img" mode="aspectFill" />
                ) : (
                  <View className="avatar-placeholder">
                    <User size={24} color="#2563EB" />
                  </View>
                )}
              </View>
              <View className="user-basic">
                <Text className="user-name">{(userInfo && userInfo.nickname) || '用户'}</Text>
                <View className="user-role">
                  <Badge variant="outline">
                    {(roleConfig[currentRole] && roleConfig[currentRole].name) || '用户'}
                  </Badge>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          ) : (
            <View className="login-prompt" onClick={goToLogin}>
              <View className="user-avatar">
                <User size={24} color="#9CA3AF" />
              </View>
              <View className="user-basic">
                <Text className="login-text">点击登录</Text>
                <Text className="login-hint">登录享受更多服务</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* 角色切换入口 */}
        {isLoggedIn && (
          <Card className="role-switch-card" style={{ margin: '12px 16px' }}>
            <CardContent style={{ padding: '16px' }}>
              <View 
                className="role-switch-entry" 
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => Taro.navigateTo({ url: '/pages/role-switch/index' })}
              >
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                  <View 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${(roleConfig[currentRole] && roleConfig[currentRole].color) || '#2563EB'}20, ${(roleConfig[currentRole] && roleConfig[currentRole].color) || '#2563EB'}40)`
                    }}
                  >
                    {(() => {
                      const RoleIcon = (roleConfig[currentRole] && roleConfig[currentRole].icon) || User
                      return <RoleIcon size={22} color={(roleConfig[currentRole] && roleConfig[currentRole].color) || '#2563EB'} />
                    })()}
                  </View>
                  <View>
                    <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                      当前身份：{(roleConfig[currentRole] && roleConfig[currentRole].name) || '用户'}
                    </Text>
                    <Text style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                      点击切换身份，享受不同权益
                    </Text>
                  </View>
                </View>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={16} color="#2563EB" />
                  <Text style={{ fontSize: '14px', color: '#2563EB' }}>切换</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 会员卡片 */}
        {isLoggedIn && (
          <Card className="member-card">
            <CardContent className="member-content">
              <View className="member-info">
                <View className="member-icon">
                  <Award size={24} color="#F59E0B" />
                </View>
                <View className="member-text">
                  {(membershipInfo && membershipInfo.is_member) ? (
                    <>
                      <Text className="member-title">会员有效</Text>
                      <Text className="member-desc">剩余{membershipInfo.remaining_days}天</Text>
                    </>
                  ) : (
                    <>
                      <Text className="member-title">开通会员</Text>
                      <Text className="member-desc">解锁更多权益</Text>
                    </>
                  )}
                </View>
              </View>
              <Button size="sm" className="member-btn">
                {(membershipInfo && membershipInfo.is_member) ? '续费' : '立即开通'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 功能菜单 */}
        <Card className="menu-card">
          <CardContent className="menu-content">
            <View className="menu-grid">
              {menuItems.map((item, idx) => (
                <View
                  key={idx}
                  className="menu-item"
                  onClick={() => goToPage(item.path)}
                >
                  <View className="menu-icon" style={{ background: `${item.color}20` }}>
                    <item.icon size={22} color={item.color} />
                  </View>
                  <Text className="menu-text">{item.title}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 设置菜单 */}
        <Card className="setting-card">
          <CardContent className="setting-content">
            {settingItems.map((item, idx) => (
              <View
                key={idx}
                className="setting-item"
                onClick={() => goToPage(item.path)}
              >
                <View className="setting-left">
                  <item.icon size={20} color={item.color} />
                  <Text className="setting-text">{item.title}</Text>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </View>
            ))}
          </CardContent>
        </Card>

        {/* 退出登录 */}
        {isLoggedIn && (
          <View className="logout-section">
            <Button variant="outline" className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} color="#EF4444" />
              <Text className="logout-text">退出登录</Text>
            </Button>
          </View>
        )}

        <View className="bottom-space" />
      </ScrollView>
    </View>
  )
}

export default ProfilePage
