import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import './index.css'

const PublishDemandPage = () => {
  return (
    <View className="publish-demand-page">
      <View className="coming-soon">
        <Text className="coming-soon-text">发布需求功能开发中...</Text>
        <Button onClick={() => Taro.navigateBack()}>返回</Button>
      </View>
    </View>
  )
}

export default PublishDemandPage
