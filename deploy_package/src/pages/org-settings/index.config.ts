export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '机构设置',
    })
  : {
      navigationBarTitleText: '机构设置',
    }
