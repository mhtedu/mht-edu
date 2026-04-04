import Taro from '@tarojs/taro'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        return `${PROJECT_DOMAIN}${url}`
    }

    /**
     * 获取存储的 token
     */
    const getToken = (): string | null => {
        try {
            // 从 zustand 存储中获取 token
            const userStorage = Taro.getStorageSync('user-storage')
            if (userStorage) {
                const parsed = JSON.parse(userStorage)
                return parsed?.state?.token || null
            }
            // 兼容直接存储的 token
            return Taro.getStorageSync('token') || null
        } catch {
            return null
        }
    }

    export const request: typeof Taro.request = option => {
        const token = getToken()
        const headers: Record<string, string> = {
            ...(option.header || {}),
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        console.log('Network.request:', {
            url: createUrl(option.url),
            method: option.method || 'GET',
            hasToken: !!token,
            token: token ? token.substring(0, 20) + '...' : null
        })

        return Taro.request({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        const token = getToken()
        const headers: Record<string, string> = {
            ...(option.header || {}),
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        const token = getToken()
        const headers: Record<string, string> = {
            ...(option.header || {}),
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
            header: headers,
        })
    }
}
