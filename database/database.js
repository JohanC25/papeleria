require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL');

  const sql = `CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE,
    monto DECIMAL(10,2),
    descripcion TEXT,
    pagado_deuna BOOLEAN
  )`;

  connection.query(sql, (err) => {
    if (err) throw err;
    console.log('Tabla "ventas" lista');
  });
});

module.exports = connection;
