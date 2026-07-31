import { Chart, registerables } from 'chart.js'
import GraficoLineas from './LineaChart'
import GraficoBarras from './BarrasChart'
import GraficoRadar from './RadarChart'
import GraficoEvolucionUsuario from './EvolucionUsuarioChart'

Chart.register(...registerables)

export { GraficoLineas, GraficoBarras, GraficoRadar, GraficoEvolucionUsuario }
