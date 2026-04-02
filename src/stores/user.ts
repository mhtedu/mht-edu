/**
 * 用户状态管理
 * 支持多端口（小程序/公众号H5/纯H5）
 * 每个角色会员独立存储
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// 端口类型
export type PlatformType = 'miniprogram' | 'wechat_h5' | 'h5'

// 用户信息类型
export interface UserInfo {
  id: number
  openid?: string
  nickname?: string
  avatar?: string
  mobile?: string
  role: number // 0-家长 1-牛师 2-机构
  membershipType?: number
  membershipExpireAt?: string
  cityName?: string
  latitude?: number
  longitude?: number
  platform?: PlatformType // 注册时的端口
  inviterCode?: string // 邀请码
}

// 当前视角类型
export type CurrentView = 'parent' | 'teacher' | 'org'

// 角色会员状态（每个角色独立）
export interface RoleMembership {
  role: number
  isMember: boolean
  expireAt: string | null
  membershipType: number
}

// 用户状态接口
interface UserState {
  // 状态
  isLoggedIn: boolean
  token: string | null
  userInfo: UserInfo | null
  currentView: CurrentView
  location: { address: string; latitude: number; longitude: number } | null
  platform: PlatformType // 当前使用的端口
  roleMemberships: RoleMembership[] // 每个角色的会员状态

  // 操作方法
  setToken: (token: string) => void
  setUserInfo: (info: UserInfo) => void
  setCurrentView: (view: CurrentView) => void
  setLocation: (loc: { address: string; latitude: number; longitude: number } | null) => void
  setPlatform: (platform: PlatformType) => void
  setRoleMembership: (role: number, membership: Partial<RoleMembership>) => void
  logout: () => void
  
  // 辅助方法
  getUserId: () => number | null
  getRole: () => number
  isMember: (role?: number) => boolean
  getRoleMembership: (role: number) => RoleMembership | null
  canSwitchRole: (targetRole: number) => { canSwitch: boolean; reason: string }
}

// Taro存储适配器
const taroStorage = {
  getItem: (name: string): string | null => {
    try {
      return Taro.getStorageSync(name) || null
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      Taro.setStorageSync(name, value)
    } catch (e) {
      console.error('存储失败:', e)
    }
  },
  removeItem: (name: string): void => {
    try {
      Taro.removeStorageSync(name)
    } catch (e) {
      console.error('删除存储失败:', e)
    }
  }
}

// 检测当前平台
const detectPlatform = (): PlatformType => {
  const env = Taro.getEnv()
  if (env === Taro.ENV_TYPE.WEAPP) {
    return 'miniprogram'
  } else if (env === Taro.ENV_TYPE.WEB) {
    // 检查是否在微信浏览器中
    if (typeof window !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)) {
      return 'wechat_h5'
    }
    return 'h5'
  }
  return 'h5'
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoggedIn: false,
      token: null,
      userInfo: null,
      currentView: 'parent',
      location: null,
      platform: detectPlatform(),
      roleMemberships: [],

      // 设置Token
      setToken: (token) => {
        set({ token, isLoggedIn: !!token })
        if (token) {
          try {
            Taro.setStorageSync('token', token)
          } catch (e) {
            console.error('保存token失败:', e)
          }
        }
      },

      // 设置用户信息
      setUserInfo: (info) => {
        set({ userInfo: info, isLoggedIn: true })
        // 根据角色设置当前视角
        if (info.role === 1) {
          set({ currentView: 'teacher' })
        } else if (info.role === 2) {
          set({ currentView: 'org' })
        } else {
          set({ currentView: 'parent' })
        }
        try {
          Taro.setStorageSync('userInfo', JSON.stringify(info))
        } catch (e) {
          console.error('保存用户信息失败:', e)
        }
      },

      // 设置当前视角
      setCurrentView: (view) => {
        set({ currentView: view })
      },

      // 设置位置
      setLocation: (loc) => {
        set({ location: loc })
      },

      // 设置平台
      setPlatform: (platform) => {
        set({ platform })
      },

      // 设置角色会员状态
      setRoleMembership: (role, membership) => {
        const current = get().roleMemberships
        const existingIndex = current.findIndex(m => m.role === role)
        
        if (existingIndex >= 0) {
          const updated = [...current]
          updated[existingIndex] = { ...updated[existingIndex], ...membership }
          set({ roleMemberships: updated })
        } else {
          set({ 
            roleMemberships: [...current, { 
              role, 
              isMember: false, 
              expireAt: null, 
              membershipType: 0,
              ...membership 
            }] 
          })
        }
      },

      // 登出
      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          userInfo: null,
          currentView: 'parent',
          location: null,
          roleMemberships: []
        })
        try {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
        } catch (e) {
          console.error('清除存储失败:', e)
        }
      },

      // 获取用户ID
      getUserId: () => {
        const state = get()
        return state.userInfo?.id || null
      },

      // 获取角色
      getRole: () => {
        const state = get()
        return state.userInfo?.role ?? 0
      },

      // 是否是会员（指定角色，默认当前视角）
      isMember: (role?: number) => {
        const state = get()
        const targetRole = role !== undefined ? role : 
          (state.currentView === 'teacher' ? 1 : state.currentView === 'org' ? 2 : 0)
        
        const membership = state.roleMemberships.find(m => m.role === targetRole)
        if (!membership || !membership.expireAt) return false
        return new Date(membership.expireAt) > new Date()
      },

      // 获取角色会员状态
      getRoleMembership: (role: number) => {
        const state = get()
        return state.roleMemberships.find(m => m.role === role) || null
      },

      // 检查是否可以切换角色
      canSwitchRole: (targetRole: number) => {
        const state = get()
        const currentRole = state.userInfo?.role ?? 0
        
        // 如果是切换到当前真实角色，允许
        if (targetRole === currentRole) {
          return { canSwitch: true, reason: '' }
        }
        
        // 切换到其他角色需要满足条件
        // 1. 必须完成对应角色的认证
        // 2. 不同端口可能有限制
        
        // 这里可以添加更多的验证逻辑
        // 例如：检查是否完成了角色认证资料
        
        return { canSwitch: true, reason: '' }
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        currentView: state.currentView,
        platform: state.platform,
        roleMemberships: state.roleMemberships
      })
    }
  )
)

export default useUserStore
