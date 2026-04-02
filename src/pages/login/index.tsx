import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { Network } from '@/network'
import { Phone, ShieldCheck, Loader } from 'lucide-react-taro'
import './index.css'

const LoginPage: FC = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const { setUserInfo, setToken } = useUserStore()
  const { siteConfig, loadSiteConfig } = useConfigStore()

  useLoad(() => {
    console.log('Login page loaded.')
    loadSiteConfig()
  })

  // 动态设置导航栏标题
  useEffect(() => {
    if (siteConfig.site_name) {
      Taro.setNavigationBarTitle({ title: `登录 - ${siteConfig.site_name}` })
    }
  }, [siteConfig.site_name])

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (countdown > 0) return

    try {
      setLoading(true)
      console.log('发送验证码请求:', { url: '/api/user/send-code', method: 'POST', data: { mobile: phone } })
      const res = await Network.request({
        url: '/api/user/send-code',
        method: 'POST',
        data: { mobile: phone }
      })
      console.log('发送验证码响应:', res.data)

      if (res.data && res.data.success) {
        Taro.showToast({ title: '验证码已发送', icon: 'success' })
        // 开始倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        Taro.showToast({ title: (res.data && res.data.message) || '发送失败', icon: 'none' })
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const handleLogin = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (!code || code.length !== 6) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      console.log('登录请求:', { url: '/api/user/login', method: 'POST', data: { mobile: phone, code } })
      const res = await Network.request({
        url: '/api/user/login',
        method: 'POST',
        data: { mobile: phone, code }
      })
      console.log('登录响应:', res.data)

      const result = res.data
      if (result && result.success) {
        const { token, user } = result.data || {}
        
        // 保存登录状态
        if (token) {
          setToken(token)
          console.log('Token 已保存:', token)
        }
        if (user) {
          setUserInfo(user)
          console.log('用户信息已保存:', user)
        }
        
        Taro.showToast({ title: '登录成功', icon: 'success' })
        
        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: (result && result.message) || '登录失败', icon: 'none' })
      }
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 一键登录（开发测试用）
  const handleQuickLogin = async () => {
    try {
      setLoading(true)
      const testPhone = '13800138000'
      const testCode = '123456'
      
      console.log('一键登录请求:', { url: '/api/user/login', method: 'POST', data: { mobile: testPhone, code: testCode } })
      const res = await Network.request({
        url: '/api/user/login',
        method: 'POST',
        data: { mobile: testPhone, code: testCode }
      })
      console.log('一键登录响应:', res.data)

      const result = res.data
      if (result && result.success) {
        const { token, user } = result.data || {}
        
        if (token) {
          setToken(token)
        }
        if (user) {
          setUserInfo(user)
        }
        
        Taro.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: (result && result.message) || '登录失败', icon: 'none' })
      }
    } catch (error) {
      console.error('一键登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">{siteConfig.site_name || '棉花糖教育'}</Text>
        <Text className="login-subtitle">{siteConfig.site_description || '连接优质教育资源，助力孩子成长'}</Text>
      </View>

      <View className="login-card">
        <Text className="card-title">欢迎登录</Text>
        
        {/* 手机号输入 */}
        <View className="input-row">
          <View className="input-icon">
            <Phone size={20} color="#6B7280" />
          </View>
          <Input
            className="login-input"
            type="number"
            maxlength={11}
            placeholder="请输入手机号"
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>

        {/* 验证码输入 */}
        <View className="input-row">
          <View className="input-icon">
            <ShieldCheck size={20} color="#6B7280" />
          </View>
          <Input
            className="login-input code-input"
            type="number"
            maxlength={6}
            placeholder="请输入验证码"
            value={code}
            onInput={(e) => setCode(e.detail.value)}
          />
          <View 
            className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
            onClick={handleSendCode}
          >
            <Text className="code-btn-text">
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Text>
          </View>
        </View>

        {/* 登录按钮 */}
        <View className="login-btn" onClick={handleLogin}>
          {loading ? (
            <View className="loading-row">
              <Loader size={20} color="#fff" />
              <Text className="loading-text">登录中...</Text>
            </View>
          ) : (
            <Text className="login-btn-text">登录</Text>
          )}
        </View>

        {/* 一键登录按钮 */}
        <View className="quick-login-btn" onClick={handleQuickLogin}>
          <Text className="quick-login-text">一键登录（测试）</Text>
        </View>
      </View>

      <View className="login-footer">
        <Text className="footer-text">
          登录即表示同意
          <Text className="link">《用户协议》</Text>
          和
          <Text className="link">《隐私政策》</Text>
        </Text>
      </View>
    </View>
  )
}

export default LoginPage
