export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '订单' })
  : { navigationBarTitleText: '订单' }
