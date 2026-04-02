import { View, Text, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useLoad, useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { FC } from 'react'
import { useUserStore } from '@/stores/user'
import { Network } from '@/network'
import { getLocation } from '@/utils'
import { MapPin, ChevronDown, ChevronRight, Briefcase, GraduationCap, Wallet, Search, Building2, Crown, Star, Phone, Heart, Calendar, Share2 } from 'lucide-react-taro'

// 需求/订单数据类型
interface DemandItem {
  id: number
  subject: string
  student_grade: string
  gender?: number
  hourly_rate: number
  description: string
  address: string
  distance_text: string
  status: number
  created_at: string
}

// 牛师数据类型
interface TeacherItem {
  id: number
  name: string
  avatar?: string
  subjects: string[]
  hourly_rate: number
  rating: number
  order_count: number
  education: string
  experience: string
  distance_text: string
  tags: string[]
}

// 学科选项
const subjectOptions = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

const HomePage: FC = () => {
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null)
  const [currentRole, setCurrentRole] = useState(1) // 0: 家长端, 1: 牛师端
  const [selectedSubject, setSelectedSubject] = useState('全部')
  const [demands, setDemands] = useState<DemandItem[]>([])
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [listLoading, setListLoading] = useState(false)

  const { isLoggedIn, setLocation: setUserLocation } = useUserStore()

  useLoad(() => {
    console.log('Home page loaded.')
  })

  useDidShow(() => {
    loadInitData()
  })

  usePullDownRefresh(() => {
    loadInitData().finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  const loadInitData = async () => {
    setLoading(true)
    try {
      const loc = await getLocation()
      if (loc) {
        setLocation(loc)
        setUserLocation(loc)
      }
      if (currentRole === 1) {
        await loadNearbyDemands(loc)
      } else {
        await loadNearbyTeachers(loc)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNearbyDemands = async (loc?: { latitude: number; longitude: number } | null) => {
    setListLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10, radius: 50 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      if (selectedSubject !== '全部') {
        params.subject = selectedSubject
      }
      console.log('加载附近需求请求:', { url: '/api/order/nearby', params })
      const res = await Network.request({
        url: '/api/order/nearby',
        data: params
      })
      console.log('加载附近需求响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setDemands(list.map((item: any) => ({
          ...item,
          distance_text: item.distance_text || (item.distance ? 
            (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`) 
            : '')
        })))
      }
    } catch (error) {
      console.error('加载附近需求失败:', error)
      setDemands([
        { id: 1, subject: '数学', student_grade: '高二', gender: 1, hourly_rate: 180, description: '需要数学辅导，目标提高30分，每周两次课', address: '朝阳区望京', distance_text: '1.5km', status: 0, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: 2, subject: '英语', student_grade: '初三', gender: 2, hourly_rate: 150, description: '英语口语和写作辅导，准备中考', address: '海淀区中关村', distance_text: '2.8km', status: 0, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
        { id: 3, subject: '物理', student_grade: '高一', gender: 1, hourly_rate: 200, description: '物理基础薄弱，需要从基础开始辅导', address: '西城区金融街', distance_text: '3.2km', status: 0, created_at: new Date(Date.now() - 8 * 3600000).toISOString() }
      ])
    } finally {
      setListLoading(false)
    }
  }

  const loadNearbyTeachers = async (loc?: { latitude: number; longitude: number } | null) => {
    setListLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 10, radius: 50 }
      if (loc) {
        params.latitude = loc.latitude
        params.longitude = loc.longitude
      }
      if (selectedSubject !== '全部') {
        params.subject = selectedSubject
      }
      console.log('加载附近牛师请求:', { url: '/api/teachers/nearby', params })
      const res = await Network.request({
        url: '/api/teachers/nearby',
        data: params
      })
      console.log('加载附近牛师响应:', res.data)
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.list || []
        setTeachers(list.map((item: any) => ({
          ...item,
          distance_text: item.distance_text || (item.distance ? 
            (item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`) 
            : '')
        })))
      }
    } catch (error) {
      console.error('加载附近牛师失败:', error)
      setTeachers([
        { id: 1, name: '张老师', subjects: ['数学', '物理'], hourly_rate: 200, rating: 4.9, order_count: 128, education: '北京大学硕士', experience: '8年教学经验', distance_text: '1.2km', tags: ['耐心细致', '提分快', '名校背景'] },
        { id: 2, name: '李老师', subjects: ['英语'], hourly_rate: 180, rating: 4.8, order_count: 86, education: '北外硕士', experience: '6年教学经验', distance_text: '2.5km', tags: ['口语地道', '语法扎实', '留学背景'] },
        { id: 3, name: '王老师', subjects: ['语文', '历史'], hourly_rate: 160, rating: 4.7, order_count: 95, education: '北师大本科', experience: '5年教学经验', distance_text: '3.0km', tags: ['亲和力强', '写作辅导', '文史兼修'] }
      ])
    } finally {
      setListLoading(false)
    }
  }

  const handleRefreshLocation = async () => {
    Taro.showLoading({ title: '定位中...' })
    const loc = await getLocation()
    Taro.hideLoading()
    if (loc) {
      setLocation(loc)
      setUserLocation(loc)
      if (currentRole === 1) {
        loadNearbyDemands(loc)
      } else {
        loadNearbyTeachers(loc)
      }
      Taro.showToast({ title: '定位成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '定位失败', icon: 'none' })
    }
  }

  const handleSwitchRole = () => {
    const newRole = currentRole === 0 ? 1 : 0
    setCurrentRole(newRole)
    setSelectedSubject('全部')
    if (newRole === 1) {
      loadNearbyDemands(location)
    } else {
      loadNearbyTeachers(location)
    }
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject)
    if (currentRole === 1) {
      loadNearbyDemands(location)
    } else {
      loadNearbyTeachers(location)
    }
  }

  const goToMember = () => Taro.navigateTo({ url: '/pages/member/index' })
  const goToLogin = () => Taro.navigateTo({ url: '/pages/login/index' })
  const goToTeacherDetail = (id: number) => Taro.navigateTo({ url: `/pages/teacher/detail?id=${id}` })
  const goToOrgList = () => Taro.navigateTo({ url: '/pages/org/list' })
  const goToPublishDemand = () => Taro.navigateTo({ url: '/pages/publish-demand/index' })

  const handleGrabOrder = (demand: DemandItem) => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录后再抢单', confirmText: '去登录', success: (res) => { if (res.confirm) goToLogin() } })
      return
    }
    
    // 检查是否是牛师角色
    const userRole = Taro.getStorageSync('userRole')
    if (userRole !== 1 && userRole !== '1') {
      Taro.showModal({
        title: '提示',
        content: '仅牛师端可以抢单，请切换到牛师端',
        confirmText: '切换角色',
        success: (res) => {
          if (res.confirm) {
            handleSwitchRole()
          }
        }
      })
      return
    }
    
    // 显示详细确认信息
    Taro.showModal({
      title: '确认抢单',
      content: `科目：${demand.subject}\n年级：${demand.student_grade}\n预算：¥${demand.hourly_rate}/小时\n距离：${demand.distance_text}\n\n抢单后家长将看到您的信息并选择合适的牛师匹配。`,
      confirmText: '确认抢单',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '抢单中...' })
          Network.request({ 
            url: `/api/demands/${demand.id}/grab`, 
            method: 'POST' 
          }).then((result) => {
            Taro.hideLoading()
            console.log('抢单响应:', result.data)
            Taro.showToast({ title: '抢单成功', icon: 'success' })
            
            // 刷新列表
            loadNearbyDemands(location)
            
            // 提示跳转
            setTimeout(() => {
              Taro.showModal({
                title: '抢单成功',
                content: '您已成功抢单，家长确认后将开始订单。请前往订单管理查看进度。',
                confirmText: '查看订单',
                cancelText: '继续浏览',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    Taro.navigateTo({ url: '/pages/orders/index' })
                  }
                }
              })
            }, 1500)
          }).catch((err) => {
            Taro.hideLoading()
            console.error('抢单失败:', err)
            Taro.showToast({ title: '抢单失败，请重试', icon: 'none' })
          })
        }
      }
    })
  }

  const handleContactTeacher = (teacher: TeacherItem) => {
    if (!isLoggedIn) {
      Taro.showModal({ title: '提示', content: '请先登录后再联系牛师', confirmText: '去登录', success: (res) => { if (res.confirm) goToLogin() } })
      return
    }
    Taro.showModal({ title: '联系方式', content: `即将查看${teacher.name}的联系方式`, confirmText: '查看', success: (res) => { if (res.confirm) goToTeacherDetail(teacher.id) } })
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  const teacherEntries = [
    { icon: <Briefcase size={22} color="#10B981" />, text: '工作台', bgColor: 'bg-green-100', action: () => Taro.navigateTo({ url: '/pages/teacher-workbench/index' }) },
    { icon: <GraduationCap size={22} color="#8B5CF6" />, text: '创建牛师班', bgColor: 'bg-purple-100', action: () => Taro.showToast({ title: '功能开发中', icon: 'none' }) },
    { icon: <Calendar size={22} color="#F59E0B" />, text: '活动', bgColor: 'bg-amber-100', action: () => Taro.navigateTo({ url: '/pages/activities/index' }) },
    { icon: <Wallet size={22} color="#2563EB" />, text: '收益中心', bgColor: 'bg-blue-100', action: () => Taro.navigateTo({ url: '/pages/earnings/index' }) },
  ]

  const parentEntries = [
    { icon: <Search size={22} color="#2563EB" />, text: '找牛师', bgColor: 'bg-blue-100', action: () => Taro.navigateTo({ url: '/pages/teacher/list' }) },
    { icon: <Building2 size={22} color="#10B981" />, text: '找机构', bgColor: 'bg-green-100', action: goToOrgList },
    { icon: <Calendar size={22} color="#F59E0B" />, text: '活动', bgColor: 'bg-amber-100', action: () => Taro.navigateTo({ url: '/pages/activities/index' }) },
    { icon: <Crown size={22} color="#8B5CF6" />, text: '会员中心', bgColor: 'bg-purple-100', action: goToMember },
  ]

  const entries = currentRole === 1 ? teacherEntries : parentEntries

  return (
    <View className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <View className="flex flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <View className="flex flex-row items-center" onClick={handleRefreshLocation}>
          <MapPin size={16} color="#2563EB" />
          <Text className="block text-sm text-blue-600 mx-1">{location?.address?.split(' ')[0] || '北京'}</Text>
          <ChevronDown size={14} color="#2563EB" />
        </View>
        <Text className="block text-base font-semibold text-gray-900">首页</Text>
        <View className="flex flex-row items-center bg-blue-50 px-2 py-1 rounded-full" onClick={handleSwitchRole}>
          <Text className="block text-sm text-blue-600 mr-1">{currentRole === 0 ? '家长端' : '牛师端'}</Text>
          <ChevronDown size={14} color="#2563EB" />
        </View>
      </View>

      <ScrollView scrollY className="h-screen box-border">
        {/* 轮播图区域 */}
        <View className="relative h-36 bg-white">
          <View className="w-[calc(100%-24px)] h-30 mx-auto my-3 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-green-400">
            <Text className="block text-5xl font-light text-white opacity-80">?</Text>
          </View>
          <View className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-row gap-1">
            <View className="w-1 h-1 rounded-full bg-gray-300" />
            <View className="w-4 h-1 rounded-full bg-blue-600" />
            <View className="w-1 h-1 rounded-full bg-gray-300" />
          </View>
        </View>

        {/* 快捷入口 */}
        <View className="flex flex-row justify-around px-4 py-4 bg-white mb-2">
          {entries.map((entry, idx) => (
            <View key={idx} className="flex flex-col items-center" onClick={entry.action}>
              <View className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${entry.bgColor}`}>
                {entry.icon}
              </View>
              <Text className="block text-xs text-gray-700">{entry.text}</Text>
            </View>
          ))}
        </View>

        {/* 内容区域 */}
        <View className="bg-white mb-2">
          <View className="flex flex-row items-center justify-between px-4 py-3">
            <Text className="block text-base font-semibold text-gray-900">{currentRole === 1 ? '附近需求' : '附近牛师'}</Text>
            <View className="flex flex-row items-center">
              <Text className="block text-sm text-gray-400">更多</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>

          {/* 学科分类标签 */}
          <ScrollView scrollX className="whitespace-nowrap px-4 pb-3">
            {subjectOptions.map((subject, idx) => (
              <View 
                key={idx} 
                className={`inline-block px-3 py-1 mr-2 rounded-full ${selectedSubject === subject ? 'bg-blue-600' : 'bg-gray-100'}`}
                onClick={() => handleSubjectChange(subject)}
              >
                <Text className={`block text-sm ${selectedSubject === subject ? 'text-white' : 'text-gray-500'}`}>{subject}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 会员提示条 */}
          <View className="flex flex-row items-center justify-between mx-4 mb-3 px-3 py-2 bg-amber-50 rounded-lg">
            <Text className="block text-xs text-amber-800">开通会员可查看完整信息与联系方式</Text>
            <View className="bg-amber-500 px-2 py-1 rounded-full" onClick={goToMember}>
              <Text className="block text-xs text-white">立即开通</Text>
            </View>
          </View>

          {/* 牛师端 - 需求列表 */}
          {currentRole === 1 && (loading || listLoading ? (
            <View className="py-10 text-center">
              <Text className="block text-sm text-gray-400">加载中...</Text>
            </View>
          ) : demands.length > 0 ? demands.map((demand) => (
            <View key={demand.id} className="mx-4 mb-3 p-3 bg-gray-50 rounded-xl">
              <View className="flex flex-row items-center justify-between mb-2">
                <View className="bg-blue-600 px-3 py-1 rounded">
                  <Text className="block text-sm font-semibold text-white">{demand.subject}</Text>
                </View>
                <View className="bg-blue-100 px-2 py-1 rounded">
                  <Text className="block text-xs text-blue-600">待抢单</Text>
                </View>
              </View>
              <View className="mb-3">
                <View className="flex flex-row items-center justify-between mb-1">
                  <Text className="block text-base font-semibold text-blue-600">¥{demand.hourly_rate}/小时</Text>
                  <Text className="block text-xs text-gray-400">{formatTime(demand.created_at)}</Text>
                </View>
                <View className="flex flex-row items-center justify-between mb-1">
                  <Text className="block text-xs text-gray-500 mr-3">{demand.student_grade}</Text>
                  <Text className="block text-xs text-gray-500 mr-3">{demand.gender === 1 ? '男' : '女'}</Text>
                  <Text className="block text-xs text-blue-600">{demand.distance_text}</Text>
                </View>
                <Text className="block text-sm text-gray-700 leading-relaxed mb-1">{demand.description}</Text>
                <View className="flex flex-row items-center">
                  <MapPin size={12} color="#9CA3AF" />
                  <Text className="block text-xs text-gray-400 ml-1">{demand.address}</Text>
                </View>
              </View>
              <View className="flex flex-row items-center justify-end gap-2 border-t border-gray-200 pt-3">
                <View className="flex flex-row items-center px-3 py-1 border border-gray-200 rounded-full">
                  <Share2 size={14} color="#6B7280" />
                  <Text className="block text-xs text-gray-500 ml-1">分享</Text>
                </View>
                <View className="bg-blue-600 px-5 py-1 rounded-full" onClick={(e) => { e.stopPropagation(); handleGrabOrder(demand) }}>
                  <Text className="block text-sm font-medium text-white">抢单</Text>
                </View>
              </View>
            </View>
          )) : (
            <View className="py-10 text-center">
              <Text className="block text-sm text-gray-400">暂无附近需求</Text>
            </View>
          ))}

          {/* 家长端 - 牛师列表 */}
          {currentRole === 0 && (loading || listLoading ? (
            <View className="py-10 text-center">
              <Text className="block text-sm text-gray-400">加载中...</Text>
            </View>
          ) : teachers.length > 0 ? teachers.map((teacher) => (
            <View key={teacher.id} className="mx-4 mb-3 p-3 bg-gray-50 rounded-xl" onClick={() => goToTeacherDetail(teacher.id)}>
              <View className="flex flex-row mb-3">
                <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-3 shrink-0">
                  <Text className="block text-xl font-semibold text-white">{teacher.name.charAt(0)}</Text>
                </View>
                <View className="flex-1 overflow-hidden">
                  <View className="flex flex-row items-center justify-between mb-1">
                    <Text className="block text-base font-semibold text-gray-900">{teacher.name}</Text>
                    <View className="flex flex-row items-center">
                      <Star size={12} color="#F59E0B" />
                      <Text className="block text-sm text-amber-500 font-medium ml-1">{teacher.rating}</Text>
                    </View>
                  </View>
                  <Text className="block text-sm text-gray-500 mb-1">{teacher.subjects.join(' · ')}</Text>
                  <View className="flex flex-row flex-wrap gap-1">
                    {teacher.tags.slice(0, 3).map((tag, idx) => (
                      <View key={idx} className="bg-blue-50 px-2 py-1 rounded">
                        <Text className="block text-xs text-blue-600">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View className="mb-3">
                <View className="flex flex-row items-center flex-wrap gap-2 mb-1">
                  <Text className="block text-xs text-gray-500">{teacher.education}</Text>
                  <Text className="block text-xs text-gray-500">{teacher.experience}</Text>
                  <Text className="block text-xs text-blue-600 ml-auto">{teacher.distance_text}</Text>
                </View>
                <View className="flex flex-row items-center justify-between">
                  <Text className="block text-base font-semibold text-blue-600">¥{teacher.hourly_rate}/小时</Text>
                  <Text className="block text-xs text-gray-400">已接单{teacher.order_count}单</Text>
                </View>
              </View>
              <View className="flex flex-row items-center justify-end gap-2 border-t border-gray-200 pt-3">
                <View className="flex flex-row items-center px-3 py-1 border border-gray-200 rounded-full" onClick={(e) => { e.stopPropagation(); Taro.showToast({ title: '已收藏', icon: 'success' }) }}>
                  <Heart size={14} color="#6B7280" />
                  <Text className="block text-xs text-gray-500 ml-1">收藏</Text>
                </View>
                <View className="flex flex-row items-center bg-blue-600 px-4 py-1 rounded-full" onClick={(e) => { e.stopPropagation(); handleContactTeacher(teacher) }}>
                  <Phone size={14} color="#fff" />
                  <Text className="block text-sm font-medium text-white ml-1">联系TA</Text>
                </View>
              </View>
            </View>
          )) : (
            <View className="py-10 text-center">
              <Text className="block text-sm text-gray-400">暂无附近牛师</Text>
            </View>
          ))}

          {/* 推荐卡片 */}
          {currentRole === 1 && (
            <>
              <View className="flex flex-row items-center justify-between mx-4 mb-2 p-3 bg-blue-50 rounded-xl" onClick={goToOrgList}>
                <View className="flex flex-col">
                  <View className="inline-block w-fit bg-blue-600 px-2 py-1 rounded mb-1">
                    <Text className="block text-xs text-white">优质机构</Text>
                  </View>
                  <Text className="block text-sm font-semibold text-gray-900 mb-1">合作机构推荐</Text>
                  <Text className="block text-xs text-gray-500">查看平台优质合作机构</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
              <View className="flex flex-row items-center justify-between mx-4 mb-4 p-3 bg-amber-50 rounded-xl">
                <View className="flex flex-col">
                  <View className="inline-block w-fit bg-amber-500 px-2 py-1 rounded mb-1">
                    <Text className="block text-xs text-white">新用户福利</Text>
                  </View>
                  <Text className="block text-sm font-semibold text-gray-900 mb-1">首次抢单立减优惠</Text>
                  <Text className="block text-xs text-gray-500">新用户专享特权</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </>
          )}

          {currentRole === 0 && (
            <>
              <View className="flex flex-row items-center justify-between mx-4 mb-2 p-3 bg-blue-50 rounded-xl" onClick={goToPublishDemand}>
                <View className="flex flex-col">
                  <View className="inline-block w-fit bg-blue-600 px-2 py-1 rounded mb-1">
                    <Text className="block text-xs text-white">快速匹配</Text>
                  </View>
                  <Text className="block text-sm font-semibold text-gray-900 mb-1">发布您的需求</Text>
                  <Text className="block text-xs text-gray-500">让优质牛师主动联系您</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
              <View className="flex flex-row items-center justify-between mx-4 mb-4 p-3 bg-amber-50 rounded-xl" onClick={goToMember}>
                <View className="flex flex-col">
                  <View className="inline-block w-fit bg-amber-500 px-2 py-1 rounded mb-1">
                    <Text className="block text-xs text-white">会员权益</Text>
                  </View>
                  <Text className="block text-sm font-semibold text-gray-900 mb-1">开通会员享更多权益</Text>
                  <Text className="block text-xs text-gray-500">无限次查看联系方式</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </>
          )}
        </View>

        {/* 热门活动区域 */}
        <View className="bg-white pb-4">
          <View className="flex flex-row items-center justify-between px-4 py-3">
            <Text className="block text-base font-semibold text-gray-900">热门活动</Text>
            <View className="flex flex-row items-center">
              <Text className="block text-sm text-gray-400">更多</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </View>
          <ScrollView scrollX className="whitespace-nowrap px-4">
            <View className="inline-block w-64 p-4 rounded-xl mr-3 bg-gradient-to-br from-green-500 to-green-600">
              <View className="inline-block bg-white bg-opacity-30 px-2 py-1 rounded mb-2">
                <Text className="block text-xs text-white">限时活动</Text>
              </View>
              <Text className="block text-base font-semibold text-white mb-2">新人专属礼包</Text>
              <View className="flex flex-row items-center">
                <Briefcase size={12} color="#fff" />
                <Text className="block text-xs text-white ml-1">128人参与</Text>
              </View>
            </View>
            <View className="inline-block w-64 p-4 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600">
              <View className="inline-block bg-white bg-opacity-30 px-2 py-1 rounded mb-2">
                <Text className="block text-xs text-white">会员专享</Text>
              </View>
              <Text className="block text-base font-semibold text-white mb-2">会员日特惠</Text>
              <View className="flex flex-row items-center">
                <Crown size={12} color="#fff" />
                <Text className="block text-xs text-white ml-1">256人参与</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* 未登录提示 */}
        {!isLoggedIn && (
          <View className="flex flex-row items-center justify-between mx-4 my-4 p-3 bg-blue-100 rounded-xl">
            <Text className="block text-sm text-blue-800">登录后可查看更多个性化推荐</Text>
            <View className="bg-blue-600 px-3 py-1 rounded-full" onClick={goToLogin}>
              <Text className="block text-xs text-white">立即登录</Text>
            </View>
          </View>
        )}

        <View className="h-5" />
      </ScrollView>
    </View>
  )
}

export default HomePage
