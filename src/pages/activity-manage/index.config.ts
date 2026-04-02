export default typeof definePageConfig === 'function'
  ? definePageConfig({ 
      navigationBarTitleText: '活动管理',
      enablePullDownRefresh: true
    })
  : { 
      navigationBarTitleText: '活动管理',
      enablePullDownRefresh: true
    }
