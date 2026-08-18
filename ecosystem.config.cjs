// PM2 optional runner - auto-restart + permanent background service
// Install once:  npm install -g pm2
// Start:        pm2 start ecosystem.config.cjs
// Auto-start on boot: pm2 startup && pm2 save
// Monitor:      pm2 status  |  Logs: pm2 logs arenax-backend / arenax-frontend
module.exports = {
  apps: [
    {
      name: 'arenax-backend',
      cwd: './backend',
      script: 'src/server.js',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: './backend/pm2-out.log',
      error_file: './backend/pm2-err.log',
      env: { NODE_ENV: 'production', PORT: '5000' },
    },
    {
      name: 'arenax-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 5173 --strictPort',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: './frontend/pm2-out.log',
      error_file: './frontend/pm2-err.log',
    },
  ],
};