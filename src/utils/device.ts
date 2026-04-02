/**
 * 设备检测工具
 */

import Taro from '@tarojs/taro'

/**
 * 检测是否为 iOS 设备（iPhone/iPad）
 * 微信小程序中苹果设备禁止虚拟支付
 */
export const isIOS = (): boolean => {
  try {
    const systemInfo = Taro.getSystemInfoSync()
    return systemInfo.platform === 'ios'
  } catch (error) {
    console.error('获取设备信息失败:', error)
    return false
  }
}

/**
 * 检测是否为微信小程序环境
 */
export const isWeapp = (): boolean => {
  return Taro.getEnv() === Taro.ENV_TYPE.WEAPP
}

/**
 * iOS 设备虚拟支付限制提示
 * 苹果端用户购买会员时，引导其通过客服完成支付
 */
export const handleIOSVirtualPayment = (options: {
  title?: string
  content?: string
  customerServiceUrl?: string
}): Promise<boolean> => {
  return new Promise((resolve) => {
    const {
      title = '温馨提示',
      content = '由于苹果公司政策限制，iOS设备暂不支持小程序内购买会员。请联系客服完成购买。',
      customerServiceUrl
    } = options

    Taro.showModal({
      title,
      content,
      confirmText: '联系客服',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 打开客服对话
          openCustomerService(customerServiceUrl)
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 打开客服对话
 * 在微信小程序中打开客服消息界面
 */
export const openCustomerService = (customUrl?: string) => {
  try {
    if (isWeapp()) {
      // 微信小程序打开客服对话
      // 可以通过 button 组件的 open-type="contact" 或者使用 Taro.openCustomerServiceChat
      // 注意：openCustomerServiceChat 需要在微信小程序管理后台配置客服
      
      if (customUrl) {
        // 如果有自定义客服链接，复制到剪贴板并提示
        Taro.setClipboardData({
          data: customUrl,
          success: () => {
            Taro.showToast({
              title: '客服链接已复制',
              icon: 'success'
            })
          }
        })
      } else {
        // 使用小程序原生客服功能
        // 注意：这个API需要用户点击按钮触发，不能通过代码直接调用
        // 所以这里我们使用复制微信号或打开网页的方式
        Taro.showModal({
          title: '联系客服',
          content: '请添加客服微信：mht_edu，或点击确定复制客服微信号',
          confirmText: '复制微信号',
          success: (res) => {
            if (res.confirm) {
              Taro.setClipboardData({
                data: 'mht_edu',
                success: () => {
                  Taro.showToast({
                    title: '已复制客服微信号',
                    icon: 'success'
                  })
                }
              })
            }
          }
        })
      }
    } else {
      // H5 环境直接跳转客服链接
      if (customUrl) {
        Taro.setClipboardData({
          data: customUrl,
          success: () => {
            Taro.showToast({
              title: '客服链接已复制',
              icon: 'success'
            })
          }
        })
      }
    }
  } catch (error) {
    console.error('打开客服失败:', error)
    Taro.showToast({
      title: '请联系客服',
      icon: 'none'
    })
  }
}
