export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '牛师班详情',
      enableShareAppMessage: true,
    })
  : {
      navigationBarTitleText: '牛师班详情',
      enableShareAppMessage: true,
    }
