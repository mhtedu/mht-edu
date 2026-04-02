export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的资源',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '我的资源',
      enablePullDownRefresh: true,
    }
