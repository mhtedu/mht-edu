export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '个人资料' })
  : { navigationBarTitleText: '个人资料' }
