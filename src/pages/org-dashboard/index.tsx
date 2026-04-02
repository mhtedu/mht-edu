import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, FileText, Settings, ChevronRight, DollarSign,
  Crown, Users, Gift, Star, Sparkles, TrendingUp
} from 'lucide-react-taro';
import './index.css';

interface Teacher {
  id: number;
  nickname: string;
  avatar: string;
  real_name: string;
  subjects: string[];
  order_count: number;
  status: number;
  has_membership: boolean;
}

/**
 * 机构端首页 - 增强版（含会员共享）
 */
const OrgDashboardPage = () => {
  const stats = {
    totalTeachers: 8,
    activeTeachers: 6,
    totalOrders: 128,
    monthRevenue: 25680,
    pendingOrders: 5,
    commissionRate: 10,
    membershipType: 2, // 机构会员类型
    membershipExpire: '2025-03-20',
    teacherQuota: 20,
    usedQuota: 8,
  };

  const teachers: Teacher[] = [
    { id: 1, nickname: '张老师', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', real_name: '张明', subjects: ['数学', '物理'], order_count: 32, status: 1, has_membership: true },
    { id: 2, nickname: '李老师', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', real_name: '李芳', subjects: ['英语'], order_count: 28, status: 1, has_membership: true },
    { id: 3, nickname: '王老师', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', real_name: '王强', subjects: ['化学', '生物'], order_count: 18, status: 1, has_membership: true },
  ];

  const quickActions = [
    { icon: Crown, title: '会员中心', desc: '管理会员权益', url: '/pages/org-membership/index', color: '#7C3AED', badge: '会员共享' },
    { icon: UserPlus, title: '邀请牛师', desc: '邀请入驻', url: '/pages/org-invite/index', color: '#2563EB' },
    { icon: Users, title: '学员管理', desc: 'CRM系统', url: '/pages/org-students/index', color: '#10B981' },
    { icon: FileText, title: '课程管理', desc: '管理课程', url: '/pages/org-courses/index', color: '#F59E0B' },
    { icon: Gift, title: '营销工具', desc: '优惠券', url: '/pages/org-marketing/index', color: '#EC4899' },
    { icon: TrendingUp, title: '数据分析', desc: '经营报表', url: '/pages/org-analysis/index', color: '#06B6D4' },
    { icon: DollarSign, title: '财务结算', desc: '收支明细', url: '/pages/org-finance/index', color: '#84CC16' },
    { icon: Settings, title: '机构设置', desc: '编辑信息', url: '/pages/org-settings/index', color: '#6B7280' },
  ];

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url });
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部统计 */}
      <View className="bg-gradient-to-br from-purple-500 to-purple-600 px-4 pt-6 pb-8">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center">
            <Building2 size={24} color="white" />
            <Text className="text-white text-xl font-bold ml-2">机构管理中心</Text>
          </View>
          <Badge className="bg-yellow-400 text-yellow-900">
            <Crown size={12} color="#713F12" />
            <Text className="text-xs ml-1">专业版</Text>
          </Badge>
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
        {/* 会员共享提示卡片 */}
        <Card className="mb-4 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Crown size={24} color="#7C3AED" />
                </View>
                <View>
                  <Text className="font-bold text-purple-700">会员共享权益已开启</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    旗下 {stats.usedQuota}/{stats.teacherQuota} 名教师已继承会员
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#7C3AED" onClick={() => handleNavigate('/pages/org-membership/index')} />
            </View>
            
            <View className="mt-3 pt-3 border-t border-purple-100">
              <View className="flex justify-between text-sm">
                <Text className="text-gray-500">会员到期</Text>
                <Text className="text-purple-600 font-semibold">{stats.membershipExpire}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>功能中心</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <View className="grid grid-cols-4 py-2">
              {quickActions.map((action, index) => (
                <View 
                  key={index} 
                  className="flex flex-col items-center py-3"
                  onClick={() => handleNavigate(action.url)}
                >
                  <View 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon size={20} color={action.color} />
                  </View>
                  <Text className="text-gray-700 text-xs">{action.title}</Text>
                  {action.badge && (
                    <Badge className="bg-purple-100 text-purple-600 mt-1">
                      <Text className="text-xs">{action.badge}</Text>
                    </Badge>
                  )}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 机构价值说明 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex items-center gap-2">
              <Sparkles size={18} color="#F59E0B" />
              <CardTitle>机构专属价值</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <Users size={16} color="#7C3AED" />
                  <Text className="font-semibold text-purple-700">会员共享</Text>
                </View>
                <Text className="text-xs text-gray-600">教师无需单独购买，自动继承机构会员资格</Text>
              </View>
              <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} color="#2563EB" />
                  <Text className="font-semibold text-blue-700">数据分析</Text>
                </View>
                <Text className="text-xs text-gray-600">全面经营数据，助力科学决策</Text>
              </View>
              <View className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <Gift size={16} color="#10B981" />
                  <Text className="font-semibold text-green-700">营销工具</Text>
                </View>
                <Text className="text-xs text-gray-600">优惠券、活动管理，提升转化率</Text>
              </View>
              <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <Star size={16} color="#F59E0B" />
                  <Text className="font-semibold text-orange-700">品牌展示</Text>
                </View>
                <Text className="text-xs text-gray-600">机构主页、优先推荐，获取更多曝光</Text>
              </View>
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
                <Text className="text-gray-500 text-xs">入驻牛师</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-green-500">{stats.activeTeachers}</Text>
                <Text className="text-gray-500 text-xs">活跃牛师</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-blue-500">{stats.totalOrders}</Text>
                <Text className="text-gray-500 text-xs">累计订单</Text>
              </View>
              <View className="flex flex-col items-center">
                <Text className="text-2xl font-bold text-orange-500">{stats.commissionRate}%</Text>
                <Text className="text-gray-500 text-xs">抽成减免</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 牛师列表 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>旗下牛师</CardTitle>
              <View className="flex flex-row items-center" onClick={() => handleNavigate('/pages/org-teachers/index')}>
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
                      <View className="flex flex-row items-center">
                        <Text className="font-semibold">{teacher.real_name}</Text>
                        {teacher.has_membership && (
                          <Badge className="ml-2 bg-purple-100">
                            <Crown size={10} color="#7C3AED" />
                            <Text className="text-xs text-purple-600 ml-1">会员</Text>
                          </Badge>
                        )}
                      </View>
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

        {/* 邀请教师入口 */}
        <Card className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <UserPlus size={24} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold">邀请牛师入驻</Text>
                  <Text className="text-white text-opacity-80 text-xs">
                    邀请越多，平台分成减免越多
                  </Text>
                </View>
              </View>
              <Button 
                size="sm" 
                className="bg-white"
                onClick={() => handleNavigate('/pages/org-invite/index')}
              >
                <Text className="text-purple-600">立即邀请</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* 最近订单 */}
        <Card>
          <CardHeader className="pb-2">
            <View className="flex flex-row items-center justify-between">
              <CardTitle>最近订单</CardTitle>
              <View className="flex flex-row items-center" onClick={() => handleNavigate('/pages/orders/index')}>
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

// 导入缺少的图标
const UserPlus = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size }}>
    <Text style={{ fontSize: size, color, lineHeight: size }}>👤+</Text>
  </View>
);

export default OrgDashboardPage;
