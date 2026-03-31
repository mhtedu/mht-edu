import { View, Text } from '@tarojs/components';
import Taro, { useDidShow, useShareAppMessage, useShareTimeline } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteConfig } from '@/store';
import { 
  Share2, Gift, Users, Copy, ChevronRight,
  DollarSign, Award, Send, Link
} from 'lucide-react-taro';
import './index.css';

interface Order {
  id: number;
  subject: string;
  grade: string;
  hourly_rate: number;
  address: string;
  share_count: number;
  view_count: number;
  created_at: string;
}

interface ShareStats {
  total_shared: number;
  total_views: number;
  total_commission: number;
  settled_commission: number;
}

/**
 * 分享中心 - 转发需求赚佣金
 */
const ShareCenterPage = () => {
  const siteName = useSiteConfig(state => state.getSiteName)();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ShareStats>({
    total_shared: 0,
    total_views: 0,
    total_commission: 0,
    settled_commission: 0,
  });
  const [inviteCode] = useState('P1ABC23');

  useDidShow(() => {
    loadData();
  });

  // 配置分享
  useShareAppMessage(() => ({
    title: '这里有家长正在找老师，快来看看！',
    path: '/pages/index/index?from=share_center',
    imageUrl: 'https://placehold.co/500x400/2563EB/white?text=找老师',
  }));

  useShareTimeline(() => ({
    title: `${siteName} - 找好老师，上${siteName}`,
    query: 'from=share_center',
    imageUrl: 'https://placehold.co/500x400/2563EB/white?text=找老师',
  }));

  const loadData = () => {
    // 模拟数据
    setOrders([
      { id: 1, subject: '高中数学', grade: '高二', hourly_rate: 200, address: '朝阳区望京', share_count: 15, view_count: 86, created_at: '刚刚' },
      { id: 2, subject: '初中英语', grade: '初三', hourly_rate: 150, address: '海淀区中关村', share_count: 23, view_count: 124, created_at: '10分钟前' },
      { id: 3, subject: '小学语文', grade: '五年级', hourly_rate: 120, address: '西城区金融街', share_count: 8, view_count: 45, created_at: '30分钟前' },
      { id: 4, subject: '高中物理', grade: '高三', hourly_rate: 250, address: '东城区王府井', share_count: 31, view_count: 156, created_at: '1小时前' },
    ]);

    setStats({
      total_shared: 77,
      total_views: 411,
      total_commission: 2580,
      settled_commission: 1260,
    });
  };

  const handleShareOrder = (order: Order) => {
    // 设置分享内容
    Taro.showShareMenu({ withShareTicket: true } as any);
    
    Taro.showModal({
      title: '分享需求',
      content: `分享「${order.subject}」需求到微信，成交后可获得5%佣金（约¥${Math.round(order.hourly_rate * 4 * 0.05)}）`,
      confirmText: '立即分享',
      success: (res) => {
        if (res.confirm) {
          // 触发分享
        }
      },
    });
  };

  const handleCopyInviteCode = () => {
    Taro.setClipboardData({
      data: inviteCode,
      success: () => {
        Taro.showToast({ title: '已复制邀请码', icon: 'success' });
      },
    });
  };

  const handleCopyLink = (orderId: number) => {
    Taro.setClipboardData({
      data: `https://edu.example.com/order/${orderId}?share_code=${inviteCode}`,
      success: () => {
        Taro.showToast({ title: '链接已复制', icon: 'success' });
      },
    });
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-6 pb-8">
        <View className="flex items-center justify-center mb-4">
          <Share2 size={28} color="white" />
          <Text className="text-white text-xl font-bold ml-2">分享中心</Text>
        </View>
        <Text className="text-white text-opacity-80 text-center text-sm">
          转发需求，成交后获得5%佣金
        </Text>

        <Card className="mt-4 bg-white bg-opacity-10 backdrop-blur">
          <CardContent className="p-4">
            <View className="flex justify-around">
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">转发次数</Text>
                <Text className="text-white text-2xl font-bold">{stats.total_shared}</Text>
              </View>
              <View className="w-px bg-white bg-opacity-20" />
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">浏览量</Text>
                <Text className="text-white text-2xl font-bold">{stats.total_views}</Text>
              </View>
              <View className="w-px bg-white bg-opacity-20" />
              <View className="text-center">
                <Text className="text-white text-opacity-80 text-sm">累计佣金</Text>
                <Text className="text-white text-2xl font-bold">¥{stats.total_commission}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 -mt-4">
        {/* 邀请码 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">我的邀请码</Text>
                <Text className="text-2xl font-bold text-orange-500 mt-1">{inviteCode}</Text>
              </View>
              <Button size="sm" onClick={handleCopyInviteCode}>
                <Copy size={14} color="white" className="mr-1" />
                <Text>复制</Text>
              </Button>
            </View>
            <View className="mt-3 bg-orange-50 rounded-lg p-3">
              <Text className="text-orange-700 text-sm">
                💡 好友通过您的邀请码注册并开通会员，您可获得20%佣金
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* 分佣规则 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>分佣规则</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              <View className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                <View className="flex items-center">
                  <Award size={20} color="#F59E0B" className="mr-2" />
                  <Text className="text-gray-700">直接邀请开通会员</Text>
                </View>
                <Text className="text-orange-500 font-bold">20%</Text>
              </View>
              <View className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                <View className="flex items-center">
                  <Users size={20} color="#3B82F6" className="mr-2" />
                  <Text className="text-gray-700">间接邀请开通会员</Text>
                </View>
                <Text className="text-orange-500 font-bold">10%</Text>
              </View>
              <View className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                <View className="flex items-center">
                  <Share2 size={20} color="#22C55E" className="mr-2" />
                  <Text className="text-gray-700">转发需求成交佣金</Text>
                </View>
                <Text className="text-orange-500 font-bold">5%</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 可分享需求列表 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex items-center justify-between">
              <View className="flex items-center">
                <Gift size={18} color="#F97316" className="mr-2" />
                <CardTitle>热门需求</CardTitle>
              </View>
              <View 
                className="flex items-center"
                onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
              >
                <Text className="text-gray-400 text-sm">查看更多</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              {orders.map((order) => (
                <View key={order.id} className="bg-gray-50 rounded-lg p-3">
                  <View className="flex justify-between items-start mb-2">
                    <View className="flex-1">
                      <View className="flex items-center">
                        <Text className="font-semibold">{order.subject}</Text>
                        <Badge className="ml-2 bg-blue-100">
                          <Text className="text-blue-600 text-xs">{order.grade}</Text>
                        </Badge>
                      </View>
                      <Text className="text-gray-500 text-xs mt-1">{order.address}</Text>
                    </View>
                    <Text className="text-orange-500 font-bold">¥{order.hourly_rate}/h</Text>
                  </View>
                  
                  <View className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <View className="flex items-center gap-4">
                      <Text>👁 {order.view_count}人浏览</Text>
                      <Text>📤 {order.share_count}次分享</Text>
                    </View>
                    <Text>预估佣金 ¥{Math.round(order.hourly_rate * 4 * 0.05)}</Text>
                  </View>

                  <View className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCopyLink(order.id)}
                    >
                      <Link size={14} color="#6B7280" className="mr-1" />
                      <Text>复制链接</Text>
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1 bg-orange-500"
                      onClick={() => handleShareOrder(order)}
                    >
                      <Send size={14} color="white" className="mr-1" />
                      <Text className="text-white">转发赚钱</Text>
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 推广技巧 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>推广技巧</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Text className="text-orange-600 text-xs font-bold">1</Text>
                </View>
                <Text className="text-gray-600 text-sm ml-2">分享到家长群、教师群，覆盖更多潜在客户</Text>
              </View>
              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Text className="text-orange-600 text-xs font-bold">2</Text>
                </View>
                <Text className="text-gray-600 text-sm ml-2">分享时添加推荐语，如「这个需求很不错，推荐看看」</Text>
              </View>
              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Text className="text-orange-600 text-xs font-bold">3</Text>
                </View>
                <Text className="text-gray-600 text-sm ml-2">关注高价值需求，时薪越高佣金越多</Text>
              </View>
              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Text className="text-orange-600 text-xs font-bold">4</Text>
                </View>
                <Text className="text-gray-600 text-sm ml-2">邀请好友注册，获得持续的二级佣金收益</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部固定 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => Taro.navigateTo({ url: '/pages/distribution/index' })}
        >
          <DollarSign size={16} color="#F97316" className="mr-1" />
          <Text>我的佣金</Text>
        </Button>
        <Button 
          className="flex-1 bg-orange-500"
          onClick={() => Taro.showShareMenu({ withShareTicket: true } as any)}
        >
          <Share2 size={16} color="white" className="mr-1" />
          <Text className="text-white">分享平台</Text>
        </Button>
      </View>
    </View>
  );
};

export default ShareCenterPage;
