export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '分销中心' })
  : { navigationBarTitleText: '分销中心' }
