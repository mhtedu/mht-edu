export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '管理后台',
      navigationBarBackgroundColor: '#1e40af',
      navigationBarTextStyle: 'white',
      // PC端适配：禁用默认的移动端viewport
      navigationStyle: 'custom',
      backgroundColor: '#f5f7fa',
    })
  : {
      navigationBarTitleText: '管理后台',
      navigationBarBackgroundColor: '#1e40af',
      navigationBarTextStyle: 'white',
      navigationStyle: 'custom',
      backgroundColor: '#f5f7fa',
    }
