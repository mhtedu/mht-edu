/**
 * 分享工具函数
 * 用于统一处理分享逻辑，自动带上邀请码
 */

import Taro from '@tarojs/taro'
import { Network } from '@/network'

/**
 * 分享类型
 */
export type ShareType = 
  | 'order'           // 订单
  | 'activity'        // 活动
  | 'teacher'         // 教师
  | 'resource'        // 资源
  | 'elite_class'     // 牛师班
  | 'platform'        // 平台

/**
 * 分享配置接口
 */
export interface ShareConfig {
  title: string
  path: string
  imageUrl?: string
  type: ShareType
  sourceId?: number
}

/**
 * 获取当前用户的邀请码
 */
export async function getInviteCode(): Promise<string> {
  try {
    const res = await Network.request({
      url: '/api/distribution/my-invite-code',
      method: 'GET'
    }) as any
    
    if (res.code === 200 && res.data && res.data.invite_code) {
      return res.data.invite_code
    }
    
    // 尝试从本地缓存获取
    const cachedCode = Taro.getStorageSync('my_invite_code')
    if (cachedCode) {
      return cachedCode
    }
    
    return ''
  } catch (error) {
    console.error('[分享] 获取邀请码失败:', error)
    // 尝试从本地缓存获取
    const cachedCode = Taro.getStorageSync('my_invite_code')
    return cachedCode || ''
  }
}

/**
 * 生成分享路径（带邀请码）
 */
export function generateSharePath(basePath: string, inviteCode?: string): string {
  if (!inviteCode) {
    return basePath
  }
  
  const separator = basePath.includes('?') ? '&' : '?'
  return `${basePath}${separator}invite_code=${inviteCode}`
}

/**
 * 准备分享内容
 */
export async function prepareShareContent(config: ShareConfig): Promise<{
  title: string
  path: string
  imageUrl: string
}> {
  const inviteCode = await getInviteCode()
  
  let path = config.path
  if (inviteCode) {
    path = generateSharePath(config.path, inviteCode)
    
    // 添加来源标识
    const separator = path.includes('?') ? '&' : '?'
    path = `${path}${separator}from=share&type=${config.type}`
    
    if (config.sourceId) {
      path = `${path}&source_id=${config.sourceId}`
    }
  }
  
  return {
    title: config.title,
    path,
    imageUrl: config.imageUrl || ''
  }
}

/**
 * 记录分享行为
 */
export async function recordShareAction(type: ShareType, sourceId?: number): Promise<void> {
  try {
    await Network.request({
      url: '/api/distribution/record-share',
      method: 'POST',
      data: { type, source_id: sourceId }
    })
  } catch (error) {
    console.error('[分享] 记录分享失败:', error)
  }
}

/**
 * 显示分享菜单
 */
export function showShareMenu(): void {
  Taro.showShareMenu({
    withShareTicket: true
  } as any)
}

/**
 * 复制分享链接
 */
export async function copyShareLink(config: ShareConfig): Promise<void> {
  const inviteCode = await getInviteCode()
  let link = `https://mht-edu.com${config.path}`
  
  if (inviteCode) {
    const separator = link.includes('?') ? '&' : '?'
    link = `${link}${separator}invite_code=${inviteCode}&from=share&type=${config.type}`
    
    if (config.sourceId) {
      link = `${link}&source_id=${config.sourceId}`
    }
  }
  
  Taro.setClipboardData({
    data: link,
    success: () => {
      Taro.showToast({ title: '链接已复制', icon: 'success' })
      recordShareAction(config.type, config.sourceId)
    }
  })
}

/**
 * 默认分享图片URL列表
 */
export const DEFAULT_SHARE_IMAGES = {
  order: 'https://placehold.co/500x400/2563EB/white?text=找老师',
  activity: 'https://placehold.co/500x400/22C55E/white?text=活动报名',
  teacher: 'https://placehold.co/500x400/9333EA/white?text=名师推荐',
  resource: 'https://placehold.co/500x400/F59E0B/white?text=学习资料',
  elite_class: 'https://placehold.co/500x400/EF4444/white?text=精品课程',
  platform: 'https://placehold.co/500x400/2563EB/white?text=棉花糖教育',
}
