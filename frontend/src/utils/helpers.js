import {
  SEMANA_MIN,
  SEMANA_MAX,
  SEMANA_ANCLA,
  ANCLA_FECHA,
  MAX_POR_UPM,
  INCIDENCIA_TRASLADO,
  TRIMESTRES,
} from './constants'

export const getEstadoClass = (estado) => {
  switch (estado) {
    case 'SIN OBSERVACION':
      return 'text-green-700 bg-green-50 border border-green-200 font-semibold'
    case 'OBSERVADO':
      return 'text-red-700 bg-red-50 border border-red-200 font-semibold'
    case 'CORREGIDO':
      return 'text-blue-700 bg-blue-50 border border-blue-200 font-semibold'
    default:
      return ''
  }
}

export const calcularPanel = (visita, upm = '', trimestre = null) => {
  const numVisita = parseInt(visita, 10)
  if (numVisita === 4) return 'PANEL 44'
  if (numVisita === 3) return 'PANEL 45'
  if (numVisita === 2) return 'PANEL 46'
  if (numVisita === 1) {
    if (Number(trimestre) === 4) {
      if (upm && upm.length >= 3) {
        const segundoDigito = upm.charAt(1)
        if (/^\d$/.test(segundoDigito)) {
          return parseInt(segundoDigito, 10) > 2 ? 'PANEL 0' : 'PANEL 47'
        }
      }
      return 'PANEL 46 / PANEL 0'
    }
    if (upm && upm.length >= 3) {
      const primeros3 = parseInt(upm.substring(0, 3), 10)
      return primeros3 < 730 ? 'PANEL 47' : 'PANEL 0'
    }
    return 'PANEL 46 / PANEL 0'
  }
  return ''
}

export const calcularUPM = (folio) => {
  return folio.length >= 17 ? folio.substring(0, 17) : folio
}

export const calcularVOE = (folio) => {
  return folio.length >= 4 ? folio.slice(-4) : ''
}

export const validarFolio = (folio) => {
  return /^\d{3}-\d{11}-[AD]-\d{4}$/.test(folio || '')
}

export const calcularUPMEfectivo = (
  folio,
  upmAdicional = '',
  upmManual = '',
) => {
  const upmDesdeFolio = calcularUPM(folio)
  const adicional = (upmAdicional || '').trim()
  if (adicional !== '' && upmDesdeFolio === adicional && upmManual) {
    return upmManual
  }
  return upmDesdeFolio
}

export const formatearFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const mod = (n, m) => ((n % m) + m) % m

export const getGlobalWeekActual = (fecha = new Date()) => {
  const hoy = new Date(fecha)
  hoy.setHours(0, 0, 0, 0)
  const ancla = new Date(ANCLA_FECHA)
  ancla.setHours(0, 0, 0, 0)
  const diffDias = Math.round((hoy - ancla) / 86400000)
  return SEMANA_ANCLA + Math.floor(diffDias / 7)
}

export const getTrimestreDesdeGlobalWeek = (globalWeek) =>
  TRIMESTRES[mod(Math.floor((globalWeek - 1) / SEMANA_MAX), TRIMESTRES.length)]

export const getTrimestreYSemanaActual = (fecha = new Date()) => {
  const globalWeek = getGlobalWeekActual(fecha)
  return {
    trimestre: getTrimestreDesdeGlobalWeek(globalWeek),
    semana: mod(globalWeek - 1, SEMANA_MAX) + SEMANA_MIN,
  }
}

export const getSemanaActual = (fecha = new Date()) =>
  getTrimestreYSemanaActual(fecha).semana

export const getTrimestreActual = (fecha = new Date()) =>
  getTrimestreYSemanaActual(fecha).trimestre

// Resuelve el numero de semana global (no ciclico) que corresponde al par
// trimestre + semana, eligiendo la ocurrencia mas cercana a la fecha actual.
export const getGlobalWeekDesdeTrimestreSemana = (
  trimestre,
  semana,
  fecha = new Date(),
) => {
  const trimestreNum = parseInt(trimestre, 10)
  const semanaNum = parseInt(semana, 10)
  if (
    !TRIMESTRES.includes(trimestreNum) ||
    !Number.isInteger(semanaNum) ||
    semanaNum < SEMANA_MIN ||
    semanaNum > SEMANA_MAX
  ) {
    return null
  }

  const actual = getGlobalWeekActual(fecha)
  let mejor = null
  let mejorDif = Infinity
  for (let ciclo = -TRIMESTRES.length; ciclo <= TRIMESTRES.length; ciclo++) {
    if (
      getTrimestreDesdeGlobalWeek(ciclo * SEMANA_MAX + semanaNum) !==
      trimestreNum
    )
      continue
    const diff = Math.abs(ciclo * SEMANA_MAX + semanaNum - actual)
    if (diff < mejorDif) {
      mejorDif = diff
      mejor = ciclo * SEMANA_MAX + semanaNum
    }
  }
  return mejor
}

export const computeObservacionFields = (detalleObservaciones) => {
  const frases = (detalleObservaciones || '')
    .split(';')
    .filter((f) => f.trim().length > 0)
  const total = frases.length
  return {
    totalObservaciones: total,
    estadoBoleta: total > 0 ? 'OBSERVADO' : 'SIN OBSERVACION',
    boletaObservada: total > 0 ? 'SI' : 'NO',
    observacionBoleta: total > 0 ? 'NO ENVIADO' : '',
  }
}

export const calcularAvanceBrigadas = (registros, semana, opciones = {}) => {
  const contarSoloEstado = opciones.contarSoloEstado === true
  const trimestre = opciones.trimestre
  const vacio = {
    semana: 0,
    agrupado: {},
    brigadas: [],
    maxPorUpm: MAX_POR_UPM,
    totales: { validas: 0, max: 0, observadas: 0, traslados: 0, upms: 0 },
    pctGeneral: 0,
  }
  if (!registros) return vacio

  const semanaNum = parseInt(semana, 10) || 0
  const registrosSemana = registros.filter((r) => {
    const matchSemana = parseInt(r.semana, 10) === semanaNum
    const matchTrimestre =
      trimestre === undefined || trimestre === null || trimestre === ''
        ? true
        : String(r.trimestre) === String(trimestre)
    return matchSemana && matchTrimestre
  })
  if (registrosSemana.length === 0) return vacio

  const agrupado = {}
  for (const r of registrosSemana) {
    const brigada = r.brigada
    if (!agrupado[brigada]) agrupado[brigada] = {}
    if (!agrupado[brigada][r.upm])
      agrupado[brigada][r.upm] = {
        total: 0,
        validas: 0,
        traslados: 0,
        observadas: 0,
        incidencias: {},
      }
    const info = agrupado[brigada][r.upm]
    info.total++
    info.incidencias[r.incidencia] = (info.incidencias[r.incidencia] || 0) + 1
    if (r.incidencia === INCIDENCIA_TRASLADO) {
      info.traslados++
    } else {
      info.validas++
    }
    if (
      contarSoloEstado
        ? r.estadoBoleta === 'OBSERVADO'
        : r.boletaObservada === 'SI' || r.estadoBoleta === 'OBSERVADO'
    ) {
      info.observadas++
    }
  }

  const brigadas = Object.entries(agrupado).map(([brigada, upms]) => {
    const upmDetalle = Object.entries(upms).map(([upm, det]) => ({
      upm,
      ...det,
    }))
    let validas = 0
    let traslados = 0
    let observadas = 0
    let max = 0
    for (const det of upmDetalle) {
      validas += det.validas
      traslados += det.traslados
      observadas += det.observadas
      max += det.validas > MAX_POR_UPM ? det.validas : MAX_POR_UPM
    }
    const pct = max > 0 ? Math.round((validas / max) * 100) : 0
    return {
      brigada,
      upms: upmDetalle.length,
      validas,
      traslados,
      observadas,
      max,
      pct,
      upmResumen: upmDetalle.map(({ upm, total, observadas }) => ({
        upm,
        total,
        observadas,
      })),
    }
  })

  const totales = brigadas.reduce(
    (acc, b) => ({
      validas: acc.validas + b.validas,
      max: acc.max + b.max,
      observadas: acc.observadas + b.observadas,
      traslados: acc.traslados + b.traslados,
      upms: acc.upms + b.upms,
    }),
    { validas: 0, max: 0, observadas: 0, traslados: 0, upms: 0 },
  )

  return {
    semana: semanaNum,
    agrupado,
    brigadas,
    maxPorUpm: MAX_POR_UPM,
    totales,
    pctGeneral:
      totales.max > 0 ? Math.round((totales.validas / totales.max) * 100) : 0,
  }
}
