/**
 * 用户状态管理
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'

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
}

// 当前视角类型
export type CurrentView = 'parent' | 'teacher' | 'org'

// 用户状态接口
interface UserState {
  // 状态
  isLoggedIn: boolean
  token: string | null
  userInfo: UserInfo | null
  currentView: CurrentView
  location: { address: string; latitude: number; longitude: number } | null

  // 操作方法
  setToken: (token: string) => void
  setUserInfo: (info: UserInfo) => void
  setCurrentView: (view: CurrentView) => void
  setLocation: (loc: { address: string; latitude: number; longitude: number } | null) => void
  logout: () => void
  
  // 辅助方法
  getUserId: () => number | null
  getRole: () => number
  isMember: () => boolean
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoggedIn: false,
      token: null,
      userInfo: null,
      currentView: 'parent',
      location: null,

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

      // 登出
      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          userInfo: null,
          currentView: 'parent',
          location: null
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

      // 是否是会员
      isMember: () => {
        const state = get()
        if (!state.userInfo?.membershipExpireAt) return false
        return new Date(state.userInfo.membershipExpireAt) > new Date()
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        currentView: state.currentView
      })
    }
  )
)

export default useUserStore
