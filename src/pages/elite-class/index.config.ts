export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '牛师班',
      enableShareAppMessage: true,
    })
  : {
      navigationBarTitleText: '牛师班',
      enableShareAppMessage: true,
    }
