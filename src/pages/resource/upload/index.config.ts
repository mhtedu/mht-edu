export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '上传资源',
    })
  : {
      navigationBarTitleText: '上传资源',
    }
