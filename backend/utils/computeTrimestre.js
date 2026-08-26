const ANCLA_FECHA = new Date(2026, 7, 3)
const SEMANA_ANCLA = 5
const SEMANA_MAX = 13
const TRIMESTRES = [3, 4, 1, 2]

function computeTrimestreYSemana(fecha = new Date()) {
  const hoy = new Date(fecha)
  hoy.setHours(0, 0, 0, 0)
  const ancla = new Date(ANCLA_FECHA)
  ancla.setHours(0, 0, 0, 0)
  const diffDias = Math.round((hoy - ancla) / 86400000)
  const globalWeek = SEMANA_ANCLA + Math.floor(diffDias / 7)
  const trimestreIndex = Math.floor(globalWeek / SEMANA_MAX) % TRIMESTRES.length
  const semanaLocal = (globalWeek % SEMANA_MAX) + 1
  return {
    trimestre: TRIMESTRES[trimestreIndex],
    semana: semanaLocal,
  }
}

function getTrimestreActual(fecha = new Date()) {
  return computeTrimestreYSemana(fecha).trimestre
}

function getTrimestreDesdeSemana(semana) {
  const semanaNum = parseInt(semana, 10)
  if (!Number.isInteger(semanaNum) || semanaNum < 1 || semanaNum > SEMANA_MAX) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ancla = new Date(ANCLA_FECHA)
  ancla.setHours(0, 0, 0, 0)
  const diffDias = Math.round((hoy - ancla) / 86400000)
  const currentGlobalWeek = SEMANA_ANCLA + Math.floor(diffDias / 7)
  const currentTrimestreIndex = Math.floor(currentGlobalWeek / SEMANA_MAX) % TRIMESTRES.length
  const currentSemanaLocal = (currentGlobalWeek % SEMANA_MAX) + 1
  const offset = semanaNum - currentSemanaLocal
  const targetGlobalWeek = currentGlobalWeek + offset
  const trimestreIndex = Math.floor(targetGlobalWeek / SEMANA_MAX) % TRIMESTRES.length
  return TRIMESTRES[trimestreIndex]
}

module.exports = { computeTrimestreYSemana, getTrimestreActual, getTrimestreDesdeSemana, ANCLA_FECHA, SEMANA_ANCLA, SEMANA_MAX, TRIMESTRES }
