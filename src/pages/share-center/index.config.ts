export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '分享中心' })
  : { navigationBarTitleText: '分享中心' }
