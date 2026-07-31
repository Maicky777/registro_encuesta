const express = require('express')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { getDB } = require('../db/connection')

const router = express.Router()

const INCIDENCIAS = [
  '1: ENTREVISTA COMPLETA',
  '2: ENTREVISTA INCOMPLETA',
  '3: TEMPORALMENTE AUSENTE',
  '4: INFORMANTE NO CALIFICADO',
  '5: FALTA DE CONTACTO',
  '6: RECHAZO',
  '7: VIVIENDA DESOCUPADA',
  '8: ENTREVISTA FUERA DE PERIODO',
  '9: TRASLADO',
]

const SEMANA_MIN = 1
const SEMANA_MAX = 13

router.get('/comportamiento', authMiddleware, requireRole('administrador'), (req, res) => {
  try {
    const db = getDB()
    const { departamento, brigada } = req.query

    let where = 'WHERE CAST(b.semana AS INTEGER) BETWEEN ? AND ?'
    const params = [SEMANA_MIN, SEMANA_MAX]

    if (departamento) {
      where += ' AND b.departamento = ?'
      params.push(departamento)
    }
    if (brigada) {
      where += ' AND b.brigada = ?'
      params.push(brigada)
    }

    const rows = db.prepare(`
      SELECT
        b.usuarioEncuestador AS usuario,
        b.nombreEncuestador AS nombre,
        b.departamento,
        b.brigada,
        CAST(b.semana AS INTEGER) AS semana,
        b.incidencia,
        COUNT(*) AS total
      FROM boletas b
      ${where}
      GROUP BY b.usuarioEncuestador, b.departamento, b.brigada, CAST(b.semana AS INTEGER), b.incidencia
      ORDER BY b.usuarioEncuestador, CAST(b.semana AS INTEGER)
    `).all(...params)

    const folioRows = db.prepare(`
      SELECT
        b.usuarioEncuestador AS usuario,
        b.incidencia,
        CAST(b.semana AS INTEGER) AS semana,
        b.folio
      FROM boletas b
      ${where}
      ORDER BY b.incidencia, CAST(b.semana AS INTEGER), b.folio
    `).all(...params)

    const usuariosMap = new Map()
    const data = {}
    const foliosByIncidencia = {}
    const foliosPorUsuario = {}

    for (const r of rows) {
      const usuario = r.usuario || '(SIN USUARIO)'
      if (!usuariosMap.has(usuario)) {
        usuariosMap.set(usuario, {
          usuario,
          nombre: r.nombre || '',
          departamento: r.departamento || '',
          brigada: r.brigada || '',
        })
        data[usuario] = {}
      }
      if (!data[usuario][r.incidencia]) {
        data[usuario][r.incidencia] = {}
      }
      data[usuario][r.incidencia][r.semana] = (data[usuario][r.incidencia][r.semana] || 0) + r.total
    }

    for (const r of folioRows) {
      if (!r.folio) continue
      if (!foliosByIncidencia[r.incidencia]) foliosByIncidencia[r.incidencia] = {}
      if (!foliosByIncidencia[r.incidencia][r.semana]) foliosByIncidencia[r.incidencia][r.semana] = []
      if (!foliosByIncidencia[r.incidencia][r.semana].includes(r.folio)) {
        foliosByIncidencia[r.incidencia][r.semana].push(r.folio)
      }
      if (!foliosPorUsuario[r.usuario || '(SIN USUARIO)']) foliosPorUsuario[r.usuario || '(SIN USUARIO)'] = {}
      if (!foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia]) foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia] = {}
      if (!foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia][r.semana]) {
        foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia][r.semana] = []
      }
      if (!foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia][r.semana].includes(r.folio)) {
        foliosPorUsuario[r.usuario || '(SIN USUARIO)'][r.incidencia][r.semana].push(r.folio)
      }
    }

    res.json({
      semanas: Array.from({ length: SEMANA_MAX - SEMANA_MIN + 1 }, (_, i) => SEMANA_MIN + i),
      incidencias: INCIDENCIAS,
      usuarios: Array.from(usuariosMap.values()),
      data,
      foliosByIncidencia,
      foliosPorUsuario,
    })
  } catch (err) {
    console.error('Error al obtener comportamiento de incidencias:', err.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
