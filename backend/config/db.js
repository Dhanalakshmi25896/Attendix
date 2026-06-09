const mysql = require("mysql");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root123",
  database: process.env.DB_NAME || "myprojectdb"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected");
});

module.exports = db;
