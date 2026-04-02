export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '支付'
    })
  : { navigationBarTitleText: '支付' }
