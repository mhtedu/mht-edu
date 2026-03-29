export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '课时管理',
    })
  : {
      navigationBarTitleText: '课时管理',
    }
