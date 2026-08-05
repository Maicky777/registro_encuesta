const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const departamento =
      req.user.rol !== 'administrador' ? req.user.departamento : req.query.departamento

    let encuestadores
    if (departamento) {
      encuestadores = db.prepare(`
        SELECT e.*,
          GROUP_CONCAT(DISTINCT b.nombre || ' (' || b.departamento || ')') as brigadas_asignadas
        FROM encuestadores e
        LEFT JOIN brigada_encuestadores be ON e.id = be.encuestador_id
        LEFT JOIN brigadas b ON be.brigada_id = b.id
        WHERE b.departamento = ?
           OR (SELECT COUNT(*) FROM brigada_encuestadores WHERE encuestador_id = e.id) = 0
        GROUP BY e.id
        ORDER BY e.nombre
      `).all(departamento)
    } else {
      encuestadores = db.prepare(`
        SELECT e.*,
          GROUP_CONCAT(DISTINCT b.nombre || ' (' || b.departamento || ')') as brigadas_asignadas
        FROM encuestadores e
        LEFT JOIN brigada_encuestadores be ON e.id = be.encuestador_id
        LEFT JOIN brigadas b ON be.brigada_id = b.id
        GROUP BY e.id
        ORDER BY e.nombre
      `).all()
    }

    res.json(encuestadores)
  } catch (err) {
    console.error('Error al listar encuestadores:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/por-codigo/:codigo', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const encuestador = db.prepare('SELECT id, nombre, rol, codigo, telefono FROM encuestadores WHERE codigo = ?').get(req.params.codigo)
    if (!encuestador) {
      return res.status(404).json({ error: 'Encuestador no encontrado' })
    }
    res.json(encuestador)
  } catch (err) {
    console.error('Error al buscar encuestador por codigo:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const encuestador = db.prepare(`
      SELECT e.*,
        GROUP_CONCAT(DISTINCT b.nombre || ' (' || b.departamento || ')') as brigadas_asignadas
      FROM encuestadores e
      LEFT JOIN brigada_encuestadores be ON e.id = be.encuestador_id
      LEFT JOIN brigadas b ON be.brigada_id = b.id
      WHERE e.id = ?
      GROUP BY e.id
    `).get(req.params.id)

    if (!encuestador) {
      return res.status(404).json({ error: 'Encuestador no encontrado' })
    }
    res.json(encuestador)
  } catch (err) {
    console.error('Error al obtener encuestador:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', authMiddleware, requireRole('administrador'), (req, res) => {
  const { nombre, rol, codigo, telefono } = req.body

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre es requerido' })
  }

  if (!rol || !['encuestador', 'supervisor'].includes(rol)) {
    return res.status(400).json({ error: 'El rol debe ser "encuestador" o "supervisor"' })
  }

  if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
    return res.status(400).json({ error: 'El codigo es requerido' })
  }

  try {
    const db = getDB()
    const existing = db.prepare('SELECT id FROM encuestadores WHERE codigo = ?').get(codigo.trim())
    if (existing) {
      return res.status(409).json({ error: `El codigo "${codigo}" ya existe` })
    }

    const result = db.prepare('INSERT INTO encuestadores (nombre, rol, codigo, telefono) VALUES (?, ?, ?, ?)').run(
      nombre.trim(), rol, codigo.trim(), (telefono || '').trim()
    )
    res.json({ id: result.lastInsertRowid, nombre: nombre.trim(), rol, codigo: codigo.trim(), telefono: (telefono || '').trim() })
  } catch (err) {
    console.error('Error al crear encuestador:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  const { id } = req.params
  const { nombre, rol, codigo, telefono } = req.body

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un numero entero positivo.' })
  }

  if (rol && !['encuestador', 'supervisor'].includes(rol)) {
    return res.status(400).json({ error: 'El rol debe ser "encuestador" o "supervisor"' })
  }

  try {
    const db = getDB()
    const existing = db.prepare('SELECT id, nombre, rol, codigo, telefono FROM encuestadores WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Encuestador no encontrado' })
    }

    const finalNombre = nombre !== undefined && nombre !== null ? String(nombre).trim() : existing.nombre
    const finalRol = rol || existing.rol
    const finalCodigo = codigo !== undefined && codigo !== null ? String(codigo).trim() : existing.codigo
    const finalTelefono = telefono !== undefined && telefono !== null ? String(telefono).trim() : existing.telefono

    if (!finalNombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    if (!finalCodigo) {
      return res.status(400).json({ error: 'El codigo es requerido' })
    }

    if (finalCodigo !== existing.codigo) {
      const codeConflict = db.prepare('SELECT id FROM encuestadores WHERE codigo = ? AND id != ?').get(finalCodigo, id)
      if (codeConflict) {
        return res.status(409).json({ error: `El codigo "${finalCodigo}" ya esta en uso` })
      }
    }

    db.prepare('UPDATE encuestadores SET nombre = ?, rol = ?, codigo = ?, telefono = ? WHERE id = ?').run(
      finalNombre, finalRol, finalCodigo, finalTelefono, id
    )
    res.json({ message: 'Encuestador actualizado correctamente', encuestador: { id: Number(id), nombre: finalNombre, rol: finalRol, codigo: finalCodigo, telefono: finalTelefono } })
  } catch (err) {
    console.error('Error al actualizar encuestador:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  try {
    const db = getDB()
    const encuestador = db.prepare('SELECT id, nombre FROM encuestadores WHERE id = ?').get(req.params.id)
    if (!encuestador) {
      return res.status(404).json({ error: 'Encuestador no encontrado' })
    }

    db.prepare('DELETE FROM encuestadores WHERE id = ?').run(req.params.id)
    res.json({ message: `Encuestador "${encuestador.nombre}" eliminado correctamente` })
  } catch (err) {
    console.error('Error al eliminar encuestador:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
