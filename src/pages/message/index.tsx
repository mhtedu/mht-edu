import { View, Text } from '@tarojs/components'
import { FC } from 'react'

const MessagePage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Text className="text-lg text-gray-600">消息中心</Text>
    </View>
  )
}

export default MessagePage
