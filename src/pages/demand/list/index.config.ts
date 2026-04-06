export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '需求列表',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '需求列表',
      enablePullDownRefresh: true,
    }
