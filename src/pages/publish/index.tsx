import { View, Text, Picker } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, DollarSign, User, BookOpen } from 'lucide-react-taro';
import './index.css';

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
const genderOptions = ['男', '女'];

/**
 * 发布需求页面 - 家长发布家教需求
 */
const PublishPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '数学',
    student_grade: '初二',
    student_gender: '男',
    hourly_rate: '',
    address: '',
    description: '',
  });
  const [subjectIndex, setSubjectIndex] = useState(1);
  const [gradeIndex, setGradeIndex] = useState(7);
  const [genderIndex, setGenderIndex] = useState(0);

  const handleSubmit = async () => {
    // 验证
    if (!formData.hourly_rate) {
      Taro.showToast({ title: '请输入课时费', icon: 'none' });
      return;
    }
    if (!formData.address) {
      Taro.showToast({ title: '请输入上课地址', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      // 获取位置
      let latitude = 39.995;
      let longitude = 116.473;
      
      try {
        const location = await Taro.getLocation({ type: 'gcj02' });
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (e) {
        console.log('获取位置失败，使用默认位置');
      }

      const res = await Network.request({
        url: '/api/orders',
        method: 'POST',
        data: {
          parent_id: 1, // TODO: 从登录状态获取
          subject: formData.subject,
          hourly_rate: formData.hourly_rate,
          student_gender: genderIndex === 0 ? 1 : 2,
          student_grade: formData.student_grade,
          address: formData.address,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          description: formData.description,
        },
      });

      if (res.data) {
        Taro.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('发布失败:', error);
      Taro.showToast({ title: '发布失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-blue-500 px-4 py-6">
        <Text className="text-white text-xl font-bold">发布家教需求</Text>
        <Text className="text-blue-100 text-sm mt-1">填写详细信息，让优质老师找到您</Text>
      </View>

      <View className="p-4">
        {/* 学科选择 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <BookOpen size={18} color="#2563EB" className="mr-2" />
              <CardTitle>辅导科目</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Picker
              mode="selector"
              range={subjects}
              value={subjectIndex}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setSubjectIndex(index);
                setFormData({ ...formData, subject: subjects[index] });
              }}
            >
              <View className="bg-gray-50 rounded-lg px-4 py-3 flex flex-row justify-between items-center">
                <Text>{formData.subject}</Text>
                <Text className="text-gray-400">▼</Text>
              </View>
            </Picker>
          </CardContent>
        </Card>

        {/* 学生信息 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <User size={18} color="#2563EB" className="mr-2" />
              <CardTitle>学生信息</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-600">年级</Text>
                <Picker
                  mode="selector"
                  range={grades}
                  value={gradeIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value);
                    setGradeIndex(index);
                    setFormData({ ...formData, student_grade: grades[index] });
                  }}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex flex-row items-center">
                    <Text>{formData.student_grade}</Text>
                    <Text className="text-gray-400 ml-2">▼</Text>
                  </View>
                </Picker>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-600">性别</Text>
                <Picker
                  mode="selector"
                  range={genderOptions}
                  value={genderIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value);
                    setGenderIndex(index);
                    setFormData({ ...formData, student_gender: genderOptions[index] });
                  }}
                >
                  <View className="bg-gray-50 rounded-lg px-3 py-2 flex flex-row items-center">
                    <Text>{formData.student_gender}</Text>
                    <Text className="text-gray-400 ml-2">▼</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 课时费 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <DollarSign size={18} color="#2563EB" className="mr-2" />
              <CardTitle>期望课时费</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row items-center bg-gray-50 rounded-lg px-4">
              <Text className="text-orange-500 text-lg font-bold mr-1">¥</Text>
              <Input
                type="number"
                placeholder="请输入每小时课时费"
                value={formData.hourly_rate}
                onInput={(e) => setFormData({ ...formData, hourly_rate: e.detail.value })}
                className="flex-1 bg-transparent py-3"
              />
              <Text className="text-gray-500">/小时</Text>
            </View>
          </CardContent>
        </Card>

        {/* 上课地址 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <MapPin size={18} color="#2563EB" className="mr-2" />
              <CardTitle>上课地址</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-lg px-4">
              <Input
                placeholder="请输入详细地址，如：北京市朝阳区望京SOHO"
                value={formData.address}
                onInput={(e) => setFormData({ ...formData, address: e.detail.value })}
                className="bg-transparent py-3"
              />
            </View>
          </CardContent>
        </Card>

        {/* 补充说明 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>补充说明</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="bg-gray-50 rounded-lg p-3">
              <Textarea
                placeholder="请描述孩子的学习情况、期望的老师类型、上课时间等..."
                value={formData.description}
                onInput={(e) => setFormData({ ...formData, description: e.detail.value })}
                maxlength={500}
                className="w-full bg-transparent"
                style={{ minHeight: '100px' }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">{formData.description.length}/500</Text>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          className="w-full bg-blue-500"
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading ? '发布中...' : '发布需求'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default PublishPage;
