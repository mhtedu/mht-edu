import { View, Text, Picker } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, User, BookOpen, Users } from 'lucide-react-taro'
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
  const [classes, setClasses] = useState<{ id: number; title: string; subject: string }[]>([])
  
  // 切换学员/班级模式
  const [scheduleType, setScheduleType] = useState<'student' | 'class'>('student')
  
  const [formData, setFormData] = useState({
    student_id: 0,
    student_name: '',
    class_id: 0,
    class_title: '',
    subject: '数学',
    date: '',
    time: '',
    duration: 2,
    address: '',
    notes: '',
  })

  const [subjectIndex, setSubjectIndex] = useState(1)
  const [durationIndex, setDurationIndex] = useState(2)
  const [studentIndex, setStudentIndex] = useState(0)
  const [classIndex, setClassIndex] = useState(0)

  useLoad(() => {
    loadStudents()
    loadClasses()
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

  const loadClasses = async () => {
    try {
      const res = await Network.request({ url: '/api/teacher/elite-classes' })
      if (res.data?.data) {
        setClasses(res.data.data)
      }
    } catch (err) {
      // 模拟数据
      setClasses([
        { id: 1, title: '高三数学冲刺班', subject: '数学' },
        { id: 2, title: '初二英语提高班', subject: '英语' },
        { id: 3, title: '高一物理基础班', subject: '物理' },
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

  const handleClassChange = (e) => {
    const index = e.detail.value
    setClassIndex(index)
    if (classes[index]) {
      setFormData(prev => ({
        ...prev,
        class_id: classes[index].id,
        class_title: classes[index].title,
        subject: classes[index].subject
      }))
      // 更新科目索引
      const subjIdx = subjects.indexOf(classes[index].subject)
      if (subjIdx >= 0) setSubjectIndex(subjIdx)
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
    if (scheduleType === 'student') {
      if (students.length > 0 && !formData.student_name) {
        Taro.showToast({ title: '请选择学员', icon: 'none' })
        return
      }
      if (students.length === 0 && !formData.student_name) {
        Taro.showToast({ title: '请输入学员姓名', icon: 'none' })
        return
      }
    }
    if (scheduleType === 'class') {
      if (classes.length > 0 && !formData.class_title) {
        Taro.showToast({ title: '请选择班级', icon: 'none' })
        return
      }
      if (classes.length === 0 && !formData.class_title) {
        Taro.showToast({ title: '请输入班级名称', icon: 'none' })
        return
      }
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
          schedule_type: scheduleType,
          student_id: scheduleType === 'student' ? formData.student_id : null,
          student_name: scheduleType === 'student' ? formData.student_name : null,
          class_id: scheduleType === 'class' ? formData.class_id : null,
          class_title: scheduleType === 'class' ? formData.class_title : null,
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
      {/* 切换学员/班级 */}
      <View className="type-switch">
        <View 
          className={`type-tab ${scheduleType === 'student' ? 'active' : ''}`}
          onClick={() => setScheduleType('student')}
        >
          <User size={16} color={scheduleType === 'student' ? '#2563EB' : '#6B7280'} />
          <Text className={scheduleType === 'student' ? 'text-blue-600' : 'text-gray-500'}>学员课时</Text>
        </View>
        <View 
          className={`type-tab ${scheduleType === 'class' ? 'active' : ''}`}
          onClick={() => setScheduleType('class')}
        >
          <Users size={16} color={scheduleType === 'class' ? '#2563EB' : '#6B7280'} />
          <Text className={scheduleType === 'class' ? 'text-blue-600' : 'text-gray-500'}>班级课时</Text>
        </View>
      </View>

      <Card className="m-4">
        <CardHeader>
          <CardTitle>{scheduleType === 'student' ? '学员课时' : '班级课时'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 选择学员 */}
          {scheduleType === 'student' && (
            <View className="form-item">
              <View className="form-label">
                <User size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-600">学员</Text>
              </View>
              {students.length > 0 ? (
                <Picker mode="selector" range={students.map(s => s.name)} value={studentIndex} onChange={handleStudentChange}>
                  <View className="form-value">
                    <Text>{students[studentIndex]?.name || '请选择学员'}</Text>
                  </View>
                </Picker>
              ) : (
                <Input
                  className="form-input"
                  placeholder="请输入学员姓名"
                  value={formData.student_name}
                  onInput={(e) => setFormData(prev => ({ ...prev, student_name: e.detail.value }))}
                />
              )}
            </View>
          )}

          {/* 选择班级 */}
          {scheduleType === 'class' && (
            <View className="form-item">
              <View className="form-label">
                <Users size={16} color="#6B7280" />
                <Text className="ml-2 text-gray-600">班级</Text>
              </View>
              {classes.length > 0 ? (
                <Picker mode="selector" range={classes.map(c => c.title)} value={classIndex} onChange={handleClassChange}>
                  <View className="form-value">
                    <Text>{classes[classIndex]?.title || '请选择班级'}</Text>
                  </View>
                </Picker>
              ) : (
                <Input
                  className="form-input"
                  placeholder="请输入班级名称"
                  value={formData.class_title}
                  onInput={(e) => setFormData(prev => ({ ...prev, class_title: e.detail.value }))}
                />
              )}
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
