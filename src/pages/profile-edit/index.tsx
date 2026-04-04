import { View, Text, ScrollView, Image, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { User, Plus, Pencil, Trash2, Calendar, BookOpen, School } from 'lucide-react-taro'

interface Child {
  id: number
  name: string
  gender: number
  birth_date: string
  grade: string
  school: string
  subjects: string
  notes: string
}

interface UserInfo {
  id: number
  nickname: string
  mobile: string
  avatar: string
  gender: number
}

const genderOptions = ['未设置', '男', '女']
const gradeOptions = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级',
  '小学五年级', '小学六年级', '初一', '初二', '初三',
  '高一', '高二', '高三'
]

/**
 * 个人资料编辑页面
 */
export default function ProfileEditPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(false)

  // 编辑孩子的状态
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childForm, setChildForm] = useState({
    name: '',
    gender: 0,
    birth_date: '',
    grade: '',
    school: '',
    subjects: '',
    notes: '',
  })

  useDidShow(() => {
    loadData()
  })

  const loadData = async () => {
    try {
      // 获取用户信息
      const userRes = await Network.request({ url: '/api/user/info' }) as any
      if (userRes) {
        setUserInfo({
          id: userRes.id,
          nickname: userRes.nickname || '',
          mobile: userRes.mobile || '',
          avatar: userRes.avatar || '',
          gender: userRes.gender || 0,
        })
      }

      // 获取孩子列表
      const childrenRes = await Network.request({ url: '/api/user/children' })
      setChildren(Array.isArray(childrenRes) ? childrenRes : [])
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleUpdateUserInfo = async () => {
    if (!userInfo) return

    setLoading(true)
    try {
      await Network.request({
        url: '/api/user/info',
        method: 'PUT',
        data: {
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          gender: userInfo.gender,
        },
      })

      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddChild = () => {
    setEditingChild(null)
    setChildForm({
      name: '',
      gender: 1,
      birth_date: '',
      grade: '',
      school: '',
      subjects: '',
      notes: '',
    })
    setShowChildForm(true)
  }

  const handleEditChild = (child: Child) => {
    setEditingChild(child)
    setChildForm({
      name: child.name,
      gender: child.gender || 1,
      birth_date: child.birth_date || '',
      grade: child.grade || '',
      school: child.school || '',
      subjects: child.subjects || '',
      notes: child.notes || '',
    })
    setShowChildForm(true)
  }

  const handleSaveChild = async () => {
    if (!childForm.name) {
      Taro.showToast({ title: '请输入孩子姓名', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      if (editingChild) {
        // 更新孩子
        await Network.request({
          url: `/api/user/children/${editingChild.id}`,
          method: 'PUT',
          data: childForm,
        })
      } else {
        // 添加孩子
        await Network.request({
          url: '/api/user/children',
          method: 'POST',
          data: childForm,
        })
      }

      Taro.showToast({ title: '保存成功', icon: 'success' })
      setShowChildForm(false)
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChild = async (childId: number) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个孩子的信息吗？',
    })

    if (!res.confirm) return

    try {
      await Network.request({
        url: `/api/user/children/${childId}/delete`,
        method: 'POST',
      })

      Taro.showToast({ title: '删除成功', icon: 'success' })
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  // 计算年龄
  const getAge = (birthDate: string) => {
    if (!birthDate) return ''
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age > 0 ? `${age}岁` : ''
  }

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50">
      {/* 用户基本信息 */}
      <View className="bg-white p-4 mb-3">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">基本信息</Text>
          <Button
            size="sm"
            onClick={handleUpdateUserInfo}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </View>

        {/* 头像 */}
        <View className="flex items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600 w-20">头像</Text>
          <View className="flex-1 flex items-center justify-end">
            {userInfo?.avatar ? (
              <Image
                src={userInfo.avatar}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={24} color="#3B82F6" />
              </View>
            )}
          </View>
        </View>

        {/* 昵称 */}
        <View className="flex items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600 w-20">昵称</Text>
          <View className="flex-1">
            <Input
              value={userInfo?.nickname || ''}
              placeholder="请输入昵称"
              onInput={(e) => setUserInfo({ ...userInfo!, nickname: e.detail.value })}
              className="text-right"
            />
          </View>
        </View>

        {/* 手机号 */}
        <View className="flex items-center py-3 border-b border-gray-100">
          <Text className="text-gray-600 w-20">手机号</Text>
          <Text className="flex-1 text-right text-gray-800">
            {userInfo?.mobile?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '-'}
          </Text>
        </View>

        {/* 性别 */}
        <View className="flex items-center py-3">
          <Text className="text-gray-600 w-20">性别</Text>
          <View className="flex-1 flex justify-end">
            <Picker
              mode="selector"
              range={genderOptions}
              value={userInfo?.gender || 0}
              onChange={(e) => setUserInfo({ ...userInfo!, gender: parseInt(e.detail.value as string) })}
            >
              <View className="px-3 py-2 bg-gray-50 rounded-lg">
                <Text className="text-gray-800">
                  {genderOptions[userInfo?.gender || 0]}
                </Text>
              </View>
            </Picker>
          </View>
        </View>
      </View>

      {/* 孩子信息 */}
      <View className="bg-white p-4">
        <View className="flex items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-800">孩子信息</Text>
          <Button size="sm" onClick={handleAddChild}>
            <Plus size={16} color="#fff" className="mr-1" />
            添加孩子
          </Button>
        </View>

        {children.length === 0 ? (
          <View className="py-8 text-center">
            <Text className="text-gray-400">暂无孩子信息</Text>
            <Text className="block text-gray-400 text-sm mt-1">
              添加孩子信息，发布需求时可直接选择
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {children.map((child) => (
              <Card key={child.id} className="border border-gray-100">
                <CardContent className="p-3">
                  <View className="flex items-start justify-between">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="font-semibold text-gray-800">{child.name}</Text>
                        <Badge variant={child.gender === 1 ? 'default' : 'secondary'}>
                          {child.gender === 1 ? '男' : '女'}
                        </Badge>
                        {child.birth_date && (
                          <Text className="text-sm text-gray-500">
                            {getAge(child.birth_date)}
                          </Text>
                        )}
                      </View>

                      <View className="flex flex-col gap-1">
                        {child.grade && (
                          <View className="flex items-center gap-1">
                            <BookOpen size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600">{child.grade}</Text>
                          </View>
                        )}
                        {child.school && (
                          <View className="flex items-center gap-1">
                            <School size={14} color="#6B7280" />
                            <Text className="text-sm text-gray-600">{child.school}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditChild(child)}
                      >
                        <Pencil size={16} color="#6B7280" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChild(child.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 孩子编辑弹窗 */}
      {showChildForm && (
        <View className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <View className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-lg font-semibold">
                {editingChild ? '编辑孩子' : '添加孩子'}
              </Text>
            </View>

            <View className="p-4 flex flex-col gap-4">
              {/* 姓名 */}
              <View>
                <Text className="text-gray-600 mb-1">姓名 *</Text>
                <Input
                  value={childForm.name}
                  placeholder="请输入孩子姓名"
                  onInput={(e) => setChildForm({ ...childForm, name: e.detail.value })}
                  className="bg-gray-50 rounded-lg px-3 py-2"
                />
              </View>

              {/* 性别 */}
              <View>
                <Text className="text-gray-600 mb-1">性别</Text>
                <Picker
                  mode="selector"
                  range={['男', '女']}
                  value={childForm.gender === 2 ? 1 : 0}
                  onChange={(e) => setChildForm({ ...childForm, gender: parseInt(e.detail.value as string) === 0 ? 1 : 2 })}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2">
                    <Text className="text-gray-800">
                      {childForm.gender === 2 ? '女' : '男'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 出生日期 */}
              <View>
                <Text className="text-gray-600 mb-1">出生日期</Text>
                <Picker
                  mode="date"
                  value={childForm.birth_date || '2015-01-01'}
                  start="2000-01-01"
                  end="2030-12-31"
                  onChange={(e) => setChildForm({ ...childForm, birth_date: e.detail.value })}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex items-center">
                    <Calendar size={16} color="#6B7280" className="mr-2" />
                    <Text className={childForm.birth_date ? 'text-gray-800' : 'text-gray-400'}>
                      {childForm.birth_date || '请选择出生日期'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 年级 */}
              <View>
                <Text className="text-gray-600 mb-1">年级</Text>
                <Picker
                  mode="selector"
                  range={gradeOptions}
                  value={gradeOptions.indexOf(childForm.grade)}
                  onChange={(e) => setChildForm({ ...childForm, grade: gradeOptions[parseInt(e.detail.value as string)] })}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex items-center">
                    <BookOpen size={16} color="#6B7280" className="mr-2" />
                    <Text className={childForm.grade ? 'text-gray-800' : 'text-gray-400'}>
                      {childForm.grade || '请选择年级'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 学校 */}
              <View>
                <Text className="text-gray-600 mb-1">学校</Text>
                <Input
                  value={childForm.school}
                  placeholder="请输入学校名称"
                  onInput={(e) => setChildForm({ ...childForm, school: e.detail.value })}
                  className="bg-gray-50 rounded-lg px-3 py-2"
                />
              </View>

              {/* 辅导科目 */}
              <View>
                <Text className="text-gray-600 mb-1">需要辅导的科目</Text>
                <Input
                  value={childForm.subjects}
                  placeholder="如：数学、英语"
                  onInput={(e) => setChildForm({ ...childForm, subjects: e.detail.value })}
                  className="bg-gray-50 rounded-lg px-3 py-2"
                />
              </View>
            </View>

            <View className="p-4 border-t border-gray-100 flex gap-3">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setShowChildForm(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveChild}
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
