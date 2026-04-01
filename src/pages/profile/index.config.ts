export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的',
      navigationBarBackgroundColor: '#2563EB',
      navigationBarTextStyle: 'white',
    })
  : {
      navigationBarTitleText: '我的',
      navigationBarBackgroundColor: '#2563EB',
      navigationBarTextStyle: 'white',
    }
