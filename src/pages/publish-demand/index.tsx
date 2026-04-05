import { View, Text, Picker } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, DollarSign } from 'lucide-react-taro';
import { Network } from '@/network';

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const grades = ['小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

/**
 * 发布需求页面
 */
const PublishDemandPage = () => {
  const [loading, setLoading] = useState(false);
  const [subjectIndex, setSubjectIndex] = useState(1);
  const [gradeIndex, setGradeIndex] = useState(7);
  
  const [formData, setFormData] = useState({
    subject: '数学',
    student_grade: '初二',
    hourly_rate: '',
    address: '',
    description: '',
  });

  const handleSubmit = async () => {
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
      let latitude = 39.995;
      let longitude = 116.473;
      
      try {
        const location = await Taro.getLocation({ type: 'gcj02' });
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (e) {
        console.log('获取位置失败，使用默认位置');
      }

      const result = await Network.request({
        url: '/api/order/create',
        method: 'POST',
        data: {
          subject: formData.subject,
          student_grade: formData.student_grade,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          address: formData.address,
          latitude: latitude,
          longitude: longitude,
          description: formData.description,
        },
      });

      if (result.data) {
        Taro.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '发布失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <View className="flex items-center justify-between">
            <Text className="text-gray-600">科目</Text>
            <Picker
              mode="selector"
              range={subjects}
              value={subjectIndex}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setSubjectIndex(index);
                setFormData(prev => ({ ...prev, subject: subjects[index] }));
              }}
            >
              <View className="flex items-center text-blue-600">
                <Text>{formData.subject}</Text>
                <Text className="ml-2">▼</Text>
              </View>
            </Picker>
          </View>

          <View className="flex items-center justify-between">
            <Text className="text-gray-600">年级</Text>
            <Picker
              mode="selector"
              range={grades}
              value={gradeIndex}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setGradeIndex(index);
                setFormData(prev => ({ ...prev, student_grade: grades[index] }));
              }}
            >
              <View className="flex items-center text-blue-600">
                <Text>{formData.student_grade}</Text>
                <Text className="ml-2">▼</Text>
              </View>
            </Picker>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>课时费</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex items-center">
            <DollarSign size={20} color="#666" className="mr-2" />
            <Input
              type="number"
              placeholder="请输入课时费（元/小时）"
              value={formData.hourly_rate}
              onInput={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.detail.value }))}
              className="flex-1"
            />
            <Text className="ml-2 text-gray-500">元/小时</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>上课地址</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex items-start">
            <MapPin size={20} color="#666" className="mr-2 mt-2" />
            <Textarea
              placeholder="请输入上课地址"
              value={formData.address}
              onInput={(e) => setFormData(prev => ({ ...prev, address: e.detail.value }))}
              className="flex-1"
              style={{ minHeight: '60px' }}
            />
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>补充说明</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="请输入补充说明（选填）"
            value={formData.description}
            onInput={(e) => setFormData(prev => ({ ...prev, description: e.detail.value }))}
            style={{ minHeight: '100px' }}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full py-3"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '发布中...' : '发布需求'}
      </Button>
    </View>
  );
};

export default PublishDemandPage;
