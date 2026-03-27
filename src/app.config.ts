export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/message/index',
    'pages/orders/index',
    'pages/profile/index',
    // 发布需求
    'pages/publish/index',
    // 教师详情
    'pages/teacher-detail/index',
    // 订单详情
    'pages/order-detail/index',
    // 会员中心
    'pages/membership/index',
    // 分销中心
    'pages/distribution/index',
    // 机构端
    'pages/org-dashboard/index',
    // 代理端
    'pages/agent-dashboard/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '棉花糖教育',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#2563EB',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/home.png',
        selectedIconPath: './assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/message/index',
        text: '消息',
        iconPath: './assets/tabbar/message-square.png',
        selectedIconPath: './assets/tabbar/message-square-active.png',
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
        iconPath: './assets/tabbar/clipboard-list.png',
        selectedIconPath: './assets/tabbar/clipboard-list-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png',
      },
    ],
  },
})
