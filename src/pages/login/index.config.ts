export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '登录',
      navigationBarBackgroundColor: '#DBEAFE',
      navigationBarTextStyle: 'black',
    })
  : {
      navigationBarTitleText: '登录',
      navigationBarBackgroundColor: '#DBEAFE',
      navigationBarTextStyle: 'black',
    }
