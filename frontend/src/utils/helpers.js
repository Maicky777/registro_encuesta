export const getEstadoClass = (estado) => {
  switch (estado) {
    case 'SIN OBSERVACION':
      return 'estado-sin-observacion'
    case 'OBSERVADO':
      return 'estado-observado'
    case 'CORREGIDO':
      return 'estado-corregido'
    default:
      return ''
  }
}

export const calcularPanel = (visita) => {
  const numVisita = parseInt(visita, 10)
  if (numVisita === 4) return 'PANEL 43'
  if (numVisita === 3) return 'PANEL 44'
  if (numVisita === 2) return 'PANEL 45'
  if (numVisita === 1) return 'PANEL 46 / PANEL 0'
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
