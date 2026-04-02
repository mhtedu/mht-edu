import { View, Text, Image } from '@tarojs/components';
import Taro, { useLoad, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { autoLockOnPageLoad } from '@/utils/referral-lock';
import { useSiteConfig } from '@/store';
import { Share2, MapPin, Phone, Lock, Eye, Gift, Clock, MessageCircle } from 'lucide-react-taro';

interface OrderDetail {
  id: number;
  order_no: string;
  subject: string;
  hourly_rate: number;
  student_grade: string;
  student_gender: number;
  address: string;
  description: string;
  status: number;
  created_at: string;
  parent_name?: string;
  parent_avatar?: string;
  parent_phone?: string;
  share_code?: string;
}

/**
 * 订单详情页 - 支持分享
 */
const OrderDetailPage = () => {
  const siteName = useSiteConfig(state => state.getSiteName)();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  useLoad(() => {
    console.log('Order detail page loaded');
  });

  // 配置分享给好友
  useShareAppMessage(() => {
    return {
      title: `【${order?.subject}】${order?.student_grade}学生找老师，时薪${order?.hourly_rate}元`,
      path: `/pages/order-detail/index?id=${order?.id}&from=share`,
      imageUrl: 'https://placehold.co/500x400/2563EB/white?text=找老师',
    };
  });

  // 配置分享到朋友圈
  useShareTimeline(() => {
    return {
      title: `【${order?.subject}】${order?.student_grade}学生找老师，时薪${order?.hourly_rate}元 - ${siteName}`,
      query: `id=${order?.id}&from=share`,
      imageUrl: 'https://placehold.co/500x400/2563EB/white?text=找老师',
    };
  });

  useEffect(() => {
    const id = router.params.id;
    const from = router.params.from;
    
    // 尝试通过分享链接锁定分销关系
    autoLockOnPageLoad(router.params).then(() => {
      console.log('[订单详情] 分销锁定处理完成')
    })
    
    // 检查会员状态
    const memberExpire = Taro.getStorageSync('member_expire');
    if (memberExpire && new Date(memberExpire) > new Date()) {
      setIsMember(true);
      setShowContact(true);
    }
    
    if (id) {
      loadOrderDetail(parseInt(id));
      
      // 如果是分享进来的，记录分享来源
      if (from === 'share') {
        recordShareView(parseInt(id));
      }
    }
  }, [router.params]);

  // 加载订单详情
  const loadOrderDetail = async (id: number) => {
    try {
      setLoading(true);
      // 使用模拟数据
      const mockOrder: OrderDetail = {
        id,
        order_no: `ORD${Date.now()}`,
        subject: '数学',
        hourly_rate: 180,
        student_grade: '初三',
        student_gender: 1,
        address: '朝阳区望京西园',
        description: '孩子数学基础薄弱，希望找到有耐心的老师，目标是中考数学达到110分以上',
        status: 0,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        parent_name: '王家长',
        parent_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent',
        parent_phone: '138****8888',
        share_code: 'SHARE123',
      };
      setOrder(mockOrder);
      setViewCount(Math.floor(Math.random() * 100) + 50);
      setShareCount(Math.floor(Math.random() * 30) + 10);
    } catch (error) {
      console.error('加载订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 记录分享浏览
  const recordShareView = async (_orderId: number) => {
    // 记录分享来源，用于分佣计算
    const shareCode = router.params.share_code;
    if (shareCode) {
      console.log('记录分享来源:', shareCode);
    }
  };

  // 查看联系方式
  const handleViewContact = () => {
    if (!isMember) {
      Taro.showModal({
        title: '开通会员',
        content: '开通会员后可查看家长联系方式并直接沟通',
        confirmText: '立即开通',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' });
          }
        },
      });
      return;
    }
    setShowContact(true);
  };

  // 抢单
  const handleGrabOrder = () => {
    if (!isMember) {
      Taro.showModal({
        title: '开通会员',
        content: '开通会员后可抢单并查看联系方式',
        confirmText: '立即开通',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/membership/index' });
          }
        },
      });
      return;
    }
    
    Taro.showModal({
      title: '确认抢单',
      content: '抢单后家长将选择合适的牛师匹配，确认抢单吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '抢单成功', icon: 'success' });
        }
      },
    });
  };

  // 分享订单
  const handleShare = () => {
    Taro.showShareMenu({
      withShareTicket: true,
    } as any);
  };

  // 获取性别文本
  const getGenderText = (gender: number) => gender === 1 ? '男' : '女';

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-500">订单不存在</Text>
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部卡片 */}
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
        <View className="flex flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold">{order.subject}</Text>
          <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">待抢单</Badge>
        </View>
        <View className="flex flex-row items-center gap-4 mb-2">
          <Text className="text-sm opacity-90">年级: {order.student_grade}</Text>
          <Text className="text-sm opacity-90">性别: {getGenderText(order.student_gender)}</Text>
        </View>
        <View className="flex flex-row items-center gap-2">
          <MapPin size={14} color="white" />
          <Text className="text-sm opacity-90">{order.address}</Text>
        </View>
      </View>

      {/* 价格信息 */}
      <View className="bg-white m-4 rounded-xl p-4 shadow-sm">
        <View className="flex flex-row justify-between items-center">
          <Text className="text-gray-600">期望时薪</Text>
          <Text className="text-2xl font-bold text-blue-600">¥{order.hourly_rate}/小时</Text>
        </View>
      </View>

      {/* 需求描述 */}
      <View className="bg-white mx-4 rounded-xl p-4 shadow-sm">
        <Text className="text-base font-semibold mb-2">需求描述</Text>
        <Text className="text-gray-600 text-sm leading-relaxed">{order.description}</Text>
      </View>

      {/* 统计信息 */}
      <View className="flex flex-row m-4 gap-3">
        <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <View className="flex flex-row items-center gap-2">
            <Eye size={16} color="#2563EB" />
            <Text className="text-sm text-gray-500">浏览</Text>
          </View>
          <Text className="text-xl font-bold mt-1">{viewCount}</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <View className="flex flex-row items-center gap-2">
            <Share2 size={16} color="#10B981" />
            <Text className="text-sm text-gray-500">分享</Text>
          </View>
          <Text className="text-xl font-bold mt-1">{shareCount}</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
          <View className="flex flex-row items-center gap-2">
            <Clock size={16} color="#F59E0B" />
            <Text className="text-sm text-gray-500">发布</Text>
          </View>
          <Text className="text-sm font-medium mt-1">{formatTime(order.created_at)}</Text>
        </View>
      </View>

      {/* 家长信息 */}
      <View className="bg-white mx-4 rounded-xl p-4 shadow-sm">
        <Text className="text-base font-semibold mb-3">家长信息</Text>
        <View className="flex flex-row items-center gap-3">
          <Image 
            src={order.parent_avatar || ''} 
            className="w-12 h-12 rounded-full"
            mode="aspectFill"
          />
          <View className="flex-1">
            <Text className="font-medium">{order.parent_name}</Text>
            <Text className="text-sm text-gray-500">发布了{Math.floor(Math.random() * 5) + 1}个需求</Text>
          </View>
        </View>
        
        {/* 联系方式 - 会员可见 */}
        <View className="mt-3 pt-3 border-t border-gray-100">
          {showContact ? (
            <View className="flex flex-row gap-3">
              <View className="flex-1 flex flex-row items-center gap-2 bg-green-50 p-2 rounded-lg">
                <Phone size={16} color="#10B981" />
                <Text className="text-sm">{order.parent_phone}</Text>
              </View>
              <View 
                className="flex flex-row items-center gap-2 bg-blue-500 px-4 py-2 rounded-lg"
                onClick={() => Taro.navigateTo({ url: `/pages/chat/index?userId=${order.id}` })}
              >
                <MessageCircle size={16} color="white" />
                <Text className="text-sm text-white">发消息</Text>
              </View>
            </View>
          ) : (
            <View 
              className="flex flex-row items-center justify-between bg-yellow-50 p-3 rounded-lg"
              onClick={handleViewContact}
            >
              <View className="flex flex-row items-center gap-2">
                <Lock size={16} color="#F59E0B" />
                <Text className="text-sm text-yellow-700">开通会员查看联系方式</Text>
              </View>
              <Text className="text-sm text-yellow-600 font-medium">立即开通 →</Text>
            </View>
          )}
        </View>
      </View>

      {/* 分享奖励提示 */}
      <View className="bg-gradient-to-r from-green-500 to-blue-500 mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <View className="flex flex-row items-center gap-3">
          <Gift size={24} color="white" />
          <View className="flex-1">
            <Text className="text-white font-medium">分享赚钱</Text>
            <Text className="text-white text-opacity-80 text-xs">分享需求给好友，成交后可获得佣金奖励</Text>
          </View>
          <View
            className="bg-white px-4 py-2 rounded-lg"
            onClick={() => {
              // 微信小程序会自动弹出分享面板，因为已配置useShareAppMessage
              Taro.showShareMenu({
                withShareTicket: true,
              } as any);
            }}
          >
            <Text className="text-green-600 text-sm font-medium">立即分享</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex flex-row gap-3">
        <View 
          className="flex flex-row items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl flex-1"
          onClick={handleShare}
        >
          <Share2 size={18} color="#6B7280" />
          <Text className="text-gray-700">分享</Text>
        </View>
        <View 
          className="flex flex-row items-center justify-center gap-2 px-4 py-3 bg-blue-500 rounded-xl flex-[2]"
          onClick={handleGrabOrder}
        >
          <Text className="text-white font-medium">立即抢单</Text>
        </View>
      </View>

      {/* 会员引导弹窗 - 分享进入的用户 */}
      {router.params.from === 'share' && !isMember && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-2xl p-6 mx-8 w-[80%]">
            <Text className="text-lg font-bold text-center mb-2">发现好老师</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              开通会员即可查看完整信息、联系方式，并抢单接课
            </Text>
            <View className="flex flex-col gap-2">
              <View 
                className="bg-blue-500 py-3 rounded-xl text-center"
                onClick={() => Taro.navigateTo({ url: '/pages/membership/index' })}
              >
                <Text className="text-white font-medium">开通会员</Text>
              </View>
              <View 
                className="bg-gray-100 py-3 rounded-xl text-center"
                onClick={() => Taro.redirectTo({ url: '/pages/index/index' })}
              >
                <Text className="text-gray-600">查看更多需求</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrderDetailPage;
