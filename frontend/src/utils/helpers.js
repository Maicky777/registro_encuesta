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

export const calcularPanel = (visita, upm = '') => {
  const numVisita = parseInt(visita, 10)
  if (numVisita === 4) return 'PANEL 43'
  if (numVisita === 3) return 'PANEL 44'
  if (numVisita === 2) return 'PANEL 45'
  if (numVisita === 1) {
    if (upm && upm.length >= 3) {
      const primeros3 = parseInt(upm.substring(0, 3), 10)
      return primeros3 < 730 ? 'PANEL 46' : 'PANEL 0'
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

export const getFechaActual = () => {
  return new Date().toISOString().split('T')[0]
}

export const normalizarCargo = (list) =>
  (list || []).map((p) => ({
    ...p,
    cargo:
      p.cargo === 'SUPERVISOR / ENCUESTADOR'
        ? 'SUPERVISOR'
        : p.cargo === 'BRIGADISTA'
          ? 'ENCUESTADOR'
          : p.cargo,
  }))

const SEMANA_REF = new Date(2026, 6, 6)
const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
const NOMBRES_LARGOS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']

export const getMonday = (date = new Date()) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

export const getSemanaInfo = (date = new Date()) => {
  const monday = getMonday(date)
  const diffMs = monday - SEMANA_REF
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const weeksSinceRef = Math.floor(diffDays / 7)
  const cycle = Math.floor(weeksSinceRef / 13)
  const weekInCycle = ((weeksSinceRef % 13) + 13) % 13 + 1
  return { week: weekInCycle, cycle, monday }
}

export const getMondayFromWeek = (week, cycle = 0) => {
  const monday = new Date(SEMANA_REF)
  monday.setDate(monday.getDate() + (cycle * 13 + (week - 1)) * 7)
  return monday
}

export const getDiasSemana = (desde) => {
  const monday = desde instanceof Date ? getMonday(desde) : getMonday()
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(monday)
    fecha.setDate(fecha.getDate() + i)
    const dd = String(fecha.getDate()).padStart(2, '0')
    const mm = String(fecha.getMonth() + 1).padStart(2, '0')
    const yyyy = fecha.getFullYear()
    return {
      id: DIAS_SEMANA[fecha.getDay()],
      nombre: NOMBRES_LARGOS[fecha.getDay()],
      fecha: `${dd}/${mm}/${yyyy}`,
    }
  })
}

export const formatDateRange = (monday) => {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' }
  const lunes = monday.toLocaleDateString('es-ES', opts)
  const domingo = sunday.toLocaleDateString('es-ES', opts)
  return `Lun ${lunes} - Dom ${domingo}`
}

export const DEP_ID_MAP = {
  'CHUQUISACA': 1,
  'LA PAZ': 2,
  'COCHABAMBA': 3,
  'ORURO': 4,
  'POTOSI': 5,
  'TARIJA': 6,
  'SANTA CRUZ': 7,
  'BENI': 8,
  'PANDO': 9,
}

export const getDepId = (departamento) => DEP_ID_MAP[departamento] || ''

export const computeObservacionFields = (detalleObservaciones) => {
  const frases = (detalleObservaciones || '').split(';').filter((f) => f.trim().length > 0)
  const total = frases.length
  return {
    totalObservaciones: total,
    estadoBoleta: total > 0 ? 'OBSERVADO' : 'SIN OBSERVACION',
    boletaObservada: total > 0 ? 'SI' : 'NO',
    observacionBoleta: total > 0 ? 'NO ENVIADO' : '',
  }
}
