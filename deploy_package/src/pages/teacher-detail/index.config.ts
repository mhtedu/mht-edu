export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '教师主页',
    })
  : {
      navigationBarTitleText: '教师主页',
    }
