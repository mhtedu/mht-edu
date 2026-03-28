import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, MapPin, Users, Gift, Check,
  DollarSign
} from 'lucide-react-taro';
import './index.css';

interface AgentBenefit {
  icon: typeof TrendingUp;
  title: string;
  desc: string;
}

/**
 * 代理申请页面
 */
const AgentApplyPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    experience: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const benefits: AgentBenefit[] = [
    { icon: MapPin, title: '区域独家', desc: '每个区域仅授权一位代理' },
    { icon: DollarSign, title: '5%流水分润', desc: '辖区内所有交易均可分润' },
    { icon: Users, title: '团队管理', desc: '发展下级代理获额外奖励' },
    { icon: Gift, title: '推广支持', desc: '平台提供营销物料和培训' },
  ];

  const requirements = [
    '有本地教育行业资源或人脉',
    '具备一定的市场推广能力',
    '认可平台理念，愿意长期合作',
    '缴纳一定金额的代理保证金',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.city) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    setLoading(true);
    
    // 模拟提交
    setTimeout(() => {
      setLoading(false);
      Taro.showModal({
        title: '申请已提交',
        content: '我们将在1-3个工作日内联系您，请保持电话畅通。',
        showCancel: false,
        success: () => {
          Taro.navigateBack();
        },
      });
    }, 1500);
  };

  return (
    <View className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <View className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-6 pb-8">
        <View className="flex items-center justify-center mb-4">
          <TrendingUp size={28} color="white" />
          <Text className="text-white text-xl font-bold ml-2">城市代理招募</Text>
        </View>
        <Text className="text-white text-opacity-80 text-center text-sm">
          加入棉花糖教育，成为本地教育服务领导者
        </Text>
      </View>

      <View className="px-4 -mt-4">
        {/* 代理权益 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>代理权益</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="grid grid-cols-2 gap-3">
              {benefits.map((benefit) => (
                <View key={benefit.title} className="bg-orange-50 rounded-lg p-3 text-center">
                  <benefit.icon size={24} color="#F97316" className="mx-auto" />
                  <Text className="font-semibold mt-2">{benefit.title}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{benefit.desc}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 收益预估 */}
        <Card className="mb-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
          <CardContent className="p-4">
            <View className="flex items-center mb-3">
              <DollarSign size={20} color="#F97316" />
              <Text className="font-semibold ml-2">收益预估</Text>
            </View>
            <View className="space-y-2">
              <View className="flex justify-between text-sm">
                <Text className="text-gray-600">假设区域月流水</Text>
                <Text className="font-semibold">¥100,000</Text>
              </View>
              <View className="flex justify-between text-sm">
                <Text className="text-gray-600">分润比例</Text>
                <Text className="font-semibold text-orange-500">5%</Text>
              </View>
              <View className="border-t border-orange-200 pt-2 mt-2">
                <View className="flex justify-between">
                  <Text className="font-semibold">预估月收入</Text>
                  <Text className="text-xl font-bold text-orange-500">¥5,000</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 申请条件 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>申请条件</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-3">
              {requirements.map((req, idx) => (
                <View key={idx} className="flex items-center">
                  <View className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check size={12} color="#22C55E" />
                  </View>
                  <Text className="text-gray-600 text-sm ml-2">{req}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 申请表单 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>填写申请</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="space-y-4">
              <View>
                <Text className="text-gray-500 text-sm mb-1">姓名 *</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    placeholder="请输入您的姓名"
                    value={formData.name}
                    onInput={(e) => handleInputChange('name', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-500 text-sm mb-1">手机号 *</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    type="number"
                    placeholder="请输入您的手机号"
                    value={formData.phone}
                    onInput={(e) => handleInputChange('phone', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-500 text-sm mb-1">申请城市 *</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    placeholder="如：北京市"
                    value={formData.city}
                    onInput={(e) => handleInputChange('city', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-500 text-sm mb-1">申请区域</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    placeholder="如：朝阳区"
                    value={formData.district}
                    onInput={(e) => handleInputChange('district', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-500 text-sm mb-1">相关经验</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    placeholder="请描述您的相关从业经验"
                    value={formData.experience}
                    onInput={(e) => handleInputChange('experience', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-500 text-sm mb-1">申请理由</Text>
                <View className="bg-gray-50 rounded-lg px-3 py-2">
                  <Input
                    className="bg-transparent"
                    placeholder="请描述您为什么想成为代理"
                    value={formData.reason}
                    onInput={(e) => handleInputChange('reason', e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <Button 
          className="w-full bg-orange-500"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading ? '提交中...' : '提交申请'}
          </Text>
        </Button>

        {/* 咨询 */}
        <View className="mt-4 text-center">
          <Text className="text-gray-400 text-sm">
            有疑问？联系客服：
            <Text className="text-blue-500" onClick={() => Taro.makePhoneCall({ phoneNumber: '400-888-8888' })}>
              400-888-8888
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default AgentApplyPage;
