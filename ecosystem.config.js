module.exports = {
  apps: [
    {
      name: 'backend soft',
      script: './node_modules/.bin/nodemon backend/src/app.js', // Используйте локальный nodemon
      watch: false, // Nodemon сам следит за изменениями
      env: {
        PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY,
        PM2_SECRET_KEY: process.env.PM2_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV,
      },
      instances: 1,
      exec_mode: 'cluster',
    },
    {
      name: 'frontend soft',
      script: 'npx vite --host', // Укажите команду для npx
      interpreter: 'none', // Не нужно интерпретировать команду
      instances: 1,
      watch: false, // Не нужно следить за изменениями, vite сам это делает
      env: {
        PM2_PUBLIC_KEY: process.env.PM2_PUBLIC_KEY,
        PM2_SECRET_KEY: process.env.PM2_SECRET_KEY,
        NODE_ENV: process.env.NODE_ENV,
      },
    },
  ],
}
