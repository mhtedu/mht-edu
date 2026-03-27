import { View, Text } from '@tarojs/components';
import { useLoad, useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, SlidersHorizontal } from 'lucide-react-taro';
import './index.css';

interface Order {
  id: number;
  subject: string;
  hourly_rate: string;
  student_grade: string;
  address: string;
  description: string;
  status: number;
  created_at: string;
}

/**
 * 首页 - 订单列表
 */
const IndexPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCity] = useState('定位中...');

  useLoad(() => {
    console.log('Page loaded.');
  });

  useDidShow(async () => {
    await loadOrders();
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      // 获取订单列表
      const res = await Network.request({
        url: '/api/orders/teacher',
        method: 'GET',
        data: {
          latitude: '0',
          longitude: '0',
          page: 1,
          pageSize: 20,
        },
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

  const getStatusText = (status: number) => {
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

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部定位 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <MapPin size={16} color="#2563EB" className="mr-1" />
            <Text className="text-sm text-gray-700">{currentCity}</Text>
          </View>
          <View className="flex flex-row items-center">
            <SlidersHorizontal size={16} color="#6B7280" className="mr-1" />
            <Text className="text-sm text-gray-600">筛选</Text>
          </View>
        </View>
      </View>

      {/* 学科筛选 */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex flex-row gap-2 overflow-x-auto">
          {['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理'].map((subject) => (
            <View
              key={subject}
              className="px-3 py-1 rounded-full bg-gray-100 text-sm whitespace-nowrap"
            >
              <Text className="text-sm text-gray-700">{subject}</Text>
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
          <View className="flex flex-col items-center justify-center py-8">
            <Text className="text-gray-500 mb-2">暂无订单</Text>
            <Text className="text-sm text-gray-400">发布需求后，教师可以在这里抢单</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {orders.map((order) => {
              const statusInfo = getStatusText(order.status);
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
                          {formatTime(order.created_at)}
                        </Text>
                      </View>
                      <View className="flex flex-row items-center">
                        <MapPin size={12} color="#6B7280" className="mr-1" />
                        <Text className="text-sm text-gray-600">{order.address}</Text>
                      </View>
                      {order.description && (
                        <Text className="text-sm text-gray-500 line-clamp-2">
                          {order.description}
                        </Text>
                      )}
                      <View className="flex flex-row gap-2 mt-2">
                        <Button size="sm" className="flex-1" variant="default">
                          <Text className="text-sm">抢单</Text>
                        </Button>
                        <Button size="sm" className="flex-1" variant="outline">
                          <Text className="text-sm">详情</Text>
                        </Button>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* 发布需求按钮 */}
      <View className="fixed bottom-20 right-4 z-50">
        <Button className="w-12 h-12 rounded-full shadow-lg" size="lg">
          <Text className="text-2xl">+</Text>
        </Button>
      </View>
    </View>
  );
};

export default IndexPage;

