export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '支付结果'
    })
  : { navigationBarTitleText: '支付结果' }
