export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/index/index',
    'pages/teacher/list',
    'pages/teacher/detail',
    'pages/org/list',
    'pages/org/detail',
    'pages/message/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '棉花糖教育',
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
