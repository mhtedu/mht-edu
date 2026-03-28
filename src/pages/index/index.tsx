import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import Taro, { useLoad, useDidShow } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Lock, Building2, ChevronDown, Users, Clock, MapPin as LocationIcon } from 'lucide-react-taro';
import CitySelector from '@/components/city-selector';
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

// 信息流广告类型
interface FeedAd {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_url: string;
  ad_type: number;
}

// 活动类型
interface Activity {
  id: number;
  title: string;
  type: 'visit' | 'training' | 'lecture' | 'other'; // 探校、培训、讲座、其他
  cover_image: string;
  start_time: string;
  end_time: string;
  address: string;
  online_price: number;
  offline_price: number;
  max_participants: number;
  current_participants: number;
  target_roles: number[]; // 0-家长, 1-教师, 2-机构
  status: 'upcoming' | 'ongoing' | 'ended';
  is_online: boolean; // 是否线上活动
}

// 城市类型
interface City {
  id: number;
  name: string;
  pinyin: string;
  first_letter: string;
  is_hot: number;
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
  const [showCitySelector, setShowCitySelector] = useState(false);
  
  // 数据状态
  const [orders, setOrders] = useState<Order[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [feedAds, setFeedAds] = useState<FeedAd[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('全部');

  const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'];

  // 模拟轮播图数据
  const mockBanners: Banner[] = [
    { id: 1, image_url: 'https://placehold.co/750x300/2563EB/white?text=棉花糖教育', title: '欢迎来到棉花糖教育', link_url: '' },
    { id: 2, image_url: 'https://placehold.co/750x300/F59E0B/white?text=会员特权', title: '开通会员享更多权益', link_url: '/pages/membership/index' },
    { id: 3, image_url: 'https://placehold.co/750x300/10B981/white?text=邀请好友', title: '邀请好友赚佣金', link_url: '/pages/distribution/index' },
  ];

  // 模拟信息流广告数据
  const mockFeedAds: FeedAd[] = [
    { id: 1, title: '优秀教师推荐', content: '精选优质教师，教学质量有保障', image_url: 'https://placehold.co/750x200/10B981/white?text=优秀教师', link_url: '', ad_type: 1 },
    { id: 2, title: '新用户福利', content: '首次开通会员享5折优惠', image_url: 'https://placehold.co/750x200/EC4899/white?text=新人福利', link_url: '/pages/membership/index', ad_type: 1 },
  ];

  useLoad(() => {
    console.log('Page loaded.');
  });

  // 每次页面显示时重新读取角色
  useDidShow(() => {
    const token = Taro.getStorageSync('token');
    if (!token) {
      Taro.redirectTo({ url: '/pages/login/index' });
      return;
    }
    
    // 重新读取角色
    const savedRole = Taro.getStorageSync('userRole');
    const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
    console.log('useDidShow - 读取到的角色值:', savedRole, '转换后:', role);
    
    if (role !== userRole) {
      setUserRole(role);
    }
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
  }, [latitude, longitude, userRole, selectedSubject, currentCity]);

  // 初始化页面
  const initPage = async () => {
    // 设置模拟轮播图
    setBanners(mockBanners);
    // 设置模拟信息流广告
    setFeedAds(mockFeedAds);
    
    // 检查登录状态
    const token = Taro.getStorageSync('token');
    if (token) {
      // 获取用户角色 - 确保转换为数字
      const savedRole = Taro.getStorageSync('userRole');
      const role = typeof savedRole === 'string' ? parseInt(savedRole, 10) : (savedRole || 0);
      console.log('读取到的角色值:', savedRole, '转换后:', role);
      setUserRole(role);
      
      // 检查会员状态
      const memberExpire = Taro.getStorageSync('member_expire');
      if (memberExpire && new Date(memberExpire) > new Date()) {
        setIsMember(true);
      }
      
      // 读取用户选择的城市
      const savedCity = Taro.getStorageSync('selectedCity');
      if (savedCity) {
        setCurrentCity(savedCity);
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
        if (currentCity === '定位中...') {
          setCurrentCity('北京·望京');
        }
        return;
      }
      
      const res = await Taro.getLocation({ type: 'gcj02' });
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      if (currentCity === '定位中...') {
        setCurrentCity('已定位');
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      // 使用默认位置（北京）
      setLatitude(39.995);
      setLongitude(116.473);
      if (currentCity === '定位中...') {
        setCurrentCity('北京');
      }
    }
  };

  // 选择城市
  const handleSelectCity = async (city: City) => {
    setCurrentCity(city.name);
    Taro.setStorageSync('selectedCity', city.name);
    setShowCitySelector(false);
    
    // 更新用户城市到后端
    try {
      await Network.request({
        url: '/api/city/select',
        method: 'POST',
        data: { cityId: city.id },
      });
    } catch (error) {
      console.error('更新城市失败:', error);
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
    } else {
      // 机构：加载待审核教师/订单
      setLoading(false);
    }
    // 所有角色都加载活动
    await loadActivities();
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
          city: currentCity !== '定位中...' ? currentCity : undefined,
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
          city: currentCity !== '定位中...' ? currentCity : undefined,
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
      description: '需要数学指导，目标中考110分以上',
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

  // 加载活动列表
  const loadActivities = async () => {
    try {
      const res = await Network.request({
        url: '/api/activities/list',
        method: 'GET',
        data: {
          role: userRole,
          page: 1,
          pageSize: 5,
        },
      });

      if (res.data && Array.isArray(res.data)) {
        setActivities(res.data);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
      // 使用模拟数据
      setActivities(getMockActivities());
    }
  };

  // 模拟活动数据
  const getMockActivities = (): Activity[] => [
    {
      id: 1,
      title: '北京四中探校活动',
      type: 'visit',
      cover_image: 'https://placehold.co/400x200/2563EB/white?text=探校活动',
      start_time: '2024-04-15 09:00',
      end_time: '2024-04-15 12:00',
      address: '北京市西城区北京四中',
      online_price: 0,
      offline_price: 99,
      max_participants: 50,
      current_participants: 32,
      target_roles: [0], // 仅家长可见
      status: 'upcoming',
      is_online: false,
    },
    {
      id: 2,
      title: '新高考政策解读讲座',
      type: 'lecture',
      cover_image: 'https://placehold.co/400x200/10B981/white?text=政策讲座',
      start_time: '2024-04-20 14:00',
      end_time: '2024-04-20 16:00',
      address: '线上直播',
      online_price: 29,
      offline_price: 0,
      max_participants: 200,
      current_participants: 156,
      target_roles: [0, 1], // 家长和教师可见
      status: 'upcoming',
      is_online: true,
    },
    {
      id: 3,
      title: '教师教学技能提升培训',
      type: 'training',
      cover_image: 'https://placehold.co/400x200/EC4899/white?text=教师培训',
      start_time: '2024-04-25 09:00',
      end_time: '2024-04-26 17:00',
      address: '海淀区教师进修学校',
      online_price: 0,
      offline_price: 299,
      max_participants: 30,
      current_participants: 28,
      target_roles: [1], // 仅教师可见
      status: 'upcoming',
      is_online: false,
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

  // 获取活动类型标签
  const getActivityTypeTag = (type: Activity['type']) => {
    const typeMap = {
      visit: { label: '探校', color: 'bg-blue-100 text-blue-600' },
      training: { label: '培训', color: 'bg-green-100 text-green-600' },
      lecture: { label: '讲座', color: 'bg-purple-100 text-purple-600' },
      other: { label: '活动', color: 'bg-gray-100 text-gray-600' },
    };
    return typeMap[type];
  };

  // 活动报名
  const handleActivitySignUp = (activity: Activity) => {
    Taro.navigateTo({ url: `/pages/activity-detail/index?id=${activity.id}` });
  };

  // 过滤当前角色可见的活动
  const visibleActivities = activities.filter(a => a.target_roles.includes(userRole));

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部定位和角色显示 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between">
          <View 
            className="flex flex-row items-center"
            onClick={() => setShowCitySelector(true)}
          >
            <MapPin size={16} color="#2563EB" className="mr-1" />
            <Text className="text-sm text-gray-700">{currentCity}</Text>
            <ChevronDown size={14} color="#9CA3AF" />
          </View>
          <View className="flex flex-row items-center">
            <View className="px-3 py-1 rounded-full bg-blue-100">
              <Text className="text-xs text-blue-600">
                {userRole === 0 ? '家长端' : userRole === 1 ? '教师端' : '机构端'}
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
          {userRole === 0 ? '附近教师' : userRole === 1 ? '附近需求' : '机构工作台'}
        </Text>
      </View>

      {/* 学科筛选 - 仅家长和教师端显示 */}
      {userRole !== 2 && (
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
      )}

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
        {(() => {
          console.log('渲染内容区域 - userRole:', userRole, '类型:', typeof userRole);
          return null;
        })()}
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
              {teachers.map((teacher, index) => (
                <View key={teacher.id}>
                  <Card className="bg-white">
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
                  {/* 在第2个教师后插入信息流广告 */}
                  {index === 1 && feedAds.length > 0 && (
                    <View 
                      key={`ad-${feedAds[0].id}`}
                      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl overflow-hidden mt-3"
                      onClick={() => feedAds[0].link_url && Taro.navigateTo({ url: feedAds[0].link_url })}
                    >
                      {feedAds[0].image_url && (
                        <Image 
                          src={feedAds[0].image_url} 
                          className="w-full h-24"
                          mode="aspectFill"
                        />
                      )}
                      <View className="p-3">
                        <Text className="font-semibold text-gray-800">{feedAds[0].title}</Text>
                        <Text className="text-xs text-gray-500 mt-1">{feedAds[0].content}</Text>
                        <View className="flex flex-row items-center justify-between mt-2">
                          <Text className="text-xs text-blue-500">了解更多 →</Text>
                          <Text className="text-xs text-gray-400">广告</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )
        ) : userRole === 1 ? (
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
        ) : (
          // ========== 机构端：工作台入口 ==========
          <View className="flex flex-col gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <View className="flex flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 size={24} color="#9333EA" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold">机构管理</Text>
                    <Text className="text-gray-500 text-xs mt-1">管理机构信息、教师和课程</Text>
                  </View>
                  <Button size="sm" onClick={() => Taro.navigateTo({ url: '/pages/org-dashboard/index' })}>
                    <Text className="text-white text-sm">进入</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="font-semibold">今日数据</Text>
                  <Text className="text-gray-400 text-xs">更新于刚刚</Text>
                </View>
                <View className="flex flex-row justify-around">
                  <View className="flex flex-col items-center">
                    <Text className="text-2xl font-bold text-blue-500">12</Text>
                    <Text className="text-gray-500 text-xs mt-1">在册教师</Text>
                  </View>
                  <View className="flex flex-col items-center">
                    <Text className="text-2xl font-bold text-green-500">28</Text>
                    <Text className="text-gray-500 text-xs mt-1">在教课程</Text>
                  </View>
                  <View className="flex flex-col items-center">
                    <Text className="text-2xl font-bold text-orange-500">156</Text>
                    <Text className="text-gray-500 text-xs mt-1">学员数量</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="font-semibold">待处理事项</Text>
                  <Badge variant="destructive">
                    <Text className="text-xs">3项</Text>
                  </Badge>
                </View>
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-gray-600 text-sm">待审核教师申请</Text>
                    <Text className="text-blue-500 font-semibold">2</Text>
                  </View>
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-gray-600 text-sm">待确认课程预约</Text>
                    <Text className="text-blue-500 font-semibold">1</Text>
                  </View>
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-gray-600 text-sm">待处理家长咨询</Text>
                    <Text className="text-blue-500 font-semibold">0</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </View>

      {/* 活动报名列表 */}
      {visibleActivities.length > 0 && (
        <View className="px-4 mt-4">
          <View className="flex flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">活动报名</Text>
            <View 
              className="flex flex-row items-center"
              onClick={() => Taro.navigateTo({ url: '/pages/activities/index' })}
            >
              <Text className="text-sm text-gray-500">全部活动</Text>
              <ChevronDown size={14} color="#9CA3AF" className="rotate-[-90deg]" />
            </View>
          </View>
          <ScrollView scrollX className="flex flex-row gap-3 overflow-x-auto pb-2">
            {visibleActivities.map((activity) => {
              const typeTag = getActivityTypeTag(activity.type);
              return (
                <View 
                  key={activity.id}
                  className="min-w-[280px] bg-white rounded-xl overflow-hidden shadow-sm"
                  onClick={() => handleActivitySignUp(activity)}
                >
                  <Image 
                    src={activity.cover_image}
                    className="w-full h-32"
                    mode="aspectFill"
                  />
                  <View className="p-3">
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Badge className={typeTag.color}>
                        <Text className="text-xs">{typeTag.label}</Text>
                      </Badge>
                      {activity.is_online && (
                        <Badge className="bg-blue-100 text-blue-600">
                          <Text className="text-xs">线上</Text>
                        </Badge>
                      )}
                    </View>
                    <Text className="font-semibold text-gray-800 line-clamp-1">{activity.title}</Text>
                    <View className="flex flex-row items-center gap-1 mt-2">
                      <Clock size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500">{activity.start_time}</Text>
                    </View>
                    <View className="flex flex-row items-center gap-1 mt-1">
                      <LocationIcon size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500 line-clamp-1">{activity.address}</Text>
                    </View>
                    <View className="flex flex-row items-center justify-between mt-3">
                      <View className="flex flex-row items-center gap-1">
                        <Users size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500">
                          {activity.current_participants}/{activity.max_participants}
                        </Text>
                      </View>
                      <Text className="text-orange-500 font-semibold">
                        {activity.is_online ? (activity.online_price > 0 ? `¥${activity.online_price}` : '免费') : (activity.offline_price > 0 ? `¥${activity.offline_price}` : '免费')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

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

      {/* 城市选择器 */}
      <CitySelector
        visible={showCitySelector}
        currentCity={currentCity}
        onClose={() => setShowCitySelector(false)}
        onSelect={handleSelectCity}
      />
    </View>
  );
};

export default IndexPage;
