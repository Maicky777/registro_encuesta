const { parseBrigadas, parseBrigadasArray, getBrigadasForDepartamento, parseDepartamentos } = require('./parseBrigadas')

function userCanAccessBoleta(user, departamento, brigada) {
  if (!user || !user.rol) return false
  if (user.rol === 'administrador') return true
  const userDepartamentos = Array.isArray(user.departamento) ? user.departamento : parseDepartamentos(user.departamento)
  if (typeof departamento !== 'string' || !userDepartamentos.includes(departamento)) return false
  if (!brigada) return true
  const deptBrigadas = getBrigadasForDepartamento(user.brigadas, departamento)
  return deptBrigadas.includes(brigada)
}

function boletaScopeConditions(user, params = []) {
  const conditions = []
  if (!user || user.rol === 'administrador') return { conditions, params }
  const userDepartamentos = Array.isArray(user.departamento) ? user.departamento : parseDepartamentos(user.departamento)
  if (userDepartamentos.length > 0) {
    const placeholders = userDepartamentos.map(() => '?').join(',')
    conditions.push(`departamento IN (${placeholders})`)
    params.push(...userDepartamentos)
  }
  const allBrigadas = parseBrigadasArray(user.brigadas)
  if (allBrigadas.length > 0) {
    const placeholders = allBrigadas.map(() => '?').join(',')
    conditions.push(`brigada IN (${placeholders})`)
    params.push(...allBrigadas)
  }
  return { conditions, params }
}

module.exports = { userCanAccessBoleta, boletaScopeConditions }
