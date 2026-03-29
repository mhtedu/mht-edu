export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '机构管理' })
  : { navigationBarTitleText: '机构管理' }
