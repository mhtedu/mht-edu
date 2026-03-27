import { View, Text, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Award, Clock, BookOpen, MessageCircle } from 'lucide-react-taro';
import './index.css';

interface Teacher {
  id: number;
  nickname: string;
  avatar: string;
  real_name: string;
  gender: number;
  education: string;
  subjects: string[];
  hourly_rate_min: number;
  hourly_rate_max: number;
  intro: string;
  distance: number;
  distance_text: string;
  certificates?: string[];
  photos?: string[];
}

/**
 * 教师详情页
 */
const TeacherDetailPage = () => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id;
    if (id) {
      loadTeacher(parseInt(id));
    }
  }, []);

  const loadTeacher = async (id: number) => {
    try {
      const res = await Network.request({
        url: `/api/user/teachers/${id}/profile`,
        method: 'GET',
      });
      
      if (res.data) {
        setTeacher(res.data);
      }
    } catch (error) {
      console.error('加载教师信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    Taro.navigateTo({ url: '/pages/publish/index' });
  };

  const handleChat = () => {
    Taro.showToast({ title: '请先开通会员', icon: 'none' });
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-500">教师不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部信息 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 pt-6 pb-8">
        <View className="flex flex-row">
          <Image 
            src={teacher.avatar} 
            className="w-20 h-20 rounded-full border-2 border-white"
          />
          <View className="ml-4 flex-1">
            <View className="flex flex-row items-center">
              <Text className="text-white text-xl font-bold">{teacher.real_name}</Text>
              <Text className="text-blue-100 text-sm ml-2">{teacher.gender === 1 ? '男' : '女'}</Text>
            </View>
            <View className="flex flex-row items-center mt-1">
              <MapPin size={14} color="#BFDBFE" />
              <Text className="text-blue-100 text-sm ml-1">{teacher.distance_text}</Text>
            </View>
            <View className="flex flex-row gap-2 mt-2">
              {teacher.subjects?.map((subj) => (
                <Badge key={subj} className="bg-white bg-opacity-20">
                  <Text className="text-white text-xs">{subj}</Text>
                </Badge>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-4">
        {/* 价格卡片 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">课时费</Text>
                <Text className="text-orange-500 text-2xl font-bold">
                  ¥{teacher.hourly_rate_min}-{teacher.hourly_rate_max}
                  <Text className="text-sm font-normal text-gray-500">/小时</Text>
                </Text>
              </View>
              <View className="flex flex-col items-end">
                <View className="flex flex-row items-center">
                  <Star size={16} color="#FCD34D" />
                  <Text className="text-yellow-500 font-semibold ml-1">4.9</Text>
                </View>
                <Text className="text-gray-400 text-xs">已授课 128 次</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 学历背景 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <Award size={18} color="#2563EB" className="mr-2" />
              <CardTitle>学历背景</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-700">{teacher.education}</Text>
          </CardContent>
        </Card>

        {/* 教学经验 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <BookOpen size={18} color="#2563EB" className="mr-2" />
              <CardTitle>教学经验</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text className="text-gray-700 leading-relaxed">{teacher.intro || '暂无介绍'}</Text>
          </CardContent>
        </Card>

        {/* 可授课时间 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <Clock size={18} color="#2563EB" className="mr-2" />
              <CardTitle>可授课时间</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row flex-wrap gap-2">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                <View key={day} className="px-3 py-1 bg-green-50 rounded">
                  <Text className="text-green-600 text-sm">{day}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 学员评价 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <MessageCircle size={18} color="#2563EB" className="mr-2" />
                <CardTitle>学员评价</CardTitle>
              </View>
              <Text className="text-gray-400 text-sm">共 36 条</Text>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-gray-700 font-semibold">张家长</Text>
                  <View className="flex flex-row">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} color="#FCD34D" />)}
                  </View>
                </View>
                <Text className="text-gray-600 text-sm">张老师讲课很有耐心，孩子数学成绩提高了很多，推荐！</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-gray-700 font-semibold">李家长</Text>
                  <View className="flex flex-row">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} color="#FCD34D" />)}
                  </View>
                </View>
                <Text className="text-gray-600 text-sm">老师很专业，针对孩子的弱项进行辅导，效果明显。</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex flex-row gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleChat}
        >
          <MessageCircle size={16} color="#2563EB" className="mr-1" />
          <Text>在线咨询</Text>
        </Button>
        <Button 
          className="flex-1 bg-blue-500"
          onClick={handleBooking}
        >
          <Text className="text-white">立即预约</Text>
        </Button>
      </View>
    </View>
  );
};

export default TeacherDetailPage;
