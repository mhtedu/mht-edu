import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface SiteConfig {
  site_name: string
  site_domain: string
  site_logo: string
  site_description: string
  contact_phone: string
  contact_wechat: string
}

interface ConfigState {
  siteConfig: SiteConfig
  loading: boolean
  loaded: boolean
  loadSiteConfig: () => Promise<void>
  getSiteName: () => string
}

// 默认配置
const defaultConfig: SiteConfig = {
  site_name: '棉花糖教育',
  site_domain: '',
  site_logo: '',
  site_description: '连接优质教育资源，助力孩子成长',
  contact_phone: '',
  contact_wechat: '',
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

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      siteConfig: defaultConfig,
      loading: false,
      loaded: false,
      
      loadSiteConfig: async () => {
        if (get().loading) return
        
        set({ loading: true })
        try {
          console.log('加载站点配置请求:', { url: '/api/config/public' })
          const res = await Network.request({
            url: '/api/config/public'
          })
          console.log('加载站点配置响应:', res.data)
          
          if (res.data && res.data.data) {
            const config = res.data.data
            set({
              siteConfig: { ...defaultConfig, ...config },
              loaded: true
            })
          } else if (res.data) {
            set({
              siteConfig: { ...defaultConfig, ...res.data },
              loaded: true
            })
          }
        } catch (error) {
          console.error('加载站点配置失败:', error)
          // 使用默认配置
          set({ siteConfig: defaultConfig, loaded: true })
        } finally {
          set({ loading: false })
        }
      },
      
      getSiteName: () => {
        const state = get()
        return state.siteConfig.site_name || defaultConfig.site_name
      },
    }),
    {
      name: 'site-config',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        siteConfig: state.siteConfig,
      }),
    }
  )
)
