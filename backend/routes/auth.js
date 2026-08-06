const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, requireRole, getJwtSecret } = require('../middleware/auth')
const { getDB } = require('../db/connection')
const { parseBrigadas } = require('../utils/parseBrigadas')

const router = express.Router()

router.post('/login', async (req, res) => {
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

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const brigadas = parseBrigadas(user.brigadas)
    const token = jwt.sign(
      { id: user.id, username: user.username, departamento: user.departamento, brigadas, rol: user.rol },
      getJwtSecret(),
      { expiresIn: '8h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
    })

    res.json({
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

router.post('/register', authMiddleware, requireRole('administrador'), async (req, res) => {
  const { username, password, departamento, brigadas, rol } = req.body

  const userRol = rol === 'administrador' ? 'administrador' : 'usuarios'

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' })
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  if (userRol !== 'administrador') {
    if (!departamento || !brigadas) {
      return res.status(400).json({ error: 'Departamento y brigadas son requeridos para usuarios' })
    }
    if (!Array.isArray(brigadas) || brigadas.length === 0) {
      return res.status(400).json({ error: 'Las brigadas deben ser un array con al menos un elemento' })
    }
  }

  try {
    const db = getDB()

    if (userRol !== 'administrador') {
      const brigadasPermitidas = db.prepare('SELECT nombre FROM brigadas WHERE departamento = ?').all(departamento).map((r) => r.nombre)
      const brigadasInvalidas = brigadas.filter(b => !brigadasPermitidas.includes(b))
      if (brigadasInvalidas.length > 0) {
        return res.status(400).json({ error: `Brigadas no válidas para ${departamento}: ${brigadasInvalidas.join(', ')}. Disponibles: ${brigadasPermitidas.join(', ')}` })
      }
    }

    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const brigadasJson = Array.isArray(brigadas) ? JSON.stringify(brigadas) : brigadas || '[]'

    const result = db.prepare(
      'INSERT INTO usuarios (username, password_hash, departamento, brigadas, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, departamento || '', brigadasJson, userRol)

    res.json({ id: result.lastInsertRowid, username, departamento: departamento || '', brigadas: JSON.parse(brigadasJson), rol: userRol })
  } catch (err) {
    console.error('Error en register:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' })
  res.json({ message: 'Sesión cerrada correctamente' })
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

router.put('/users/:id', authMiddleware, requireRole('administrador'), async (req, res) => {
  const { id } = req.params
  const { username, password, departamento, brigadas, rol } = req.body

  if (!username) {
    return res.status(400).json({ error: 'El nombre de usuario es requerido' })
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' })
  }

  if (password && (typeof password !== 'string' || password.length < 6)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const userRol = rol === 'administrador' ? 'administrador' : 'usuarios'

  if (userRol !== 'administrador') {
    if (!departamento) {
      return res.status(400).json({ error: 'El departamento es requerido para usuarios' })
    }
    if (!brigadas || !Array.isArray(brigadas) || brigadas.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos una brigada' })
    }
  }

  try {
    const db = getDB()
    const existing = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const duplicate = db.prepare('SELECT id FROM usuarios WHERE username = ? AND id != ?').get(username, id)
    if (duplicate) {
      return res.status(409).json({ error: 'Ya existe otro usuario con ese nombre' })
    }

    if (userRol !== 'administrador') {
      const brigadasPermitidas = db.prepare('SELECT nombre FROM brigadas WHERE departamento = ?').all(departamento).map((r) => r.nombre)
      const brigadasInvalidas = brigadas.filter(b => !brigadasPermitidas.includes(b))
      if (brigadasInvalidas.length > 0) {
        return res.status(400).json({ error: `Brigadas no válidas para ${departamento}: ${brigadasInvalidas.join(', ')}. Disponibles: ${brigadasPermitidas.join(', ')}` })
      }
    }

    const brigadasJson = Array.isArray(brigadas) ? JSON.stringify(brigadas) : brigadas || '[]'

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      db.prepare('UPDATE usuarios SET username = ?, password_hash = ?, departamento = ?, brigadas = ?, rol = ? WHERE id = ?')
        .run(username, hashedPassword, departamento || '', brigadasJson, userRol, id)
    } else {
      db.prepare('UPDATE usuarios SET username = ?, departamento = ?, brigadas = ?, rol = ? WHERE id = ?')
        .run(username, departamento || '', brigadasJson, userRol, id)
    }

    res.json({ id: Number(id), username, departamento: departamento || '', brigadas: JSON.parse(brigadasJson), rol: userRol })
  } catch (err) {
    console.error('Error al actualizar usuario:', err.message)
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
