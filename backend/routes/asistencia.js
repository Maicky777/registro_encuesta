const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const { getDB } = require('../db/connection')
const { parseBrigadas } = require('../utils/parseBrigadas')

const router = express.Router()

const DEP_ID_MAP = {
  'CHUQUISACA': 1,
  'LA PAZ': 2,
  'COCHABAMBA': 3,
  'ORURO': 4,
  'POTOSI': 5,
  'TARIJA': 6,
  'SANTA CRUZ': 7,
  'BENI': 8,
  'PANDO': 9,
}

router.get('/personal', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const userDept = req.user.departamento
    const userBrigadas = parseBrigadas(req.user.brigadas)

    const departamento = req.query.departamento || (req.user.rol !== 'administrador' ? userDept : null)
    const brigadaNombre = req.query.brigada

    let query = `
      SELECT e.id as encuestador_id, e.nombre, e.rol, e.codigo,
             b.id as brigada_id, b.nombre as brigada_nombre, b.departamento
      FROM encuestadores e
      JOIN brigada_encuestadores be ON e.id = be.encuestador_id
      JOIN brigadas b ON be.brigada_id = b.id
      WHERE 1=1
    `
    const params = []

    if (departamento && req.user.rol === 'administrador') {
      query += ' AND b.departamento = ?'
      params.push(departamento)
    } else if (req.user.rol !== 'administrador') {
      query += ' AND b.departamento = ?'
      params.push(userDept)
    }

    if (brigadaNombre) {
      query += ' AND b.nombre = ?'
      params.push(brigadaNombre)
    } else if (req.user.rol !== 'administrador' && userBrigadas.length > 0) {
      const placeholders = userBrigadas.map(() => '?').join(',')
      query += ` AND b.nombre IN (${placeholders})`
      params.push(...userBrigadas)
    }

    query += ' ORDER BY e.nombre'

    const rows = db.prepare(query).all(...params)

    const personal = rows.map((r) => ({
      uid: String(r.encuestador_id),
      encuestador_id: r.encuestador_id,
      idDep: DEP_ID_MAP[r.departamento] || '',
      departamento: r.departamento,
      codBrigada: r.brigada_nombre,
      semana: req.query.semana || '4',
      idEnc: '',
      cargo: r.rol === 'supervisor' ? 'SUPERVISOR' : 'ENCUESTADOR',
      nombre: r.nombre.toUpperCase(),
      usuario: r.codigo,
    }))

    res.json(personal)
  } catch (err) {
    console.error('Error al listar personal:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const { semana, departamento, brigada } = req.query

    let query = 'SELECT * FROM asistencia WHERE 1=1'
    const params = []

    if (semana) {
      query += ' AND semana = ?'
      params.push(parseInt(semana, 10))
    }
    if (departamento) {
      query += ' AND departamento = ?'
      params.push(departamento)
    }
    if (brigada) {
      query += ' AND brigada = ?'
      params.push(brigada)
    }

    if (req.user.rol !== 'administrador') {
      query += ' AND departamento = ?'
      params.push(req.user.departamento)
      const userBrigadas = parseBrigadas(req.user.brigadas)
      if (userBrigadas.length > 0) {
        const placeholders = userBrigadas.map(() => '?').join(',')
        query += ` AND brigada IN (${placeholders})`
        params.push(...userBrigadas)
      }
    }

    const records = db.prepare(query).all(...params)
    res.json(records)
  } catch (err) {
    console.error('Error al obtener asistencia:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/batch', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const { records, semana, departamento, brigada } = req.body

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records debe ser un array' })
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'records no puede estar vacío' })
    }

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      if (!r || typeof r !== 'object') {
        return res.status(400).json({ error: `El registro ${i + 1} debe ser un objeto válido.` })
      }
      if (!r.encuestador_id || !Number.isInteger(Number(r.encuestador_id))) {
        return res.status(400).json({ error: `El registro ${i + 1} debe incluir un encuestador_id válido.` })
      }
      if (r.dia === undefined || r.dia === null || String(r.dia).trim() === '') {
        return res.status(400).json({ error: `El registro ${i + 1} debe incluir el campo "dia".` })
      }
      if (r.turno === undefined || r.turno === null || String(r.turno).trim() === '') {
        return res.status(400).json({ error: `El registro ${i + 1} debe incluir el campo "turno".` })
      }
    }

    if (req.user.rol !== 'administrador') {
      const userBrigadas = parseBrigadas(req.user.brigadas)
      if (userBrigadas.length === 0) {
        return res.status(403).json({ error: 'No tienes brigadas asignadas para guardar asistencia.' })
      }
      for (const r of records) {
        const dept = departamento || r.departamento || ''
        const brig = brigada || r.brigada || ''
        if (dept !== req.user.departamento) {
          return res.status(403).json({ error: 'No tienes permisos para guardar asistencia de otro departamento.' })
        }
        if (brig && !userBrigadas.includes(brig)) {
          return res.status(403).json({ error: `No tienes permisos para guardar asistencia de la brigada ${brig}.` })
        }
      }

      const placeholders = userBrigadas.map(() => '?').join(',')
      const idsInScope = db.prepare(`
        SELECT DISTINCT e.id FROM encuestadores e
        JOIN brigada_encuestadores be ON e.id = be.encuestador_id
        JOIN brigadas b ON be.brigada_id = b.id
        WHERE b.departamento = ? AND b.nombre IN (${placeholders})
      `).all(req.user.departamento, ...userBrigadas).map((row) => row.id)
      const allowedIds = new Set(idsInScope)
      for (const r of records) {
        if (!allowedIds.has(Number(r.encuestador_id))) {
          return res.status(403).json({ error: `No tienes permisos para guardar asistencia del encuestador ${r.encuestador_id}.` })
        }
      }
    }

    const upsert = db.prepare(`
      INSERT INTO asistencia (encuestador_id, departamento, brigada, semana, dia, turno, estatus, ingreso, fIngreso, salida, fSalida, observacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(encuestador_id, semana, dia, turno)
      DO UPDATE SET estatus = excluded.estatus,
                    ingreso = excluded.ingreso,
                    fIngreso = excluded.fIngreso,
                    salida = excluded.salida,
                    fSalida = excluded.fSalida,
                    observacion = excluded.observacion
    `)

    const saveAll = db.transaction((records) => {
      let count = 0
      for (const r of records) {
        upsert.run(
          r.encuestador_id,
          departamento || r.departamento || '',
          brigada || r.brigada || '',
          parseInt(semana || r.semana || 0, 10),
          r.dia,
          r.turno,
          r.estatus || 'N/A',
          r.ingreso || '',
          r.fIngreso || '',
          r.salida || '',
          r.fSalida || '',
          r.observacion || '',
        )
        count++
      }
      return count
    })

    const count = saveAll(records)
    res.json({ message: 'Asistencia guardada correctamente', count })
  } catch (err) {
    console.error('Error al guardar asistencia:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const { semana, dia, departamento, brigada } = req.query

    if (semana === undefined || semana === null || semana === '') {
      return res.status(400).json({ error: 'semana es requerida' })
    }
    if (dia === undefined || dia === null || String(dia).trim() === '') {
      return res.status(400).json({ error: 'dia es requerido' })
    }

    let query = 'DELETE FROM asistencia WHERE semana = ? AND dia = ?'
    const params = [parseInt(semana, 10), String(dia).trim().toUpperCase()]

    if (departamento) {
      query += ' AND departamento = ?'
      params.push(departamento)
    }
    if (brigada) {
      query += ' AND brigada = ?'
      params.push(brigada)
    }

    if (req.user.rol !== 'administrador') {
      query += ' AND departamento = ?'
      params.push(req.user.departamento)
      const userBrigadas = parseBrigadas(req.user.brigadas)
      if (userBrigadas.length > 0) {
        const placeholders = userBrigadas.map(() => '?').join(',')
        query += ` AND brigada IN (${placeholders})`
        params.push(...userBrigadas)
      }
    }

    const result = db.prepare(query).run(...params)
    res.json({ message: 'Asistencia eliminada correctamente', count: result.changes })
  } catch (err) {
    console.error('Error al eliminar asistencia:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
