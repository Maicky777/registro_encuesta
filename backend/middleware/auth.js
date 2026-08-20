const jwt = require('jsonwebtoken')
const { parseDepartamentos, parseBrigadas } = require('../utils/parseBrigadas')

function getJwtSecret() {
  return process.env.JWT_SECRET
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  const cookieToken = req.cookies?.token

  let token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (cookieToken) {
    token = cookieToken
  }

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret())
    decoded.departamento = parseDepartamentos(decoded.departamento)
    decoded.brigadas = parseBrigadas(decoded.brigadas)
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

module.exports = { authMiddleware, requireRole, getJwtSecret }
