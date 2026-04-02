export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '学员管理' })
  : { navigationBarTitleText: '学员管理' }
