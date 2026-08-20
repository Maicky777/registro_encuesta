const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

let db

function connectDB(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, '..', 'boletas.db')
  try {
    db = new Database(resolvedPath)
    db.pragma('foreign_keys = ON')
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
  {
    name: '009_create_asistencia',
    up(database) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS asistencia (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          encuestador_id INTEGER NOT NULL REFERENCES encuestadores(id) ON DELETE CASCADE,
          departamento TEXT NOT NULL DEFAULT '',
          brigada TEXT NOT NULL DEFAULT '',
          semana INTEGER NOT NULL DEFAULT 0,
          dia TEXT NOT NULL,
          turno TEXT NOT NULL,
          estatus TEXT NOT NULL DEFAULT 'N/A',
          ingreso TEXT DEFAULT '',
          fIngreso TEXT DEFAULT '',
          salida TEXT DEFAULT '',
          fSalida TEXT DEFAULT '',
          observacion TEXT DEFAULT '',
          UNIQUE(encuestador_id, semana, dia, turno)
        )
      `)
      database.exec(`
        CREATE INDEX IF NOT EXISTS idx_asistencia_semana ON asistencia(semana);
        CREATE INDEX IF NOT EXISTS idx_asistencia_departamento ON asistencia(departamento);
        CREATE INDEX IF NOT EXISTS idx_asistencia_brigada ON asistencia(brigada);
      `)
    },
  },
  {
    name: '010_add_telefono_to_brigadas',
    up(database) {
      const columns = database.prepare('PRAGMA table_info(brigadas)').all()
      if (!columns.some((c) => c.name === 'telefono')) {
        database.exec("ALTER TABLE brigadas ADD COLUMN telefono TEXT DEFAULT ''")
      }
    },
  },
  {
    name: '011_add_fechas_boletas',
    up(database) {
      const columns = database.prepare('PRAGMA table_info(boletas)').all()
      if (!columns.some((c) => c.name === 'fecha_registro')) {
        database.exec('ALTER TABLE boletas ADD COLUMN fecha_registro TEXT')
      }
      if (!columns.some((c) => c.name === 'fecha_modificacion')) {
        database.exec('ALTER TABLE boletas ADD COLUMN fecha_modificacion TEXT')
      }
      database.exec(`
        UPDATE boletas SET
          fecha_registro = COALESCE(fecha_registro, datetime('now')),
          fecha_modificacion = COALESCE(fecha_modificacion, datetime('now'))
      `)
    },
  },
  {
    name: '012_add_usuario_campos_boletas',
    up(database) {
      const columns = database.prepare('PRAGMA table_info(boletas)').all()
      if (!columns.some((c) => c.name === 'creado_por')) {
        database.exec("ALTER TABLE boletas ADD COLUMN creado_por TEXT DEFAULT ''")
      }
      if (!columns.some((c) => c.name === 'editado_por')) {
        database.exec("ALTER TABLE boletas ADD COLUMN editado_por TEXT DEFAULT ''")
      }
    },
  },
  {
    name: '013_departamentos_to_json_array',
    up(database) {
      const users = database.prepare('SELECT id, departamento FROM usuarios').all()
      const update = database.prepare('UPDATE usuarios SET departamento = ? WHERE id = ?')
      for (const user of users) {
        try {
          const parsed = JSON.parse(user.departamento)
          if (Array.isArray(parsed)) continue
        } catch {
          // not JSON yet, convert
        }
        if (typeof user.departamento === 'string' && user.departamento.trim() && !user.departamento.startsWith('[')) {
          update.run(JSON.stringify([user.departamento.trim()]), user.id)
        }
      }
    },
  },
  {
    name: '014_brigadas_per_departamento',
    up(database) {
      const users = database.prepare('SELECT id, brigadas, departamento FROM usuarios').all()
      const update = database.prepare('UPDATE usuarios SET brigadas = ? WHERE id = ?')
      for (const user of users) {
        try {
          const parsed = JSON.parse(user.brigadas)
          if (typeof parsed === 'object' && !Array.isArray(parsed)) continue
          const deptos = JSON.parse(user.departamento)
          if (!Array.isArray(deptos) || deptos.length === 0) continue
          if (Array.isArray(parsed) && parsed.length > 0) {
            const perDepto = {}
            for (const dept of deptos) {
              perDepto[dept] = [...parsed]
            }
            update.run(JSON.stringify(perDepto), user.id)
          }
        } catch {
          // skip
        }
      }
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
    'CHUQUISACA': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece10101', nombre: 'Maria', telefono: '' },
        { codigo: 'ece10102', nombre: 'Carlos', telefono: '' },
        { codigo: 'ece10103', nombre: 'Rosa', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece10201', nombre: 'Pedro', telefono: '' },
        { codigo: 'ece10202', nombre: 'Ana', telefono: '' },
        { codigo: 'ece10203', nombre: 'Luis', telefono: '' },
      ]},
    ],
    'LA PAZ': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece20101', nombre: 'Juan', telefono: '' },
        { codigo: 'ece20102', nombre: 'Sofia', telefono: '' },
        { codigo: 'ece20103', nombre: 'Marcos', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece20201', nombre: 'Elena', telefono: '' },
        { codigo: 'ece20202', nombre: 'Pablo', telefono: '' },
        { codigo: 'ece20203', nombre: 'Carmen', telefono: '' },
      ]},
    ],
    'COCHABAMBA': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece30101', nombre: 'Victor', telefono: '' },
        { codigo: 'ece30102', nombre: 'Lucia', telefono: '' },
        { codigo: 'ece30103', nombre: 'Raul', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece30201', nombre: 'Gloria', telefono: '' },
        { codigo: 'ece30202', nombre: 'Hugo', telefono: '' },
        { codigo: 'ece30203', nombre: 'Irene', telefono: '' },
      ]},
    ],
    'ORURO': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece40101', nombre: 'Mario', telefono: '' },
        { codigo: 'ece40102', nombre: 'Nadia', telefono: '' },
        { codigo: 'ece40103', nombre: 'Oscar', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece40201', nombre: 'Patricia', telefono: '' },
        { codigo: 'ece40202', nombre: 'Ramiro', telefono: '' },
        { codigo: 'ece40203', nombre: 'Silvia', telefono: '' },
      ]},
    ],
    'POTOSI': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece50101', nombre: 'Teodoro', telefono: '' },
        { codigo: 'ece50102', nombre: 'Ulises', telefono: '' },
        { codigo: 'ece50103', nombre: 'Veronica', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece50201', nombre: 'Walter', telefono: '' },
        { codigo: 'ece50202', nombre: 'Ximena', telefono: '' },
        { codigo: 'ece50203', nombre: 'Yuri', telefono: '' },
      ]},
    ],
    'TARIJA': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece60101', nombre: 'Zulema', telefono: '' },
        { codigo: 'ece60102', nombre: 'Adrian', telefono: '' },
        { codigo: 'ece60103', nombre: 'Beatriz', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece60201', nombre: 'Claudio', telefono: '' },
        { codigo: 'ece60202', nombre: 'Diana', telefono: '' },
        { codigo: 'ece60203', nombre: 'Esteban', telefono: '' },
      ]},
    ],
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
    'BENI': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece80101', nombre: 'Fabiola', telefono: '' },
        { codigo: 'ece80102', nombre: 'Gaston', telefono: '' },
        { codigo: 'ece80103', nombre: 'Helena', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece80201', nombre: 'Ignacio', telefono: '' },
        { codigo: 'ece80202', nombre: 'Julia', telefono: '' },
        { codigo: 'ece80203', nombre: 'Kevin', telefono: '' },
      ]},
    ],
    'PANDO': [
      { nombre: 'Brigada 1', encuestadores: [
        { codigo: 'ece90101', nombre: 'Laura', telefono: '' },
        { codigo: 'ece90102', nombre: 'Miguel', telefono: '' },
        { codigo: 'ece90103', nombre: 'Nora', telefono: '' },
      ]},
      { nombre: 'Brigada 2', encuestadores: [
        { codigo: 'ece90201', nombre: 'Omar', telefono: '' },
        { codigo: 'ece90202', nombre: 'Paola', telefono: '' },
        { codigo: 'ece90203', nombre: 'Rene', telefono: '' },
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
  if (adminPassword.length < 8) {
    console.error('ADMIN_PASSWORD debe tener al menos 8 caracteres. Saltando seed de usuario admin.')
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
    // Asegurar que el admin tenga el rol correcto y acceso a todos los departamentos/brigadas
    if (existingUser.rol !== 'administrador') {
      const allDeps = database.prepare('SELECT DISTINCT departamento FROM brigadas ORDER BY departamento').all().map((r) => r.departamento)
      const allBrigadas = database.prepare('SELECT DISTINCT nombre FROM brigadas ORDER BY nombre').all().map((r) => r.nombre)
      database.prepare('UPDATE usuarios SET rol = ?, departamento = ?, brigadas = ? WHERE id = ?')
        .run('administrador', JSON.stringify(allDeps), JSON.stringify(allBrigadas), existingUser.id)
      console.log(`Usuario "${adminUser}" actualizado a administrador con acceso completo.`)
    } else {
      console.log(`Usuario "${adminUser}" ya existe con rol administrador.`)
    }
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

module.exports = { initDatabase, getDB }
