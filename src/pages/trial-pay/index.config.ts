export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '支付试课费' })
  : { navigationBarTitleText: '支付试课费' }
