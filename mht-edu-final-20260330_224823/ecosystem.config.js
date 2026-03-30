module.exports = {
  apps: [{
    name: 'mht-edu-server',
    script: 'dist/main.js',
    cwd: '/www/wwwroot/mht-edu/server',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_NAME: 'mht_edu',
      DB_USER: 'mht_edu',
      DB_PASS: 'mht2026edu',
    },
    error_file: '/www/wwwlogs/mht-edu-server-error.log',
    out_file: '/www/wwwlogs/mht-edu-server-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
