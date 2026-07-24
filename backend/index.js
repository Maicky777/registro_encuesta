const express = require('express')
const Database = require('better-sqlite3')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// Conexión/Creación de Base de Datos con better-sqlite3
let db
try {
  db = new Database('./boletas.db', { verbose: console.log })
  console.log('Conectado exitosamente a la base de datos SQLite (boletas.db)')
} catch (err) {
  console.error('Error al abrir la base de datos:', err.message)
}

// Crear Tabla si no existe (Se ejecuta síncronamente)
db.exec(`
  CREATE TABLE IF NOT EXISTS boletas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    departamento TEXT,
    brigada TEXT,
    folio TEXT,
    upm TEXT,
    upmReemplazo TEXT,
    upmAdicional TEXT,
    semana INTEGER,
    visita TEXT,
    panel TEXT,
    numeroCorrelativo INTEGER,
    voe TEXT,
    usuarioEncuestador TEXT,
    nombreEncuestador TEXT,
    incidencia TEXT,
    detalleObservaciones TEXT,
    totalObservaciones INTEGER,
    boletaObservada TEXT,
    estadoBoleta TEXT,
    observacionBoleta TEXT,
    observacionPersonal TEXT,
    consolidada TEXT,
    fechaFinalConsolidacion TEXT
  )
`)

// 1. VERIFICAR SI UN FOLIO EXISTE (UNICIDAD)
app.get('/api/boletas/check-folio', (req, res) => {
  const { folio, excludeId } = req.query
  if (!folio) {
    return res.json({ exists: false })
  }
  try {
    let row
    if (excludeId) {
      row = db
        .prepare('SELECT id FROM boletas WHERE folio = ? AND id != ?')
        .get(folio, excludeId)
    } else {
      row = db.prepare('SELECT id FROM boletas WHERE folio = ?').get(folio)
    }
    res.json({ exists: !!row })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 2. OBTENER todos los registros (READ)
app.get('/api/boletas', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM boletas ORDER BY id DESC').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 3. CREAR nuevo registro (CREATE)
app.post('/api/boletas', (req, res) => {
  const data = req.body

  if (data.folio) {
    const existente = db
      .prepare('SELECT id FROM boletas WHERE folio = ?')
      .get(data.folio)
    if (existente) {
      return res
        .status(409)
        .json({ error: `El folio "${data.folio}" ya existe en la base de datos.` })
    }
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
    const info = db
      .prepare(sql)
      .run(
        data.departamento,
        data.brigada,
        data.folio,
        data.upm,
        data.upmReemplazo,
        data.upmAdicional,
        data.semana,
        data.visita,
        data.panel,
        data.numeroCorrelativo,
        data.voe,
        data.usuarioEncuestador,
        data.nombreEncuestador,
        data.incidencia,
        data.detalleObservaciones,
        data.totalObservaciones,
        data.boletaObservada,
        data.estadoBoleta,
        data.observacionBoleta,
        data.observacionPersonal,
        data.consolidada,
        data.fechaFinalConsolidacion,
      )
    res.json({ id: info.lastInsertRowid, ...data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 4. ACTUALIZAR registro existente (UPDATE)
app.put('/api/boletas/:id', (req, res) => {
  const { id } = req.params
  const data = req.body

  // Verificar que el folio no exista en otro registro
  if (data.folio) {
    const existente = db
      .prepare('SELECT id FROM boletas WHERE folio = ? AND id != ?')
      .get(data.folio, id)
    if (existente) {
      return res
        .status(409)
        .json({ error: `El folio "${data.folio}" ya existe en otro registro.` })
    }
  }

  const sql = `
    UPDATE boletas SET 
      departamento=?, brigada=?, folio=?, upm=?, upmReemplazo=?, upmAdicional=?, semana=?,
      visita=?, panel=?, numeroCorrelativo=?, voe=?, usuarioEncuestador=?, nombreEncuestador=?,
      incidencia=?, detalleObservaciones=?, totalObservaciones=?, boletaObservada=?,
      estadoBoleta=?, observacionBoleta=?, observacionPersonal=?, consolidada=?,
      fechaFinalConsolidacion=?
    WHERE id=?
  `

  try {
    db.prepare(sql).run(
      data.departamento,
      data.brigada,
      data.folio,
      data.upm,
      data.upmReemplazo,
      data.upmAdicional,
      data.semana,
      data.visita,
      data.panel,
      data.numeroCorrelativo,
      data.voe,
      data.usuarioEncuestador,
      data.nombreEncuestador,
      data.incidencia,
      data.detalleObservaciones,
      data.totalObservaciones,
      data.boletaObservada,
      data.estadoBoleta,
      data.observacionBoleta,
      data.observacionPersonal,
      data.consolidada,
      data.fechaFinalConsolidacion,
      id,
    )
    res.json({ message: 'Registro actualizado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 5. ELIMINAR registro (DELETE)
app.delete('/api/boletas/:id', (req, res) => {
  const { id } = req.params
  try {
    db.prepare('DELETE FROM boletas WHERE id = ?').run(id)
    res.json({ message: 'Registro eliminado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 5. CARGA MASIVA desde JSON (Importar con Transacción)
app.post('/api/boletas/batch', (req, res) => {
  const registros = req.body
  if (!Array.isArray(registros)) {
    return res.status(400).json({ error: 'Se esperaba un arreglo' })
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
    const stmt = db.prepare(sql)
    const checkStmt = db.prepare('SELECT id FROM boletas WHERE folio = ?')
    let insertados = 0
    let omitidos = 0

    // Creamos una transacción para procesar miles de registros en milisegundos
    const insertMany = db.transaction((dataArray) => {
      for (const data of dataArray) {
        if (data.folio && checkStmt.get(data.folio)) {
          omitidos++
          continue
        }
        stmt.run(
          data.departamento,
          data.brigada,
          data.folio,
          data.upm,
          data.upmReemplazo,
          data.upmAdicional,
          data.semana,
          data.visita,
          data.panel,
          data.numeroCorrelativo,
          data.voe,
          data.usuarioEncuestador,
          data.nombreEncuestador,
          data.incidencia,
          data.detalleObservaciones,
          data.totalObservaciones,
          data.boletaObservada,
          data.estadoBoleta,
          data.observacionBoleta,
          data.observacionPersonal,
          data.consolidada,
          data.fechaFinalConsolidacion ||
            new Date().toISOString().split('T')[0],
        )
        insertados++
      }
    })

    // Ejecutamos la carga masiva estructurada
    insertMany(registros)
    res.json({
      message: 'Carga masiva completada',
      insertados,
      omitidos,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 5000
app.listen(PORT, () =>
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`),
)
