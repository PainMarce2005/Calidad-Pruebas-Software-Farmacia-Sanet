const router = require('express').Router();

// Singleton
const db = require('../patterns/DatabaseSingleton');

// Builder 
const { CompraBuilder } = require('../patterns/builders');

// listar todas
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM compras ORDER BY fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// obtener por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM compras WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// registrar compra (Builder)
router.post('/', async (req, res) => {
  try {
    // construye y valida el objeto Compra
    const compra = new CompraBuilder()
      .setId(req.body.id)
      .setProveedor(req.body.proveedor)
      .setFecha(req.body.fecha)
      .setTotal(req.body.total)
      .setEstado(req.body.estado || 'pendiente')
      .setProductos(req.body.productos || [])
      .setNotas(req.body.notas)
      .build();

    await db.query(
      'INSERT INTO compras (id, proveedor, fecha, total, estado, productos, notas) VALUES (?,?,?,?,?,?,?)',
      [compra.id, compra.proveedor, compra.fecha, compra.total, compra.estado, compra.productos, compra.notas]
    );

    res.status(201).json({ mensaje: 'Compra registrada', id: compra.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// actualizar compra (Builder)
router.put('/:id', async (req, res) => {
  try {
    const compra = new CompraBuilder()
      .setId(req.params.id)
      .setProveedor(req.body.proveedor)
      .setFecha(req.body.fecha)
      .setTotal(req.body.total)
      .setEstado(req.body.estado || 'pendiente')
      .setProductos(req.body.productos || [])
      .setNotas(req.body.notas)
      .build();

    await db.query(
      'UPDATE compras SET proveedor=?, fecha=?, total=?, estado=?, productos=?, notas=? WHERE id=?',
      [compra.proveedor, compra.fecha, compra.total, compra.estado, compra.productos, compra.notas, compra.id]
    );

    res.json({ mensaje: 'Compra actualizada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// eliminar compra
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM compras WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Compra eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
