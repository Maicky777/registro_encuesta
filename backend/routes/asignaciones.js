const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')
const { parseBrigadasArray, getBrigadasForDepartamento } = require('../utils/parseBrigadas')

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const { brigada_id, departamento } = req.query
    const isAdmin = req.user.rol === 'administrador'

    if (!isAdmin) {
      const userDepartamentos = req.user.departamento || []

      if (brigada_id) {
        const brigada = db.prepare('SELECT id, departamento, nombre FROM brigadas WHERE id = ?').get(brigada_id)
        if (!brigada) {
          return res.status(404).json({ error: 'Brigada no encontrada' })
        }
        const deptBrigadas = getBrigadasForDepartamento(req.user.brigadas, brigada.departamento)
        if (!userDepartamentos.includes(brigada.departamento) || !deptBrigadas.includes(brigada.nombre)) {
          return res.status(403).json({ error: 'No tienes permisos para ver esta brigada' })
        }
        const encuestadores = db.prepare(`
          SELECT e.* FROM encuestadores e
          JOIN brigada_encuestadores be ON e.id = be.encuestador_id
          WHERE be.brigada_id = ?
          ORDER BY e.nombre
        `).all(brigada_id)
        return res.json(encuestadores)
      }

      if (departamento && !userDepartamentos.includes(departamento)) {
        return res.status(403).json({ error: 'No tienes permisos para ver este departamento' })
      }

      if (userDepartamentos.length > 0) {
        const deptPlaceholders = userDepartamentos.map(() => '?').join(',')
        const asignaciones = db.prepare(`
          SELECT b.id as brigada_id, b.nombre as brigada_nombre, b.departamento,
            e.id as encuestador_id, e.nombre as encuestador_nombre, e.codigo, e.rol
          FROM brigadas b
          JOIN brigada_encuestadores be ON b.id = be.brigada_id
          JOIN encuestadores e ON be.encuestador_id = e.id
          WHERE b.departamento IN (${deptPlaceholders})
          ORDER BY b.departamento, b.nombre, e.nombre
        `).all(...userDepartamentos)
        return res.json(asignaciones)
      }
      return res.json([])
    }

    if (brigada_id) {
      const encuestadores = db.prepare(`
        SELECT e.* FROM encuestadores e
        JOIN brigada_encuestadores be ON e.id = be.encuestador_id
        WHERE be.brigada_id = ?
        ORDER BY e.nombre
      `).all(brigada_id)
      return res.json(encuestadores)
    }

    if (departamento) {
      const asignaciones = db.prepare(`
        SELECT b.id as brigada_id, b.nombre as brigada_nombre, b.departamento,
          e.id as encuestador_id, e.nombre as encuestador_nombre, e.codigo, e.rol
        FROM brigadas b
        JOIN brigada_encuestadores be ON b.id = be.brigada_id
        JOIN encuestadores e ON be.encuestador_id = e.id
        WHERE b.departamento = ?
        ORDER BY b.nombre, e.nombre
      `).all(departamento)
      return res.json(asignaciones)
    }

    const all = db.prepare(`
      SELECT b.id as brigada_id, b.nombre as brigada_nombre, b.departamento,
        e.id as encuestador_id, e.nombre as encuestador_nombre, e.codigo, e.rol
      FROM brigadas b
      JOIN brigada_encuestadores be ON b.id = be.brigada_id
      JOIN encuestadores e ON be.encuestador_id = e.id
      ORDER BY b.departamento, b.nombre, e.nombre
    `).all()
    res.json(all)
  } catch (err) {
    console.error('Error al listar asignaciones:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', authMiddleware, requireRole('administrador'), (req, res) => {
  const { brigada_id, encuestador_id } = req.body

  if (!brigada_id || !encuestador_id) {
    return res.status(400).json({ error: 'brigada_id y encuestador_id son requeridos' })
  }

  try {
    const db = getDB()
    const brigada = db.prepare('SELECT id FROM brigadas WHERE id = ?').get(brigada_id)
    if (!brigada) {
      return res.status(404).json({ error: 'Brigada no encontrada' })
    }

    const encuestador = db.prepare('SELECT id FROM encuestadores WHERE id = ?').get(encuestador_id)
    if (!encuestador) {
      return res.status(404).json({ error: 'Encuestador no encontrado' })
    }

    const existing = db.prepare('SELECT * FROM brigada_encuestadores WHERE brigada_id = ? AND encuestador_id = ?').get(brigada_id, encuestador_id)
    if (existing) {
      return res.status(409).json({ error: 'Este encuestador ya esta asignado a esta brigada' })
    }

    db.prepare('INSERT INTO brigada_encuestadores (brigada_id, encuestador_id) VALUES (?, ?)').run(brigada_id, encuestador_id)
    res.json({ message: 'Asignacion creada correctamente' })
  } catch (err) {
    console.error('Error al crear asignacion:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/', authMiddleware, requireRole('administrador'), (req, res) => {
  const { brigada_id, encuestador_id } = req.body

  if (!brigada_id || !encuestador_id) {
    return res.status(400).json({ error: 'brigada_id y encuestador_id son requeridos' })
  }

  try {
    const db = getDB()
    const result = db.prepare('DELETE FROM brigada_encuestadores WHERE brigada_id = ? AND encuestador_id = ?').run(brigada_id, encuestador_id)
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asignacion no encontrada' })
    }
    res.json({ message: 'Asignacion eliminada correctamente' })
  } catch (err) {
    console.error('Error al eliminar asignacion:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
