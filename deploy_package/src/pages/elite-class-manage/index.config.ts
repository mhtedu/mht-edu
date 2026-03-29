export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '牛师班管理',
    })
  : {
      navigationBarTitleText: '牛师班管理',
    }
