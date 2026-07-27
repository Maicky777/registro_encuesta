const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')

const router = express.Router()

const ALLOWED_INCIDENCIAS = [
  '1: ENTREVISTA COMPLETA',
  '2: ENTREVISTA INCOMPLETA',
  '3: TEMPORALMENTE AUSENTE',
  '4: INFORMANTE NO CALIFICADO',
  '5: FALTA DE CONTACTO',
  '6: RECHAZO',
  '7: VIVIENDA DESOCUPADA',
  '8: ENTREVISTA FUERA DE PERIODO',
  '9: TRASLADO',
]

const ALLOWED_ESTADOS = ['SIN OBSERVACION', 'OBSERVADO', 'CORREGIDO']
const ALLOWED_OBS_BOLETA = ['', 'ENVIADO', 'NO ENVIADO']

function computeObservacionFields(detalleObservaciones) {
  const frases = (detalleObservaciones || '').split(';').filter((f) => f.trim().length > 0)
  const total = frases.length
  return {
    totalObservaciones: total,
    estadoBoleta: total > 0 ? 'OBSERVADO' : 'SIN OBSERVACION',
    boletaObservada: total > 0 ? 'SI' : 'NO',
    observacionBoleta: total > 0 ? 'NO ENVIADO' : '',
  }
}

const BOLETA_FIELDS = [
  'departamento', 'brigada', 'folio', 'upm', 'upmReemplazo', 'upmAdicional',
  'semana', 'visita', 'panel', 'numeroCorrelativo', 'voe', 'usuarioEncuestador',
  'nombreEncuestador', 'incidencia', 'detalleObservaciones', 'totalObservaciones',
  'boletaObservada', 'estadoBoleta', 'observacionBoleta', 'observacionPersonal',
  'consolidada', 'fechaFinalConsolidacion',
]

function validateBoleta(data, { isUpdate = false } = {}) {
  const errors = []

  if (!isUpdate) {
    const required = ['departamento', 'brigada', 'folio']
    for (const field of required) {
      if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
        errors.push(`El campo "${field}" es requerido y debe ser una cadena no vacía.`)
      }
    }
  }

  if (data.folio !== undefined) {
    if (typeof data.folio !== 'string' || data.folio.trim().length === 0) {
      errors.push('El folio no puede estar vacío.')
    } else if (data.folio.length < 10 || data.folio.length > 30) {
      errors.push('El folio debe tener entre 10 y 30 caracteres.')
    }
  }

  if (data.semana !== undefined && data.semana !== null && data.semana !== '') {
    const semanaNum = Number(data.semana)
    if (!Number.isInteger(semanaNum) || semanaNum < 1 || semanaNum > 53) {
      errors.push('La semana debe ser un número entero entre 1 y 53.')
    }
  }

  if (data.visita !== undefined && data.visita !== null && data.visita !== '') {
    const visitaNum = Number(data.visita)
    if (!Number.isInteger(visitaNum) || visitaNum < 1 || visitaNum > 4) {
      errors.push('La visita debe ser un número entero entre 1 y 4.')
    }
  }

  if (data.incidencia !== undefined && data.incidencia !== '') {
    if (!ALLOWED_INCIDENCIAS.includes(data.incidencia)) {
      errors.push(`Incidencia inválida. Valores permitidos: ${ALLOWED_INCIDENCIAS.join(', ')}`)
    }
  }

  if (data.estadoBoleta !== undefined && data.estadoBoleta !== '') {
    if (!ALLOWED_ESTADOS.includes(data.estadoBoleta)) {
      errors.push(`Estado de boleta inválido. Valores permitidos: ${ALLOWED_ESTADOS.join(', ')}`)
    }
  }

  if (data.observacionBoleta !== undefined && data.observacionBoleta !== '') {
    if (!ALLOWED_OBS_BOLETA.includes(data.observacionBoleta)) {
      errors.push(`Observación boleta inválida. Valores permitidos: ENVIADO, NO ENVIADO`)
    }
  }

  return errors
}

router.get('/check-folio', authMiddleware, (req, res) => {
  const { folio, excludeId } = req.query
  if (!folio) {
    return res.json({ exists: false })
  }
  try {
    const db = getDB()
    let row
    if (excludeId) {
      row = db.prepare('SELECT id FROM boletas WHERE folio = ? AND id != ?').get(folio, excludeId)
    } else {
      row = db.prepare('SELECT id FROM boletas WHERE folio = ?').get(folio)
    }
    res.json({ exists: !!row })
  } catch (err) {
    console.error('Error en check-folio:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 100))
    const offset = (page - 1) * limit

    let whereClause = ''
    const params = []

    if (req.user.rol !== 'administrador') {
      try {
        const userBrigadas = JSON.parse(req.user.brigadas || '[]')
        if (userBrigadas.length > 0) {
          const placeholders = userBrigadas.map(() => '?').join(',')
          whereClause = `WHERE brigada IN (${placeholders})`
          params.push(...userBrigadas)
        }
      } catch (e) {
        console.error('Error al parsear brigadas del usuario:', e.message)
      }
    }

    const countQuery = `SELECT COUNT(*) as count FROM boletas ${whereClause}`
    const totalRows = db.prepare(countQuery).get(...params).count

    const dataQuery = `SELECT * FROM boletas ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`
    const rows = db.prepare(dataQuery).all(...params, limit, offset)

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: totalRows,
        totalPages: Math.ceil(totalRows / limit),
      },
    })
  } catch (err) {
    console.error('Error al listar boletas:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/', authMiddleware, (req, res) => {
  const data = req.body

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'El cuerpo de la petición debe ser un objeto válido.' })
  }

  const validationErrors = validateBoleta(data)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(' ') })
  }

  try {
    const db = getDB()
    const existente = db.prepare('SELECT id FROM boletas WHERE folio = ?').get(data.folio)
    if (existente) {
      return res.status(409).json({ error: `El folio "${data.folio}" ya existe en la base de datos.` })
    }

    const obsFields = computeObservacionFields(data.detalleObservaciones)

    const finalEstado = data.estadoBoleta || obsFields.estadoBoleta
    const finalBoletaObs = data.boletaObservada !== undefined ? data.boletaObservada : obsFields.boletaObservada
    const finalObservacion = data.observacionBoleta !== undefined ? data.observacionBoleta : obsFields.observacionBoleta
    const finalTotal = data.totalObservaciones !== undefined ? Number(data.totalObservaciones) : obsFields.totalObservaciones

    const sql = `
      INSERT INTO boletas (
        departamento, brigada, folio, upm, upmReemplazo, upmAdicional, semana, visita, panel,
        numeroCorrelativo, voe, usuarioEncuestador, nombreEncuestador, incidencia,
        detalleObservaciones, totalObservaciones, boletaObservada, estadoBoleta,
        observacionBoleta, observacionPersonal, consolidada, fechaFinalConsolidacion
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `

    const info = db.prepare(sql).run(
      data.departamento, data.brigada, data.folio, data.upm, data.upmReemplazo,
      data.upmAdicional, data.semana, data.visita, data.panel, data.numeroCorrelativo,
      data.voe, data.usuarioEncuestador, data.nombreEncuestador, data.incidencia,
      data.detalleObservaciones, finalTotal, finalBoletaObs,
      finalEstado, finalObservacion, data.observacionPersonal,
      data.consolidada, data.fechaFinalConsolidacion,
    )
    res.json({ id: info.lastInsertRowid, ...data, totalObservaciones: finalTotal, boletaObservada: finalBoletaObs, estadoBoleta: finalEstado, observacionBoleta: finalObservacion })
  } catch (err) {
    console.error('Error al crear boleta:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/upm-reemplazo', authMiddleware, (req, res) => {
  const { upm, upmReemplazo, excludeId } = req.body
  if (!upm || typeof upm !== 'string') {
    return res.status(400).json({ error: 'El campo "upm" es requerido.' })
  }
  try {
    const db = getDB()
    let sql = 'UPDATE boletas SET upmReemplazo = ? WHERE upm = ?'
    const params = [upmReemplazo || '', upm]
    if (excludeId) {
      sql += ' AND id != ?'
      params.push(excludeId)
    }
    const info = db.prepare(sql).run(...params)
    res.json({ message: 'UPM reemplazo propagado', actualizados: info.changes })
  } catch (err) {
    console.error('Error al actualizar UPM reemplazo:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const data = req.body

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'El cuerpo de la petición debe ser un objeto válido.' })
  }

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un número entero positivo.' })
  }

  const validationErrors = validateBoleta(data, { isUpdate: true })
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(' ') })
  }

  try {
    const db = getDB()
    const existente = db.prepare('SELECT id FROM boletas WHERE id = ?').get(id)
    if (!existente) {
      return res.status(404).json({ error: `No se encontró registro con id ${id}.` })
    }

    if (data.folio) {
      const existenteFolio = db.prepare('SELECT id FROM boletas WHERE folio = ? AND id != ?').get(data.folio, id)
      if (existenteFolio) {
        return res.status(409).json({ error: `El folio "${data.folio}" ya existe en otro registro.` })
      }
    }

    const obsFields = computeObservacionFields(data.detalleObservaciones)

    const finalEstado = data.estadoBoleta || obsFields.estadoBoleta
    const finalBoletaObs = data.boletaObservada !== undefined ? data.boletaObservada : obsFields.boletaObservada
    const finalObservacion = data.observacionBoleta !== undefined ? data.observacionBoleta : obsFields.observacionBoleta
    const finalTotal = data.totalObservaciones !== undefined ? Number(data.totalObservaciones) : obsFields.totalObservaciones

    const sql = `
      UPDATE boletas SET
        departamento=?, brigada=?, folio=?, upm=?, upmReemplazo=?, upmAdicional=?, semana=?,
        visita=?, panel=?, numeroCorrelativo=?, voe=?, usuarioEncuestador=?, nombreEncuestador=?,
        incidencia=?, detalleObservaciones=?, totalObservaciones=?, boletaObservada=?,
        estadoBoleta=?, observacionBoleta=?, observacionPersonal=?, consolidada=?,
        fechaFinalConsolidacion=?
      WHERE id=?
    `

    db.prepare(sql).run(
      data.departamento, data.brigada, data.folio, data.upm, data.upmReemplazo,
      data.upmAdicional, data.semana, data.visita, data.panel, data.numeroCorrelativo,
      data.voe, data.usuarioEncuestador, data.nombreEncuestador, data.incidencia,
      data.detalleObservaciones, finalTotal, finalBoletaObs,
      finalEstado, finalObservacion, data.observacionPersonal,
      data.consolidada, data.fechaFinalConsolidacion, id,
    )
    res.json({ message: 'Registro actualizado correctamente' })
  } catch (err) {
    console.error('Error al actualizar boleta:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  const { id } = req.params
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'El ID debe ser un número entero positivo.' })
  }
  try {
    const db = getDB()
    const existente = db.prepare('SELECT id FROM boletas WHERE id = ?').get(id)
    if (!existente) {
      return res.status(404).json({ error: `No se encontró registro con id ${id}.` })
    }
    db.prepare('DELETE FROM boletas WHERE id = ?').run(id)
    res.json({ message: 'Registro eliminado' })
  } catch (err) {
    console.error('Error al eliminar boleta:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/batch', authMiddleware, (req, res) => {
  const registros = req.body
  if (!Array.isArray(registros)) {
    return res.status(400).json({ error: 'Se esperaba un arreglo de registros.' })
  }

  if (registros.length === 0) {
    return res.status(400).json({ error: 'El arreglo de registros no puede estar vacío.' })
  }

  if (registros.length > 10000) {
    return res.status(400).json({ error: 'No se pueden importar más de 10,000 registros a la vez.' })
  }

  const batchErrors = []
  for (let i = 0; i < registros.length; i++) {
    const errors = validateBoleta(registros[i])
    if (errors.length > 0) {
      batchErrors.push(`Registro ${i + 1} (folio: ${registros[i].folio || 'N/A'}): ${errors.join(' ')}`)
    }
  }

  if (batchErrors.length > 0) {
    return res.status(400).json({
      error: `Se encontraron errores de validación en ${batchErrors.length} registro(s).`,
      details: batchErrors.slice(0, 10),
    })
  }

  const sql = `
    INSERT INTO boletas (
      departamento, brigada, folio, upm, upmReemplazo, upmAdicional, semana, visita, panel,
      numeroCorrelativo, voe, usuarioEncuestador, nombreEncuestador, incidencia,
      detalleObservaciones, totalObservaciones, boletaObservada, estadoBoleta,
      observacionBoleta, observacionPersonal, consolidada, fechaFinalConsolidacion
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `

  try {
    const db = getDB()
    const stmt = db.prepare(sql)
    const checkStmt = db.prepare('SELECT id FROM boletas WHERE folio = ?')
    let insertados = 0
    let omitidos = 0

  const fechaBatch = new Date().toISOString().split('T')[0]

  const insertMany = db.transaction((dataArray) => {
    for (const data of dataArray) {
      if (data.folio && checkStmt.get(data.folio)) {
        omitidos++
        continue
      }
      const obsFields = computeObservacionFields(data.detalleObservaciones)
      const finalEstado = data.estadoBoleta || obsFields.estadoBoleta
      const finalBoletaObs = data.boletaObservada !== undefined ? data.boletaObservada : obsFields.boletaObservada
      const finalObservacion = data.observacionBoleta !== undefined ? data.observacionBoleta : obsFields.observacionBoleta
      const finalTotal = data.totalObservaciones !== undefined ? Number(data.totalObservaciones) : obsFields.totalObservaciones

      stmt.run(
        data.departamento, data.brigada, data.folio, data.upm, data.upmReemplazo,
        data.upmAdicional, data.semana, data.visita, data.panel, data.numeroCorrelativo,
        data.voe, data.usuarioEncuestador, data.nombreEncuestador, data.incidencia,
        data.detalleObservaciones, finalTotal, finalBoletaObs,
        finalEstado, finalObservacion, data.observacionPersonal,
        data.consolidada,
        data.fechaFinalConsolidacion || fechaBatch,
      )
      insertados++
    }
    })

    insertMany(registros)
    res.json({ message: 'Carga masiva completada', insertados, omitidos })
  } catch (err) {
    console.error('Error en batch:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
