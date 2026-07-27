const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

let db

function connectDB(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, '..', 'boletas.db')
  try {
    db = new Database(resolvedPath)
    console.log('Conectado exitosamente a la base de datos SQLite')
  } catch (err) {
    console.error('Error al abrir la base de datos:', err.message)
    process.exit(1)
  }
  return db
}

function createTables(database) {
  database.exec(`
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

  database.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      departamento TEXT NOT NULL,
      brigadas TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuarios'
    )
  `)

  const columns = database.prepare("PRAGMA table_info(usuarios)").all()
  const hasRol = columns.some(c => c.name === 'rol')
  if (!hasRol) {
    database.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'usuarios'")
    console.log('Columna "rol" agregada a la tabla usuarios')
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS brigadas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      departamento TEXT NOT NULL,
      UNIQUE(nombre, departamento)
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS encuestadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('encuestador', 'supervisor')),
      codigo TEXT UNIQUE NOT NULL,
      telefono TEXT
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS brigada_encuestadores (
      brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
      encuestador_id INTEGER NOT NULL REFERENCES encuestadores(id) ON DELETE CASCADE,
      PRIMARY KEY (brigada_id, encuestador_id)
    )
  `)

  const boletaColumns = database.prepare("PRAGMA table_info(boletas)").all()
  const hasEncuestadorId = boletaColumns.some(c => c.name === 'encuestador_id')
  if (!hasEncuestadorId) {
    database.exec("ALTER TABLE boletas ADD COLUMN encuestador_id INTEGER REFERENCES encuestadores(id)")
    console.log('Columna "encuestador_id" agregada a la tabla boletas')
  }
}

function seedBrigadasYEncuestadores(database) {
  const existingBrigadas = database.prepare('SELECT COUNT(*) as count FROM brigadas').get()
  if (existingBrigadas.count > 0) return

  const BRIGADAS_DATA_SEED = {
    'SANTA CRUZ': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece70101', nombre: 'Griselda', telefono: '' },
        { codigo: 'ece70102', nombre: 'Diego', telefono: '' },
        { codigo: 'ece70103', nombre: 'Geovani', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece70201', nombre: 'Jesus', telefono: '' },
        { codigo: 'ece70202', nombre: 'Elizabeth', telefono: '' },
        { codigo: 'ece70203', nombre: 'Jhonny', telefono: '' },
      ]},
      { nombre: 'Brigada 7', encuestadores: [
        { codigo: 'ece70701', nombre: 'Cristian', telefono: '' },
        { codigo: 'ece70702', nombre: 'Jesica', telefono: '' },
        { codigo: 'ece70703', nombre: 'Sulmian', telefono: '' },
      ]},
    ],
  }

  const insertBrigada = database.prepare('INSERT OR IGNORE INTO brigadas (nombre, departamento) VALUES (?, ?)')
  const insertEncuestador = database.prepare('INSERT OR IGNORE INTO encuestadores (nombre, rol, codigo, telefono) VALUES (?, ?, ?, ?)')
  const insertAsignacion = database.prepare('INSERT OR IGNORE INTO brigada_encuestadores (brigada_id, encuestador_id) VALUES (?, ?)')
  const getEncuestador = database.prepare('SELECT id FROM encuestadores WHERE codigo = ?')
  const getBrigada = database.prepare('SELECT id FROM brigadas WHERE nombre = ? AND departamento = ?')

  const seedAll = database.transaction(() => {
    for (const [departamento, brigadas] of Object.entries(BRIGADAS_DATA_SEED)) {
      for (const brigada of brigadas) {
        insertBrigada.run(brigada.nombre, departamento)
        const brigadaRow = getBrigada.get(brigada.nombre, departamento)

        for (const enc of brigada.encuestadores) {
          insertEncuestador.run(enc.nombre, 'encuestador', enc.codigo, enc.telefono)
          const encRow = getEncuestador.get(enc.codigo)
          if (brigadaRow && encRow) {
            insertAsignacion.run(brigadaRow.id, encRow.id)
          }
        }
      }
    }
  })

  seedAll()
  console.log('Brigadas y encuestadores semilla creados')
}

function seedDefaultUser(database) {
  const adminUser = process.env.ADMIN_USERNAME || 'mcayo'
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD no está definido en .env. Saltando seed.')
    return
  }
  const existingUser = database.prepare('SELECT id, rol FROM usuarios WHERE username = ?').get(adminUser)
  if (!existingUser) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10)
    database.prepare(
      'INSERT INTO usuarios (username, password_hash, departamento, brigadas, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(adminUser, hashedPassword, 'SANTA CRUZ', JSON.stringify(['Brigada 1', 'Brigada 2', 'Brigada 7']), 'administrador')
    console.log(`Usuario administrador "${adminUser}" creado`)
  } else {
    console.log(`Usuario "${adminUser}" ya existe. Saltando seed (para resetear, elimina el usuario primero).`)
  }
}

function initDatabase() {
  const database = connectDB()
  createTables(database)
  seedDefaultUser(database)
  seedBrigadasYEncuestadores(database)
  return database
}

function getDB() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.')
  }
  return db
}

module.exports = { connectDB, createTables, seedDefaultUser, initDatabase, getDB }
