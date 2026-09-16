// =====================================================
// Database Connection
// Connects the Node.js backend to MariaDB/MySQL
// =====================================================

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a reusable database connection pool
const database = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Allows multiple users to use the system at once
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = database;