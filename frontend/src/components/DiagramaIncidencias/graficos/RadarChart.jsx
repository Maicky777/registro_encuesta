import { Radar } from 'react-chartjs-2'
import { useMemo } from 'react'
import { externalTooltipHandler } from './customTooltip'

export default function GraficoRadar({ semanas, series, totales, ocultos, folios }) {
  const datasets = useMemo(
    () =>
      series.map((serie) => ({
        label: serie.label,
        serieSub: serie.sub,
        data: semanas.map((s) => totales[serie.key]?.[s] || 0),
        backgroundColor: `${serie.color}40`,
        borderColor: serie.color,
        borderWidth: 1.5,
        fill: true,
        pointBackgroundColor: serie.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        hidden: ocultos.has(serie.key),
      })),
    [series, semanas, totales, ocultos],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 12, boxHeight: 12, color: '#334155', font: { size: 11 } },
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#94a3b8',
            backdropColor: 'transparent',
            font: { size: 9 },
          },
          grid: { color: '#e2e8f0' },
          angleLines: { color: '#e2e8f0' },
          pointLabels: { color: '#64748b', font: { size: 10 } },
        },
      },
    }),
    [series],
  )

  return <Radar data={{ labels: semanas.map((s) => `Semana ${s}`), datasets }} options={options} />
}
