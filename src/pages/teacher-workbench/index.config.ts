export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '牛师工作台' })
  : { navigationBarTitleText: '牛师工作台' }
