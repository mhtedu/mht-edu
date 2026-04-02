export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '机构会员' })
  : { navigationBarTitleText: '机构会员' }
