import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import {
  User, ChevronRight, Crown, FileText, Heart,
  Gift, Info, Phone, BookOpen, Building2
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
      const res = await Network.request({
        url: '/api/user/membership'
      })
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

  // 功能菜单项
  const menuItems = [
    { icon: FileText, title: '我的需求', subtitle: '已发布的需求', path: '/pages/orders/index', color: '#2563EB' },
    { icon: Heart, title: '收藏教师', subtitle: '已收藏的教师', path: '/pages/favorites/index', color: '#EF4444' },
    { icon: Crown, title: '会员中心', subtitle: membershipInfo && membershipInfo.is_member ? `剩余${membershipInfo.remaining_days}天` : '未开通', path: '/pages/membership/index', color: '#F59E0B', showBtn: !(membershipInfo && membershipInfo.is_member) },
    { icon: Gift, title: '邀请有礼', subtitle: '赚佣金', path: '/pages/distribution/index', color: '#8B5CF6' },
  ]

  // 底部菜单项
  const bottomItems = [
    { icon: Info, title: '关于我们', path: '/pages/settings/index', color: '#6B7280' },
    { icon: Phone, title: '联系客服', subtitle: '400-888-8888', path: '', color: '#10B981' },
  ]

  return (
    <View className="profile-page">
      <ScrollView scrollY className="profile-scroll">
        {/* 用户信息区域 - 蓝色背景 */}
        <View className="user-header">
          {isLoggedIn ? (
            <View className="user-info" onClick={() => goToPage('/pages/settings/index')}>
              <View className="user-avatar">
                {userInfo && userInfo.avatar ? (
                  <Image src={userInfo.avatar} className="avatar-img" mode="aspectFill" />
                ) : (
                  <View className="avatar-placeholder">
                    <User size={28} color="#fff" />
                  </View>
                )}
              </View>
              <View className="user-basic">
                <Text className="user-name">{(userInfo && userInfo.nickname) || '用户'}</Text>
                <Text className="user-phone">未绑定手机</Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
            </View>
          ) : (
            <View className="login-prompt" onClick={goToLogin}>
              <View className="user-avatar">
                <User size={28} color="#fff" />
              </View>
              <View className="user-basic">
                <Text className="user-name">点击登录</Text>
                <Text className="user-phone">登录享受更多服务</Text>
              </View>
              <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </View>

        {/* 家长会员特权卡片 */}
        {isLoggedIn && (
          <View className="member-privilege-card">
            <View className="privilege-left">
              <Crown size={20} color="#F59E0B" />
              <View className="privilege-text">
                <Text className="privilege-title">{roleConfig[currentRole] && roleConfig[currentRole].name}会员特权</Text>
                <Text className="privilege-desc">开通会员解锁更多权益</Text>
              </View>
            </View>
            <Button 
              size="sm" 
              className="privilege-btn"
              onClick={() => goToPage('/pages/membership/index')}
            >
              立即开通
            </Button>
          </View>
        )}

        {/* 功能菜单列表 */}
        <View className="menu-section">
          {menuItems.map((item, idx) => (
            <View
              key={idx}
              className="menu-item"
              onClick={() => goToPage(item.path)}
            >
              <View className="menu-left">
                <View className="menu-icon" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon size={20} color={item.color} />
                </View>
                <View className="menu-text-area">
                  <Text className="menu-title">{item.title}</Text>
                  {item.subtitle && <Text className="menu-subtitle">{item.subtitle}</Text>}
                </View>
              </View>
              <View className="menu-right">
                {item.showBtn && (
                  <View className="menu-open-btn">
                    <Text className="open-btn-text">开通</Text>
                  </View>
                )}
                <ChevronRight size={18} color="#9CA3AF" />
              </View>
            </View>
          ))}
        </View>

        {/* 底部菜单 */}
        <View className="menu-section">
          {bottomItems.map((item, idx) => (
            <View
              key={idx}
              className="menu-item"
              onClick={() => item.path && goToPage(item.path)}
            >
              <View className="menu-left">
                <View className="menu-icon" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon size={20} color={item.color} />
                </View>
                <View className="menu-text-area">
                  <Text className="menu-title">{item.title}</Text>
                  {item.subtitle && <Text className="menu-subtitle">{item.subtitle}</Text>}
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          ))}
        </View>

        {/* 退出登录 */}
        {isLoggedIn && (
          <View className="logout-section">
            <View className="logout-btn" onClick={handleLogout}>
              <Text className="logout-text">退出登录</Text>
            </View>
          </View>
        )}

        {/* 切换身份入口 */}
        <View className="switch-role-section">
          <View 
            className="switch-role-item"
            onClick={() => Taro.navigateTo({ url: '/pages/role-switch/index' })}
          >
            <Text className="switch-role-text">切换身份</Text>
            <Text className="current-role">当前：{roleConfig[currentRole] && roleConfig[currentRole].name}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProfilePage
