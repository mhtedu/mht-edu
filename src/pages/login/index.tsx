import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, GraduationCap, BookOpen, Phone, Lock } from 'lucide-react-taro';
import './index.css';

// 用户角色: 0-家长, 1-教师
type UserRole = 0 | 1;

/**
 * 登录注册页面
 */
const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 初始化：读取之前保存的角色
  useEffect(() => {
    const savedRole = Taro.getStorageSync('userRole');
    if (savedRole !== '' && savedRole !== undefined && savedRole !== null) {
      setSelectedRole(savedRole as UserRole);
    }
  }, []);

  // 发送验证码
  const handleSendCode = () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (countdown > 0) return;

    // 模拟发送验证码
    Taro.showToast({ title: '验证码已发送', icon: 'success' });
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 登录/注册
  const handleSubmit = async () => {
    if (!phone || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    if (!code || code.length < 4) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    setLoading(true);

    try {
      // 模拟登录/注册
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 保存用户信息
      Taro.setStorageSync('token', 'mock_token_' + Date.now());
      Taro.setStorageSync('userRole', selectedRole);
      Taro.setStorageSync('userPhone', phone);
      if (nickname) {
        Taro.setStorageSync('userNickname', nickname);
      }

      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });

      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (error) {
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // 微信登录
  const handleWechatLogin = () => {
    Taro.showModal({
      title: '微信登录',
      content: '即将使用微信账号登录',
      success: (res) => {
        if (res.confirm) {
          // 模拟微信登录
          Taro.setStorageSync('token', 'wechat_token_' + Date.now());
          Taro.setStorageSync('userRole', selectedRole);
          Taro.switchTab({ url: '/pages/index/index' });
        }
      },
    });
  };

  return (
    <View className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600">
      {/* Logo区域 */}
      <View className="flex flex-col items-center pt-20 pb-10">
        <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4">
          <Text className="text-blue-500 text-3xl font-bold">棉</Text>
        </View>
        <Text className="text-white text-2xl font-bold">棉花糖教育</Text>
        <Text className="text-blue-100 text-sm mt-2">专业家教信息撮合平台</Text>
      </View>

      {/* 表单卡片 */}
      <View className="mx-4">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            {/* 模式切换 */}
            <View className="flex flex-row mb-6">
              <View
                className={`flex-1 py-2 border-b-2 ${
                  mode === 'login' ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setMode('login')}
              >
                <Text className={`text-center ${mode === 'login' ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
                  登录
                </Text>
              </View>
              <View
                className={`flex-1 py-2 border-b-2 ${
                  mode === 'register' ? 'border-blue-500' : 'border-transparent'
                }`}
                onClick={() => setMode('register')}
              >
                <Text className={`text-center ${mode === 'register' ? 'text-blue-500 font-semibold' : 'text-gray-400'}`}>
                  注册
                </Text>
              </View>
            </View>

            {/* 角色选择 - 登录和注册都显示 */}
            <View className="mb-6">
              <Text className="text-gray-600 text-sm mb-3">
                {mode === 'login' ? '选择您的身份' : '选择您的身份'}
              </Text>
              <View className="flex flex-row gap-3">
                <View
                  className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center ${
                    selectedRole === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRole(0)}
                >
                  <GraduationCap size={32} color={selectedRole === 0 ? '#2563EB' : '#9CA3AF'} />
                  <Text className={`mt-2 ${selectedRole === 0 ? 'text-blue-500 font-semibold' : 'text-gray-500'}`}>
                    我是家长
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">找老师辅导孩子</Text>
                </View>
                <View
                  className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center ${
                    selectedRole === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRole(1)}
                >
                  <BookOpen size={32} color={selectedRole === 1 ? '#2563EB' : '#9CA3AF'} />
                  <Text className={`mt-2 ${selectedRole === 1 ? 'text-blue-500 font-semibold' : 'text-gray-500'}`}>
                    我是教师
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">接单授课赚钱</Text>
                </View>
              </View>
            </View>

            {/* 手机号输入 */}
            <View className="mb-4">
              <View className="flex flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Phone size={20} color="#9CA3AF" className="mr-3" />
                <Input
                  className="flex-1 bg-transparent"
                  type="number"
                  placeholder="请输入手机号"
                  maxlength={11}
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                />
              </View>
            </View>

            {/* 验证码输入 */}
            <View className="mb-4">
              <View className="flex flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                <Lock size={20} color="#9CA3AF" className="mr-3" />
                <Input
                  className="flex-1 bg-transparent"
                  type="number"
                  placeholder="请输入验证码"
                  maxlength={6}
                  value={code}
                  onInput={(e) => setCode(e.detail.value)}
                />
                <View
                  className={`px-3 py-1 rounded ${countdown > 0 ? 'bg-gray-300' : 'bg-blue-500'}`}
                  onClick={handleSendCode}
                >
                  <Text className="text-white text-sm">
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 昵称输入 - 注册时显示 */}
            {mode === 'register' && (
              <View className="mb-4">
                <View className="flex flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                  <User size={20} color="#9CA3AF" className="mr-3" />
                  <Input
                    className="flex-1 bg-transparent"
                    placeholder="请输入昵称"
                    maxlength={20}
                    value={nickname}
                    onInput={(e) => setNickname(e.detail.value)}
                  />
                </View>
              </View>
            )}

            {/* 登录/注册按钮 */}
            <Button
              className="w-full bg-blue-500 rounded-xl py-4 mt-4"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Text className="text-white font-semibold">
                {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
              </Text>
            </Button>

            {/* 微信登录 */}
            <View className="flex flex-col items-center mt-6">
              <View className="flex flex-row items-center w-full">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-4 text-gray-400 text-sm">其他登录方式</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>
              <View
                className="mt-4 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
                onClick={handleWechatLogin}
              >
                <Text className="text-white text-xl font-bold">微</Text>
              </View>
            </View>

            {/* 协议 */}
            <View className="flex flex-row items-center justify-center mt-6">
              <Text className="text-gray-400 text-xs">
                {mode === 'register' ? '注册即表示同意' : '登录即表示同意'}
              </Text>
              <Text className="text-blue-500 text-xs ml-1">《用户协议》</Text>
              <Text className="text-gray-400 text-xs mx-1">和</Text>
              <Text className="text-blue-500 text-xs">《隐私政策》</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部信息 */}
      <View className="flex flex-col items-center mt-10 pb-10">
        <Text className="text-blue-100 text-xs">客服热线：400-888-8888</Text>
        <Text className="text-blue-100 text-xs mt-2">工作时间：9:00-21:00</Text>
      </View>
    </View>
  );
};

export default LoginPage;
