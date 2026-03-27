import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User } from 'lucide-react-taro';
import './index.css';

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
 * 订单管理页面 - 家长/教师不同视图
 */
const OrdersPage = () => {
  const [currentRole, setCurrentRole] = useState(0); // 0: 家长, 1: 教师
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, [currentRole, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const url = currentRole === 0 
        ? '/api/orders/parent' 
        : '/api/orders/teacher';
      
      const params: any = {
        page: 1,
        pageSize: 20,
      };

      if (currentRole === 0) {
        params.parentId = 1;
      } else {
        params.latitude = 39.995;
        params.longitude = 116.473;
      }

      // 根据tab筛选状态
      if (activeTab === 'pending') {
        params.status = 0;
      } else if (activeTab === 'ongoing') {
        params.status = [1, 2, 3].join(',');
      } else if (activeTab === 'completed') {
        params.status = 4;
      }

      const res = await Network.request({
        url,
        method: 'GET',
        data: params,
      });

      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
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

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 角色切换 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-2">
          <View
            className={`px-4 py-2 rounded-full ${currentRole === 0 ? 'bg-blue-500' : 'bg-gray-100'}`}
            onClick={() => setCurrentRole(0)}
          >
            <Text className={currentRole === 0 ? 'text-white' : 'text-gray-600'}>家长端</Text>
          </View>
          <View
            className={`px-4 py-2 rounded-full ${currentRole === 1 ? 'bg-blue-500' : 'bg-gray-100'}`}
            onClick={() => setCurrentRole(1)}
          >
            <Text className={currentRole === 1 ? 'text-white' : 'text-gray-600'}>教师端</Text>
          </View>
        </View>
      </View>

      {/* 状态Tab */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <View className="flex flex-row gap-4">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: currentRole === 0 ? '待接单' : '可抢单' },
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
            <Text className="text-gray-400">暂无订单</Text>
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
