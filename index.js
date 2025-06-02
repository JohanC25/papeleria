const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database/database');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  db.all('SELECT * FROM ventas ORDER BY fecha DESC', (err, rows) => {
    if (err) throw err;
    rows = rows.map(row => ({
      ...row,
      pagado_deuna_str: row.pagado_deuna ? 'Sí' : 'No'
    }));
    res.render('index', { ventas: rows });
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

  db.all(query, params, (err, rows) => {
    if (err) throw err;

    let total = 0, conDeuna = 0, sinDeuna = 0;

    rows.forEach(v => {
      total += v.monto;
      if (v.pagado_deuna) conDeuna += v.monto;
      else sinDeuna += v.monto;
    });

    res.render('reportes', {
      total: total.toFixed(2),
      conDeuna: conDeuna.toFixed(2),
      sinDeuna: sinDeuna.toFixed(2),
      ventas: rows,
      filtros: { desde, hasta, deuna }
    });
  });
});

app.post('/registrar', (req, res) => {
  const { fecha, monto, descripcion, pagado } = req.body;
  db.run(
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
