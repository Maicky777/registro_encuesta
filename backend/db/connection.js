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

function ensureMigrationsTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

function getAppliedMigrations(database) {
  const rows = database.prepare('SELECT name FROM migrations ORDER BY id').all()
  return new Set(rows.map((r) => r.name))
}

const MIGRATIONS = [
  {
    name: '001_create_boletas',
    up(database) {
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
    },
  },
  {
    name: '002_create_usuarios',
    up(database) {
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
    },
  },
  {
    name: '003_add_rol_to_usuarios',
    up(database) {
      const columns = database.prepare('PRAGMA table_info(usuarios)').all()
      if (!columns.some((c) => c.name === 'rol')) {
        database.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'usuarios'")
      }
    },
  },
  {
    name: '004_create_brigadas',
    up(database) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS brigadas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          departamento TEXT NOT NULL,
          UNIQUE(nombre, departamento)
        )
      `)
    },
  },
  {
    name: '005_create_encuestadores',
    up(database) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS encuestadores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          rol TEXT NOT NULL CHECK(rol IN ('encuestador', 'supervisor')),
          codigo TEXT UNIQUE NOT NULL,
          telefono TEXT
        )
      `)
    },
  },
  {
    name: '006_create_brigada_encuestadores',
    up(database) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS brigada_encuestadores (
          brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
          encuestador_id INTEGER NOT NULL REFERENCES encuestadores(id) ON DELETE CASCADE,
          PRIMARY KEY (brigada_id, encuestador_id)
        )
      `)
    },
  },
  {
    name: '007_add_encuestador_id_to_boletas',
    up(database) {
      const columns = database.prepare('PRAGMA table_info(boletas)').all()
      if (!columns.some((c) => c.name === 'encuestador_id')) {
        database.exec('ALTER TABLE boletas ADD COLUMN encuestador_id INTEGER REFERENCES encuestadores(id)')
      }
    },
  },
  {
    name: '008_add_indexes_boletas',
    up(database) {
      database.exec(`
        CREATE INDEX IF NOT EXISTS idx_boletas_folio ON boletas(folio);
        CREATE INDEX IF NOT EXISTS idx_boletas_brigada ON boletas(brigada);
        CREATE INDEX IF NOT EXISTS idx_boletas_departamento ON boletas(departamento);
        CREATE INDEX IF NOT EXISTS idx_boletas_semana ON boletas(semana);
        CREATE INDEX IF NOT EXISTS idx_boletas_upm ON boletas(upm);
        CREATE INDEX IF NOT EXISTS idx_boletas_estado ON boletas(estadoBoleta);
        CREATE INDEX IF NOT EXISTS idx_boletas_brigada_semana ON boletas(brigada, semana);
      `)
    },
  },
]

function runMigrations(database) {
  ensureMigrationsTable(database)
  const applied = getAppliedMigrations(database)

  const insertMigration = database.prepare('INSERT INTO migrations (name) VALUES (?)')

  const runAll = database.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (applied.has(migration.name)) continue
      console.log(`Aplicando migración: ${migration.name}`)
      migration.up(database)
      insertMigration.run(migration.name)
    }
  })

  runAll()
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
    console.error('ADMIN_PASSWORD no está definido en .env. Saltando seed de usuario admin.')
    return
  }
  const existingUser = database.prepare('SELECT id, rol FROM usuarios WHERE username = ?').get(adminUser)
  if (!existingUser) {
    const allDeps = database.prepare('SELECT DISTINCT departamento FROM brigadas ORDER BY departamento').all().map((r) => r.departamento)
    const allBrigadas = database.prepare('SELECT DISTINCT nombre FROM brigadas ORDER BY nombre').all().map((r) => r.nombre)
    const hashedPassword = bcrypt.hashSync(adminPassword, 10)
    database.prepare(
      'INSERT INTO usuarios (username, password_hash, departamento, brigadas, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(adminUser, hashedPassword, JSON.stringify(allDeps), JSON.stringify(allBrigadas), 'administrador')
    console.log(`Usuario administrador "${adminUser}" creado con acceso a todos los departamentos y brigadas`)
  } else {
    console.log(`Usuario "${adminUser}" ya existe. Saltando seed (para resetear, elimina el usuario primero).`)
  }
}

function initDatabase(dbPath) {
  const database = connectDB(dbPath)
  runMigrations(database)
  seedBrigadasYEncuestadores(database)
  seedDefaultUser(database)
  return database
}

function getDB() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.')
  }
  return db
}

module.exports = { connectDB, runMigrations, seedDefaultUser, initDatabase, getDB }
