export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的试课',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '我的试课',
      enablePullDownRefresh: true,
    }
