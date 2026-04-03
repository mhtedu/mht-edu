export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '佣金明细' })
  : { navigationBarTitleText: '佣金明细' }
