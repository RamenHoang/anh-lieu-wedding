const mysql = require("mysql2/promise");

const database = module.exports;

database.init = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    return connection;
  } catch (error) {
    console.log(error);
  }
};
