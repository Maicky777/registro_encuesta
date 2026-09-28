const ANCLA_FECHA = new Date(2026, 7, 3)
const SEMANA_ANCLA = 5
const SEMANA_MAX = 13
const TRIMESTRES = [3, 4, 1, 2]

function mod(n, m) {
  return ((n % m) + m) % m
}

function globalWeekDesde(fecha) {
  const hoy = new Date(fecha)
  hoy.setHours(0, 0, 0, 0)
  const ancla = new Date(ANCLA_FECHA)
  ancla.setHours(0, 0, 0, 0)
  const diffDias = Math.round((hoy - ancla) / 86400000)
  return SEMANA_ANCLA + Math.floor(diffDias / 7)
}

// El ciclo de 13 semanas cierra en la semana 13, por lo que el trimestre
// cambia al pasar de globalWeek 13 -> 14 (y no en 13 -> 14 por division entera).
function trimestreDesdeGlobalWeek(globalWeek) {
  return TRIMESTRES[mod(Math.floor((globalWeek - 1) / SEMANA_MAX), TRIMESTRES.length)]
}

function computeTrimestreYSemana(fecha = new Date()) {
  const globalWeek = globalWeekDesde(fecha)
  return {
    trimestre: trimestreDesdeGlobalWeek(globalWeek),
    semana: mod(globalWeek - 1, SEMANA_MAX) + 1,
  }
}

function getTrimestreActual(fecha = new Date()) {
  return computeTrimestreYSemana(fecha).trimestre
}

function getTrimestreDesdeSemana(semana, fecha = new Date()) {
  const semanaNum = parseInt(semana, 10)
  if (!Number.isInteger(semanaNum) || semanaNum < 1 || semanaNum > SEMANA_MAX) return null

  const currentGlobalWeek = globalWeekDesde(fecha)
  const currentSemanaLocal = mod(currentGlobalWeek - 1, SEMANA_MAX) + 1

  // Las semanas 1..13 pertenecen al ciclo en curso. Solo se retrocede un ciclo
  // cuando se captura una semana "futura" lejana (p.ej. en la semana 1 se
  // captura la 13, que fue la ultima del trimestre anterior).
  let targetGlobalWeek = currentGlobalWeek
  if (semanaNum - currentSemanaLocal > SEMANA_MAX / 2) {
    targetGlobalWeek = currentGlobalWeek - SEMANA_MAX
  }

  return trimestreDesdeGlobalWeek(targetGlobalWeek)
}

module.exports = { computeTrimestreYSemana, getTrimestreActual, getTrimestreDesdeSemana, ANCLA_FECHA, SEMANA_ANCLA, SEMANA_MAX, TRIMESTRES }
