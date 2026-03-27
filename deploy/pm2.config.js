module.exports = {
  apps: [
    {
      name: 'mianhuatang-api',
      cwd: '/var/www/mianhuatang/server',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/mianhuatang/logs/error.log',
      out_file: '/var/www/mianhuatang/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    },
  ],
};
