import { Bar } from 'react-chartjs-2'
import { useMemo } from 'react'

export default function GraficoEvolucionUsuario({ semanas, totalesSemana, completasSemana }) {
  const data = useMemo(
    () => ({
      labels: semanas.map((s) => `S${s}`),
      datasets: [
        {
          type: 'bar',
          label: 'Incidencias',
          data: semanas.map((s) => totalesSemana[s] || 0),
          backgroundColor: '#dc2626',
          borderRadius: 3,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Entrevistas completas',
          data: semanas.map((s) => completasSemana[s] || 0),
          borderColor: '#16a34a',
          backgroundColor: '#16a34a',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#16a34a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    }),
    [semanas, totalesSemana, completasSemana],
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, boxHeight: 12, color: '#334155', font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 10,
          cornerRadius: 6,
          titleFont: { size: 11, weight: '600' },
          bodyFont: { size: 11 },
          callbacks: {
            title: (items) => `Semana ${items[0].label.replace('S', '')}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } },
        },
        y: {
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Incidencias', color: '#dc2626', font: { size: 10, weight: '600' } },
          grid: { color: '#e2e8f0' },
          ticks: { precision: 0, color: '#94a3b8', font: { size: 10 } },
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: 'Entrevistas completas', color: '#16a34a', font: { size: 10, weight: '600' } },
          grid: { drawOnChartArea: false },
          ticks: { precision: 0, color: '#94a3b8', font: { size: 10 } },
        },
      },
    }),
    [],
  )

  return <Bar data={data} options={options} />
}
