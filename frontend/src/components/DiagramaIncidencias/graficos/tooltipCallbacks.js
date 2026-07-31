export function buildTooltipCallbacks(series) {
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
    title: (items) => {
      const week = items[0]?.label || ''
      return `Semana ${week.replace('S', '')}`
    },
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
      if (!chart) return ''
      const total = sumaIndice(chart, items[0].dataIndex)
      return total > 0 ? `Total semana: ${total}` : ''
    },
  }
}
