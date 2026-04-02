/**
 * 配置状态管理
 */
import { create } from 'zustand'
import { Network } from '@/network'

// 站点配置类型
export interface SiteConfig {
  siteName?: string
  siteLogo?: string
  siteDescription?: string
  contactPhone?: string
  contactWechat?: string
  icpNumber?: string
  [key: string]: string | undefined
}

// 配置状态接口
interface ConfigState {
  siteConfig: SiteConfig
  loaded: boolean

  // 操作方法
  loadSiteConfig: () => Promise<void>
  loadConfig: () => Promise<void>
  getSiteName: () => string
  getLogo: () => string
}

// 默认配置
const defaultConfig: SiteConfig = {
  siteName: '教育平台',
  siteLogo: '',
  siteDescription: '专业的教育信息撮合平台',
  contactPhone: '',
  contactWechat: '',
  icpNumber: ''
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  siteConfig: defaultConfig,
  loaded: false,

  // 加载站点配置（别名）
  loadSiteConfig: async () => {
    const state = get()
    await state.loadConfig()
  },

  // 加载配置
  loadConfig: async () => {
    try {
      const res = await Network.request({
        url: '/api/admin/config',
        method: 'GET'
      })

      if (res.data) {
        set({
          siteConfig: { ...defaultConfig, ...res.data },
          loaded: true
        })
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      set({ loaded: true })
    }
  },

  // 获取站点名称
  getSiteName: () => {
    const state = get()
    return state.siteConfig.siteName || '教育平台'
  },

  // 获取Logo
  getLogo: () => {
    const state = get()
    return state.siteConfig.siteLogo || ''
  }
}))

export default useConfigStore
