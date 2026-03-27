import { View, Text } from '@tarojs/components'
import { FC } from 'react'

const OrdersPage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Text className="text-lg text-gray-600">订单管理</Text>
    </View>
  )
}

export default OrdersPage
