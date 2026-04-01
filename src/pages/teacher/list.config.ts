export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '找老师',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '找老师',
      enablePullDownRefresh: true,
    }
