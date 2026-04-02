import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import type { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUserStore, PlatformType } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { Network } from '@/network'
import { validatePhone, validateCode } from '@/utils'
import { Phone, ShieldCheck, Loader, GraduationCap, BookOpen, Building2, Check } from 'lucide-react-taro'
import './index.css'

// 角色配置
const roleOptions = [
  { id: 0, name: '家长', icon: GraduationCap, color: '#2563EB', desc: '发布需求，找到满意的老师' },
  { id: 1, name: '牛师', icon: BookOpen, color: '#22C55E', desc: '抢单接课，展示教学实力' },
  { id: 2, name: '机构', icon: Building2, color: '#9333EA', desc: '管理团队，扩展业务版图' },
]

const LoginPage: FC = () => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isRegister, setIsRegister] = useState(false)
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [selectedRole, setSelectedRole] = useState(0)
  // 平台类型由系统自动检测，不需要用户选择
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>('h5')

  const { setUserInfo, setToken, setPlatform } = useUserStore()
  const { getSiteName, siteConfig } = useConfigStore()

  useLoad(() => {
    console.log('Login page loaded.')
    // 自动检测当前平台
    const env = Taro.getEnv()
    if (env === Taro.ENV_TYPE.WEAPP) {
      setDetectedPlatform('miniprogram')
    } else if (env === Taro.ENV_TYPE.WEB) {
      if (typeof window !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)) {
        setDetectedPlatform('wechat_h5')
      } else {
        setDetectedPlatform('h5')
      }
    }
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
      console.log('登录/注册请求:', { url, method: 'POST', data: { mobile: phone, code, role: selectedRole, platform: detectedPlatform } })
      const res = await Network.request({
        url,
        method: 'POST',
        data: { mobile: phone, code, role: selectedRole, platform: detectedPlatform }
      })
      console.log('登录/注册响应:', res.data)

      const result = res.data
      if (result.success || result.code === 200) {
        const { token, user } = result.data || result
        setToken(token)
        setUserInfo({ ...user, platform: detectedPlatform })
        setPlatform(detectedPlatform)
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

  // 角色选择页面
  if (step === 'role') {
    return (
      <View className="login-page">
        <View className="login-header">
          <Text className="login-title">{getSiteName()}成长平台</Text>
          <Text className="login-subtitle">选择您的身份，开启专属服务</Text>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-lg font-semibold mb-3">请选择您的身份</Text>
          {roleOptions.map((role) => {
            const RoleIcon = role.icon
            return (
              <Card 
                key={role.id} 
                className={`mb-3 ${selectedRole === role.id ? 'border-2 border-blue-500' : ''}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardContent className="p-4">
                  <View className="flex items-center">
                    <View 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <RoleIcon size={24} color={role.color} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-lg font-semibold">{role.name}</Text>
                      <Text className="text-sm text-gray-500 mt-1">{role.desc}</Text>
                    </View>
                    {selectedRole === role.id && (
                      <View className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={16} color="white" />
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )
          })}

          <Button
            className="w-full mt-6"
            onClick={() => setStep('form')}
          >
            下一步
          </Button>
        </View>
      </View>
    )
  }

  // 登录/注册表单页面
  const siteName = getSiteName()
  const selectedRoleInfo = roleOptions.find(r => r.id === selectedRole)

  return (
    <View className="login-page">
      <View className="login-header">
        <Text className="login-title">{siteName}成长平台</Text>
        <Text className="login-subtitle">{siteConfig.site_description || '连接优质教育资源，助力孩子成长'}</Text>
      </View>

      {/* 已选身份 */}
      <View className="px-4 -mt-2 mb-2">
        <View className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <View className="flex items-center gap-3">
            <Badge variant="outline">
              {selectedRoleInfo?.name}
            </Badge>
          </View>
          <Text className="text-sm text-blue-500" onClick={() => setStep('role')}>
            修改
          </Text>
        </View>
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

  // 切换登录/注册
  function toggleMode() {
    setIsRegister(!isRegister)
    setCode('')
  }
}

export default LoginPage
