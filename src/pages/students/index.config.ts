export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '我的学员',
    })
  : {
      navigationBarTitleText: '我的学员',
    }
