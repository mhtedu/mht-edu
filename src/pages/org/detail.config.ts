export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '机构详情',
    })
  : {
      navigationBarTitleText: '机构详情',
    }
