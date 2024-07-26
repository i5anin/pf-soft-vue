module.exports = {
  dbConfigTest: {
    user: process.env.DB_TEST_USER,
    host: process.env.DB_TEST_HOST,
    database: process.env.DB_TEST_NAME,
    password: process.env.DB_TEST_PASSWORD,
    port: process.env.DB_TEST_PORT,
    dialect: process.env.DB_DIALECT,
  },
  dbConfig: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  },
  server: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  port: process.env.PORT,
  emailConfig: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    to: process.env.MAIL_TO,
    from: process.env.MAIL_FROM,
  },
}
