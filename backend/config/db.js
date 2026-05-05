const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "myprojectdb"
});

db.connect(err => {
  if (err) throw err;
  console.log("MySQL connected");
});

module.exports = db;
