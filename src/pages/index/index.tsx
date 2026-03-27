import { View, Text, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, SlidersHorizontal } from 'lucide-react-taro';
import './index.css';

// 订单类型
interface Order {
  id: number;
  subject: string;
  hourly_rate: number;
  student_grade: string;
  student_gender: number;
  address: string;
  description: string;
  status: number;
  created_at: string;
  distance: number;
  distance_text: string;
}

// 教师类型
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
}

// 用户角色: 0-家长, 1-教师, 2-机构, 3-代理商
type UserRole = 0 | 1 | 2 | 3;

/**
 * 首页 - 根据角色显示不同内容
 * 家长：看到教师列表
 * 教师：看到需求订单
 */
const IndexPage = () => {
  // 用户状态
  const [userRole, setUserRole] = useState<UserRole>(0); // 默认家长
  
  // 位置状态
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [currentCity, setCurrentCity] = useState('定位中...');
  
  // 数据状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');

  const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'];

  useLoad(() => {
    console.log('Page loaded.');
  });

  useEffect(() => {
    // 获取位置
    getLocation();
  }, []);

  useEffect(() => {
    // 位置变化后加载数据
    if (latitude !== 0 || longitude !== 0) {
      loadData();
    }
  }, [latitude, longitude, userRole, selectedSubject]);

  // 获取位置
  const getLocation = async () => {
    try {
      // H5 端获取位置
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        // 模拟北京望京位置
        setLatitude(39.995);
        setLongitude(116.473);
        setCurrentCity('北京·望京');
        return;
      }
      
      const res = await Taro.getLocation({ type: 'gcj02' });
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      setCurrentCity('已定位');
    } catch (error) {
      console.error('获取位置失败:', error);
      // 使用默认位置（北京）
      setLatitude(39.995);
      setLongitude(116.473);
      setCurrentCity('北京');
    }
  };

  // 加载数据
  const loadData = async () => {
    if (userRole === 0) {
      // 家长：加载教师列表
      await loadTeachers();
    } else if (userRole === 1) {
      // 教师：加载订单列表
      await loadOrders();
    }
  };

  // 加载教师列表（家长端）
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await Network.request({
        url: '/api/user/teachers/list',
        method: 'GET',
        data: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          subject: selectedSubject,
          page: 1,
          pageSize: 20,
        },
      });

      console.log('教师列表响应:', res.data);
      if (res.data && Array.isArray(res.data)) {
        setTeachers(res.data);
      }
    } catch (error) {
      console.error('加载教师列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载订单列表（教师端）
  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('加载订单，位置:', latitude, longitude);
      const res = await Network.request({
        url: '/api/orders/teacher',
        method: 'GET',
        data: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          subject: selectedSubject !== '全部' ? selectedSubject : undefined,
          page: 1,
          pageSize: 20,
        },
      });

      console.log('订单列表响应:', res.data);
      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换角色（测试用）
  const toggleRole = () => {
    const newRole = userRole === 0 ? 1 : 0;
    setUserRole(newRole as UserRole);
    setOrders([]);
    setTeachers([]);
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}小时前`;
    }
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 获取订单状态
  const getStatusInfo = (status: number) => {
    const statusMap: Record<number, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { text: '待抢单', variant: 'default' },
      1: { text: '已匹配', variant: 'secondary' },
      2: { text: '试课中', variant: 'secondary' },
      3: { text: '已签约', variant: 'outline' },
      4: { text: '已完成', variant: 'outline' },
      5: { text: '已解除', variant: 'destructive' },
    };
    return statusMap[status] || { text: '未知', variant: 'outline' };
  };

  // 获取性别图标
  const getGenderText = (gender: number) => {
    return gender === 1 ? '男' : '女';
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部定位与角色切换 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <MapPin size={16} color="#2563EB" className="mr-1" />
            <Text className="text-sm text-gray-700">{currentCity}</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            {/* 测试用：角色切换按钮 */}
            <View 
              className="px-3 py-1 rounded-full bg-blue-100"
              onClick={toggleRole}
            >
              <Text className="text-xs text-blue-600">
                {userRole === 0 ? '家长端' : '教师端'}
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <SlidersHorizontal size={16} color="#6B7280" className="mr-1" />
              <Text className="text-sm text-gray-600">筛选</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 学科筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-2 overflow-x-auto">
          {subjects.map((subject) => (
            <View
              key={subject}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedSubject === subject 
                  ? 'bg-blue-500' 
                  : 'bg-gray-100'
              }`}
              onClick={() => setSelectedSubject(subject)}
            >
              <Text className={selectedSubject === subject ? 'text-white' : 'text-gray-700'}>
                {subject}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 内容区域 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : userRole === 0 ? (
          // ========== 家长端：教师列表 ==========
          teachers.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-8">
              <Text className="text-gray-500 mb-2">暂无教师</Text>
              <Text className="text-sm text-gray-400">附近暂无合适的教师</Text>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
              {teachers.map((teacher) => (
                <Card key={teacher.id} className="bg-white">
                  <CardContent className="p-4">
                    <View className="flex flex-row gap-3">
                      {/* 头像 */}
                      <Image 
                        src={teacher.avatar} 
                        className="w-16 h-16 rounded-full"
                        mode="aspectFill"
                      />
                      {/* 信息 */}
                      <View className="flex-1 flex flex-col gap-1">
                        <View className="flex flex-row items-center justify-between">
                          <View className="flex flex-row items-center gap-2">
                            <Text className="text-base font-semibold">{teacher.real_name || teacher.nickname}</Text>
                            <Text className="text-xs text-gray-500">{getGenderText(teacher.gender)}</Text>
                          </View>
                          <Text className="text-xs text-gray-400">{teacher.distance_text}</Text>
                        </View>
                        
                        <Text className="text-xs text-gray-500">{teacher.education}</Text>
                        
                        {/* 学科标签 */}
                        <View className="flex flex-row gap-1 mt-1">
                          {teacher.subjects?.map((subj) => (
                            <Badge key={subj} variant="secondary">
                              <Text className="text-xs">{subj}</Text>
                            </Badge>
                          ))}
                        </View>
                        
                        {/* 价格和简介 */}
                        <View className="flex flex-row items-center justify-between mt-2">
                          <Text className="text-orange-500 font-semibold">
                            ¥{teacher.hourly_rate_min}-{teacher.hourly_rate_max}/小时
                          </Text>
                        </View>
                        
                        {teacher.intro && (
                          <Text className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {teacher.intro}
                          </Text>
                        )}
                        
                        {/* 操作按钮 */}
                        <View className="flex flex-row gap-2 mt-3">
                          <Button size="sm" className="flex-1" onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>
                            <Text className="text-sm">预约试课</Text>
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacher.id}` })}>
                            <Text className="text-sm">查看详情</Text>
                          </Button>
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )
        ) : (
          // ========== 教师端：订单列表 ==========
          orders.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-8">
              <Text className="text-gray-500 mb-2">暂无订单</Text>
              <Text className="text-sm text-gray-400">发布需求后，教师可以在这里抢单</Text>
            </View>
          ) : (
            <View className="flex flex-col gap-3">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <Card key={order.id} className="bg-white">
                    <CardHeader className="pb-2">
                      <View className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{order.subject}</CardTitle>
                        <Badge variant={statusInfo.variant}>
                          <Text className="text-xs">{statusInfo.text}</Text>
                        </Badge>
                      </View>
                    </CardHeader>
                    <CardContent>
                      <View className="flex flex-col gap-2">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-orange-500 font-semibold text-lg">
                            ¥{order.hourly_rate}/小时
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {order.distance_text} · {formatTime(order.created_at)}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center">
                          <MapPin size={12} color="#6B7280" className="mr-1" />
                          <Text className="text-sm text-gray-600">{order.address}</Text>
                        </View>
                        <View className="flex flex-row items-center gap-2">
                          <Text className="text-sm text-gray-500">
                            {order.student_grade}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {order.student_gender === 1 ? '男生' : '女生'}
                          </Text>
                        </View>
                        {order.description && (
                          <Text className="text-sm text-gray-500 line-clamp-2">
                            {order.description}
                          </Text>
                        )}
                        <View className="flex flex-row gap-2 mt-2">
                          <Button size="sm" className="flex-1" variant="default" onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })}>
                            <Text className="text-sm">抢单</Text>
                          </Button>
                          <Button size="sm" className="flex-1" variant="outline" onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })}>
                            <Text className="text-sm">详情</Text>
                          </Button>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          )
        )}
      </View>

      {/* 底部发布按钮 */}
      <View className="fixed bottom-20 right-4 z-50">
        <Button 
          className="w-12 h-12 rounded-full shadow-lg" 
          size="lg"
          onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}
        >
          <Text className="text-2xl text-white">+</Text>
        </Button>
      </View>
    </View>
  );
};

export default IndexPage;
