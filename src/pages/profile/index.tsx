import { View, Text } from '@tarojs/components'
import { FC } from 'react'

const ProfilePage: FC = () => {
  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Text className="text-lg text-gray-600">个人中心</Text>
    </View>
  )
}

export default ProfilePage
