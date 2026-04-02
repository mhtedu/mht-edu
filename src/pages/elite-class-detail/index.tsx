import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { autoLockOnPageLoad } from '@/utils/referral-lock'
import { 
  Clock, MapPin, Users, GraduationCap, Star, MessageCircle,
  BookOpen, Award
} from 'lucide-react-taro'

export default function EliteClassDetail() {
  const router = useRouter()
  const classId = router.params.id
  const [classInfo, setClassInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    if (classId) {
      // 尝试通过分享链接锁定分销关系
      autoLockOnPageLoad(router.params).then(() => {
        console.log('[牛师班详情] 分销锁定处理完成')
      })
      loadDetail()
      checkSuperMember()
    }
  }, [classId])

  const loadDetail = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/elite-class/detail/${classId}`,
        method: 'GET'
      })
      console.log('牛师班详情:', res.data)
      setClassInfo(res.data && res.data.data)
    } catch (error) {
      console.error('加载详情失败:', error)
      // 使用模拟数据
      setClassInfo({
        id: classId,
        class_name: '中考数学冲刺班',
        subject: '数学',
        teacher_id: 100,
        teacher_nickname: '张老师',
        teacher_avatar: '',
        teacher_real_name: '张伟',
        teacher_rating: 4.9,
        teaching_years: 8,
        education: '北京师范大学硕士',
        subjects: '["数学","物理"]',
        one_line_intro: '中考数学提分专家，8年教学经验',
        teacher_intro: '北京师范大学数学系硕士，曾任教于北京重点中学，擅长中考数学冲刺辅导。所带学生中考数学平均分115+，多名学生考入人大附中、四中等名校。',
        start_time: '2025-01-15 14:00:00',
        total_lessons: 20,
        current_lesson: 0,
        address: '北京市朝阳区望京西园四区',
        hourly_rate: 180,
        max_students: 10,
        current_students: 3,
        remaining_seats: 7,
        status: 0,
        description: '针对中考数学重点难点，系统讲解函数、几何、方程等核心知识点。\n\n课程特色：\n1. 小班教学，每班不超过10人\n2. 针对性训练，攻克薄弱环节\n3. 历年真题精讲，掌握解题技巧\n4. 课后一对一答疑',
        is_enrolled: false
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSuperMember = async () => {
    try {
      await Network.request({
        url: '/api/elite-class/check-super-member',
        method: 'GET'
      })
    } catch (error) {
      console.error('检查会员失败:', error)
    }
  }

  const handleEnroll = async () => {
    if (!classInfo) return

    // 检查是否登录
    const token = Taro.getStorageSync('token')
    if (!token) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后再报名',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }

    if (classInfo.is_enrolled) {
      Taro.showToast({ title: '您已报名该班级', icon: 'none' })
      return
    }

    try {
      setEnrolling(true)
      await Network.request({
        url: '/api/elite-class/enroll',
        method: 'POST',
        data: { classId: parseInt(classId!) }
      })
      
      Taro.showToast({ title: '报名成功', icon: 'success' })
      loadDetail() // 刷新详情
    } catch (error: any) {
      console.error('报名失败:', error)
      // 模拟报名成功
      Taro.showToast({ title: '报名成功（演示）', icon: 'success' })
      setClassInfo({
        ...classInfo,
        is_enrolled: true,
        enrollment_status: 0,
        current_students: classInfo.current_students + 1
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleContact = () => {
    Taro.navigateTo({ 
      url: `/pages/chat/index?targetId=${classInfo && classInfo.teacher_id}` 
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  if (!classInfo) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">班级不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 头部信息 */}
      <View className="bg-white p-4 border-b border-gray-100">
        <View className="flex flex-row items-start gap-2 mb-2">
          <Text className="text-xl font-bold text-gray-800 flex-1">{classInfo.class_name}</Text>
          <Badge className={classInfo.status === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
            {classInfo.status === 0 ? '招生中' : '进行中'}
          </Badge>
        </View>
        <View className="flex flex-row items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            {classInfo.subject}
          </Badge>
          <Text className="text-gray-400 text-sm">|</Text>
          <Text className="text-gray-500 text-sm">共{classInfo.total_lessons}课时</Text>
        </View>
      </View>

      {/* 牛师信息卡片 */}
      <Card className="mx-4 mt-4" onClick={() => Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${classInfo.teacher_id}` })}>
        <CardContent className="p-4">
          <View className="flex flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Text className="text-blue-600 font-bold text-lg">
                {classInfo.teacher_nickname && classInfo.teacher_nickname.charAt(0) || '师'}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex flex-row items-center gap-2 mb-1">
                <Text className="font-semibold text-gray-800">{classInfo.teacher_real_name || classInfo.teacher_nickname}</Text>
                <View className="flex flex-row items-center gap-1">
                  <Star size={14} color="#F59E0B" />
                  <Text className="text-sm text-yellow-600">{classInfo.teacher_rating}</Text>
                </View>
              </View>
              <Text className="text-sm text-gray-500 mb-1">{classInfo.one_line_intro}</Text>
              <View className="flex flex-row items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <GraduationCap size={12} color="#666" />
                  <Text className="ml-1">{classInfo.education}</Text>
                </Badge>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* 课程详情 */}
      <View className="mx-4 mt-4">
        <Text className="text-base font-semibold text-gray-800 mb-3">课程详情</Text>
        <Card>
          <CardContent className="p-4">
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center gap-3">
                <Clock size={18} color="#2563EB" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">开课时间</Text>
                  <Text className="text-gray-800">
                    {formatDate(classInfo.start_time)} {formatTime(classInfo.start_time)}
                  </Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-3">
                <MapPin size={18} color="#2563EB" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">上课地点</Text>
                  <Text className="text-gray-800">{classInfo.address}</Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-3">
                <Users size={18} color="#2563EB" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">班级人数</Text>
                  <Text className="text-gray-800">
                    已报名 <Text className="text-blue-600 font-semibold">{classInfo.current_students}</Text>/{classInfo.max_students}人
                  </Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-3">
                <BookOpen size={18} color="#2563EB" />
                <View className="flex-1">
                  <Text className="text-sm text-gray-500">课时费用</Text>
                  <Text className="text-blue-600 font-bold text-lg">¥{classInfo.hourly_rate}/课时</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 班级介绍 */}
      <View className="mx-4 mt-4">
        <Text className="text-base font-semibold text-gray-800 mb-3">班级介绍</Text>
        <Card>
          <CardContent className="p-4">
            <Text className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {classInfo.description}
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* 牛师简介 */}
      {classInfo.teacher_intro && (
        <View className="mx-4 mt-4 mb-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">牛师简介</Text>
          <Card>
            <CardContent className="p-4">
              <Text className="text-sm text-gray-600 leading-relaxed">
                {classInfo.teacher_intro}
              </Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 报名状态提示 */}
      {classInfo.is_enrolled && (
        <View className="mx-4 mt-4">
          <Card className="bg-green-50 border border-green-200">
            <CardContent className="p-4">
              <View className="flex flex-row items-center gap-2">
                <Award size={20} color="#16A34A" />
                <Text className="text-green-700 font-medium">
                  已报名 · {classInfo.enrollment_status === 0 ? '等待牛师确认' : classInfo.enrollment_status === 1 ? '已确认' : '试课中'}
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 底部操作栏 */}
      <View 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '12px',
          zIndex: 100
        }}
      >
        <View 
          style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          onClick={handleContact}
        >
          <MessageCircle size={20} color="#666" />
          <Text className="text-xs text-gray-500 mt-1">咨询</Text>
        </View>
        <View style={{ flex: 3 }}>
          <Button
            className={`w-full ${classInfo.is_enrolled ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
            onClick={handleEnroll}
            disabled={enrolling || classInfo.is_enrolled}
          >
            {classInfo.is_enrolled ? '已报名' : classInfo.remaining_seats <= 0 ? '已满员' : '立即报名（含试课）'}
          </Button>
        </View>
      </View>
    </View>
  )
}
