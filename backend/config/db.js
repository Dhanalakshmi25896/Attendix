require("dotenv").config();
const mysql = require("mysql");

const isProduction = process.env.NODE_ENV === "production";
const dbConfig = {
  host: process.env.DB_HOST || (isProduction ? "" : "localhost"),
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || (isProduction ? "" : "root"),
  password: process.env.DB_PASSWORD || (isProduction ? "" : "root123"),
  database: process.env.DB_NAME || (isProduction ? "" : "myprojectdb"),
  connectionLimit: 10,
  connectTimeout: 10000,
  acquireTimeout: 10000,
};

if (process.env.DB_SSL_CA) {
  dbConfig.ssl = {
    ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n"),
  };
} else if (process.env.DB_SSL === "true") {
  dbConfig.ssl = { rejectUnauthorized: true };
}

if (isProduction && (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database)) {
  throw new Error(
    "Missing database env vars in production. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in Render."
  );
}

const pool = mysql.createPool(dbConfig);

pool.on("error", (err) => {
  console.error("MySQL pool error:", err.message);
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }
  console.log("MySQL connected");
  connection.release();
});

module.exports = pool;
