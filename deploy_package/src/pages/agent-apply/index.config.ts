export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '申请代理' })
  : { navigationBarTitleText: '申请代理' }
