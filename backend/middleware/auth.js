const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('ERROR FATAL: JWT_SECRET no está definido en las variables de entorno.')
  console.error('Crea un archivo .env con JWT_SECRET=<tu-secreto-seguro>')
  process.exit(1)
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' })
    }
    next()
  }
}

module.exports = { authMiddleware, requireRole, JWT_SECRET }
