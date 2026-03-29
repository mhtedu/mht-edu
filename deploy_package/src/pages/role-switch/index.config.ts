export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '角色切换' })
  : { navigationBarTitleText: '角色切换' }
