import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Settings, Plus, ChevronRight, DollarSign } from 'lucide-react-taro';
import './index.css';

interface Teacher {
  id: number;
  nickname: string;
  avatar: string;
  real_name: string;
  subjects: string[];
  order_count: number;
  status: number;
}

/**
 * 机构端首页
 */
const OrgDashboardPage = () => {
  const stats = {
    totalTeachers: 8,
    activeTeachers: 6,
    totalOrders: 128,
    monthRevenue: 25680,
    pendingOrders: 5,
    commissionRate: 10,
  };

  const teachers: Teacher[] = [
    { id: 1, nickname: '张老师', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', real_name: '张明', subjects: ['数学', '物理'], order_count: 32, status: 1 },
    { id: 2, nickname: '李老师', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', real_name: '李芳', subjects: ['英语'], order_count: 28, status: 1 },
    { id: 3, nickname: '王老师', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', real_name: '王强', subjects: ['化学', '生物'], order_count: 18, status: 1 },
  ];

  const quickActions = [
    { icon: Plus, title: '邀请教师', desc: '邀请教师入驻', url: '/pages/org-invite/index' },
    { icon: FileText, title: '派单管理', desc: '自动派单设置', url: '/pages/org-dispatch/index' },
    { icon: DollarSign, title: '抽成设置', desc: '设置抽成比例', url: '/pages/org-commission/index' },
    { icon: Settings, title: '机构设置', desc: '编辑机构信息', url: '/pages/org-settings/index' },
  ];

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部统计 */}
      <View className="bg-gradient-to-br from-purple-500 to-purple-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center mb-4">
          <Building2 size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-2">机构管理中心</Text>
        </View>
        
        <View className="grid grid-cols-2 gap-4">
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-3">
              <Text className="text-white text-opacity-80 text-sm">本月营收</Text>
              <Text className="text-white text-xl font-bold mt-1">¥{stats.monthRevenue.toLocaleString()}</Text>
            </CardContent>
          </Card>
          <Card className="bg-white bg-opacity-10 backdrop-blur">
            <CardContent className="p-3">
              <Text className="text-white text-opacity-80 text-sm">待处理订单</Text>
              <Text className="text-white text-xl font-bold mt-1">{stats.pendingOrders}单</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      <View className="px-4 -mt-4">
        {/* 快捷入口 */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <View className="grid grid-cols-4 py-4">
              {quickActions.map((action, index) => (
                <View 
                  key={index} 
                  className="flex flex-col items-center"
                  onClick={() => Taro.navigateTo({ url: action.url })}
                >
                  <action.icon size={24} color="#7C3AED" />
                  <Text className="text-gray-700 text-xs mt-2">{action.title}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 数据概览 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>数据概览</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex flex-row justify-around">
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-purple-500">{stats.totalTeachers}</Text>
                <Text className="text-gray-500 text-xs">入驻教师</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-green-500">{stats.activeTeachers}</Text>
                <Text className="text-gray-500 text-xs">活跃教师</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-blue-500">{stats.totalOrders}</Text>
                <Text className="text-gray-500 text-xs">累计订单</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-orange-500">{stats.commissionRate}%</Text>
                <Text className="text-gray-500 text-xs">抽成比例</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 教师列表 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>旗下教师</CardTitle>
              <View className="flex flex-row items-center" onClick={() => Taro.navigateTo({ url: '/pages/org-teachers/index' })}>
                <Text className="text-gray-400 text-sm">全部 {stats.totalTeachers} 人</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              {teachers.map((teacher) => (
                <View key={teacher.id} className="flex flex-row items-center justify-between py-2">
                  <View className="flex flex-row items-center">
                    <Image src={teacher.avatar} className="w-10 h-10 rounded-full" />
                    <View className="ml-3">
                      <Text className="font-semibold">{teacher.real_name}</Text>
                      <View className="flex flex-row gap-1 mt-1">
                        {teacher.subjects.map(s => (
                          <Badge key={s} variant="secondary">
                            <Text className="text-xs">{s}</Text>
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View className="flex flex-col items-end">
                    <Text className="text-gray-500 text-xs">接单 {teacher.order_count} 次</Text>
                    <Badge className="bg-green-100 mt-1">
                      <Text className="text-xs text-green-600">活跃</Text>
                    </Badge>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 最近订单 */}
        <Card>
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>最近订单</CardTitle>
              <View className="flex flex-row items-center" onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}>
                <Text className="text-gray-400 text-sm">查看全部</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex flex-col gap-3">
              <View className="flex flex-row items-center justify-between py-2 border-b border-gray-100">
                <View>
                  <Text className="font-semibold">数学辅导</Text>
                  <Text className="text-gray-400 text-xs">张老师 · 望京SOHO</Text>
                </View>
                <Badge className="bg-green-100">
                  <Text className="text-xs text-green-600">已完成</Text>
                </Badge>
              </View>
              <View className="flex flex-row items-center justify-between py-2">
                <View>
                  <Text className="font-semibold">英语口语</Text>
                  <Text className="text-gray-400 text-xs">李老师 · 中关村</Text>
                </View>
                <Badge className="bg-yellow-100">
                  <Text className="text-xs text-yellow-600">试课中</Text>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );
};

export default OrgDashboardPage;
