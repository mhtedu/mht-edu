import { create } from 'zustand'
import { Network } from '@/network'

export interface SiteConfig {
  site_name: string
  site_domain: string
  site_logo: string
  site_description: string
  contact_phone: string
  contact_wechat: string
}

interface SiteConfigState {
  config: SiteConfig
  loaded: boolean
  loadConfig: () => Promise<void>
  getSiteName: () => string
}

const defaultConfig: SiteConfig = {
  site_name: '棉花糖教育',
  site_domain: '',
  site_logo: '',
  site_description: '连接优质教育资源，助力孩子成长',
  contact_phone: '',
  contact_wechat: '',
}

export const useSiteConfig = create<SiteConfigState>((set, get) => ({
  config: defaultConfig,
  loaded: false,

  loadConfig: async () => {
    try {
      const res = await Network.request({
        url: '/api/config/public',
        method: 'GET',
      })

      if (res.statusCode === 200 && res.data) {
        const data = res.data as any
        set({
          config: {
            site_name: data.site_name || defaultConfig.site_name,
            site_domain: data.site_domain || '',
            site_logo: data.site_logo || '',
            site_description: data.site_description || defaultConfig.site_description,
            contact_phone: data.contact_phone || '',
            contact_wechat: data.contact_wechat || '',
          },
          loaded: true,
        })
        console.log('[SiteConfig] 配置加载成功:', data)
      }
    } catch (error) {
      console.error('[SiteConfig] 加载配置失败:', error)
      set({ loaded: true })
    }
  },

  getSiteName: () => {
    const state = get()
    return state.config.site_name || defaultConfig.site_name
  },
}))
