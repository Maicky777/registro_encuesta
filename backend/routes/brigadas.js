const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const { departamento } = req.query

    let brigadas
    if (departamento) {
      brigadas = db.prepare(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores
        FROM brigadas b 
        WHERE b.departamento = ? 
        ORDER BY b.nombre
      `).all(departamento)
    } else {
      brigadas = db.prepare(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores
        FROM brigadas b 
        ORDER BY b.departamento, b.nombre
      `).all()
    }

    res.json(brigadas)
  } catch (err) {
    console.error('Error al listar brigadas:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const brigada = db.prepare(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores
      FROM brigadas b WHERE b.id = ?
    `).get(req.params.id)

    if (!brigada) {
      return res.status(404).json({ error: 'Brigada no encontrada' })
    }
    res.json(brigada)
  } catch (err) {
    console.error('Error al obtener brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', authMiddleware, requireRole('administrador'), (req, res) => {
  const { nombre, departamento } = req.body

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la brigada es requerido' })
  }

  if (!departamento || typeof departamento !== 'string' || !departamento.trim()) {
    return res.status(400).json({ error: 'El departamento es requerido' })
  }

  try {
    const db = getDB()
    const existing = db.prepare('SELECT id FROM brigadas WHERE nombre = ? AND departamento = ?').get(nombre.trim(), departamento.trim())
    if (existing) {
      return res.status(409).json({ error: `La brigada "${nombre}" ya existe en ${departamento}` })
    }

    const result = db.prepare('INSERT INTO brigadas (nombre, departamento) VALUES (?, ?)').run(nombre.trim(), departamento.trim())
    res.json({ id: result.lastInsertRowid, nombre: nombre.trim(), departamento: departamento.trim() })
  } catch (err) {
    console.error('Error al crear brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  const { id } = req.params
  const { nombre, departamento } = req.body

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un numero entero positivo.' })
  }

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la brigada es requerido' })
  }

  if (!departamento || typeof departamento !== 'string' || !departamento.trim()) {
    return res.status(400).json({ error: 'El departamento es requerido' })
  }

  try {
    const db = getDB()
    const existing = db.prepare('SELECT id FROM brigadas WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Brigada no encontrada' })
    }

    const conflict = db.prepare('SELECT id FROM brigadas WHERE nombre = ? AND departamento = ? AND id != ?').get(nombre.trim(), departamento.trim(), id)
    if (conflict) {
      return res.status(409).json({ error: `La brigada "${nombre}" ya existe en ${departamento}` })
    }

    db.prepare('UPDATE brigadas SET nombre = ?, departamento = ? WHERE id = ?').run(nombre.trim(), departamento.trim(), id)
    res.json({ message: 'Brigada actualizada correctamente' })
  } catch (err) {
    console.error('Error al actualizar brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  try {
    const db = getDB()
    const brigada = db.prepare('SELECT id, nombre, departamento FROM brigadas WHERE id = ?').get(req.params.id)
    if (!brigada) {
      return res.status(404).json({ error: 'Brigada no encontrada' })
    }

    db.prepare('DELETE FROM brigadas WHERE id = ?').run(req.params.id)
    res.json({ message: `Brigada "${brigada.nombre}" de ${brigada.departamento} eliminada correctamente` })
  } catch (err) {
    console.error('Error al eliminar brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
