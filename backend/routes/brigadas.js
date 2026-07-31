const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')
const { parseBrigadas } = require('../utils/parseBrigadas')

const router = express.Router()

router.get('/departamentos', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    if (req.user.rol !== 'administrador') {
      return res.json([req.user.departamento].filter(Boolean))
    }
    const rows = db.prepare('SELECT DISTINCT departamento FROM brigadas ORDER BY departamento').all()
    res.json(rows.map((r) => r.departamento))
  } catch (err) {
    console.error('Error al listar departamentos:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()

    if (req.user.rol !== 'administrador') {
      const userBrigadas = parseBrigadas(req.user.brigadas)
      if (userBrigadas.length > 0) {
        const placeholders = userBrigadas.map(() => '?').join(',')
        const brigadas = db.prepare(`
          SELECT b.*, 
            (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores,
            (SELECT GROUP_CONCAT(e.nombre, ', ') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as nombres_encuestadores,
            (SELECT GROUP_CONCAT(COALESCE(e.telefono, ''), '|') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as telefonos_encuestadores
          FROM brigadas b 
          WHERE b.departamento = ? AND b.nombre IN (${placeholders})
          ORDER BY b.nombre
        `).all(req.user.departamento, ...userBrigadas)
        return res.json(brigadas)
      }
      return res.json([])
    }

    const { departamento } = req.query

    let brigadas
    if (departamento) {
      brigadas = db.prepare(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores,
          (SELECT GROUP_CONCAT(e.nombre, ', ') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as nombres_encuestadores,
          (SELECT GROUP_CONCAT(COALESCE(e.telefono, ''), '|') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as telefonos_encuestadores
        FROM brigadas b 
        WHERE b.departamento = ? 
        ORDER BY b.nombre
      `).all(departamento)
    } else {
      brigadas = db.prepare(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM brigada_encuestadores WHERE brigada_id = b.id) as total_encuestadores,
          (SELECT GROUP_CONCAT(e.nombre, ', ') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as nombres_encuestadores,
          (SELECT GROUP_CONCAT(COALESCE(e.telefono, ''), '|') FROM brigada_encuestadores be JOIN encuestadores e ON e.id = be.encuestador_id WHERE be.brigada_id = b.id) as telefonos_encuestadores
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

    if (req.user.rol !== 'administrador') {
      const userBrigadas = parseBrigadas(req.user.brigadas)
      if (brigada.departamento !== req.user.departamento || !userBrigadas.includes(brigada.nombre)) {
        return res.status(404).json({ error: 'Brigada no encontrada' })
      }
    }

    res.json(brigada)
  } catch (err) {
    console.error('Error al obtener brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', authMiddleware, requireRole('administrador'), (req, res) => {
  const { nombre, departamento, telefono } = req.body

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

    const result = db.prepare('INSERT INTO brigadas (nombre, departamento, telefono) VALUES (?, ?, ?)').run(nombre.trim(), departamento.trim(), (telefono || '').trim())
    res.json({ id: result.lastInsertRowid, nombre: nombre.trim(), departamento: departamento.trim(), telefono: (telefono || '').trim() })
  } catch (err) {
    console.error('Error al crear brigada:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  const { id } = req.params
  const { nombre, departamento, telefono } = req.body

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

    db.prepare('UPDATE brigadas SET nombre = ?, departamento = ?, telefono = ? WHERE id = ?').run(nombre.trim(), departamento.trim(), (telefono || '').trim(), id)
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
