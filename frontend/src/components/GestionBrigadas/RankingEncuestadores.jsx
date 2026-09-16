import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getRankingObservaciones,
  getRankingSemanas,
} from '../../services/brigadaService'
import { DEPARTAMENTOS } from '../../utils/constants'

const ORDEN_FOLIOS = 'folios'
const ORDEN_OBSERVACIONES = 'observaciones'

const VISTA_TABLA = 'tabla'
const VISTA_PODIO = 'podio'

const MEDALLAS = [
  { color: 'from-yellow-400 to-amber-500', label: 'Oro' },
  { color: 'from-slate-300 to-slate-400', label: 'Plata' },
  { color: 'from-amber-600 to-orange-700', label: 'Bronce' },
]

const avatarColores = [
  'from-indigo-400 to-indigo-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
]

const avatarBgs = [
  'bg-indigo-50',
  'bg-emerald-50',
  'bg-amber-50',
  'bg-rose-50',
  'bg-sky-50',
  'bg-violet-50',
]

const iniciales = (nombre) =>
  String(nombre || '')
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '—'

const DEPARTAMENTOS_SORT = [...DEPARTAMENTOS].sort((a, b) => a.localeCompare(b))

const thClass =
  'px-5 py-3.5 text-left font-semibold text-slate-400 uppercase tracking-wider text-[0.65rem] whitespace-nowrap'

export default function RankingEncuestadores({ sessionUser }) {
  const isAdmin = sessionUser?.rol === 'administrador'

  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [departamentoFiltro, setDepartamentoFiltro] = useState('')
  const [semanas, setSemanas] = useState([])
  const [semanaDesdeFiltro, setSemanaDesdeFiltro] = useState(
    () => localStorage.getItem('rankingSemanaDesde') || '',
  )
  const [semanaHastaFiltro, setSemanaHastaFiltro] = useState(
    () => localStorage.getItem('rankingSemanaHasta') || '',
  )
  const [orden, setOrden] = useState(ORDEN_OBSERVACIONES)
  const [vista, setVista] = useState(VISTA_TABLA)

  useEffect(() => {
    localStorage.setItem('rankingSemanaDesde', semanaDesdeFiltro)
  }, [semanaDesdeFiltro])

  useEffect(() => {
    localStorage.setItem('rankingSemanaHasta', semanaHastaFiltro)
  }, [semanaHastaFiltro])

  useEffect(() => {
    let activo = true
    getRankingSemanas()
      .then((semanasData) => {
        if (activo) setSemanas(Array.isArray(semanasData) ? semanasData : [])
      })
      .catch(() => {
        if (activo) setSemanas([])
      })
    return () => {
      activo = false
    }
  }, [])

  const cargarRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const departamento = isAdmin ? departamentoFiltro : undefined
      const data = await getRankingObservaciones({
        departamento,
        semanaDesde: semanaDesdeFiltro || undefined,
        semanaHasta: semanaHastaFiltro || undefined,
      })
      setRanking(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cargar el ranking de observaciones'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, departamentoFiltro, semanaDesdeFiltro, semanaHastaFiltro])

  useEffect(() => {
    cargarRanking()
  }, [cargarRanking])

  const rankingOrdenado = useMemo(() => {
    const list = [...ranking]
    if (orden === ORDEN_FOLIOS) {
      list.sort(
        (a, b) =>
          b.folios_observados - a.folios_observados ||
          b.total_observaciones - a.total_observaciones ||
          String(a.nombre_encuestador).localeCompare(b.nombre_encuestador),
      )
    } else {
      list.sort(
        (a, b) =>
          b.total_observaciones - a.total_observaciones ||
          b.folios_observados - a.folios_observados ||
          String(a.nombre_encuestador).localeCompare(b.nombre_encuestador),
      )
    }
    return list
  }, [ranking, orden])

  const totales = useMemo(() => {
    return ranking.reduce(
      (acc, fila) => ({
        foliosObservados: acc.foliosObservados + (fila.folios_observados || 0),
        totalObservaciones:
          acc.totalObservaciones + (fila.total_observaciones || 0),
      }),
      { foliosObservados: 0, totalObservaciones: 0 },
    )
  }, [ranking])

  const maximoMetrica = useMemo(() => {
    if (ranking.length === 0) return 1
    if (orden === ORDEN_FOLIOS) {
      return Math.max(...ranking.map((f) => f.folios_observados || 0), 1)
    }
    return Math.max(...ranking.map((f) => f.total_observaciones || 0), 1)
  }, [ranking, orden])

  const semanaLabel = useMemo(() => {
    if (semanaDesdeFiltro && semanaHastaFiltro) {
      return `Semanas ${semanaDesdeFiltro} a ${semanaHastaFiltro}`
    }
    if (semanaDesdeFiltro) return `Desde semana ${semanaDesdeFiltro}`
    if (semanaHastaFiltro) return `Hasta semana ${semanaHastaFiltro}`
    return 'Todas las semanas'
  }, [semanaDesdeFiltro, semanaHastaFiltro])

  const metricaLabel = orden === ORDEN_FOLIOS ? 'Folios observados' : 'Observaciones totales'
  const metricaKey = orden === ORDEN_FOLIOS ? 'folios_observados' : 'total_observaciones'

  return (
    <div className="max-w-7xl mx-auto my-6 px-4 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Ranking de Encuestadores
              </h2>
              <p className="text-[0.75rem] text-slate-400 mt-0.5">
                Rendimiento por observaciones y folios revisados
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.7rem]">
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {semanaLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              Orden: {metricaLabel}
            </span>
          </div>
        </div>

        {/* Vista toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all duration-200 ${
              vista === VISTA_TABLA
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
            onClick={() => setVista(VISTA_TABLA)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            Tabla
          </button>
          <button
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all duration-200 ${
              vista === VISTA_PODIO
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
            onClick={() => setVista(VISTA_PODIO)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9Z" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Podio
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Encuestadores',
            value: ranking.length,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
            gradient: 'from-indigo-500 to-indigo-700',
            bgLight: 'bg-indigo-50',
            textDark: 'text-indigo-600',
          },
          {
            label: 'Folios observados',
            value: totales.foliosObservados,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
            ),
            gradient: 'from-rose-500 to-rose-700',
            bgLight: 'bg-rose-50',
            textDark: 'text-rose-600',
          },
          {
            label: 'Observación total',
            value: totales.totalObservaciones,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            ),
            gradient: 'from-amber-500 to-amber-700',
            bgLight: 'bg-amber-50',
            textDark: 'text-amber-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group bg-white rounded-2xl border border-slate-200/80 px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg shadow-slate-200/50 group-hover:scale-105 transition-transform duration-200`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-bold">
                {stat.label}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 leading-tight tabular-nums">
                {stat.value.toLocaleString('es-PE')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Orden */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              className={`px-3.5 py-2 rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all duration-200 ${
                orden === ORDEN_OBSERVACIONES
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-slate-500 hover:bg-white hover:text-amber-700'
              }`}
              onClick={() => setOrden(ORDEN_OBSERVACIONES)}
            >
              Observaciones
            </button>
            <button
              className={`px-3.5 py-2 rounded-md text-[0.72rem] font-semibold cursor-pointer transition-all duration-200 ${
                orden === ORDEN_FOLIOS
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-500 hover:bg-white hover:text-rose-700'
              }`}
              onClick={() => setOrden(ORDEN_FOLIOS)}
            >
              Folios
            </button>
          </div>

          {isAdmin && (
            <select
              className="px-3 py-2 text-[0.78rem] border border-slate-200 rounded-lg bg-white text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-slate-300 transition-shadow"
              value={departamentoFiltro}
              onChange={(e) => setDepartamentoFiltro(e.target.value)}
            >
              <option value="">Todos los departamentos</option>
              {DEPARTAMENTOS_SORT.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Semanas */}
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select
              className="bg-transparent px-1 py-0.5 text-[0.8rem] text-slate-700 outline-none cursor-pointer font-medium"
              value={semanaDesdeFiltro}
              onChange={(e) => setSemanaDesdeFiltro(e.target.value)}
            >
              <option value="">Desde</option>
              {semanas.map((s) => (
                <option key={`desde-${s}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-slate-300 text-sm">—</span>
            <select
              className="bg-transparent px-1 py-0.5 text-[0.8rem] text-slate-700 outline-none cursor-pointer font-medium"
              value={semanaHastaFiltro}
              onChange={(e) => setSemanaHastaFiltro(e.target.value)}
            >
              <option value="">Hasta</option>
              {semanas.map((s) => (
                <option key={`hasta-${s}`} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <button
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-[0.72rem] font-semibold cursor-pointer hover:bg-slate-700 active:scale-[0.97] transition-all duration-200 shadow-sm"
              onClick={cargarRanking}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[0.78rem] font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-700 rounded-full animate-spin" />
          <span className="text-sm font-medium">Cargando ranking...</span>
        </div>
      ) : rankingOrdenado.length === 0 ? (
        /* ── Empty ── */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-20 flex flex-col items-center gap-3 text-slate-400">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <p className="font-semibold text-slate-500">No hay encuestadores registrados</p>
          <p className="text-[0.75rem] text-slate-400">Intenta ajustar los filtros de semana</p>
        </div>
      ) : vista === VISTA_PODIO ? (
        /* ══════════════════════════════════════════════════════════
           VISTA PODIO
           ══════════════════════════════════════════════════════════ */
        <div className="space-y-5">

          {/* Aclaración del criterio */}
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[0.72rem] text-amber-800 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              Este podio refleja a los encuestadores con <strong>mayor cantidad de {metricaLabel.toLowerCase()}</strong>{' '}
              registradas en las encuestas, no necesariamente a los de mejor desempeño o calidad.
            </p>
          </div>

          {/* Top 3 */}
          {rankingOrdenado.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Render in podium order: 2nd, 1st, 3rd */}
              {[1, 0, 2].map((posicion) => {
                const fila = rankingOrdenado[posicion]
                if (!fila) return <div key={`empty-${posicion}`} />
                const medalla = MEDALLAS[posicion]
                const metrica = fila[metricaKey] || 0
                const pct = Math.round((metrica / maximoMetrica) * 100)
                const esPrimero = posicion === 0
                const avatarGrad = avatarColores[posicion % avatarColores.length]
                const avatarBg = avatarBgs[posicion % avatarBgs.length]

                return (
                  <div
                    key={fila.encuestador_id}
                    className={`relative rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      esPrimero
                        ? 'border-amber-300 bg-gradient-to-b from-amber-50/80 via-white to-white ring-1 ring-amber-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Ribbon */}
                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${medalla.color}`} />

                    <div className="px-5 pt-6 pb-5 text-center">
                      {/* Trophy + medal */}
                      <div className="relative inline-block mb-4">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-2xl font-extrabold shadow-lg ${
                          esPrimero ? 'shadow-amber-200/60 scale-105' : 'shadow-slate-200/60'
                        } transition-transform duration-300`}>
                          {iniciales(fila.nombre_encuestador)}
                        </div>
                        <span className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${medalla.color} flex items-center justify-center shadow-md ring-2 ring-white`} title={`${posicion + 1}º puesto por ${metricaLabel.toLowerCase()} en encuestas`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className={`font-bold ${esPrimero ? 'text-lg text-slate-900' : 'text-base text-slate-800'} leading-tight`}>
                        {fila.nombre_encuestador || '(Sin nombre)'}
                      </h3>
                      <p className="text-[0.68rem] text-slate-400 mt-1 font-medium">
                        {fila.codigo}
                        {fila.rol && (
                          <span className="ml-1.5 uppercase text-[0.58rem] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded px-1 py-0.5">
                            {fila.rol}
                          </span>
                        )}
                      </p>

                      {/* Departments */}
                      <div className="flex flex-wrap justify-center gap-1 mt-3">
                        {(fila.departamentos || '').split(',').filter(Boolean).map((dept) => (
                          <span
                            key={dept}
                            className="inline-flex items-center bg-indigo-50 text-indigo-700 text-[0.62rem] px-2 py-0.5 rounded-full font-semibold border border-indigo-100"
                          >
                            {dept}
                          </span>
                        ))}
                        {!fila.departamentos && (
                          <span className="text-slate-300 text-[0.7rem]">—</span>
                        )}
                      </div>

                      {/* Metric */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[0.62rem] uppercase tracking-widest text-slate-400 font-bold">
                          {metricaLabel}
                        </p>
                        <p className={`text-3xl font-extrabold leading-tight mt-1 tabular-nums ${
                          metrica > 0 ? (orden === ORDEN_FOLIOS ? 'text-rose-600' : 'text-amber-600') : 'text-slate-300'
                        }`}>
                          {metrica.toLocaleString('es-PE')}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${orden === ORDEN_FOLIOS ? 'from-rose-400 to-rose-600' : 'from-amber-400 to-amber-600'} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[0.6rem] text-slate-400 mt-1.5 font-medium">
                          {pct}% del máximo
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Resto del ranking (posición 4+) */}
          {rankingOrdenado.length > 3 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Demás participantes
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {rankingOrdenado.slice(3).map((fila, idx) => {
                  const posicion = idx + 4
                  const metrica = fila[metricaKey] || 0
                  const pct = Math.round((metrica / maximoMetrica) * 100)
                  const avatarGrad = avatarColores[posicion % avatarColores.length]
                  const avatarBg = avatarBgs[posicion % avatarBgs.length]

                  return (
                    <div
                      key={fila.encuestador_id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                    >
                      <span className="flex-shrink-0 w-8 text-center text-[0.75rem] font-bold text-slate-400 tabular-nums">
                        {posicion}
                      </span>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white text-[0.72rem] font-bold shadow-sm`}>
                        {iniciales(fila.nombre_encuestador)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {fila.nombre_encuestador || '(Sin nombre)'}
                          </p>
                          <span className="text-[0.62rem] text-slate-400 font-medium">
                            {fila.codigo}
                          </span>
                          {fila.rol && (
                            <span className="uppercase text-[0.55rem] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded px-1 py-0.5">
                              {fila.rol}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(fila.departamentos || '').split(',').filter(Boolean).slice(0, 3).map((dept) => (
                            <span key={dept} className="inline-flex items-center bg-indigo-50 text-indigo-700 text-[0.58rem] px-1.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Progress */}
                        <div className="hidden sm:block w-28">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${orden === ORDEN_FOLIOS ? 'from-rose-400 to-rose-600' : 'from-amber-400 to-amber-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className={`w-16 text-right font-extrabold text-sm tabular-nums ${
                          metrica > 0 ? (orden === ORDEN_FOLIOS ? 'text-rose-600' : 'text-amber-600') : 'text-slate-300'
                        }`}>
                          {metrica.toLocaleString('es-PE')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
           VISTA TABLA
           ══════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8rem] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="w-14 px-5 py-3.5 text-center font-semibold text-slate-400 uppercase tracking-wider text-[0.65rem]">
                    #
                  </th>
                  <th className={thClass}>Encuestador</th>
                  <th className={thClass}>Departamento(s)</th>
                  <th className={`px-5 py-3.5 text-right font-semibold uppercase tracking-wider text-[0.65rem] whitespace-nowrap cursor-pointer select-none transition-colors ${
                    orden === ORDEN_FOLIOS ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                    onClick={() => setOrden(ORDEN_FOLIOS)}
                  >
                    <span className="inline-flex items-center gap-1">
                      Folios Observados
                      {orden === ORDEN_FOLIOS && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </span>
                  </th>
                  <th className={`px-5 py-3.5 text-right font-semibold uppercase tracking-wider text-[0.65rem] whitespace-nowrap cursor-pointer select-none transition-colors ${
                    orden === ORDEN_OBSERVACIONES ? 'text-amber-600 bg-amber-50/50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                    onClick={() => setOrden(ORDEN_OBSERVACIONES)}
                  >
                    <span className="inline-flex items-center gap-1">
                      Observación Total
                      {orden === ORDEN_OBSERVACIONES && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      )}
                    </span>
                  </th>
                  <th className="w-40 px-5 py-3.5 text-right font-semibold text-slate-400 uppercase tracking-wider text-[0.65rem] whitespace-nowrap">
                    Progreso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingOrdenado.map((fila, idx) => {
                  const posicion = idx + 1
                  const medalla = MEDALLAS[idx]
                  const metrica = fila[metricaKey] || 0
                  const pct = Math.round((metrica / maximoMetrica) * 100)

                  return (
                    <tr
                      key={fila.encuestador_id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="px-5 py-3.5 text-center">
                        {medalla ? (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white text-[0.72rem] font-extrabold shadow-sm`}
                            title={medalla.label}
                          >
                            {posicion}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-7 px-1.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-[0.72rem] font-bold tabular-nums">
                            {posicion}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-[0.72rem] font-bold shadow-sm group-hover:scale-105 transition-transform duration-200">
                            {iniciales(fila.nombre_encuestador)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 whitespace-nowrap text-[0.82rem]">
                              {fila.nombre_encuestador || '(Sin nombre)'}
                            </p>
                            <p className="text-[0.66rem] text-slate-400 font-medium flex items-center gap-1.5">
                              <span className="tabular-nums">{fila.codigo}</span>
                              {fila.rol && (
                                <span className="uppercase text-[0.55rem] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1 py-0.5">
                                  {fila.rol}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(fila.departamentos || '')
                            .split(',')
                            .filter(Boolean)
                            .map((dept) => (
                              <span
                                key={dept}
                                className="inline-flex items-center bg-slate-100 text-slate-600 border border-slate-200 text-[0.62rem] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                              >
                                {dept}
                              </span>
                            ))}
                          {!fila.departamentos && (
                            <span className="text-slate-300 text-[0.7rem]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center justify-end font-bold tabular-nums ${
                            fila.folios_observados > 0 ? 'text-rose-600' : 'text-slate-300'
                          }`}
                        >
                          {(fila.folios_observados || 0).toLocaleString('es-PE')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center justify-end font-bold tabular-nums ${
                            fila.total_observaciones > 0 ? 'text-amber-600' : 'text-slate-300'
                          }`}
                        >
                          {(fila.total_observaciones || 0).toLocaleString('es-PE')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${orden === ORDEN_FOLIOS ? 'from-rose-400 to-rose-600' : 'from-amber-400 to-amber-600'} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[0.62rem] text-slate-400 font-medium w-8 text-right tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
