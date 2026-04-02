import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import type { UserInfo } from '@/types'

// 用户角色类型
export type UserRole = 'parent' | 'teacher' | 'org' | 'admin'

// 当前视角/端类型 (用户可以切换不同视角)
export type CurrentView = 'parent' | 'teacher' | 'org'

interface UserState {
  userInfo: UserInfo | null
  token: string
  isLoggedIn: boolean
  currentView: CurrentView // 当前视角（用户可切换）
  location: {
    latitude: number
    longitude: number
    address: string
  } | null
  setUserInfo: (info: UserInfo) => void
  setToken: (token: string) => void
  setLocation: (location: { latitude: number; longitude: number; address: string }) => void
  setCurrentView: (view: CurrentView) => void
  logout: () => void
}

// Taro 存储适配器
const taroStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { data } = await Taro.getStorage({ key: name })
      return data ?? null
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Taro.setStorage({ key: name, data: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await Taro.removeStorage({ key: name })
  },
}

// 根据用户角色获取默认视角
const getDefaultView = (role?: UserRole): CurrentView => {
  switch (role) {
    case 'teacher':
      return 'teacher'
    case 'org':
      return 'org'
    default:
      return 'parent'
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: '',
      isLoggedIn: false,
      currentView: 'parent',
      location: null,
      setUserInfo: (info) => set({ 
        userInfo: info, 
        isLoggedIn: true,
        // 登录时根据用户角色设置默认视角
        currentView: getDefaultView(info.role)
      }),
      setToken: (token) => set({ token }),
      setLocation: (location) => set({ location }),
      setCurrentView: (view) => {
        set({ currentView: view })
        // 同时保存到本地存储，方便角色切换页面读取
        const viewMap: Record<CurrentView, number> = { parent: 0, teacher: 1, org: 2 }
        Taro.setStorageSync('userRole', viewMap[view])
      },
      logout: () => set({ userInfo: null, token: '', isLoggedIn: false, currentView: 'parent' }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        currentView: state.currentView,
      }),
    }
  )
)
