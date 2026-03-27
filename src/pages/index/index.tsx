import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Lock } from 'lucide-react-taro';
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

// 轮播图类型
interface Banner {
  id: number;
  image_url: string;
  title: string;
  link_url: string;
}

/**
 * 首页 - 根据用户角色显示不同内容
 * 家长角色：显示教师列表
 * 教师角色：显示需求订单
 */
const IndexPage = () => {
  // 用户状态
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(0); // 0-家长, 1-教师
  
  // 位置状态
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [currentCity, setCurrentCity] = useState('定位中...');
  
  // 数据状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');

  const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'];

  // 模拟轮播图数据
  const mockBanners: Banner[] = [
    { id: 1, image_url: 'https://placehold.co/750x300/2563EB/white?text=棉花糖教育', title: '欢迎来到棉花糖教育', link_url: '' },
    { id: 2, image_url: 'https://placehold.co/750x300/F59E0B/white?text=会员特权', title: '开通会员享更多权益', link_url: '/pages/membership/index' },
    { id: 3, image_url: 'https://placehold.co/750x300/10B981/white?text=邀请好友', title: '邀请好友赚佣金', link_url: '/pages/distribution/index' },
  ];

  useLoad(() => {
    console.log('Page loaded.');
  });

  useEffect(() => {
    // 初始化
    initPage();
  }, []);

  useEffect(() => {
    // 角色或筛选变化后加载数据
    if (latitude !== 0 || longitude !== 0) {
      loadData();
    }
  }, [latitude, longitude, userRole, selectedSubject]);

  // 初始化页面
  const initPage = async () => {
    // 设置模拟轮播图
    setBanners(mockBanners);
    
    // 检查登录状态
    const token = Taro.getStorageSync('token');
    if (token) {
      // 获取用户角色
      const role = Taro.getStorageSync('userRole') || 0;
      setUserRole(role);
      
      // 检查会员状态
      const memberExpire = Taro.getStorageSync('member_expire');
      if (memberExpire && new Date(memberExpire) > new Date()) {
        setIsMember(true);
      }
    } else {
      // 未登录，跳转到登录页
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' });
      }, 500);
    }
    
    // 获取位置
    await getLocation();
  };

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
    } else {
      // 教师：加载订单列表
      await loadOrders();
    }
  };

  // 加载教师列表
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
      // 使用模拟数据
      setTeachers(getMockTeachers());
    } finally {
      setLoading(false);
    }
  };

  // 加载订单列表
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await Network.request({
        url: '/api/orders/list',
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
      // 使用模拟数据
      setOrders(getMockOrders());
    } finally {
      setLoading(false);
    }
  };

  // 模拟教师数据
  const getMockTeachers = (): Teacher[] => [
    {
      id: 1,
      nickname: '张老师',
      avatar: 'https://placehold.co/100/2563EB/white?text=张',
      real_name: '张明',
      gender: 1,
      education: '北京大学·硕士',
      subjects: ['数学', '物理'],
      hourly_rate_min: 150,
      hourly_rate_max: 200,
      intro: '8年教学经验，擅长中考数学提分',
      distance: 1200,
      distance_text: '1.2km',
    },
    {
      id: 2,
      nickname: '李老师',
      avatar: 'https://placehold.co/100/EC4899/white?text=李',
      real_name: '李芳',
      gender: 2,
      education: '清华大学·本科',
      subjects: ['英语', '语文'],
      hourly_rate_min: 120,
      hourly_rate_max: 180,
      intro: '英语专八，口语流利',
      distance: 2500,
      distance_text: '2.5km',
    },
    {
      id: 3,
      nickname: '王老师',
      avatar: 'https://placehold.co/100/10B981/white?text=王',
      real_name: '王强',
      gender: 1,
      education: '北京师范大学·博士',
      subjects: ['化学', '生物'],
      hourly_rate_min: 200,
      hourly_rate_max: 300,
      intro: '重点中学在职教师',
      distance: 3800,
      distance_text: '3.8km',
    },
  ];

  // 模拟订单数据
  const getMockOrders = (): Order[] => [
    {
      id: 1,
      subject: '数学',
      hourly_rate: 180,
      student_grade: '初三',
      student_gender: 1,
      address: '朝阳区望京西园',
      description: '需要数学辅导，目标中考110分以上',
      status: 0,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      distance: 800,
      distance_text: '0.8km',
    },
    {
      id: 2,
      subject: '英语',
      hourly_rate: 150,
      student_grade: '高二',
      student_gender: 2,
      address: '海淀区中关村',
      description: '英语口语提升，准备出国',
      status: 0,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      distance: 1500,
      distance_text: '1.5km',
    },
  ];

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

  // 处理轮播图点击
  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      Taro.navigateTo({ url: banner.link_url });
    }
  };

  // 查看教师详情
  const handleViewTeacher = (teacherId: number) => {
    if (!isMember) {
      Taro.showModal({
        title: '提示',
        content: '开通会员后可查看教师详情和联系方式',
        confirmText: '开通会员',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' });
          }
        },
      });
      return;
    }
    Taro.navigateTo({ url: `/pages/teacher-detail/index?id=${teacherId}` });
  };

  // 查看订单详情
  const handleViewOrder = (orderId: number) => {
    if (!isMember) {
      Taro.showModal({
        title: '提示',
        content: '开通会员后可查看订单详情和联系方式',
        confirmText: '开通会员',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' });
          }
        },
      });
      return;
    }
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部定位和角色显示 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <MapPin size={16} color="#2563EB" className="mr-1" />
            <Text className="text-sm text-gray-700">{currentCity}</Text>
          </View>
          <View className="flex flex-row items-center">
            <View className="px-3 py-1 rounded-full bg-blue-100">
              <Text className="text-xs text-blue-600">
                {userRole === 0 ? '家长端' : '教师端'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 轮播图广告位 */}
      <View className="bg-white px-4 py-3">
        <Swiper
          className="w-full h-32 rounded-xl overflow-hidden"
          indicatorDots
          autoplay
          circular
          indicatorColor="rgba(255,255,255,0.5)"
          indicatorActiveColor="#2563EB"
        >
          {banners.map((banner) => (
            <SwiperItem key={banner.id} onClick={() => handleBannerClick(banner)}>
              <Image
                src={banner.image_url}
                className="w-full h-full"
                mode="aspectFill"
              />
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {/* 标题区域 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">
          {userRole === 0 ? '附近教师' : '附近需求'}
        </Text>
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

      {/* 非会员提示 */}
      {!isMember && (
        <View className="bg-yellow-50 px-4 py-2 flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <Lock size={14} color="#F59E0B" className="mr-2" />
            <Text className="text-xs text-yellow-700">
              开通会员可查看完整信息与联系方式
            </Text>
          </View>
          <View 
            className="px-2 py-1 bg-yellow-500 rounded"
            onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}
          >
            <Text className="text-xs text-white">立即开通</Text>
          </View>
        </View>
      )}

      {/* 内容区域 */}
      <View className="p-4 pb-24">
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
                            <Text className="text-base font-semibold">
                              {isMember ? (teacher.real_name || teacher.nickname) : teacher.nickname}
                            </Text>
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
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewTeacher(teacher.id)}>
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
              <Text className="text-sm text-gray-400">附近暂无新的需求</Text>
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
                          <Text className="text-sm text-gray-600">
                            {isMember ? order.address : '开通会员查看详细地址'}
                          </Text>
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
                          <Button size="sm" className="flex-1" variant="default" onClick={() => handleViewOrder(order.id)}>
                            <Text className="text-sm">抢单</Text>
                          </Button>
                          <Button size="sm" className="flex-1" variant="outline" onClick={() => handleViewOrder(order.id)}>
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

      {/* 底部发布按钮 - 仅家长端显示 */}
      {userRole === 0 && (
        <View className="fixed bottom-20 right-4 z-50">
          <Button 
            className="w-12 h-12 rounded-full shadow-lg" 
            size="lg"
            onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}
          >
            <Text className="text-2xl text-white">+</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default IndexPage;
