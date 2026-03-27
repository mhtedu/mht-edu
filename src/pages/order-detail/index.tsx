import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Phone, MessageCircle, Check, Lock, TriangleAlert } from 'lucide-react-taro';
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
  matched_teacher_id?: number;
}

interface CloseReason {
  value: string;
  label: string;
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
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closeFeedback, setCloseFeedback] = useState('');
  const [closeReasons, setCloseReasons] = useState<CloseReason[]>([]);
  const [isParent, setIsParent] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');

  useEffect(() => {
    const id = Taro.getCurrentInstance().router?.params?.id;
    if (id) {
      loadOrder(parseInt(id));
    }
    
    // 获取用户角色
    const userRole = Taro.getStorageSync('userRole');
    setIsParent(userRole === 0);
    
    // 获取关闭原因选项
    loadCloseReasons();
  }, []);

  const loadOrder = async (id: number) => {
    try {
      const res = await Network.request({
        url: `/api/orders/${id}`,
        method: 'GET',
      });
      
      console.log('订单详情:', res.data);
      if (res.data?.data) {
        setOrder(res.data.data);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCloseReasons = async () => {
    try {
      const res = await Network.request({
        url: '/api/order-close/reasons',
        method: 'GET',
      });
      
      console.log('关闭原因选项:', res.data);
      if (res.data?.data) {
        setCloseReasons(res.data.data);
      }
    } catch (error) {
      console.error('获取关闭原因失败:', error);
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
        url: '/api/teacher-profile/unlock-contact',
        method: 'POST',
        data: {
          targetUserId: order.parent_id,
          orderId: order.id,
          unlockType: 3, // 全部解锁
        },
      });
      
      console.log('解锁结果:', res.data);
      if (res.data?.data) {
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

  // 关闭订单（仅家长可操作）
  const handleCloseOrder = async () => {
    if (!order || !closeReason) {
      Taro.showToast({ title: '请选择关闭原因', icon: 'none' });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/order-close/close',
        method: 'POST',
        data: {
          orderId: order.id,
          closeType: 1, // 未达成合作
          reason: closeReason,
          feedback: closeFeedback,
        },
      });

      console.log('关闭订单结果:', res.data);
      if (res.data?.data) {
        setShowCloseDialog(false);
        
        // 提示会员权益终止
        Taro.showModal({
          title: '订单已关闭',
          content: res.data.data.message || '订单已关闭，会员权益已终止。订单已进入公海池供其他教师抢单。',
          showCancel: false,
          success: () => {
            Taro.navigateBack();
          },
        });
      }
    } catch (error) {
      console.error('关闭订单失败:', error);
      Taro.showToast({ title: '关闭失败', icon: 'none' });
    }
  };

  // 完成评价
  const handleCompleteReview = async () => {
    if (!order || !reviewContent) {
      Taro.showToast({ title: '请填写评价内容', icon: 'none' });
      return;
    }

    try {
      const res = await Network.request({
        url: '/api/order-close/complete-review',
        method: 'POST',
        data: {
          orderId: order.id,
          rating: reviewRating,
          content: reviewContent,
          isAnonymous: false,
        },
      });

      console.log('评价结果:', res.data);
      if (res.data?.data) {
        setShowReviewDialog(false);
        Taro.showToast({ title: '评价成功', icon: 'success' });
        loadOrder(order.id);
      }
    } catch (error) {
      console.error('评价失败:', error);
      Taro.showToast({ title: '评价失败', icon: 'none' });
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

        {/* 会员权益提示（订单已解除时显示） */}
        {order.status === 5 && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <View className="flex flex-row items-start gap-2">
                <TriangleAlert size={20} color="#DC2626" />
                <View className="flex-1">
                  <Text className="text-red-600 font-semibold">订单已关闭</Text>
                  <Text className="text-red-500 text-sm mt-1">
                    会员权益已终止。订单已进入公海池供其他教师抢单。
                  </Text>
                </View>
              </View>
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
                  <Text className="text-gray-400 text-xs">{order.created_at}</Text>
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
                    <Text className="text-gray-400 text-xs">教师已接单</Text>
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
            {/* 家长可以关闭订单 */}
            {isParent && (
              <Button 
                variant="outline" 
                className="flex-1 border-red-500 text-red-500" 
                onClick={() => setShowCloseDialog(true)}
              >
                <Text className="text-red-500">关闭订单</Text>
              </Button>
            )}
            {/* 教师可以解除绑定 */}
            {!isParent && (
              <Button variant="outline" className="flex-1" onClick={() => handleStatusChange(5)}>
                <Text>解除绑定</Text>
              </Button>
            )}
            <Button className="flex-1 bg-green-500" onClick={() => handleStatusChange(2)}>
              <Text className="text-white">开始试课</Text>
            </Button>
          </View>
        )}
        {order.status === 2 && (
          <View className="flex flex-row gap-3">
            {/* 家长可以关闭订单 */}
            {isParent && (
              <Button 
                variant="outline" 
                className="flex-1 border-red-500 text-red-500" 
                onClick={() => setShowCloseDialog(true)}
              >
                <Text className="text-red-500">关闭订单</Text>
              </Button>
            )}
            {/* 教师可以试课不合适 */}
            {!isParent && (
              <Button variant="outline" className="flex-1" onClick={() => handleStatusChange(5)}>
                <Text>试课不合适</Text>
              </Button>
            )}
            <Button className="flex-1 bg-purple-500" onClick={() => handleStatusChange(3)}>
              <Text className="text-white">确认签约</Text>
            </Button>
          </View>
        )}
        {order.status === 3 && (
          <Button className="w-full bg-green-500" onClick={() => setShowReviewDialog(true)}>
            <Text className="text-white">完成并评价</Text>
          </Button>
        )}
      </View>

      {/* 关闭订单弹窗 */}
      {showCloseDialog && (
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>关闭订单</DialogTitle>
            </DialogHeader>
            <View className="flex flex-col gap-4">
              {/* 警告提示 */}
              <View className="bg-red-50 p-3 rounded-lg">
                <View className="flex flex-row items-start gap-2">
                  <TriangleAlert size={16} color="#DC2626" />
                  <View className="flex-1">
                    <Text className="text-red-600 text-sm font-semibold">重要提示</Text>
                    <Text className="text-red-500 text-xs mt-1">
                      关闭订单将终止您的会员权益，订单将进入公海池供其他教师抢单。
                    </Text>
                  </View>
                </View>
              </View>

              {/* 关闭原因 */}
              <View>
                <Text className="text-sm font-semibold mb-2">关闭原因</Text>
                <View className="flex flex-col gap-2">
                  {closeReasons.map((reason) => (
                    <View
                      key={reason.value}
                      className={`p-3 rounded-lg border ${
                        closeReason === reason.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setCloseReason(reason.value)}
                    >
                      <Text className={closeReason === reason.value ? 'text-blue-600' : 'text-gray-700'}>
                        {reason.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 补充说明 */}
              <View>
                <Text className="text-sm font-semibold mb-2">补充说明（选填）</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Textarea
                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                    placeholder="请输入补充说明..."
                    value={closeFeedback}
                    onInput={(e) => setCloseFeedback(e.detail.value)}
                  />
                </View>
              </View>

              {/* 按钮 */}
              <View className="flex flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowCloseDialog(false)}
                >
                  <Text>取消</Text>
                </Button>
                <Button 
                  className="flex-1 bg-red-500"
                  onClick={handleCloseOrder}
                  disabled={!closeReason}
                >
                  <Text className="text-white">确认关闭</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}

      {/* 评价弹窗 */}
      {showReviewDialog && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="w-80">
            <DialogHeader>
              <DialogTitle>评价教师</DialogTitle>
            </DialogHeader>
            <View className="flex flex-col gap-4">
              {/* 评分 */}
              <View>
                <Text className="text-sm font-semibold mb-2">评分</Text>
                <View className="flex flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <View
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Text className={`text-2xl ${star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}`}>
                        ★
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 评价内容 */}
              <View>
                <Text className="text-sm font-semibold mb-2">评价内容</Text>
                <View className="bg-gray-50 rounded-lg p-3">
                  <Textarea
                    style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                    placeholder="请输入您的评价..."
                    value={reviewContent}
                    onInput={(e) => setReviewContent(e.detail.value)}
                  />
                </View>
              </View>

              {/* 按钮 */}
              <View className="flex flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowReviewDialog(false)}
                >
                  <Text>取消</Text>
                </Button>
                <Button 
                  className="flex-1 bg-blue-500"
                  onClick={handleCompleteReview}
                  disabled={!reviewContent}
                >
                  <Text className="text-white">提交评价</Text>
                </Button>
              </View>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  );
};

export default OrderDetailPage;
