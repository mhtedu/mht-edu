import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import type { UserInfo } from '@/types'

interface UserState {
  userInfo: UserInfo | null
  token: string
  isLoggedIn: boolean
  currentRole: number // 0-家长 1-教师 2-机构
  location: {
    latitude: number
    longitude: number
    address: string
  } | null
  setUserInfo: (info: UserInfo) => void
  setToken: (token: string) => void
  setLocation: (location: { latitude: number; longitude: number; address: string }) => void
  setCurrentRole: (role: number) => void
  logout: () => void
}

// 自定义存储适配器
const customStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(name)
      }
      const data = Taro.getStorageSync(name)
      return data || null
    } catch (e) {
      console.error('获取存储失败:', e)
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(name, value)
      }
      Taro.setStorageSync(name, value)
    } catch (e) {
      console.error('设置存储失败:', e)
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(name)
      }
      Taro.removeStorageSync(name)
    } catch (e) {
      console.error('删除存储失败:', e)
    }
  },
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userInfo: null,
      token: '',
      isLoggedIn: false,
      currentRole: 0,
      location: null,
      setUserInfo: (info) => {
        console.log('setUserInfo 被调用:', info)
        set({ userInfo: info, isLoggedIn: true })
        setTimeout(() => {
          console.log('当前登录状态:', get().isLoggedIn, 'token:', get().token ? '有' : '无')
        }, 100)
      },
      setToken: (token) => {
        console.log('setToken 被调用:', token ? '有值' : '空')
        set({ token })
        setTimeout(() => {
          console.log('当前登录状态:', get().isLoggedIn, 'token:', get().token ? '有' : '无')
        }, 100)
      },
      setLocation: (location) => set({ location }),
      setCurrentRole: (role) => set({ currentRole: role }),
      logout: () => {
        console.log('logout 被调用')
        set({ userInfo: null, token: '', isLoggedIn: false })
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
