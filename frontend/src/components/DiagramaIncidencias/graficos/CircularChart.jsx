import { Pie, Doughnut } from 'react-chartjs-2'
import { useMemo } from 'react'

const CHART_TYPE = {
  circular: Pie,
  anillo: Doughnut,
}

function buildTotalPorSerie(series, semanas, totales) {
  return series.map((s) => {
    let total = 0
    for (const week of semanas) total += totales[s.key]?.[week] || 0
    return { ...s, total }
  })
}

export default function GraficoCircular({ semanas, series, totales, ocultos, onSelect, tipo = 'anillo' }) {
  const Comp = CHART_TYPE[tipo] || Doughnut

  const data = useMemo(() => {
    const slices = buildTotalPorSerie(series, semanas, totales).filter((s) => !ocultos.has(s.key))
    return {
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.total),
          backgroundColor: slices.map((s) => s.color),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    }
  }, [series, semanas, totales, ocultos])

  const options = useMemo(() => {
    const totalSerie = buildTotalPorSerie(series, semanas, totales)
      .filter((s) => !ocultos.has(s.key))
      .reduce((acc, s) => acc + s.total, 0)

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      cutout: tipo === 'anillo' ? '62%' : '0%',
      onClick: (evt, elements) => {
        if (!onSelect || !elements.length) return
        const idx = elements[0].index
        const slices = buildTotalPorSerie(series, semanas, totales).filter((s) => !ocultos.has(s.key))
        onSelect(slices[idx]?.key)
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 12, boxHeight: 12, color: '#334155', font: { size: 11 }, padding: 12 },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 11, weight: '600' },
          bodyFont: { size: 11 },
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed || 0
              const pct = totalSerie > 0 ? Math.round((v / totalSerie) * 100) : 0
              return ` ${ctx.label}: ${v} (${pct}%)`
            },
            footer: () => `Total del periodo: ${totalSerie}`,
          },
        },
      },
    }
  }, [series, semanas, totales, ocultos, tipo, onSelect])

  return <Comp data={data} options={options} />
}
