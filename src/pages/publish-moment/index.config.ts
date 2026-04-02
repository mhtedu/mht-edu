export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '发布动态',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      backgroundColor: '#f5f5f5'
    })
  : {
      navigationBarTitleText: '发布动态',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
      backgroundColor: '#f5f5f5'
    }
