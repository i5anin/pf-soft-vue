// config.js
const apiConfig = {
  ip: '192.168.0.200',
  port: '4001',
}

module.exports = {
  api: {
    ...apiConfig, // Используйте spread syntax для добавления свойств
    baseUrl: `http://${apiConfig.ip}:${apiConfig.port}/api`,
  },
}
