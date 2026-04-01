import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { Network } from '@/network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, ChevronRight, Copy, Share2 } from 'lucide-react-taro';
import './index.css';

interface InviteInfo {
  invite_code: string;
  invite_link: string;
  total_invited: number;
  total_commission: number;
  level1_count: number;
  level2_count: number;
}

interface Commission {
  id: number;
  amount: number;
  rate: number;
  status: number;
  created_at: string;
  from_user: { nickname: string };
}

/**
 * 分销中心页面
 */
const DistributionPage = () => {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inviteRes, commissionRes] = await Promise.all([
        Network.request({
          url: '/api/distribution/invite-info/1',
          method: 'GET',
        }),
        Network.request({
          url: '/api/distribution/commission-list/1',
          method: 'GET',
        }),
      ]);

      if (inviteRes.data) setInviteInfo(inviteRes.data);
      if (commissionRes.data) setCommissions(commissionRes.data);
    } catch (error) {
      // 使用模拟数据
      setInviteInfo({
        invite_code: 'P1ABC23',
        invite_link: 'https://edu.example.com/invite/P1ABC23',
        total_invited: 12,
        total_commission: 580,
        level1_count: 8,
        level2_count: 4,
      });
      setCommissions([
        { id: 1, amount: 59.8, rate: 20, status: 1, created_at: '2026-03-27', from_user: { nickname: '张老师' } },
        { id: 2, amount: 39.8, rate: 20, status: 1, created_at: '2026-03-26', from_user: { nickname: '李家长' } },
      ]);
    } finally {
    }
  };

  const handleCopyCode = () => {
    if (!inviteInfo) return;
    Taro.setClipboardData({
      data: inviteInfo.invite_code,
      success: () => {
        Taro.showToast({ title: '已复制邀请码', icon: 'success' });
      }
    });
  };

  const handleShare = () => {
    // 小程序分享
    Taro.showShareMenu({
      withShareTicket: true
    });
  };

  const handleWithdraw = () => {
    Taro.navigateTo({ url: '/pages/withdraw/index' });
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部收益信息 */}
      <View className="bg-gradient-to-br from-purple-500 to-purple-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-center mb-6">
          <Gift size={28} color="white" />
          <Text className="text-white text-xl font-bold ml-2">分销中心</Text>
        </View>
        
        <Card className="bg-white bg-opacity-10 backdrop-blur">
          <CardContent className="p-4">
            <View className="flex flex-row justify-around">
              <View className="flex flex-col items-center">
                <Text className="text-white text-opacity-80 text-sm">累计佣金</Text>
                <Text className="text-white text-2xl font-bold mt-1">¥{(inviteInfo && inviteInfo.total_commission) || 0}</Text>
              </View>
              <View className="w-px bg-white bg-opacity-20" />
              <View className="flex flex-col items-center">
                <Text className="text-white text-opacity-80 text-sm">邀请人数</Text>
                <Text className="text-white text-2xl font-bold mt-1">{(inviteInfo && inviteInfo.total_invited) || 0}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 -mt-4">
        {/* 邀请码 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">我的邀请码</Text>
                <Text className="text-2xl font-bold text-purple-500 mt-1">{(inviteInfo && inviteInfo.invite_code) || ''}</Text>
              </View>
              <Button size="sm" onClick={handleCopyCode}>
                <Copy size={14} color="white" className="mr-1" />
                <Text>复制</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 分佣规则 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>分佣规则</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <Badge className="bg-yellow-100 mr-2">一级</Badge>
                  <Text className="text-gray-700">直接邀请</Text>
                </View>
                <Text className="text-orange-500 font-semibold">20%</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <Badge className="bg-blue-100 mr-2">二级</Badge>
                  <Text className="text-gray-700">间接邀请</Text>
                </View>
                <Text className="text-orange-500 font-semibold">10%</Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <Badge className="bg-green-100 mr-2">代理</Badge>
                  <Text className="text-gray-700">城市代理</Text>
                </View>
                <Text className="text-orange-500 font-semibold">5%</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 我的团队 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>我的团队</CardTitle>
              <View className="flex flex-row items-center" onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}>
                <Text className="text-gray-400 text-sm">查看全部</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row justify-around">
              <View className="flex flex-col items-center">
                <Users size={24} color="#FCD34D" />
                <Text className="font-semibold mt-1">{(inviteInfo && inviteInfo.level1_count) || 0}</Text>
                <Text className="text-gray-500 text-xs">一级成员</Text>
              </View>
              <View className="flex flex-col items-center">
                <Users size={24} color="#60A5FA" />
                <Text className="font-semibold mt-1">{(inviteInfo && inviteInfo.level2_count) || 0}</Text>
                <Text className="text-gray-500 text-xs">二级成员</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 佣金明细 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>佣金明细</CardTitle>
              <View className="flex flex-row items-center" onClick={() => Taro.navigateTo({ url: '/pages/commission/index' })}>
                <Text className="text-gray-400 text-sm">查看全部</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <Text className="text-gray-400 text-center py-4">暂无佣金记录</Text>
            ) : (
              <View className="flex flex-col gap-3">
                {commissions.map((item) => (
                  <View key={item.id} className="flex flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-700">{item.from_user.nickname} 购买会员</Text>
                      <Text className="text-gray-400 text-xs">{item.created_at}</Text>
                    </View>
                    <Text className="text-green-500 font-semibold">+¥{item.amount}</Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 底部操作 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex flex-row gap-3">
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <Share2 size={16} color="#9333EA" className="mr-1" />
          <Text>分享邀请</Text>
        </Button>
        <Button className="flex-1 bg-purple-500" onClick={handleWithdraw}>
          <Text className="text-white">提现</Text>
        </Button>
      </View>
    </View>
  );
};

export default DistributionPage;
