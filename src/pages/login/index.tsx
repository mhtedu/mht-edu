import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useUserStore } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { Network } from '@/network'
import { validatePhone, validateCode } from '@/utils'
import { Phone, ShieldCheck, Loader } from 'lucide-react-taro'
import './index.css'

const LoginPage: FC = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isRegister, setIsRegister] = useState(false)

  const { setUserInfo, setToken } = useUserStore()
  const { getSiteName, siteConfig } = useConfigStore()

  useLoad(() => {
    console.log('Login page loaded.')
  })

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (countdown > 0) return

    try {
      setLoading(true)
      console.log('发送验证码请求:', { url: '/api/sms/send-code', method: 'POST', data: { mobile: phone } })
      const res = await Network.request({
        url: '/api/sms/send-code',
        method: 'POST',
        data: { mobile: phone }
      })
      console.log('发送验证码响应:', res.data)

      if (res.data.success || res.data.code === 200) {
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
        Taro.showToast({ title: res.data.message || '发送失败', icon: 'none' })
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
      Taro.showToast({ title: '发送失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 登录/注册
  const handleSubmit = async () => {
    if (!validatePhone(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (!validateCode(code)) {
      Taro.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    try {
      setLoading(true)
      const url = isRegister ? '/api/user/register' : '/api/user/login'
      console.log('登录/注册请求:', { url, method: 'POST', data: { mobile: phone, code } })
      const res = await Network.request({
        url,
        method: 'POST',
        data: { mobile: phone, code }
      })
      console.log('登录/注册响应:', res.data)

      const result = res.data
      if (result.success || result.code === 200) {
        const { token, user } = result.data || result
        setToken(token)
        setUserInfo(user)
        Taro.showToast({ title: isRegister ? '注册成功' : '登录成功', icon: 'success' })
        
        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } else {
        Taro.showToast({ title: result.message || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('登录/注册失败:', error)
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 切换登录/注册模式
  const toggleMode = () => {
    setIsRegister(!isRegister)
    setCode('')
  }

  const siteName = getSiteName()

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">{siteName}成长平台</Text>
        <Text className="login-subtitle">{siteConfig.site_description || '连接优质教育资源，助力孩子成长'}</Text>
      </View>

      <Card className="login-card">
        <CardHeader>
          <CardTitle>{isRegister ? '注册账号' : '欢迎回来'}</CardTitle>
          <CardDescription>
            {isRegister ? '创建账号，开启教育之旅' : '使用手机号验证码登录'}
          </CardDescription>
        </CardHeader>
        <CardContent className="login-form">
          {/* 手机号输入 */}
          <View className="input-wrapper">
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
          <View className="input-wrapper">
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
            <Button
              className="code-btn"
              variant="outline"
              size="sm"
              disabled={countdown > 0 || loading}
              onClick={handleSendCode}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Button>
          </View>

          {/* 提交按钮 */}
          <Button
            className="submit-btn"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <View className="loading-wrapper">
                <Loader size={20} color="#fff" className="animate-spin" />
                <Text className="loading-text">处理中...</Text>
              </View>
            ) : (
              isRegister ? '注册' : '登录'
            )}
          </Button>

          {/* 切换登录/注册 */}
          <View className="switch-mode">
            <Text className="switch-text">
              {isRegister ? '已有账号？' : '没有账号？'}
            </Text>
            <Text className="switch-link" onClick={toggleMode}>
              {isRegister ? '立即登录' : '立即注册'}
            </Text>
          </View>
        </CardContent>
      </Card>

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
