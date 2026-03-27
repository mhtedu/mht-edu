import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Check, Lock } from 'lucide-react-taro';
import './index.css';

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
  parent_id: number;
}

const statusConfig: Record<number, { text: string; color: string; desc: string }> = {
  0: { text: '待抢单', color: 'bg-blue-500', desc: '等待教师抢单' },
  1: { text: '沟通中', color: 'bg-green-500', desc: '教师已接单，正在沟通' },
  2: { text: '试课中', color: 'bg-yellow-500', desc: '试课进行中' },
  3: { text: '已签约', color: 'bg-purple-500', desc: '已正式签约' },
  4: { text: '已完成', color: 'bg-gray-500', desc: '课程已完成' },
  5: { text: '已解除', color: 'bg-red-500', desc: '已解除关系' },
};

/**
 * 订单详情页
 */
const OrderDetailPage = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactUnlocked, setContactUnlocked] = useState(false);

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id;
    if (id) {
      loadOrder(parseInt(id));
    }
  }, []);

  const loadOrder = async (id: number) => {
    try {
      const res = await Network.request({
        url: `/api/orders/${id}`,
        method: 'GET',
      });
      
      if (res.data) {
        setOrder(res.data);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrab = async () => {
    if (!order) return;
    
    try {
      const res = await Network.request({
        url: `/api/orders/${order.id}/grab`,
        method: 'POST',
        data: { teacher_id: 2 }, // TODO: 从登录状态获取
      });
      
      if (res.data) {
        Taro.showToast({ title: '抢单成功', icon: 'success' });
        loadOrder(order.id);
      }
    } catch (error) {
      Taro.showToast({ title: '抢单失败', icon: 'none' });
    }
  };

  const handleUnlockContact = async () => {
    if (!order) return;
    
    try {
      const res = await Network.request({
        url: `/api/orders/${order.id}/contact`,
        method: 'GET',
        data: { userId: 2 }, // TODO: 从登录状态获取
      });
      
      if (res.data) {
        setContactUnlocked(true);
        Taro.showToast({ title: '解锁成功', icon: 'success' });
      }
    } catch (error) {
      Taro.showToast({ title: '解锁失败，请先开通会员', icon: 'none' });
    }
  };

  const handleStatusChange = async (newStatus: number) => {
    if (!order) return;
    
    try {
      const res = await Network.request({
        url: `/api/orders/${order.id}`,
        method: 'PUT',
        data: { status: newStatus },
      });
      
      if (res.data) {
        Taro.showToast({ title: '状态已更新', icon: 'success' });
        loadOrder(order.id);
      }
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
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

  const status = statusConfig[order.status] || statusConfig[0];

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {/* 状态头部 */}
      <View className={`${status.color} px-4 py-6`}>
        <View className="flex flex-row items-center">
          <Check size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-2">{status.text}</Text>
        </View>
        <Text className="text-white text-opacity-80 text-sm mt-2">{status.desc}</Text>
      </View>

      <View className="px-4 py-4">
        {/* 基本信息 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>需求信息</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-500">科目</Text>
                <Text className="font-semibold">{order.subject}</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-500">年级</Text>
                <Text>{order.student_grade}</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-500">学生性别</Text>
                <Text>{order.student_gender === 1 ? '男' : '女'}</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-gray-500">课时费</Text>
                <Text className="text-orange-500 font-semibold">¥{order.hourly_rate}/小时</Text>
              </View>
              <View className="flex flex-row items-start">
                <MapPin size={16} color="#6B7280" className="mr-2 mt-1" />
                <Text className="text-gray-700">{order.address}</Text>
              </View>
              {order.description && (
                <View className="bg-gray-50 rounded-lg p-3 mt-2">
                  <Text className="text-gray-600">{order.description}</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* 联系方式（需解锁） */}
        {order.status >= 1 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle>联系方式</CardTitle>
            </CardHeader>
            <CardContent>
              {contactUnlocked ? (
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row items-center">
                    <Phone size={16} color="#2563EB" className="mr-2" />
                    <Text className="text-blue-500">138****8888</Text>
                  </View>
                  <View className="flex flex-row items-center">
                    <MessageCircle size={16} color="#2563EB" className="mr-2" />
                    <Text className="text-blue-500">在线咨询</Text>
                  </View>
                </View>
              ) : (
                <View className="flex flex-col items-center py-4">
                  <Lock size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">联系方式已隐藏</Text>
                  <Button 
                    size="sm" 
                    className="mt-3 bg-blue-500"
                    onClick={handleUnlockContact}
                  >
                    <Text className="text-white">解锁联系方式</Text>
                  </Button>
                  <Text className="text-gray-400 text-xs mt-2">开通会员后可解锁</Text>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* 时间线 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>订单进度</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-4">
              <View className="flex flex-row">
                <View className="flex flex-col items-center mr-3">
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                  <View className="w-1 h-8 bg-blue-500" />
                </View>
                <View>
                  <Text className="font-semibold">发布需求</Text>
                  <Text className="text-gray-400 text-xs">2026-03-27 22:42</Text>
                </View>
              </View>
              {order.status >= 1 && (
                <View className="flex flex-row">
                  <View className="flex flex-col items-center mr-3">
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                    <View className="w-1 h-8 bg-blue-500" />
                  </View>
                  <View>
                    <Text className="font-semibold">教师接单</Text>
                    <Text className="text-gray-400 text-xs">张老师已接单</Text>
                  </View>
                </View>
              )}
              {order.status >= 2 && (
                <View className="flex flex-row">
                  <View className="flex flex-col items-center mr-3">
                    <View className="w-3 h-3 rounded-full bg-blue-500" />
                    <View className="w-1 h-8 bg-blue-500" />
                  </View>
                  <View>
                    <Text className="font-semibold">开始试课</Text>
                    <Text className="text-gray-400 text-xs">试课进行中</Text>
                  </View>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        {order.status === 0 && (
          <Button className="w-full bg-blue-500" onClick={handleGrab}>
            <Text className="text-white font-semibold">立即抢单</Text>
          </Button>
        )}
        {order.status === 1 && (
          <View className="flex flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => handleStatusChange(5)}>
              <Text>解除绑定</Text>
            </Button>
            <Button className="flex-1 bg-green-500" onClick={() => handleStatusChange(2)}>
              <Text className="text-white">开始试课</Text>
            </Button>
          </View>
        )}
        {order.status === 2 && (
          <View className="flex flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => handleStatusChange(5)}>
              <Text>试课不合适</Text>
            </Button>
            <Button className="flex-1 bg-purple-500" onClick={() => handleStatusChange(3)}>
              <Text className="text-white">确认签约</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
