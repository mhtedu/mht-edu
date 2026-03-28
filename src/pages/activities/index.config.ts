export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '活动中心',
    })
  : {
      navigationBarTitleText: '活动中心',
    }
