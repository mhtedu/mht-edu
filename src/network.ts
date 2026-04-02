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

    const getToken = (): string => {
        try {
            const storage = Taro.getStorageSync('user-storage')
            if (storage) {
                const data = typeof storage === 'string' ? JSON.parse(storage) : storage
                return data.state?.token || ''
            }
        } catch (e) {
            console.error('获取token失败:', e)
        }
        return ''
    }

    export const request: typeof Taro.request = option => {
        const token = getToken()
        const header = {
            'Content-Type': 'application/json',
            ...option.header,
        }
        if (token) {
            header['Authorization'] = `Bearer ${token}`
        }

        console.log('Network request:', {
            url: createUrl(option.url),
            method: option.method || 'GET',
            data: option.data,
            header
        })

        return Taro.request({
            ...option,
            url: createUrl(option.url),
            header,
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        const token = getToken()
        const header = {
            ...option.header,
        }
        if (token) {
            header['Authorization'] = `Bearer ${token}`
        }

        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            header,
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
        })
    }
}

