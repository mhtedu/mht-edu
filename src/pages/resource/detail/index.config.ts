export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '资源详情',
    })
  : {
      navigationBarTitleText: '资源详情',
    }
