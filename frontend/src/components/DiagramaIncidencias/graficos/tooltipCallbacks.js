export function buildTooltipCallbacks(series, folios) {
  const sumaIndice = (chart, idx) => {
    let total = 0
    chart.data.datasets.forEach((ds) => {
      if (ds.hidden) return
      const v = ds.data[idx]
      if (typeof v === 'number') total += v
    })
    return total
  }

  return {
    title: (items) => items[0]?.label || '',
    label: (ctx) => {
      const value = ctx.parsed.y ?? ctx.parsed.r ?? 0
      const total = sumaIndice(ctx.chart, ctx.dataIndex)
      const pct = total > 0 ? Math.round((value / total) * 100) : 0
      return ` ${ctx.dataset.label}: ${value}${pct ? ` (${pct}% de la semana)` : ''}`
    },
    afterLabel: (ctx) => {
      const serie = series[ctx.datasetIndex]
      return serie?.sub ? `  ${serie.sub}` : ''
    },
    footer: (items) => {
      const chart = items[0]?.chart
      if (!chart) return []
      const serie = series[items[0].datasetIndex]
      const lines = []
      const total = sumaIndice(chart, items[0].dataIndex)
      if (total > 0) lines.push(`Total semana: ${total}`)
      const semana = (items[0]?.label || '').replace(/\D/g, '')
      const foliosList = folios?.[serie?.key]?.[semana]
      if (foliosList?.length) {
        const visibles = foliosList.slice(0, 5).join(', ')
        const restantes = foliosList.length - 5
        lines.push(`Folios: ${visibles}${restantes > 0 ? ` +${restantes} más` : ''}`)
      }
      return lines
    },
  }
}
