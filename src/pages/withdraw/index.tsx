import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/stores/user';
import { Network } from '@/network';
import { Wallet, CreditCard, Banknote, CircleAlert } from 'lucide-react-taro';
import './index.css';

interface InviteInfo {
  statistics: {
    total_commission: string;
    settled_commission: string;
    withdrawn_commission: string;
    available_commission: string;
  };
}

/**
 * 提现页面
 */
const WithdrawPage = () => {
  const getUserId = useUserStore(state => state.getUserId);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [accountType, setAccountType] = useState('wechat');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    loadData();
  });

  const loadData = async () => {
    try {
      const uid = getUserId();
      if (!uid) {
        Taro.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      const inviteRes = await Network.request({
        url: `/api/distribution/invite-info/${uid}`,
        method: 'GET',
      });
      if (inviteRes.data) {
        setInviteInfo(inviteRes.data as InviteInfo);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleWithdraw = async () => {
    const uid = getUserId();
    if (!uid) {
      Taro.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    const available = parseFloat(inviteInfo?.statistics?.available_commission || '0');
    if (withdrawAmount > available) {
      Taro.showToast({ title: '可提现余额不足', icon: 'none' });
      return;
    }

    if (!accountNo) {
      Taro.showToast({ title: '请输入账号', icon: 'none' });
      return;
    }

    if (!accountName) {
      Taro.showToast({ title: '请输入账户名', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await Network.request({
        url: '/api/distribution/withdraw',
        method: 'POST',
        data: {
          user_id: uid,
          amount: withdrawAmount,
          account_info: {
            type: accountType,
            account: accountNo,
            name: accountName,
          },
        },
      });

      Taro.showToast({ title: '提现申请已提交', icon: 'success' });
      setAmount('');
      loadData();
    } catch (error) {
      Taro.showToast({ title: '提现失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleAllWithdraw = () => {
    const available = inviteInfo?.statistics?.available_commission || '0';
    setAmount(available);
  };

  const availableAmount = parseFloat(inviteInfo?.statistics?.available_commission || '0');

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部余额信息 */}
      <View className="bg-gradient-to-br from-green-500 to-green-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-center mb-6">
          <Wallet size={28} color="white" />
          <Text className="text-white text-xl font-bold ml-2">提现</Text>
        </View>
        
        <Card className="bg-white bg-opacity-10 backdrop-blur">
          <CardContent className="p-4">
            <Text className="text-white text-opacity-80 text-sm">可提现余额</Text>
            <Text className="text-white text-4xl font-bold mt-2">¥{availableAmount.toFixed(2)}</Text>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 -mt-4">
        {/* 提现表单 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>提现金额</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row items-center border-b border-gray-200 pb-3 mb-3">
              <Text className="text-2xl font-bold text-gray-700">¥</Text>
              <View className="flex-1 ml-2">
                <Input
                  type="digit"
                  placeholder="请输入提现金额"
                  value={amount}
                  onInput={(e) => setAmount(e.detail.value)}
                  className="text-2xl font-bold border-0"
                />
              </View>
            </View>
            <View className="flex flex-row justify-between items-center">
              <Text className="text-gray-500 text-sm">可提现 ¥{availableAmount.toFixed(2)}</Text>
              <Button size="sm" variant="link" onClick={handleAllWithdraw}>
                <Text className="text-green-600">全部提现</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 收款账户 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>收款账户</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 账户类型选择 */}
            <View className="flex flex-row gap-3 mb-4">
              <View
                className={`flex-1 p-3 rounded-lg border ${accountType === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => setAccountType('wechat')}
              >
                <View className="flex flex-row items-center justify-center">
                  <CreditCard size={20} color={accountType === 'wechat' ? '#22C55E' : '#9CA3AF'} />
                  <Text className={`ml-2 ${accountType === 'wechat' ? 'text-green-600' : 'text-gray-600'}`}>微信</Text>
                </View>
              </View>
              <View
                className={`flex-1 p-3 rounded-lg border ${accountType === 'alipay' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => setAccountType('alipay')}
              >
                <View className="flex flex-row items-center justify-center">
                  <Banknote size={20} color={accountType === 'alipay' ? '#22C55E' : '#9CA3AF'} />
                  <Text className={`ml-2 ${accountType === 'alipay' ? 'text-green-600' : 'text-gray-600'}`}>支付宝</Text>
                </View>
              </View>
            </View>

            {/* 账号输入 */}
            <View className="mb-3">
              <Text className="text-gray-500 text-sm mb-1">账号</Text>
              <Input
                placeholder={accountType === 'wechat' ? '请输入微信号' : '请输入支付宝账号'}
                value={accountNo}
                onInput={(e) => setAccountNo(e.detail.value)}
              />
            </View>

            {/* 真实姓名 */}
            <View>
              <Text className="text-gray-500 text-sm mb-1">真实姓名</Text>
              <Input
                placeholder="请输入账户真实姓名"
                value={accountName}
                onInput={(e) => setAccountName(e.detail.value)}
              />
            </View>
          </CardContent>
        </Card>

        {/* 提现说明 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <View className="flex flex-row items-start">
              <CircleAlert size={16} color="#F59E0B" className="mr-2 flex-shrink-0 mt-1" />
              <View className="flex-1">
                <Text className="text-gray-600 text-sm">提现说明</Text>
                <View className="mt-2">
                  <Text className="text-gray-500 text-xs block">• 单次提现最低10元</Text>
                  <Text className="text-gray-500 text-xs block mt-1">• 提现申请后1-3个工作日到账</Text>
                  <Text className="text-gray-500 text-xs block mt-1">• 如有疑问请联系客服</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <Button
          className="w-full bg-green-500"
          onClick={handleWithdraw}
          disabled={loading || availableAmount < 10}
        >
          <Text className="text-white font-semibold">
            {loading ? '提交中...' : '确认提现'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default WithdrawPage;
