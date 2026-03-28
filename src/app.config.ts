export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/mall/index',
    'pages/message/index',
    'pages/profile/index',
    // 发布需求
    'pages/publish/index',
    // 教师详情
    'pages/teacher-detail/index',
    // 订单列表
    'pages/orders/index',
    // 订单详情
    'pages/order-detail/index',
    // 会员中心
    'pages/membership/index',
    // 分销中心
    'pages/distribution/index',
    // 机构端
    'pages/org-dashboard/index',
    'pages/org-teachers/index',
    'pages/org-courses/index',
    'pages/org-invite/index',
    'pages/org-settings/index',
    // 代理端
    'pages/agent-dashboard/index',
    // PC管理后台
    'pages/admin/index',
    // 登录注册
    'pages/login/index',
    // 商品详情
    'pages/product-detail/index',
    // 聊天详情
    'pages/chat/index',
    // 课时管理（教师端）
    'pages/course-manage/index',
    // 家长主页
    'pages/parent-profile/index',
    // 活动详情
    'pages/activity-detail/index',
    // 活动列表
    'pages/activities/index',
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
        pagePath: 'pages/mall/index',
        text: '商城',
        iconPath: './assets/tabbar/shopping-cart.png',
        selectedIconPath: './assets/tabbar/shopping-cart-active.png',
      },
      {
        pagePath: 'pages/message/index',
        text: '消息',
        iconPath: './assets/tabbar/message-square.png',
        selectedIconPath: './assets/tabbar/message-square-active.png',
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
