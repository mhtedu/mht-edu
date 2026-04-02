export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '消息中心',
      enablePullDownRefresh: true,
      backgroundColor: '#F5F5F5'
    })
  : {
      navigationBarTitleText: '消息中心',
      enablePullDownRefresh: true,
      backgroundColor: '#F5F5F5'
    }
