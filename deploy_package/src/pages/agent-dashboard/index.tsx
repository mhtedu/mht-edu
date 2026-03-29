import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, TrendingUp, DollarSign, FileText, Timer, Check } from 'lucide-react-taro';
import './index.css';

/**
 * 城市代理端首页
 */
const AgentDashboardPage = () => {
  const stats = {
    city: '北京市朝阳区',
    totalUsers: 1256,
    totalTeachers: 89,
    totalParents: 1167,
    monthRevenue: 128600,
    monthCommission: 6430,
    pendingAudit: 3,
    activeRate: 78,
  };

  const recentAudits = [
    { id: 1, type: 'teacher', name: '张明', status: 'pending', time: '2小时前' },
    { id: 2, type: 'teacher', name: '李芳', status: 'pending', time: '3小时前' },
    { id: 3, type: 'org', name: '阳光教育', status: 'pending', time: '昨天' },
  ];

  const trendData = [
    { month: '1月', revenue: 86000 },
    { month: '2月', revenue: 92000 },
    { month: '3月', revenue: 128600 },
  ];

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center mb-4">
          <MapPin size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-2">{stats.city}</Text>
          <Badge className="ml-2 bg-white bg-opacity-20">
            <Text className="text-white text-xs">城市代理</Text>
          </Badge>
        </View>
        
        <View className="grid grid-cols-2 gap-4">
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-3">
              <Text className="text-white text-opacity-80 text-sm">本月流水</Text>
              <Text className="text-white text-xl font-bold mt-1">¥{stats.monthRevenue.toLocaleString()}</Text>
            </CardContent>
          </Card>
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-3">
              <Text className="text-white text-opacity-80 text-sm">本月分润</Text>
              <Text className="text-white text-xl font-bold mt-1">¥{stats.monthCommission.toLocaleString()}</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      <View className="px-4 -mt-4">
        {/* 数据卡片 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>辖区数据</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-3 gap-4">
              <View className="flex flex-col items-center">
                <Users size={24} color="#F97316" />
                <Text className="text-xl font-bold mt-1">{stats.totalUsers}</Text>
                <Text className="text-gray-500 text-xs">总用户</Text>
              </View>
              <View className="flex flex-col items-center">
                <Users size={24} color="#22C55E" />
                <Text className="text-xl font-bold mt-1">{stats.totalTeachers}</Text>
                <Text className="text-gray-500 text-xs">教师数</Text>
              </View>
              <View className="flex flex-col items-center">
                <Users size={24} color="#3B82F6" />
                <Text className="text-xl font-bold mt-1">{stats.totalParents}</Text>
                <Text className="text-gray-500 text-xs">家长数</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 流水趋势 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center">
              <TrendingUp size={18} color="#2563EB" className="mr-2" />
              <CardTitle>流水趋势</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row justify-around items-end h-32">
              {trendData.map((item) => (
                <View key={item.month} className="flex flex-col items-center">
                  <View 
                    className="w-8 bg-orange-400 rounded-t"
                    style={{ height: `${(item.revenue / 150000) * 80}px` }}
                  />
                  <Text className="text-gray-500 text-xs mt-2">{item.month}</Text>
                  <Text className="text-xs text-orange-500">¥{(item.revenue / 10000).toFixed(1)}万</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 入驻审核 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <FileText size={18} color="#2563EB" className="mr-2" />
                <CardTitle>入驻审核</CardTitle>
                {stats.pendingAudit > 0 && (
                  <Badge className="ml-2 bg-red-500">
                    <Text className="text-white text-xs">{stats.pendingAudit}</Text>
                  </Badge>
                )}
              </View>
              <Text className="text-gray-400 text-sm" onClick={() => Taro.navigateTo({ url: '/pages/agent-audit/index' })}>
                查看全部
              </Text>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              {recentAudits.map((audit) => (
                <View key={audit.id} className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                  <View className="flex flex-row items-center">
                    <Timer size={16} color="#F59E0B" className="mr-2" />
                    <View>
                      <Text className="text-gray-700">{audit.name}</Text>
                      <Text className="text-gray-400 text-xs">{audit.type === 'teacher' ? '教师入驻' : '机构入驻'}</Text>
                    </View>
                  </View>
                  <View className="flex flex-row items-center">
                    <Text className="text-gray-400 text-xs mr-2">{audit.time}</Text>
                    <Badge className="bg-yellow-100">
                      <Text className="text-xs text-yellow-600">待审核</Text>
                    </Badge>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 快捷功能 */}
        <Card>
          <CardContent className="p-0">
            <View className="flex flex-col">
              <View 
                className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                onClick={() => Taro.navigateTo({ url: '/pages/agent-stats/index' })}
              >
                <View className="flex flex-row items-center">
                  <TrendingUp size={20} color="#F97316" className="mr-3" />
                  <Text className="text-gray-700">数据统计</Text>
                </View>
                <Text className="text-gray-400 text-sm">查看详细报表</Text>
              </View>
              <View 
                className="flex flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
                onClick={() => Taro.navigateTo({ url: '/pages/agent-settlement/index' })}
              >
                <View className="flex flex-row items-center">
                  <DollarSign size={20} color="#22C55E" className="mr-3" />
                  <Text className="text-gray-700">分润结算</Text>
                </View>
                <Text className="text-gray-400 text-sm">本月 ¥{stats.monthCommission}</Text>
              </View>
              <View 
                className="flex flex-row items-center justify-between px-4 py-4"
                onClick={() => Taro.navigateTo({ url: '/pages/agent-settings/index' })}
              >
                <View className="flex flex-row items-center">
                  <Check size={20} color="#3B82F6" className="mr-3" />
                  <Text className="text-gray-700">代理设置</Text>
                </View>
                <Text className="text-gray-400 text-sm">分润比例 5%</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default AgentDashboardPage;
