export default defineAppConfig({
  pages: [
    // 登录和首页
    'pages/login/index',
    'pages/index/index',
    
    // 角色切换
    'pages/role-switch/index',
    
    // 教师相关
    'pages/teacher/list',
    'pages/teacher/detail',
    'pages/teacher-detail/index',
    'pages/teacher-workbench/index',
    
    // 机构相关
    'pages/org/list',
    'pages/org/detail',
    'pages/org-dashboard/index',
    'pages/org-teachers/index',
    'pages/org-courses/index',
    'pages/org-settings/index',
    'pages/org-invite/index',
    'pages/org-elite-class/index',
    
    // 家长相关
    'pages/parent-profile/index',
    'pages/publish/index',
    'pages/orders/index',
    'pages/order-detail/index',
    'pages/favorites/index',
    'pages/students/index',
    
    // 消息和聊天
    'pages/message/index',
    'pages/chat/index',
    
    // 会员和分销
    'pages/membership/index',
    'pages/distribution/index',
    'pages/earnings/index',
    'pages/share-center/index',
    
    // 牛师班
    'pages/elite-class/index',
    'pages/elite-class-detail/index',
    'pages/elite-class-manage/index',
    'pages/create-elite-class/index',
    
    // 活动相关
    'pages/activities/index',
    'pages/activity-detail/index',
    
    // 商城
    'pages/mall/index',
    'pages/product-detail/index',
    'pages/course-manage/index',
    
    // 个人中心和设置
    'pages/profile/index',
    'pages/settings/index',
    
    // 代理推广
    'pages/agent-apply/index',
    'pages/agent-dashboard/index',
    
    // 管理后台
    'pages/admin/index',
    'pages/admin-config/index',
    'pages/admin-elite-class/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '', // 标题由各页面动态设置
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#6B7280',
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
        pagePath: 'pages/teacher/list',
        text: '找老师',
        iconPath: './assets/tabbar/teacher.png',
        selectedIconPath: './assets/tabbar/teacher-active.png',
      },
      {
        pagePath: 'pages/org/list',
        text: '找机构',
        iconPath: './assets/tabbar/building.png',
        selectedIconPath: './assets/tabbar/building-active.png',
      },
      {
        pagePath: 'pages/message/index',
        text: '消息',
        iconPath: './assets/tabbar/message.png',
        selectedIconPath: './assets/tabbar/message-active.png',
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
