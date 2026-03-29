export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '教辅商城',
    })
  : {
      navigationBarTitleText: '教辅商城',
    }
