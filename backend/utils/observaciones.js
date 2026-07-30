function computeObservacionFields(detalleObservaciones) {
  const frases = (detalleObservaciones || '').split(';').filter((f) => f.trim().length > 0)
  const total = frases.length
  return {
    totalObservaciones: total,
    estadoBoleta: total > 0 ? 'OBSERVADO' : 'SIN OBSERVACION',
    boletaObservada: total > 0 ? 'SI' : 'NO',
    observacionBoleta: total > 0 ? 'NO ENVIADO' : '',
  }
}

module.exports = { computeObservacionFields }
