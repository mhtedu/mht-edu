/**
 * 分销锁定工具函数
 * 用于在前端各个分享场景中调用分销锁定API
 */

import Taro from '@tarojs/taro'
import { Network } from '@/network'

/**
 * 锁定类型
 */
export type LockType = 
  | 'teacher_profile'  // 教师主页
  | 'order'           // 订单
  | 'activity'        // 活动
  | 'elite_class'     // 牛师班
  | 'invite_link'     // 邀请链接
  | 'qrcode'          // 二维码

/**
 * 通过分享码锁定分销关系
 * @param shareCode 分享码
 */
export async function lockByShareCode(shareCode: string): Promise<boolean> {
  try {
    const token = Taro.getStorageSync('token')
    if (!token) {
      console.log('[分销锁定] 未登录，跳过锁定')
      return false
    }

    console.log('[分销锁定] 尝试通过分享码锁定:', shareCode)
    
    const res = await Network.request({
      url: '/api/referral/lock-by-share-code',
      method: 'POST',
      data: { shareCode }
    }) as any

    if (res.code === 200 && res.data?.locked) {
      console.log('[分销锁定] 锁定成功')
      return true
    } else {
      console.log('[分销锁定] 锁定失败:', res.msg)
      return false
    }
  } catch (error) {
    console.error('[分销锁定] 锁定异常:', error)
    return false
  }
}

/**
 * 通过邀请码锁定分销关系
 * @param inviteCode 邀请码
 */
export async function lockByInviteCode(inviteCode: string): Promise<boolean> {
  try {
    const token = Taro.getStorageSync('token')
    if (!token) {
      console.log('[分销锁定] 未登录，跳过锁定')
      return false
    }

    console.log('[分销锁定] 尝试通过邀请码锁定:', inviteCode)
    
    const res = await Network.request({
      url: '/api/referral/lock-by-invite-code',
      method: 'POST',
      data: { inviteCode }
    }) as any

    if (res.code === 200 && res.data?.locked) {
      console.log('[分销锁定] 锁定成功')
      return true
    } else {
      console.log('[分销锁定] 锁定失败:', res.msg)
      return false
    }
  } catch (error) {
    console.error('[分销锁定] 锁定异常:', error)
    return false
  }
}

/**
 * 直接锁定分销关系
 * @param lockerId 锁定者ID（分享者）
 * @param lockType 锁定类型
 * @param sourceId 来源ID（可选）
 */
export async function lockRelation(
  lockerId: number,
  lockType: LockType,
  sourceId?: number
): Promise<boolean> {
  try {
    const token = Taro.getStorageSync('token')
    if (!token) {
      console.log('[分销锁定] 未登录，跳过锁定')
      return false
    }

    console.log('[分销锁定] 尝试锁定:', { lockerId, lockType, sourceId })
    
    const res = await Network.request({
      url: '/api/referral/lock',
      method: 'POST',
      data: { lockerId, lockType, sourceId }
    }) as any

    if (res.code === 200 && res.data?.locked) {
      console.log('[分销锁定] 锁定成功')
      return true
    } else {
      console.log('[分销锁定] 锁定失败:', res.msg)
      return false
    }
  } catch (error) {
    console.error('[分销锁定] 锁定异常:', error)
    return false
  }
}

/**
 * 检查当前用户是否已被锁定
 */
export async function checkIsLocked(): Promise<boolean> {
  try {
    const res = await Network.request({
      url: '/api/referral/is-locked',
      method: 'GET'
    }) as any

    return res.code === 200 && res.data?.is_locked === true
  } catch (error) {
    console.error('[分销锁定] 检查状态异常:', error)
    return false
  }
}

/**
 * 获取我的推荐人信息
 */
export async function getMyLocker(): Promise<any> {
  try {
    const res = await Network.request({
      url: '/api/referral/my-locker',
      method: 'GET'
    }) as any

    return res.code === 200 ? res.data : null
  } catch (error) {
    console.error('[分销锁定] 获取推荐人异常:', error)
    return null
  }
}

/**
 * 获取邀请统计
 */
export async function getInviteStats(): Promise<{
  total: number
  teachers: number
  parents: number
  invite_code: string
} | null> {
  try {
    const res = await Network.request({
      url: '/api/referral/invite-stats',
      method: 'GET'
    }) as any

    return res.code === 200 ? res.data : null
  } catch (error) {
    console.error('[分销锁定] 获取邀请统计异常:', error)
    return null
  }
}

/**
 * 获取我的邀请码
 */
export async function getMyInviteCode(): Promise<string | null> {
  try {
    const res = await Network.request({
      url: '/api/referral/my-invite-code',
      method: 'GET'
    }) as any

    return res.code === 200 ? res.data?.invite_code : null
  } catch (error) {
    console.error('[分销锁定] 获取邀请码异常:', error)
    return null
  }
}

/**
 * 从URL参数中提取分享码并尝试锁定
 * @param url 当前页面URL
 */
export async function tryLockFromUrl(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url, 'https://example.com')
    const shareCode = urlObj.searchParams.get('share_code') || urlObj.searchParams.get('sc')
    const inviteCode = urlObj.searchParams.get('invite_code') || urlObj.searchParams.get('ic')
    const lockerId = urlObj.searchParams.get('locker_id') || urlObj.searchParams.get('from')

    if (shareCode) {
      return lockByShareCode(shareCode)
    } else if (inviteCode) {
      return lockByInviteCode(inviteCode)
    } else if (lockerId) {
      const type = urlObj.searchParams.get('type') || 'invite_link'
      const sourceId = urlObj.searchParams.get('source_id')
      return lockRelation(
        parseInt(lockerId),
        type as LockType,
        sourceId ? parseInt(sourceId) : undefined
      )
    }

    return false
  } catch (error) {
    console.error('[分销锁定] URL解析异常:', error)
    return false
  }
}

/**
 * 页面加载时自动尝试锁定（推荐在onLoad中使用）
 */
export async function autoLockOnPageLoad(options: Record<string, any> = {}): Promise<boolean> {
  const { share_code, sc, invite_code, ic, locker_id, from, type, source_id } = options

  if (share_code || sc) {
    return lockByShareCode(share_code || sc)
  } else if (invite_code || ic) {
    return lockByInviteCode(invite_code || ic)
  } else if (locker_id || from) {
    return lockRelation(
      parseInt(locker_id || from),
      (type || 'invite_link') as LockType,
      source_id ? parseInt(source_id) : undefined
    )
  }

  return false
}
