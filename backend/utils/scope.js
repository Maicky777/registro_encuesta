const { parseBrigadas } = require('./parseBrigadas')

function userCanAccessBoleta(user, departamento, brigada) {
  if (!user || !user.rol) return false
  if (user.rol === 'administrador') return true
  if (typeof departamento !== 'string' || departamento !== user.departamento) return false
  if (!brigada) return true
  return parseBrigadas(user.brigadas).includes(brigada)
}

function boletaScopeConditions(user, params = []) {
  const conditions = []
  if (!user || user.rol === 'administrador') return { conditions, params }
  if (typeof user.departamento === 'string' && user.departamento) {
    conditions.push('departamento = ?')
    params.push(user.departamento)
  }
  const userBrigadas = parseBrigadas(user.brigadas)
  if (userBrigadas.length > 0) {
    const placeholders = userBrigadas.map(() => '?').join(',')
    conditions.push(`brigada IN (${placeholders})`)
    params.push(...userBrigadas)
  }
  return { conditions, params }
}

module.exports = { userCanAccessBoleta, boletaScopeConditions }
