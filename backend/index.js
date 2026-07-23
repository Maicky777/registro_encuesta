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
    semana TEXT,
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

// 1. OBTENER todos los registros (READ)
app.get('/api/boletas', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM boletas ORDER BY id DESC').all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 2. CREAR nuevo registro (CREATE)
app.post('/api/boletas', (req, res) => {
  const data = req.body
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

// 3. ACTUALIZAR registro existente (UPDATE)
app.put('/api/boletas/:id', (req, res) => {
  const { id } = req.params
  const data = req.body
  const sql = `
    UPDATE boletas SET 
      departamento=?, brigada=?, folio=?, upm=?, upmReemplazo=?, upmAdicional=?, semana=?,
      visita=?, panel=?, numeroCorrelativo=?, voe=?, usuarioEncuestador=?, nombreEncuestador=?,
      incidencia=?, detalleObservaciones=?, totalObservaciones=?, boletaObservada=?,
      estadoBoleta=?, observacionBoleta=?, observacionPersonal=?, consolidada=?
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
      id,
    )
    res.json({ message: 'Registro actualizado correctamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 4. ELIMINAR registro (DELETE)
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

    // Creamos una transacción para procesar miles de registros en milisegundos
    const insertMany = db.transaction((dataArray) => {
      for (const data of dataArray) {
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
      }
    })

    // Ejecutamos la carga masiva estructurada
    insertMany(registros)
    res.json({ message: 'Carga masiva completada exitosamente' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 5000
app.listen(PORT, () =>
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`),
)
