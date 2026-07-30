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
