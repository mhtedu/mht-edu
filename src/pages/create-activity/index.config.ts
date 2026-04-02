export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '创建活动' })
  : { navigationBarTitleText: '创建活动' }
