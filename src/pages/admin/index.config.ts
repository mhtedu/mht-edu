export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '管理后台',
      navigationBarBackgroundColor: '#1e3a5f',
      navigationBarTextStyle: 'white',
    })
  : {
      navigationBarTitleText: '管理后台',
      navigationBarBackgroundColor: '#1e3a5f',
      navigationBarTextStyle: 'white',
    }
