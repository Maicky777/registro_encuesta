const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, requireRole, getJwtSecret } = require('../middleware/auth')
const { getDB } = require('../db/connection')
const { parseBrigadas, parseBrigadasArray, getBrigadasForDepartamento, parseDepartamentos } = require('../utils/parseBrigadas')

const router = express.Router()

function generarPasswordAleatoria(longitud = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const bytes = crypto.randomBytes(longitud)
  let password = ''
  for (let i = 0; i < longitud; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}

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
    const departamentos = parseDepartamentos(user.departamento)
    const token = jwt.sign(
      { id: user.id, username: user.username, departamento: departamentos, brigadas, rol: user.rol },
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
        departamento: departamentos,
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
    if (!departamento || !Array.isArray(departamento) || departamento.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un departamento para usuarios' })
    }
    if (!brigadas) {
      return res.status(400).json({ error: 'Las brigadas son requeridas para usuarios' })
    }
    const brigadasObj = typeof brigadas === 'object' && !Array.isArray(brigadas) ? brigadas : null
    if (!brigadasObj || Object.keys(brigadasObj).length === 0) {
      return res.status(400).json({ error: 'Las brigadas deben ser un objeto por departamento' })
    }
  }

  try {
    const db = getDB()

    if (userRol !== 'administrador') {
      const brigadasObj = typeof brigadas === 'object' && !Array.isArray(brigadas) ? brigadas : {}
      for (const [dept, deptBrigadas] of Object.entries(brigadasObj)) {
        if (!departamento.includes(dept)) continue
        const rows = db.prepare('SELECT nombre FROM brigadas WHERE departamento = ?').all(dept)
        const validNames = rows.map((r) => r.nombre)
        const invalid = (Array.isArray(deptBrigadas) ? deptBrigadas : []).filter(b => !validNames.includes(b))
        if (invalid.length > 0) {
          return res.status(400).json({ error: `Brigadas no válidas para ${dept}: ${invalid.join(', ')}. Disponibles: ${validNames.join(', ')}` })
        }
      }
    }

    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const brigadasJson = (typeof brigadas === 'object' && !Array.isArray(brigadas))
      ? JSON.stringify(brigadas)
      : Array.isArray(brigadas) ? JSON.stringify(brigadas) : brigadas || '{}'
    const departamentosJson = Array.isArray(departamento) ? JSON.stringify(departamento) : departamento || '[]'

    const result = db.prepare(
      'INSERT INTO usuarios (username, password_hash, departamento, brigadas, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, departamentosJson, brigadasJson, userRol)

    res.json({ id: result.lastInsertRowid, username, departamento: Array.isArray(departamento) ? departamento : [], brigadas: JSON.parse(brigadasJson), rol: userRol })
  } catch (err) {
    console.error('Error en register:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'La contraseña actual, la nueva y su confirmación son requeridas' })
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' })
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas nuevas no coinciden' })
  }

  try {
    const db = getDB()
    const user = db.prepare('SELECT id, username, password_hash FROM usuarios WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, user.id)
    res.json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('Error en change-password:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.post('/users/:id/reset-password', authMiddleware, requireRole('administrador'), async (req, res) => {
  const { id } = req.params
  const { password } = req.body

  try {
    const db = getDB()
    const user = db.prepare('SELECT id, username FROM usuarios WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    let nuevaPassword = password
    let generada = false

    if (nuevaPassword === undefined || nuevaPassword === null || nuevaPassword === '') {
      nuevaPassword = generarPasswordAleatoria()
      generada = true
    }

    if (typeof nuevaPassword !== 'string' || nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10)
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashedPassword, user.id)

    res.json({
      message: `Contraseña de "${user.username}" restablecida correctamente`,
      username: user.username,
      password: generada ? nuevaPassword : undefined,
      generada,
    })
  } catch (err) {
    console.error('Error en reset-password:', err.message)
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
      departamento: parseDepartamentos(u.departamento),
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
    if (!departamento || !Array.isArray(departamento) || departamento.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un departamento para usuarios' })
    }
    if (!brigadas) {
      return res.status(400).json({ error: 'Las brigadas son requeridas para usuarios' })
    }
    const brigadasObjVal = typeof brigadas === 'object' && !Array.isArray(brigadas) ? brigadas : null
    if (!brigadasObjVal || Object.keys(brigadasObjVal).length === 0) {
      return res.status(400).json({ error: 'Las brigadas deben ser un objeto por departamento' })
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
      const brigadasObj = typeof brigadas === 'object' && !Array.isArray(brigadas) ? brigadas : {}
      for (const [dept, deptBrigadas] of Object.entries(brigadasObj)) {
        if (!departamento.includes(dept)) continue
        const rows = db.prepare('SELECT nombre FROM brigadas WHERE departamento = ?').all(dept)
        const validNames = rows.map((r) => r.nombre)
        const invalid = (Array.isArray(deptBrigadas) ? deptBrigadas : []).filter(b => !validNames.includes(b))
        if (invalid.length > 0) {
          return res.status(400).json({ error: `Brigadas no válidas para ${dept}: ${invalid.join(', ')}. Disponibles: ${validNames.join(', ')}` })
        }
      }
    }

    const brigadasJson = (typeof brigadas === 'object' && !Array.isArray(brigadas))
      ? JSON.stringify(brigadas)
      : Array.isArray(brigadas) ? JSON.stringify(brigadas) : brigadas || '{}'
    const departamentosJson = Array.isArray(departamento) ? JSON.stringify(departamento) : departamento || '[]'

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      db.prepare('UPDATE usuarios SET username = ?, password_hash = ?, departamento = ?, brigadas = ?, rol = ? WHERE id = ?')
        .run(username, hashedPassword, departamentosJson, brigadasJson, userRol, id)
    } else {
      db.prepare('UPDATE usuarios SET username = ?, departamento = ?, brigadas = ?, rol = ? WHERE id = ?')
        .run(username, departamentosJson, brigadasJson, userRol, id)
    }

    res.json({ id: Number(id), username, departamento: Array.isArray(departamento) ? departamento : [], brigadas: JSON.parse(brigadasJson), rol: userRol })
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
      departamento: parseDepartamentos(user.departamento),
      brigadas: parseBrigadas(user.brigadas),
      rol: user.rol,
    })
  } catch (err) {
    console.error('Error en /me:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
