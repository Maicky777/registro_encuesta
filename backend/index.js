const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const { initDatabase, getDB } = require('./db/connection')
const authRoutes = require('./routes/auth')
const boletasRoutes = require('./routes/boletas')
const brigadasRoutes = require('./routes/brigadas')
const encuestadoresRoutes = require('./routes/encuestadores')
const asignacionesRoutes = require('./routes/asignaciones')
const asistenciaRoutes = require('./routes/asistencia')

const app = express()

// Validación de variables de entorno al inicio
if (!process.env.JWT_SECRET) {
  console.error('ERROR FATAL: JWT_SECRET no está definido en las variables de entorno.')
  console.error('Crea un archivo .env con JWT_SECRET=<tu-secreto-seguro>')
  process.exit(1)
}

// Seguridad
app.use(helmet())

// Cookie parser para tokens HttpOnly
app.use(cookieParser())

// Rate limiting para login (previene fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting para register (evita creación masiva de cuentas)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(generalLimiter)
app.use(express.json({ limit: '5mb' }))
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

// Rutas
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/boletas', boletasRoutes)
app.use('/api/brigadas', brigadasRoutes)
app.use('/api/encuestadores', encuestadoresRoutes)
app.use('/api/asignaciones', asignacionesRoutes)
app.use('/api/asistencia', asistenciaRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler centralizado
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 5000

if (!process.env.ADMIN_PASSWORD) {
  console.error('ERROR FATAL: ADMIN_PASSWORD no está definido en .env')
  console.error('Crea un archivo .env con ADMIN_PASSWORD=<contraseña-segura>')
  process.exit(1)
}
if (process.env.ADMIN_PASSWORD.length < 8) {
  console.error('ERROR FATAL: ADMIN_PASSWORD debe tener al menos 8 caracteres.')
  console.error('Usa una combinación de mayúsculas, minúsculas, números y símbolos.')
  process.exit(1)
}

function crearBackup() {
  try {
    const db = getDB()
    db.pragma('wal_checkpoint(TRUNCATE)')
    const backupDir = path.join(__dirname, 'backups')
    fs.mkdirSync(backupDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `boletas-${timestamp}.db`)
    fs.copyFileSync(path.join(__dirname, 'boletas.db'), backupPath)
    console.log(`Backup creado: ${backupPath}`)
    return true
  } catch (e) {
    console.error('Error durante el backup:', e.message)
    return false
  }
}

function startServer() {
  initDatabase()
  crearBackup()

  const server = app.listen(PORT, () =>
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`),
  )

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`)
    crearBackup()
    try { getDB().close() } catch {}
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGBREAK', () => shutdown('SIGBREAK'))
}

startServer()

module.exports = app
