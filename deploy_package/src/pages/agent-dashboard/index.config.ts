export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '代理中心' })
  : { navigationBarTitleText: '代理中心' }
