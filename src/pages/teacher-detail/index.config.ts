export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '教师详情' })
  : { navigationBarTitleText: '教师详情' }
