import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import type { UserInfo } from '@/types'

interface UserState {
  userInfo: UserInfo | null
  token: string
  isLoggedIn: boolean
  location: {
    latitude: number
    longitude: number
    address: string
  } | null
  setUserInfo: (info: UserInfo) => void
  setToken: (token: string) => void
  setLocation: (location: { latitude: number; longitude: number; address: string }) => void
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

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: '',
      isLoggedIn: false,
      location: null,
      setUserInfo: (info) => set({ userInfo: info, isLoggedIn: true }),
      setToken: (token) => set({ token }),
      setLocation: (location) => set({ location }),
      logout: () => set({ userInfo: null, token: '', isLoggedIn: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
