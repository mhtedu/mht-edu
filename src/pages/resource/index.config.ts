export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '资源中心',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '资源中心',
      enablePullDownRefresh: true,
    }
