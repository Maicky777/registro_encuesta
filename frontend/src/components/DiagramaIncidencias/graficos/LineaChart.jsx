import { Line } from 'react-chartjs-2'
import { useMemo } from 'react'
import { buildTooltipCallbacks } from './tooltipCallbacks'

const COLORS_LABEL = '#475569'
const TOOLTIP = {
  backgroundColor: '#0f172a',
  padding: 10,
  cornerRadius: 6,
  titleFont: { size: 11, weight: '600' },
  bodyFont: { size: 11 },
}

function pluginValores(enabled) {
  return {
    id: 'valores',
    afterDatasetsDraw(chart) {
      if (!enabled) return
      const { ctx } = chart
      chart.data.datasets.forEach((dataset, dsIdx) => {
        const meta = chart.getDatasetMeta(dsIdx)
        if (meta.hidden) return
        meta.data.forEach((point, i) => {
          const v = dataset.data[i]
          if (v > 0) {
            ctx.save()
            ctx.font = '9px ui-sans-serif, system-ui, sans-serif'
            ctx.fillStyle = COLORS_LABEL
            ctx.textAlign = 'center'
            ctx.fillText(String(v), point.x, point.y - 7)
            ctx.restore()
          }
        })
      })
    },
  }
}

export default function GraficoLineas({ semanas, series, totales, ocultos, onSelect, mostrarValores, folios }) {
  const datasets = useMemo(
    () =>
      series.map((serie) => ({
        label: serie.label,
        data: semanas.map((s) => totales[serie.key]?.[s] || 0),
        borderColor: serie.color,
        backgroundColor: serie.color,
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: serie.color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: serie.color,
        pointHoverBorderColor: '#ffffff',
        hidden: ocultos.has(serie.key),
      })),
    [series, semanas, totales, ocultos],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      interaction: { mode: 'nearest', intersect: false },
      onClick: (evt, elements) => {
        if (!onSelect || !elements.length) return
        onSelect(series[elements[0].datasetIndex]?.key)
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 12, boxHeight: 12, color: '#334155', font: { size: 11 } },
        },
        tooltip: {
          ...TOOLTIP,
          callbacks: buildTooltipCallbacks(series, folios),
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e2e8f0' },
          ticks: { precision: 0, color: '#94a3b8', font: { size: 10 } },
        },
      },
    }),
    [onSelect, series, folios],
  )

  return (
    <Line
      data={{ labels: semanas.map((s) => `Semana ${s}`), datasets }}
      options={options}
      plugins={[pluginValores(mostrarValores)]}
    />
  )
}
