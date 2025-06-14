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
  db.query('SELECT * FROM ventas ORDER BY fecha DESC', (err, result) => {
    if (err) throw err;
    const ventas = result.rows.map(row => ({
      ...row,
      monto: Number(row.monto),
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
  let paramIndex = 1;

  if (desde) {
    query += ` AND fecha >= $${paramIndex++}`;
    params.push(desde);
  }

  if (hasta) {
    query += ` AND fecha <= $${paramIndex++}`;
    params.push(hasta);
  }

  if (deuna === '1') {
    query += ' AND pagado_deuna = true';
  } else if (deuna === '0') {
    query += ' AND pagado_deuna = false';
  }

  query += ' ORDER BY fecha DESC';

  db.query(query, params, (err, result) => {
    if (err) throw err;

    let total = 0, conDeuna = 0, sinDeuna = 0;

    const ventas = result.rows.map(row => {
      const monto = Number(row.monto);
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

app.get('/ver/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM ventas WHERE id = $1', [id], (err, result) => {
    if (err) throw err;
    if (result.rows.length === 0) return res.send('Venta no encontrada');
    const venta = result.rows[0];
    venta.monto = Number(venta.monto);
    venta.fecha_formateada = formatearFecha(venta.fecha);
    venta.pagado_deuna_str = venta.pagado_deuna ? 'Sí' : 'No';
    res.render('ver', { venta });
  });
});

app.get('/editar/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM ventas WHERE id = $1', [id], (err, result) => {
    if (err) throw err;
    if (result.rows.length === 0) return res.send('Venta no encontrada');
    const venta = result.rows[0];
    res.render('editar', { venta });
  });
});

app.post('/editar/:id', (req, res) => {
  const id = req.params.id;
  const { fecha, monto, descripcion, pagado } = req.body;
  db.query(
    'UPDATE ventas SET fecha = $1, monto = $2, descripcion = $3, pagado_deuna = $4 WHERE id = $5',
    [fecha, monto, descripcion, pagado === 'on', id],
    err => {
      if (err) throw err;
      res.redirect('/reportes');
    }
  );
});

app.post('/eliminar/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM ventas WHERE id = $1', [id], err => {
    if (err) throw err;
    res.redirect('/reportes');
  });
});

app.post('/registrar', (req, res) => {
  const { fecha, monto, descripcion, pagado } = req.body;
  db.query(
    'INSERT INTO ventas (fecha, monto, descripcion, pagado_deuna) VALUES ($1, $2, $3, $4)',
    [fecha, monto, descripcion, pagado === 'on'],
    err => {
      if (err) throw err;
      res.redirect('/');
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
