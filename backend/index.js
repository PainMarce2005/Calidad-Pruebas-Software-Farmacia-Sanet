const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { verifyToken } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/auth', require('./routes/auth'));

// Rutas protegidas
app.use('/api/productos',    verifyToken, require('./routes/productos'));
app.use('/api/compras',      verifyToken, require('./routes/compras'));
app.use('/api/laboratorios', verifyToken, require('./routes/laboratorios'));
app.use('/api/categorias',   verifyToken, require('./routes/categorias'));
app.use('/api/clientes', verifyToken, require('./routes/clientes'));
app.use('/api/ventas', verifyToken, require('./routes/ventas'));
app.use('/api/usuarios',     require('./routes/usuarios'));  // maneja verifyToken internamente

// Health check
app.get('/', (_req, res) => {
  res.json({ mensaje: 'API Farmacia Sanet funcionando ✓' });
});

const PORT = process.env.PORT || 3001;
app.use((err, req, res, _next) => {
  console.error('[Error global]', err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
