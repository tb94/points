const fs = require('fs');

module.exports = {
  development: {
    username: "username",
    password: "password",
    database: "database",
    host: "localhost",
    dialect: "sqlite",
    storage: "database.sqlite",
    transactionType: "IMMEDIATE",
    pool: {
      maxactive: 1,
      max: 5,
      min: 0,
      idle: 20000
    }
  },
  production: {
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
}
