import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user';
import { Network } from '@/network';
import { TrendingUp } from 'lucide-react-taro';
import './index.css';

interface Commission {
  id: number;
  amount: number;
  rate: number;
  level_type: number;
  status: number;
  created_at: string;
  from_nickname: string;
  from_avatar: string;
}

interface CommissionList {
  list: Commission[];
  total: number;
  page: number;
  total_pages: number;
}

const levelNames: Record<number, string> = {
  1: '一级邀请',
  2: '二级邀请',
  3: '城市代理',
  4: '机构分佣',
};

const statusNames: Record<number, { name: string; color: string }> = {
  0: { name: '待结算', color: 'bg-yellow-100 text-yellow-600' },
  1: { name: '已结算', color: 'bg-green-100 text-green-600' },
  2: { name: '已提现', color: 'bg-blue-100 text-blue-600' },
};

/**
 * 佣金明细页面
 */
const CommissionPage = () => {
  const getUserId = useUserStore(state => state.getUserId);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    loadCommissions(1);
  });

  const loadCommissions = async (pageNum: number) => {
    const uid = getUserId();
    if (!uid) return;

    setLoading(true);
    try {
      const res = await Network.request({
        url: `/api/distribution/commission-list/${uid}`,
        method: 'GET',
        data: { page: pageNum, pageSize: 20 },
      });

      const data = res.data as CommissionList;
      if (data) {
        setCommissions(pageNum === 1 ? data.list : [...commissions, ...data.list]);
        setTotal(data.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('加载佣金明细失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading) {
      loadCommissions(page + 1);
    }
  };

  const getStatusBadge = (status: number) => {
    const statusInfo = statusNames[status] || statusNames[0];
    return (
      <Badge className={statusInfo.color}>
        <Text className="text-xs">{statusInfo.name}</Text>
      </Badge>
    );
  };

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 统计信息 */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex flex-row justify-around">
          <View className="flex flex-col items-center">
            <Text className="text-gray-500 text-sm">累计佣金</Text>
            <Text className="text-xl font-bold text-green-600 mt-1">
              ¥{commissions.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)}
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="flex flex-col items-center">
            <Text className="text-gray-500 text-sm">总笔数</Text>
            <Text className="text-xl font-bold mt-1">{total}</Text>
          </View>
        </View>
      </View>

      {/* 佣金列表 */}
      <View className="px-4">
        {commissions.length === 0 && !loading ? (
          <View className="flex flex-col items-center justify-center py-20">
            <TrendingUp size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4">暂无佣金记录</Text>
            <Text className="text-gray-400 text-sm mt-1">邀请好友开通会员获取佣金</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {commissions.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <View className="flex flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex flex-row items-center">
                        <Text className="font-medium">{item.from_nickname || '用户'}</Text>
                        <Badge className="ml-2 bg-purple-100">
                          <Text className="text-purple-600 text-xs">{levelNames[item.level_type]}</Text>
                        </Badge>
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                    <View className="flex flex-col items-end">
                      <Text className="text-green-600 font-bold text-lg">+¥{item.amount}</Text>
                      <View className="mt-1">{getStatusBadge(item.status)}</View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* 加载更多 */}
        {commissions.length > 0 && commissions.length < total && (
          <View className="py-4 text-center" onClick={loadMore}>
            <Text className="text-gray-400 text-sm">
              {loading ? '加载中...' : '点击加载更多'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CommissionPage;
