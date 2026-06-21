const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ...(process.env.DB_SSL === 'true'
    ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
    : {})
};

// Пул підключень для контролерів, які використовують pool.query
const pool = mysql.createPool(dbConfig);

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

async function getQuery(query, params = []) {
  const connection = await getConnection();
  const [rows] = await connection.query(query, params);
  connection.end();
  return rows;
}

// For INSERT/UPDATE/DELETE: returns OkPacket with insertId/affectedRows
async function run(query, params = []) {
  const connection = await getConnection();
  const [result] = await connection.execute(query, params);
  connection.end();
  return result; // OkPacket
}

module.exports = { dbConfig, pool, getConnection, getQuery, run };
