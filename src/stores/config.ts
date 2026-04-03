/**
 * 配置状态管理
 */
import { create } from 'zustand'
import { Network } from '@/network'

// 站点配置类型
export interface SiteConfig {
  siteName?: string
  siteLogo?: string
  site_description?: string
  contact_phone?: string
  contact_wechat?: string
  site_domain?: string
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
  siteName: '棉花糖教育平台',
  siteLogo: '',
  site_description: '连接优质教育资源，助力孩子成长',
  contact_phone: '',
  contact_wechat: '',
  site_domain: ''
}

// 字段名映射：后端下划线 -> 前端驼峰
function mapConfigFields(backendData: Record<string, any>): SiteConfig {
  return {
    siteName: backendData.site_name || defaultConfig.siteName,
    siteLogo: backendData.site_logo || defaultConfig.siteLogo,
    site_description: backendData.site_description || defaultConfig.site_description,
    contact_phone: backendData.contact_phone || defaultConfig.contact_phone,
    contact_wechat: backendData.contact_wechat || defaultConfig.contact_wechat,
    site_domain: backendData.site_domain || defaultConfig.site_domain,
  }
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
      console.log('[ConfigStore] 开始加载配置...')
      const res = await Network.request({
        url: '/api/admin/config/public/site',
        method: 'GET'
      })

      console.log('[ConfigStore] 配置API返回:', res.data)

      if (res.data) {
        const mappedConfig = mapConfigFields(res.data)
        console.log('[ConfigStore] 映射后配置:', mappedConfig)
        set({
          siteConfig: { ...defaultConfig, ...mappedConfig },
          loaded: true
        })
      }
    } catch (error) {
      console.error('[ConfigStore] 加载配置失败:', error)
      set({ loaded: true })
    }
  },

  // 获取站点名称
  getSiteName: () => {
    const state = get()
    return state.siteConfig.siteName || '棉花糖教育平台'
  },

  // 获取Logo
  getLogo: () => {
    const state = get()
    return state.siteConfig.siteLogo || ''
  }
}))

export default useConfigStore
