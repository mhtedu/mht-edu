export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '牛师管理',
    })
  : {
      navigationBarTitleText: '牛师管理',
    }
