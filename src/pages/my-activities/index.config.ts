export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的活动'
    })
  : { navigationBarTitleText: '我的活动' }
