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
  return database
}

function getDB() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.')
  }
  return db
}

module.exports = { connectDB, createTables, seedDefaultUser, initDatabase, getDB }
