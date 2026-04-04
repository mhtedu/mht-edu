export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '新增课时安排' })
  : { navigationBarTitleText: '新增课时安排' }
