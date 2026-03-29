module.exports = {
  apps: [{
    name: 'mht-edu-server',
    script: 'dist/src/main.js',
    cwd: '/www/wwwroot/mht-edu/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3002',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_USERNAME: 'mht_edu',
      DB_PASSWORD: '请修改为你的数据库密码',
      DB_DATABASE: 'mht_edu',
      JWT_SECRET: 'mht-edu-jwt-secret-2026-change-this',
      JWT_EXPIRES_IN: '7d',
      WECHAT_APPID: '请填写你的小程序AppID',
      WECHAT_SECRET: '请填写你的小程序Secret',
      PLATFORM_NAME: '棉花糖教育',
      PLATFORM_DOMAIN: 'https://wx.dajiaopei.com'
    },
    error_file: '/www/wwwlogs/mht-edu-server-error.log',
    out_file: '/www/wwwlogs/mht-edu-server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
