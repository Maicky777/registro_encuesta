import { Bar } from 'react-chartjs-2'
import { useMemo } from 'react'
import { buildTooltipCallbacks } from './tooltipCallbacks'

const TOOLTIP = {
  backgroundColor: '#0f172a',
  padding: 10,
  cornerRadius: 6,
  titleFont: { size: 11, weight: '600' },
  bodyFont: { size: 11 },
}

export default function GraficoBarras({ semanas, series, totales, ocultos, onSelect, stacked }) {
  const datasets = useMemo(
    () =>
      series.map((serie) => ({
        label: serie.label,
        data: semanas.map((s) => totales[serie.key]?.[s] || 0),
        backgroundColor: serie.color,
        borderColor: serie.color,
        borderWidth: 1,
        borderRadius: 2,
        hidden: ocultos.has(serie.key),
        stack: 'principal',
      })),
    [series, semanas, totales, ocultos],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      onClick: (evt, elements) => {
        if (!onSelect || !elements.length) return
        onSelect(series[elements[0].datasetIndex]?.key)
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: buildTooltipCallbacks(series),
        },
      },
      scales: {
        x: {
          stacked,
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } },
        },
        y: {
          stacked,
          beginAtZero: true,
          grid: { color: '#e2e8f0' },
          ticks: { precision: 0, color: '#94a3b8', font: { size: 10 } },
        },
      },
    }),
    [onSelect, series, stacked],
  )

  return <Bar data={{ labels: semanas.map((s) => `S${s}`), datasets }} options={options} />
}
