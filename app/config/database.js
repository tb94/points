const fs = require('fs');

module.exports = {
    development: {
        username: "username",
        password: "password",
        database: "database",
        host: "localhost",
        dialect: "sqlite",
        storage: "database.sqlite",
        logging: false,
        transactionType: "IMMEDIATE"
    },
    production: {
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        logging: false,
        dialect: 'mysql'
    }
}
