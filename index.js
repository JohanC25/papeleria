const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database/database');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Función para formatear fechas como dd/mm/yyyy
function formatearFecha(fecha) {
  const fechaObj = new Date(fecha);
  const d = String(fechaObj.getDate()).padStart(2, '0');
  const m = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const a = fechaObj.getFullYear();
  return `${d}/${m}/${a}`;
}

app.get('/', (req, res) => {
  db.query('SELECT * FROM ventas ORDER BY fecha DESC', (err, results) => {
    if (err) throw err;
    const ventas = results.map(row => ({
      ...row,
      monto: Number(row.monto), // 👈 aseguramos que sea número
      pagado_deuna_str: row.pagado_deuna ? 'Sí' : 'No',
      fecha_formateada: formatearFecha(row.fecha)
    }));
    res.render('index', { ventas });
  });
});

app.get('/reportes', (req, res) => {
  const { desde, hasta, deuna } = req.query;

  let query = 'SELECT * FROM ventas WHERE 1=1';
  let params = [];

  if (desde) {
    query += ' AND fecha >= ?';
    params.push(desde);
  }

  if (hasta) {
    query += ' AND fecha <= ?';
    params.push(hasta);
  }

  if (deuna === '1') {
    query += ' AND pagado_deuna = 1';
  } else if (deuna === '0') {
    query += ' AND pagado_deuna = 0';
  }

  query += ' ORDER BY fecha DESC';

  db.query(query, params, (err, results) => {
    if (err) throw err;

    let total = 0, conDeuna = 0, sinDeuna = 0;

    const ventas = results.map(row => {
      const monto = Number(row.monto); // 👈 convertir monto a número
      total += monto;
      if (row.pagado_deuna) conDeuna += monto;
      else sinDeuna += monto;

      return {
        ...row,
        monto,
        fecha_formateada: formatearFecha(row.fecha),
        pagado_deuna_str: row.pagado_deuna ? 'Sí' : 'No'
      };
    });

    res.render('reportes', {
      total: total.toFixed(2),
      conDeuna: conDeuna.toFixed(2),
      sinDeuna: sinDeuna.toFixed(2),
      ventas,
      filtros: { desde, hasta, deuna }
    });
  });
});

app.post('/registrar', (req, res) => {
  const { fecha, monto, descripcion, pagado } = req.body;
  db.query(
    'INSERT INTO ventas (fecha, monto, descripcion, pagado_deuna) VALUES (?, ?, ?, ?)',
    [fecha, monto, descripcion, pagado === 'on' ? 1 : 0],
    err => {
      if (err) throw err;
      res.redirect('/');
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
