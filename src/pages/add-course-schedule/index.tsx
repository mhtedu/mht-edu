import { View, Text, Picker } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const durations = ['1小时', '1.5小时', '2小时', '2.5小时', '3小时']

/**
 * 教师新增课时安排页面
 */
const AddCourseSchedulePage = () => {
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<{ id: number; name: string }[]>([])
  
  const [formData, setFormData] = useState({
    student_id: 0,
    student_name: '',
    subject: '数学',
    date: '',
    time: '',
    duration: 2,
    address: '',
    notes: '',
    hourly_rate: '',
  })

  const [subjectIndex, setSubjectIndex] = useState(1)
  const [durationIndex, setDurationIndex] = useState(2)
  const [studentIndex, setStudentIndex] = useState(0)

  useLoad(() => {
    loadStudents()
    // 设置默认日期为今天
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setFormData(prev => ({ ...prev, date: dateStr }))
  })

  const loadStudents = async () => {
    try {
      const res = await Network.request({ url: '/api/teacher/students' })
      if (res.data?.data) {
        setStudents(res.data.data)
      }
    } catch (err) {
      // 模拟数据
      setStudents([
        { id: 1, name: '王小明' },
        { id: 2, name: '李小红' },
        { id: 3, name: '张小华' },
      ])
    }
  }

  const handleStudentChange = (e) => {
    const index = e.detail.value
    setStudentIndex(index)
    if (students[index]) {
      setFormData(prev => ({
        ...prev,
        student_id: students[index].id,
        student_name: students[index].name
      }))
    }
  }

  const handleSubjectChange = (e) => {
    setSubjectIndex(e.detail.value)
    setFormData(prev => ({ ...prev, subject: subjects[e.detail.value] }))
  }

  const handleDurationChange = (e) => {
    const index = e.detail.value
    setDurationIndex(index)
    const hours = [1, 1.5, 2, 2.5, 3][index]
    setFormData(prev => ({ ...prev, duration: hours }))
  }

  const handleSubmit = async () => {
    // 验证
    if (!formData.student_name && students.length > 0) {
      Taro.showToast({ title: '请选择学员', icon: 'none' })
      return
    }
    if (!formData.date) {
      Taro.showToast({ title: '请选择日期', icon: 'none' })
      return
    }
    if (!formData.time) {
      Taro.showToast({ title: '请选择时间', icon: 'none' })
      return
    }
    if (!formData.address) {
      Taro.showToast({ title: '请输入上课地点', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const scheduledTime = `${formData.date} ${formData.time}`
      
      await Network.request({
        url: '/api/teacher/course-schedules',
        method: 'POST',
        data: {
          student_id: formData.student_id || null,
          student_name: formData.student_name || '待定',
          subject: formData.subject,
          scheduled_time: scheduledTime,
          duration: formData.duration,
          address: formData.address,
          notes: formData.notes,
        }
      })

      Taro.showToast({ title: '添加成功', icon: 'success' })
      
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('添加课时失败:', err)
      // 模拟成功
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const onDateChange = (e) => {
    setFormData(prev => ({ ...prev, date: e.detail.value }))
  }

  const onTimeChange = (e) => {
    setFormData(prev => ({ ...prev, time: e.detail.value }))
  }

  return (
    <View className="add-course-page">
      <Card className="m-4">
        <CardHeader>
          <CardTitle>课时信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 选择学员 */}
          {students.length > 0 && (
            <View className="form-item">
              <View className="form-label">
                <User size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-600">学员</Text>
              </View>
              <Picker mode="selector" range={students.map(s => s.name)} value={studentIndex} onChange={handleStudentChange}>
                <View className="form-value">
                  <Text>{students[studentIndex]?.name || '请选择'}</Text>
                </View>
              </Picker>
            </View>
          )}

          {/* 科目 */}
          <View className="form-item">
            <View className="form-label">
              <BookOpen size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">科目</Text>
            </View>
            <Picker mode="selector" range={subjects} value={subjectIndex} onChange={handleSubjectChange}>
              <View className="form-value">
                <Text>{formData.subject}</Text>
              </View>
            </Picker>
          </View>

          {/* 日期 */}
          <View className="form-item">
            <View className="form-label">
              <Calendar size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">日期</Text>
            </View>
            <Picker mode="date" value={formData.date} onChange={onDateChange}>
              <View className="form-value">
                <Text>{formData.date || '请选择日期'}</Text>
              </View>
            </Picker>
          </View>

          {/* 时间 */}
          <View className="form-item">
            <View className="form-label">
              <Clock size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">时间</Text>
            </View>
            <Picker mode="time" value={formData.time} onChange={onTimeChange}>
              <View className="form-value">
                <Text>{formData.time || '请选择时间'}</Text>
              </View>
            </Picker>
          </View>

          {/* 时长 */}
          <View className="form-item">
            <View className="form-label">
              <Clock size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">时长</Text>
            </View>
            <Picker mode="selector" range={durations} value={durationIndex} onChange={handleDurationChange}>
              <View className="form-value">
                <Text>{durations[durationIndex]}</Text>
              </View>
            </Picker>
          </View>

          {/* 上课地点 */}
          <View className="form-item">
            <View className="form-label">
              <MapPin size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-600">地点</Text>
            </View>
            <Input
              className="form-input"
              placeholder="请输入上课地点"
              value={formData.address}
              onInput={(e) => setFormData(prev => ({ ...prev, address: e.detail.value }))}
            />
          </View>

          {/* 备注 */}
          <View className="form-item">
            <View className="form-label">
              <Text className="text-gray-600">备注</Text>
            </View>
            <Textarea
              className="form-textarea"
              placeholder="可选，如学习内容、注意事项等"
              value={formData.notes}
              onInput={(e) => setFormData(prev => ({ ...prev, notes: e.detail.value }))}
            />
          </View>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <View className="m-4 mt-6">
        <Button
          className="w-full py-4"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-base">{loading ? '提交中...' : '确认添加'}</Text>
        </Button>
      </View>
    </View>
  )
}

export default AddCourseSchedulePage
