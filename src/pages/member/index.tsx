import { View, Text } from '@tarojs/components'
import { Button } from '@/components/ui/button'
import { Crown, Check } from 'lucide-react-taro'
import './index.css'

const MemberPage = () => {
  const plans = [
    { name: '月卡', price: 29.9, originalPrice: 49.9, days: 30 },
    { name: '季卡', price: 79.9, originalPrice: 149.9, days: 90 },
    { name: '年卡', price: 199.9, originalPrice: 599.9, days: 365 }
  ]

  const benefits = [
    '无限抢单',
    '优先派单',
    '专属客服',
    '更多曝光'
  ]

  return (
    <View className="member-page">
      <View className="member-header">
        <Crown size={32} color="#F59E0B" />
        <Text className="member-title">会员特权</Text>
      </View>

      <View className="benefits-list">
        {benefits.map((benefit, idx) => (
          <View key={idx} className="benefit-item">
            <Check size={16} color="#10B981" />
            <Text className="benefit-text">{benefit}</Text>
          </View>
        ))}
      </View>

      <View className="plans-list">
        {plans.map((plan, idx) => (
          <View key={idx} className="plan-card">
            <Text className="plan-name">{plan.name}</Text>
            <View className="plan-price">
              <Text className="price-current">¥{plan.price}</Text>
              <Text className="price-original">¥{plan.originalPrice}</Text>
            </View>
            <Button size="sm" className="plan-btn">立即开通</Button>
          </View>
        ))}
      </View>
    </View>
  )
}

export default MemberPage
