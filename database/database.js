const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/ventas.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    monto REAL,
    descripcion TEXT,
    pagado_deuna INTEGER
  )`);
});

module.exports = db;
