export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '试课详情' })
  : { navigationBarTitleText: '试课详情' }
