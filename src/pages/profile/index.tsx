import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import {
  User, Crown, FileText, Heart, Users, Info, MessageCircle, Settings
} from 'lucide-react-taro'
import './index.css'

// 会员等级名称映射
const VIP_LEVEL_NAMES: Record<number, string> = {
  0: '普通会员',
  1: '月度会员',
  2: '季度会员',
  3: '年度会员',
  4: '终身会员'
}

// 会员等级颜色
const VIP_LEVEL_COLORS: Record<number, string> = {
  0: '#9CA3AF',
  1: '#60A5FA',
  2: '#34D399',
  3: '#F59E0B',
  4: '#8B5CF6'
}

const ProfilePage: FC = () => {
  const { currentRole, userInfo } = useUserStore()

  useDidShow(() => {
    // 可以在这里加载用户信息
  })

  // 获取角色名称
  const getRoleName = () => {
    const roleNames: Record<number, string> = {
      0: '家长',
      1: '教师',
      2: '机构'
    }
    return roleNames[currentRole] || '家长'
  }

  // 跳转到编辑资料
  const goToEditProfile = () => {
    Taro.navigateTo({ url: '/pages/edit-profile/index' })
  }

  // 跳转到会员中心
  const goToMembership = () => {
    Taro.navigateTo({ url: '/pages/membership/index' })
  }

  // 跳转到需求管理
  const goToMyNeeds = () => {
    Taro.navigateTo({ url: '/pages/my-needs/index' })
  }

  // 跳转到收藏教师
  const goToFavorites = () => {
    Taro.navigateTo({ url: '/pages/favorites/index' })
  }

  // 跳转到邀请有礼
  const goToInvite = () => {
    Taro.navigateTo({ url: '/pages/invite/index' })
  }

  // 跳转到关于我们
  const goToAbout = () => {
    Taro.navigateTo({ url: '/pages/about/index' })
  }

  // 跳转到联系客服
  const goToCustomerService = () => {
    Taro.navigateTo({ url: '/pages/customer-service/index' })
  }

  // 跳转到角色切换
  const goToRoleSwitch = () => {
    Taro.navigateTo({ url: '/pages/role-switch/index' })
  }

  // 获取用户显示信息
  const getUserDisplay = () => {
    if (userInfo) {
      return {
        nickname: userInfo.nickname || '用户',
        phone: userInfo.phone || '未绑定手机',
        avatar: userInfo.avatar || '',
        vipLevel: 0, // 可以从 userInfo 扩展字段获取
        vipExpire: '',
        isVerified: false
      }
    }
    return {
      nickname: '未登录',
      phone: '点击登录享受更多服务',
      avatar: '',
      vipLevel: 0,
      vipExpire: '',
      isVerified: false
    }
  }

  const userDisplay = getUserDisplay()

  return (
    <View className="profile-page">
      {/* 顶部用户信息区域 */}
      <View className="user-header">
        <View className="user-info-card">
          <View className="user-avatar-area" onClick={goToEditProfile}>
            {userDisplay.avatar ? (
              <Image src={userDisplay.avatar} className="user-avatar" mode="aspectFill" />
            ) : (
              <View className="avatar-placeholder">
                <User size={40} color="#fff" />
              </View>
            )}
          </View>
          <View className="user-details">
            <View className="user-name-row">
              <Text className="user-name">{userDisplay.nickname}</Text>
              {userDisplay.isVerified && (
                <View className="verified-badge">
                  <Text className="verified-text">已认证</Text>
                </View>
              )}
            </View>
            <Text className="user-phone">{userDisplay.phone}</Text>
            <View className="user-vip">
              <Crown size={14} color={VIP_LEVEL_COLORS[userDisplay.vipLevel]} />
              <Text className="vip-text" style={{ color: VIP_LEVEL_COLORS[userDisplay.vipLevel] }}>
                {VIP_LEVEL_NAMES[userDisplay.vipLevel]}
              </Text>
              {userDisplay.vipLevel > 0 && userDisplay.vipExpire && (
                <Text className="vip-expire">有效期至 {userDisplay.vipExpire}</Text>
              )}
            </View>
          </View>
        </View>

        {/* 会员特权卡片 */}
        <View className="vip-card" onClick={goToMembership}>
          <View className="vip-left">
            <Crown size={24} color="#F59E0B" />
            <View className="vip-info">
              <Text className="vip-title">开通会员享特权</Text>
              <Text className="vip-desc">解锁完整信息、优先推荐</Text>
            </View>
          </View>
          <View className="vip-btn">
            <Text className="vip-btn-text">立即开通</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="profile-scroll">
        {/* 功能列表 */}
        <View className="menu-section">
          <View className="menu-item" onClick={goToMyNeeds}>
            <View className="menu-icon">
              <FileText size={22} color="#2563EB" />
            </View>
            <Text className="menu-text">我的需求</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>

          <View className="menu-item" onClick={goToFavorites}>
            <View className="menu-icon">
              <Heart size={22} color="#EF4444" />
            </View>
            <Text className="menu-text">收藏教师</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>

          <View className="menu-item" onClick={goToMembership}>
            <View className="menu-icon">
              <Crown size={22} color="#F59E0B" />
            </View>
            <Text className="menu-text">会员中心</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>

          <View className="menu-item" onClick={goToInvite}>
            <View className="menu-icon">
              <Users size={22} color="#8B5CF6" />
            </View>
            <Text className="menu-text">邀请有礼</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>

          <View className="menu-item" onClick={goToAbout}>
            <View className="menu-icon">
              <Info size={22} color="#6B7280" />
            </View>
            <Text className="menu-text">关于我们</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>

          <View className="menu-item last" onClick={goToCustomerService}>
            <View className="menu-icon">
              <MessageCircle size={22} color="#10B981" />
            </View>
            <Text className="menu-text">联系客服</Text>
            <Text className="menu-arrow">{'>'}</Text>
          </View>
        </View>

        {/* 切换身份入口 */}
        <View className="switch-role-section">
          <Button className="switch-role-btn" onClick={goToRoleSwitch}>
            <Settings size={20} color="#fff" />
            <Text className="switch-role-text">切换身份（当前：{getRoleName()}）</Text>
          </Button>
        </View>

        {/* 底部占位 */}
        <View style={{ height: '20px' }} />
      </ScrollView>
    </View>
  )
}

export default ProfilePage
