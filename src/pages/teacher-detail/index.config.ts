export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '牛师主页',
    })
  : {
      navigationBarTitleText: '牛师主页',
    }
