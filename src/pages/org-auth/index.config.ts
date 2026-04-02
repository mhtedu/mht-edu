export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '机构认证' })
  : { navigationBarTitleText: '机构认证' }
