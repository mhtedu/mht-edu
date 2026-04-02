export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '教育平台',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '教育平台',
      enablePullDownRefresh: true,
    }
