import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User } from 'lucide-react-taro';
import { useUserStore } from '@/stores/user';
import { getLocation } from '@/utils';

interface Order {
  id: number;
  subject: string;
  hourly_rate: number;
  student_grade: string;
  address: string;
  description: string;
  status: number;
  created_at: string;
  distance?: number;
  distance_text?: string;
  matched_teacher_id?: number;
}

const statusConfig: Record<number, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  0: { text: '待抢单', variant: 'default', color: 'bg-blue-500' },
  1: { text: '沟通中', variant: 'secondary', color: 'bg-green-500' },
  2: { text: '试课中', variant: 'secondary', color: 'bg-yellow-500' },
  3: { text: '已签约', variant: 'outline', color: 'bg-purple-500' },
  4: { text: '已完成', variant: 'outline', color: 'bg-gray-500' },
  5: { text: '已解除', variant: 'destructive', color: 'bg-red-500' },
};

/**
 * 订单管理页面 - 根据用户角色显示不同内容
 * 家长：显示自己发布的订单
 * 牛师：显示可抢单的订单
 */
const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed'>('all');
  const { location: userLocation, currentView, isLoggedIn } = useUserStore();

  // 根据用户角色确定视角
  const isParentView = currentView === 'parent';
  const isTeacherView = currentView === 'teacher';

  useEffect(() => {
    // 未登录时提示登录
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后查看订单',
        showCancel: false,
        success: () => Taro.navigateBack()
      });
      return;
    }
    loadOrders();
  }, [activeTab, currentView, isLoggedIn]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // 根据角色调用不同接口
      let url = '';
      const params: any = {
        page: 1,
        pageSize: 20,
      };

      if (isParentView) {
        // 家长视角：获取自己发布的订单
        url = '/api/order/list';
        // 后端会从 token 中获取用户ID，不需要前端传递
      } else if (isTeacherView) {
        // 牛师视角：获取附近可抢单的订单
        url = '/api/order/nearby';
        
        let lat = userLocation?.latitude;
        let lng = userLocation?.longitude;

        if (!lat || !lng) {
          const loc = await getLocation();
          if (loc) {
            lat = loc.latitude;
            lng = loc.longitude;
          }
        }

        if (lat && lng) {
          params.latitude = lat;
          params.longitude = lng;
          params.radius = 50;
        }
      } else {
        // 机构视角：显示机构的订单
        url = '/api/order/list';
      }

      // 根据tab筛选状态
      if (activeTab === 'pending') {
        params.status = 0;
      } else if (activeTab === 'ongoing') {
        params.status = [1, 2, 3].join(',');
      } else if (activeTab === 'completed') {
        params.status = 4;
      }

      console.log('加载订单请求:', { url, params, currentView });
      const res = await Network.request({
        url,
        method: 'GET',
        data: params,
      });
      console.log('加载订单响应:', res);

      // Network.request 返回 Taro.request 的结果，数据在 res.data 中
      let orderList: Order[] = [];
      const responseData = res.data;
      
      if (responseData && Array.isArray(responseData.list)) {
        orderList = responseData.list;
      } else if (responseData && Array.isArray(responseData)) {
        orderList = responseData;
      } else if (Array.isArray(res)) {
        // 兼容直接返回数组的情况
        orderList = res;
      } else if (res && Array.isArray(res.list)) {
        orderList = res.list;
      }

      console.log('解析后的订单列表:', orderList, '数量:', orderList.length);

      // 格式化距离显示
      orderList = orderList.map((order: any) => ({
        ...order,
        distance_text: order.distance_text || (order.distance ? 
          (order.distance < 1 ? `${Math.round(order.distance * 1000)}m` : `${order.distance.toFixed(1)}km`) 
          : undefined)
      }));

      setOrders(orderList);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 获取当前视角的标签文本
  const getTabLabel = (tabKey: string) => {
    if (tabKey === 'pending') {
      return isParentView ? '待接单' : '可抢单';
    }
    const labels: Record<string, string> = {
      'all': '全部',
      'ongoing': '进行中',
      'completed': '已完成',
    };
    return labels[tabKey] || tabKey;
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 当前视角提示 */}
      <View className="bg-blue-50 px-4 py-2 border-b border-blue-100">
        <Text className="text-sm text-blue-600">
          当前视角：{isParentView ? '家长 - 我的订单' : isTeacherView ? '牛师 - 可抢单订单' : '机构 - 订单管理'}
        </Text>
      </View>

      {/* 状态Tab */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <View className="flex flex-row gap-4">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: getTabLabel('pending') },
            { key: 'ongoing', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ].map((tab) => (
            <View
              key={tab.key}
              className={`pb-2 ${activeTab === tab.key ? 'border-b-2 border-blue-500' : ''}`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Text className={activeTab === tab.key ? 'text-blue-500 font-semibold' : 'text-gray-600'}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 订单列表 */}
      <View className="p-4">
        {loading ? (
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">加载中...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Text className="text-gray-400">
              {isParentView ? '暂无订单，去发布需求吧' : '暂无可抢单订单'}
            </Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig[0];
              return (
                <Card 
                  key={order.id} 
                  className="bg-white"
                  onClick={() => Taro.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` })}
                >
                  <CardContent className="p-4">
                    <View className="flex flex-row justify-between items-start mb-2">
                      <View className="flex flex-row items-center">
                        <View className={`w-1 h-4 rounded ${status.color} mr-2`} />
                        <Text className="font-semibold text-lg">{order.subject}</Text>
                      </View>
                      <Badge variant={status.variant}>
                        <Text className="text-xs">{status.text}</Text>
                      </Badge>
                    </View>
                    
                    <View className="flex flex-col gap-2">
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-orange-500 font-semibold">¥{order.hourly_rate}/小时</Text>
                        <Text className="text-xs text-gray-400">{formatTime(order.created_at)}</Text>
                      </View>
                      
                      <View className="flex flex-row items-center text-gray-500 text-sm">
                        <User size={14} color="#6B7280" className="mr-1" />
                        <Text>{order.student_grade}</Text>
                      </View>
                      
                      <View className="flex flex-row items-center text-gray-500 text-sm">
                        <MapPin size={14} color="#6B7280" className="mr-1" />
                        <Text>{order.address}</Text>
                        {order.distance_text && (
                          <Text className="ml-2 text-blue-500">{order.distance_text}</Text>
                        )}
                      </View>

                      {order.description && (
                        <Text className="text-gray-400 text-sm line-clamp-1">{order.description}</Text>
                      )}
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default OrdersPage;
