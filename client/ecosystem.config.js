module.exports = {
  apps: [
    {
      name: 'server',
      script: 'server/src/app.js',
      watch: true,
      env: {
        PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY,
        PM2_SECRET_KEY: process.env.PM2_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV,
      },
      instances: 1,
      exec_mode: 'cluster',
    },
    {
      name: 'client',
      script: 'npx',
      args: 'vite --host',
      interpreter: 'none',
      instances: 1,
      watch: true,
      env: {
        PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY,
        PM2_SECRET_KEY: process.env.PM2_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV,
      },
    },
  ],
}
