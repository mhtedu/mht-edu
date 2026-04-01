export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '找机构',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '找机构',
      enablePullDownRefresh: true,
    }
