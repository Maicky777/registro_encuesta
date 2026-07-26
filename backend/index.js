const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const { connectDB, createTables } = require('./db/connection')
const authRoutes = require('./routes/auth')
const boletasRoutes = require('./routes/boletas')

const app = express()

// Seguridad
app.use(helmet())

// Rate limiting para login (previene fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
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
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))

// Inicializar base de datos
const db = connectDB()
createTables(db)

// Rutas
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/boletas', boletasRoutes)

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
app.listen(PORT, () =>
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`),
)
