export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '家长主页',
    })
  : {
      navigationBarTitleText: '家长主页',
    }
