import axios from 'axios'

const API_BASE = '/api/admin/miniprogram'

export const miniprogramApi = {
  // 构建小程序
  async build(): Promise<{ success: boolean; message?: string }> {
    const res = await axios.post(`${API_BASE}/build`)
    return res.data
  },

  // 上传小程序
  async upload(params: { version: string; desc: string }): Promise<{
    success: boolean
    message?: string
    version?: string
  }> {
    const res = await axios.post(`${API_BASE}/upload`, params)
    return res.data
  },

  // 预览小程序
  async preview(): Promise<{
    success: boolean
    message?: string
    qrcodeUrl?: string
  }> {
    const res = await axios.post(`${API_BASE}/preview`)
    return res.data
  },

  // 查询上传状态
  async status(): Promise<{
    success: boolean
    data?: {
      lastUploadTime?: string
      lastUploadVersion?: string
    }
  }> {
    const res = await axios.post(`${API_BASE}/status`)
    return res.data
  }
}
