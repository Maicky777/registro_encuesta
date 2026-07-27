const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, requireRole, JWT_SECRET } = require('../middleware/auth')
const { getDB } = require('../db/connection')

const router = express.Router()

function parseBrigadas(brigadasStr) {
  try {
    return JSON.parse(brigadasStr)
  } catch {
    return []
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
  }

  try {
    const db = getDB()
    const user = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username)
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const brigadas = parseBrigadas(user.brigadas)
    const token = jwt.sign(
      { id: user.id, username: user.username, departamento: user.departamento, brigadas, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        departamento: user.departamento,
        brigadas,
        rol: user.rol,
      },
    })
  } catch (err) {
    console.error('Error en login:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/register', authMiddleware, requireRole('administrador'), (req, res) => {
  const { username, password, departamento, brigadas, rol } = req.body

  if (!username || !password || !departamento || !brigadas) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' })
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  if (!Array.isArray(brigadas) || brigadas.length === 0) {
    return res.status(400).json({ error: 'Las brigadas deben ser un array con al menos un elemento' })
  }

  const brigadasPermitidas = ['Brigada 1', 'Brigada 2', 'Brigada 3', 'Brigada 4', 'Brigada 5', 'Brigada 6', 'Brigada 7', 'Brigada 8', 'Brigada 9']
  const brigadasInvalidas = brigadas.filter(b => !brigadasPermitidas.includes(b))
  if (brigadasInvalidas.length > 0) {
    return res.status(400).json({ error: `Brigadas no válidas: ${brigadasInvalidas.join(', ')}. Permitidas: ${brigadasPermitidas.join(', ')}` })
  }

  const userRol = rol === 'administrador' ? 'administrador' : 'usuarios'

  try {
    const db = getDB()
    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const brigadasJson = Array.isArray(brigadas) ? JSON.stringify(brigadas) : brigadas

    const result = db.prepare(
      'INSERT INTO usuarios (username, password_hash, departamento, brigadas, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, departamento, brigadasJson, userRol)

    res.json({ id: result.lastInsertRowid, username, departamento, brigadas: JSON.parse(brigadasJson), rol: userRol })
  } catch (err) {
    console.error('Error en register:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/users', authMiddleware, requireRole('administrador'), (req, res) => {
  try {
    const db = getDB()
    const users = db.prepare('SELECT id, username, departamento, brigadas, rol FROM usuarios ORDER BY id').all()
    const parsed = users.map((u) => ({
      ...u,
      brigadas: parseBrigadas(u.brigadas),
    }))
    res.json(parsed)
  } catch (err) {
    console.error('Error al listar usuarios:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/users/:id', authMiddleware, requireRole('administrador'), (req, res) => {
  const { id } = req.params

  if (parseInt(id, 10) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
  }

  try {
    const db = getDB()
    const user = db.prepare('SELECT id, username FROM usuarios WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id)
    res.json({ message: `Usuario "${user.username}" eliminado correctamente` })
  } catch (err) {
    console.error('Error al eliminar usuario:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDB()
    const user = db.prepare('SELECT id, username, departamento, brigadas, rol FROM usuarios WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({
      id: user.id,
      username: user.username,
      departamento: user.departamento,
      brigadas: parseBrigadas(user.brigadas),
      rol: user.rol,
    })
  } catch (err) {
    console.error('Error en /me:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
