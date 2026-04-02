import Taro from '@tarojs/taro'

// 默认坐标（北京天安门）
const DEFAULT_LOCATION = {
  latitude: 39.9042,
  longitude: 116.4074,
  address: '北京市'
}

/**
 * 获取当前位置
 * 如果获取失败，返回默认坐标（北京）
 */
export const getLocation = async (): Promise<{
  latitude: number
  longitude: number
  address: string
} | null> => {
  try {
    // H5 端可能没有定位权限，使用默认坐标
    const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
    if (isH5) {
      console.log('H5 环境，使用默认坐标')
      return DEFAULT_LOCATION
    }
    
    const { latitude, longitude } = await Taro.getLocation({ type: 'gcj02' })
    // 逆地理编码获取地址
    const address = await reverseGeocode(latitude, longitude)
    return { latitude, longitude, address }
  } catch (error) {
    console.error('获取位置失败，使用默认坐标:', error)
    return DEFAULT_LOCATION
  }
}

/**
 * 逆地理编码（将坐标转换为地址）
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  // TODO: 调用后端接口或第三方服务进行逆地理编码
  // 这里暂时返回占位地址
  return `当前位置 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
}

/**
 * 计算两点之间的距离（米）
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000 // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 格式化距离显示
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

/**
 * 格式化价格显示
 */
export const formatPrice = (min?: number, max?: number): string => {
  if (!min && !max) return '面议'
  if (min && max && min !== max) {
    return `¥${min}-${max}/课时`
  }
  return `¥${min || max}/课时`
}

/**
 * 格式化时间显示
 */
export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}-${date.getDate()}`
}

/**
 * 验证手机号
 */
export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证验证码
 */
export const validateCode = (code: string): boolean => {
  return /^\d{6}$/.test(code)
}
