const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// Conexión/Creación de Base de Datos SQLite
const db = new sqlite3.Database('./boletas.db', (err) => {
  if (err) console.error('Error al abrir la base de datos:', err.message)
  else
    console.log('Conectado exitosamente a la base de datos SQLite (boletas.db)')
})

// Crear Tabla si no existe
db.run(`
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
  db.all('SELECT * FROM boletas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
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
  const params = [
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
  ]

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ id: this.lastID, ...data })
  })
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
  const params = [
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
  ]

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Registro actualizado correctamente' })
  })
})

// 4. ELIMINAR registro (DELETE)
app.delete('/api/boletas/:id', (req, res) => {
  const { id } = req.params
  db.run('DELETE FROM boletas WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Registro eliminado' })
  })
})

// 5. CARGA MASIVA desde JSON (Importar)
app.post('/api/boletas/batch', (req, res) => {
  const registros = req.body
  if (!Array.isArray(registros))
    return res.status(400).json({ error: 'Se esperaba un arreglo' })

  const stmt = db.prepare(`
    INSERT INTO boletas (
      departamento, brigada, folio, upm, upmReemplazo, upmAdicional, semana, visita, panel,
      numeroCorrelativo, voe, usuarioEncuestador, nombreEncuestador, incidencia,
      detalleObservaciones, totalObservaciones, boletaObservada, estadoBoleta,
      observacionBoleta, observacionPersonal, consolidada, fechaFinalConsolidacion
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)

  registros.forEach((data) => {
    stmt.run([
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
      data.fechaFinalConsolidacion || new Date().toISOString().split('T')[0],
    ])
  })

  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Carga masiva completada exitosamente' })
  })
})

const PORT = 5000
app.listen(PORT, () =>
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`),
)
