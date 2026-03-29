export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '聊天',
    })
  : {
      navigationBarTitleText: '聊天',
    }
