export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '牛师认证' })
  : { navigationBarTitleText: '牛师认证' }
