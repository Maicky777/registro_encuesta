import { Chart, registerables } from 'chart.js'
import GraficoLineas from './LineaChart'
import GraficoCircular from './CircularChart'
import GraficoRadar from './RadarChart'
import GraficoEvolucionUsuario from './EvolucionUsuarioChart'

Chart.register(...registerables)

export { GraficoLineas, GraficoCircular, GraficoRadar, GraficoEvolucionUsuario }
