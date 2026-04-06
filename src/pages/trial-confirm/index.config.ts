export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '确认试课结果' })
  : { navigationBarTitleText: '确认试课结果' }
