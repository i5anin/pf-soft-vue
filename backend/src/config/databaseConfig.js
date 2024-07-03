const config = require('./config')

function getDbConfig() {
  let databaseType = process.env.NODE_ENV
  // console.log(databaseType)
  // const networkDetails = 'определить ip клиента!!!'

  // if (networkDetails.ip === '192.168.0.200') {
  //   console.log(config.dbConfigSuperTest)
  //   return config.dbConfigSuperTest
  // } else {
  return databaseType === 'build' ? config.dbConfig : config.dbConfigTest
  // }
}

module.exports = getDbConfig
