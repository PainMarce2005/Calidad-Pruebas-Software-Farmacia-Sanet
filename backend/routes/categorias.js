const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion, productos } = req.body;
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion, productos) VALUES (?,?,?)',
      [nombre.trim(), descripcion, productos || 0]
    );
    res.status(201).json({ mensaje: 'Categoría creada', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion, productos } = req.body;
  const categoryId = Number(req.params.id);
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
  }
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    return res.status(404).json({ error: 'Categoría no encontrada.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE categorias SET nombre=?, descripcion=?, productos=? WHERE id=?',
      [nombre.trim(), descripcion, productos, categoryId]
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.query('SELECT id FROM categorias WHERE id = ?', [categoryId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ mensaje: 'Categoría actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
