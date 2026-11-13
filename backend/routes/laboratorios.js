const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM laboratorios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, pais, contacto, telefono, productos } = req.body;
  if (typeof nombre !== 'string' || !nombre.trim()
    || typeof pais !== 'string' || !pais.trim()) {
    return res.status(400).json({ error: 'El nombre y el país del laboratorio son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO laboratorios (nombre, pais, contacto, telefono, productos) VALUES (?,?,?,?,?)',
      [nombre.trim(), pais.trim(), contacto, telefono, productos || 0]
    );
    res.status(201).json({ mensaje: 'Laboratorio creado', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, pais, contacto, telefono, productos } = req.body;
  try {
    await pool.query(
      'UPDATE laboratorios SET nombre=?, pais=?, contacto=?, telefono=?, productos=? WHERE id=?',
      [nombre, pais, contacto, telefono, productos, req.params.id]
    );
    res.json({ mensaje: 'Laboratorio actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM laboratorios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Laboratorio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
