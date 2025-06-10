require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

client.connect(err => {
  if (err) {
    console.error('Error al conectar a PostgreSQL', err.stack);
  } else {
    console.log('Conectado a PostgreSQL');

    const sql = `CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      fecha DATE,
      monto NUMERIC(10,2),
      descripcion TEXT,
      pagado_deuna BOOLEAN
    )`;

    client.query(sql, (err, res) => {
      if (err) {
        console.error('Error al crear la tabla', err.stack);
      } else {
        console.log('Tabla "ventas" lista');
      }
    });
  }
});

module.exports = client;
