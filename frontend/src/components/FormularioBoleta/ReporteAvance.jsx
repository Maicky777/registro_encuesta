import React, { useMemo } from 'react'
import { INCIDENCIA_TRASLADO, INCIDENCIA_COMPLETA, INCIDENCIAS } from '../../utils/constants'
import { calcularAvanceBrigadas } from '../../utils/helpers'

function getColor(pct) {
  if (pct >= 100) return { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', ring: 'ring-emerald-500/20' }
  if (pct >= 75) return { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200', ring: 'ring-amber-500/20' }
  if (pct >= 50) return { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200', ring: 'ring-orange-500/20' }
  if (pct > 0) return { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200', ring: 'ring-red-500/20' }
  return { bar: 'bg-slate-300', bg: 'bg-slate-50', text: 'text-slate-400', dot: 'bg-slate-300', border: 'border-slate-200', ring: 'ring-slate-500/10' }
}

const INCIDENCIA_COLOR = {
  bar: 'bg-amber-500',
  bg: 'bg-amber-50',
  text: 'text-amber-700',
  dot: 'bg-amber-500',
  border: 'border-amber-200',
  ring: 'ring-amber-500/20',
}

function getIncidenciaColor(inc) {
  if (inc.startsWith('1:'))
    return { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', ring: 'ring-emerald-500/20' }
  if (inc === INCIDENCIA_TRASLADO)
    return { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200', ring: 'ring-slate-500/10' }
  return INCIDENCIA_COLOR
}

const INCIDENCIA_BADGES = {
  '2': { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200', solid: 'bg-amber-500' },
  '3': { bar: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200', solid: 'bg-sky-500' },
  '4': { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200', solid: 'bg-violet-500' },
  '5': { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200', solid: 'bg-orange-500' },
  '6': { bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200', solid: 'bg-red-500' },
  '7': { bar: 'bg-slate-500', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-500', border: 'border-slate-200', solid: 'bg-slate-500' },
  '8': { bar: 'bg-fuchsia-500', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200', solid: 'bg-fuchsia-500' },
  '9': { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-200', solid: 'bg-slate-400' },
}

function getIncidenciaBadge(inc) {
  const code = inc.split(':')[0].trim()
  return INCIDENCIA_BADGES[code] || INCIDENCIA_BADGES['9']
}

function getInitials(name) {
  return String(name)
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || String(name).slice(0, 2).toUpperCase()
}

const BRIGADE_COLORS = [
  { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', solid: 'bg-blue-600', soft: 'bg-blue-500/10', softText: 'text-blue-700', ring: 'ring-blue-500/20' },
  { text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200', solid: 'bg-pink-600', soft: 'bg-pink-500/10', softText: 'text-pink-700', ring: 'ring-pink-500/20' },
  { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', solid: 'bg-violet-600', soft: 'bg-violet-500/10', softText: 'text-violet-700', ring: 'ring-violet-500/20' },
  { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', solid: 'bg-amber-500', soft: 'bg-amber-500/10', softText: 'text-amber-700', ring: 'ring-amber-500/20' },
  { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', solid: 'bg-rose-600', soft: 'bg-rose-500/10', softText: 'text-rose-700', ring: 'ring-rose-500/20' },
  { text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', solid: 'bg-cyan-600', soft: 'bg-cyan-500/10', softText: 'text-cyan-700', ring: 'ring-cyan-500/20' },
  { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', solid: 'bg-indigo-600', soft: 'bg-indigo-500/10', softText: 'text-indigo-700', ring: 'ring-indigo-500/20' },
  { text: 'text-fuchsia-700', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', solid: 'bg-fuchsia-600', soft: 'bg-fuchsia-500/10', softText: 'text-fuchsia-700', ring: 'ring-fuchsia-500/20' },
  { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', solid: 'bg-sky-600', soft: 'bg-sky-500/10', softText: 'text-sky-700', ring: 'ring-sky-500/20' },
]

function getBrigadeColor(index) {
  return BRIGADE_COLORS[index % BRIGADE_COLORS.length]
}

const StatCard = ({ label, value, color, sub }) => (
  <div className={`flex flex-col items-center px-4 py-3 rounded-xl ${color.bg} border ${color.border} ring-1 ${color.ring}`}>
    <span className={`text-2xl font-extrabold ${color.text} leading-none`}>{value}</span>
    <span className="text-[0.65rem] font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    {sub && <span className="text-[0.6rem] text-slate-400 mt-0.5">{sub}</span>}
  </div>
)

const calcularUsuariosIncidencias = (registrosDept) => {
  const porUsuario = {}
  for (const r of registrosDept) {
    if (r.incidencia === INCIDENCIA_COMPLETA) continue
    const key = r.nombreEncuestador || r.usuarioEncuestador
    if (!porUsuario[key]) porUsuario[key] = { brigada: r.brigada, incidencias: {}, folios: {} }
    porUsuario[key].incidencias[r.incidencia] = (porUsuario[key].incidencias[r.incidencia] || 0) + 1
    if (!porUsuario[key].folios[r.incidencia]) porUsuario[key].folios[r.incidencia] = []
    if (r.folio) porUsuario[key].folios[r.incidencia].push(r.folio)
  }

  return Object.entries(porUsuario)
    .map(([usuario, info]) => {
      const total = Object.values(info.incidencias).reduce((a, b) => a + b, 0)
      return { usuario, brigada: info.brigada, incidencias: info.incidencias, folios: info.folios, total }
    })
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total)
}

const calcularIncidenciasResumen = (registrosDept) => {
  const counts = {}
  for (const r of registrosDept) {
    counts[r.incidencia] = (counts[r.incidencia] || 0) + 1
  }
  return INCIDENCIAS.map((inc) => ({
    inc,
    count: counts[inc] || 0,
  }))
}

const ReporteAvance = ({ registros, semana }) => {
  const semanaVal = semana || 3

  const registrosSemana = useMemo(
    () => (registros || []).filter((r) => parseInt(r.semana, 10) === semanaVal),
    [registros, semanaVal],
  )

  const datosPorDepartamento = useMemo(() => {
    const set = new Set(
      registrosSemana.map((r) => r.departamento || 'SIN DEPARTAMENTO'),
    )
    return [...set]
      .sort((a, b) => a.localeCompare(b))
      .map((departamento) => {
        const regsDept = registrosSemana.filter(
          (r) => (r.departamento || 'SIN DEPARTAMENTO') === departamento,
        )
        return {
          departamento,
          avance: calcularAvanceBrigadas(regsDept, semanaVal),
          usuarios: calcularUsuariosIncidencias(regsDept),
          incidenciasResumen: calcularIncidenciasResumen(regsDept),
        }
      })
  }, [registrosSemana, semanaVal])

  const avanceTotal = useMemo(
    () => calcularAvanceBrigadas(registrosSemana, semanaVal),
    [registrosSemana, semanaVal],
  )

  if (datosPorDepartamento.length === 0) return null

  const generalColor = getColor(avanceTotal.pctGeneral)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reporte de Avance</h3>
            <p className="text-[0.75rem] text-slate-400 mt-0.5">
              Semana <span className="font-semibold text-slate-600">{avanceTotal.semana}</span>
              <span className="mx-1.5 text-slate-300">|</span>
              {datosPorDepartamento.length} departamento{datosPorDepartamento.length !== 1 ? 's' : ''}
              <span className="mx-1.5 text-slate-300">|</span>
              {avanceTotal.brigadas.length} brigada{avanceTotal.brigadas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[0.65rem] text-slate-400 uppercase tracking-wider font-medium">Progreso General</div>
              <div className="text-[0.72rem] text-slate-500 mt-0.5">{avanceTotal.totales.validas} / {avanceTotal.totales.max} encuestas</div>
            </div>
            <div className={`w-16 h-16 rounded-2xl ${generalColor.bg} border ${generalColor.border} flex flex-col items-center justify-center ring-1 ${generalColor.ring}`}>
              <span className={`text-xl font-extrabold ${generalColor.text} leading-none`}>{avanceTotal.pctGeneral}%</span>
            </div>
          </div>
        </div>
        {/* Barra general */}
        <div className="mt-4">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${generalColor.bar} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${avanceTotal.pctGeneral}%` }}
            />
          </div>
        </div>

      </div>

      {datosPorDepartamento.map((datos) => {
        const departamento = datos.departamento
        const avanceData = datos.avance
        const usuariosIncidencias = datos.usuarios
        const incidenciasResumen = datos.incidenciasResumen
        const deptColor = getColor(avanceData.pctGeneral)
        const upmsDepto = avanceData.totales.upms

        return (
          <div key={departamento} className="border-b-2 border-slate-100 last:border-b-0">
            {/* Departamento header */}
            <div className="px-6 py-4 bg-linear-to-r from-indigo-50/60 to-white border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 w-1.5 h-8 rounded-full bg-indigo-600" />
                  <div className="min-w-0">
                    <h4 className="text-[0.92rem] font-bold text-slate-900 tracking-tight truncate">
                      {departamento}
                    </h4>
                    <p className="text-[0.66rem] text-slate-400 mt-0.5">
                      {avanceData.brigadas.length} brigada{avanceData.brigadas.length !== 1 ? 's' : ''}
                      <span className="mx-1 text-slate-300">|</span>
                      {upmsDepto} UPM{upmsDepto !== 1 ? 's' : ''} visitada{upmsDepto !== 1 ? 's' : ''}
                      <span className="mx-1 text-slate-300">|</span>
                      {avanceData.totales.validas} / {avanceData.totales.max} encuestas
                    </p>
                  </div>
                </div>
                <div className={`shrink-0 flex items-center px-3 py-1.5 rounded-lg ${deptColor.bg} border ${deptColor.border} ring-1 ${deptColor.ring}`}>
                  <span className={`text-sm font-extrabold ${deptColor.text} leading-none`}>{avanceData.pctGeneral}%</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard label="UPMs" value={Object.values(avanceData.agrupado).reduce((s, b) => s + Object.keys(b).length, 0)} color={{ bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', ring: 'ring-blue-500/20' }} sub="visitadas" />
          <StatCard label="Validas" value={avanceData.totales.validas} color={getColor(100)} sub={`${avanceData.totales.max} max`} />
          <StatCard label="Observadas" value={avanceData.totales.observadas} color={avanceData.totales.observadas > 0 ? getColor(10) : getColor(100)} sub="boletas" />
          {incidenciasResumen.map(({ inc, count }) => (
            <StatCard
              key={inc}
              label={inc.split(': ')[1] || inc}
              value={count}
              color={count > 0 ? getIncidenciaColor(inc) : { ...getIncidenciaColor(inc), bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200', ring: 'ring-slate-500/10' }}
              sub="registros"
            />
          ))}
        </div>
      </div>

      {/* Brigadas */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-slate-800 rounded-full" />
          <h4 className="text-[0.8rem] font-bold text-slate-700 uppercase tracking-wider">Avance por Brigada</h4>
        </div>
        <div className="space-y-3">
          {avanceData.brigadas.map((resumen) => {
            const brigada = resumen.brigada
            const upms = avanceData.agrupado[brigada]
            const upmKeys = Object.keys(upms).sort()
            const totalObservadas = resumen.observadas
            const totalTraslados = resumen.traslados
            const pctBrigada = resumen.pct
            const color = getColor(pctBrigada)

            return (
              <div
                key={brigada}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                {/* Brigada header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-bold text-[0.82rem] text-slate-900">{brigada}</div>
                      <div className="text-[0.65rem] text-slate-400">{upmKeys.length} UPM{upmKeys.length !== 1 ? 's' : ''} visitadas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalObservadas > 0 && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {totalObservadas} obs
                      </span>
                    )}
                    {totalTraslados > 0 && (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {totalTraslados} trasl
                      </span>
                    )}
                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg ${color.bg} border ${color.border} ring-1 ${color.ring}`}>
                      <span className={`text-sm font-extrabold ${color.text} leading-none`}>{pctBrigada}%</span>
                    </div>
                  </div>
                </div>

                {/* Barra brigada */}
                <div className="px-4 pb-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color.bar} rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${pctBrigada}%` }}
                    />
                  </div>
                </div>

                {/* UPMs grid */}
                <div className="px-4 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                    {upmKeys.map((upm) => {
                      const info = upms[upm]
                      const pct = Math.round((info.validas / avanceData.maxPorUpm) * 100)
                      const upmColor = getColor(pct)
                      const shortUpm = upm.length > 12 ? upm.slice(-8) : upm

                      return (
                        <div
                          key={upm}
                          className="group/tip relative"
                        >
                          <div
                            className={`flex items-center gap-1.5 ${upmColor.bg} border ${upmColor.border} rounded-lg px-2 py-1.5 cursor-default transition-all duration-150 hover:shadow-sm hover:scale-[1.02]`}
                          >
                            <span className={`w-2 h-2 rounded-full ${upmColor.dot} shrink-0 ring-2 ring-white`} />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-[0.65rem] text-slate-700 truncate">{shortUpm}</div>
                              <div className={`text-[0.6rem] font-bold ${upmColor.text}`}>
                                {info.validas}/{avanceData.maxPorUpm}
                              </div>
                            </div>
                            
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-left">
                              {/* Header tooltip */}
                              <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-700/60">
                                <div className="min-w-0">
                                  <div className="text-[0.7rem] font-bold text-white truncate">{upm}</div>
                                  <div className="text-[0.58rem] text-slate-400 mt-0.5">Brigada: {brigada}</div>
                                </div>
                                <span className={`shrink-0 text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md ${
                                  pct >= 100 ? 'bg-emerald-900/60 text-emerald-300' :
                                  pct >= 75 ? 'bg-amber-900/60 text-amber-300' :
                                  pct >= 50 ? 'bg-orange-900/60 text-orange-300' :
                                  'bg-red-900/60 text-red-300'
                                }`}>
                                  {pct}%
                                </span>
                              </div>

                              {/* Metricas */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-[0.6rem] text-slate-400">Validas</span>
                                  </div>
                                  <span className="text-[0.65rem] font-bold text-emerald-300">{info.validas} / {avanceData.maxPorUpm}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <span className="text-[0.6rem] text-slate-400">Observadas</span>
                                  </div>
                                  <span className={`text-[0.65rem] font-bold ${info.observadas > 0 ? 'text-red-300' : 'text-slate-500'}`}>{info.observadas}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span className="text-[0.6rem] text-slate-400">Traslados</span>
                                  </div>
                                  <span className={`text-[0.65rem] font-bold ${info.traslados > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{info.traslados}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="text-[0.6rem] text-slate-400">Total boletas</span>
                                  </div>
                                  <span className="text-[0.65rem] font-bold text-slate-300">{info.total}</span>
                                </div>
                              </div>

                              {/* Incidencias por tipo */}
                              {Object.entries(info.incidencias).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-700/60">
                                  <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider mb-1">Incidencias</div>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(info.incidencias).map(([inc, count]) => (
                                      <span key={inc} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[0.55rem]">
                                        <span className="font-bold">{count}x</span>
                                        <span>{inc.split(': ')[1] || inc}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Barra mini */}
                              <div className="mt-2 pt-2 border-t border-slate-700/60">
                                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-400' : pct >= 75 ? 'bg-amber-400' : pct >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>

                              {/* Flecha */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-[5px]" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

          
      {/* Incidencias por Usuario */}
      {usuariosIncidencias.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-6 py-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 border border-red-200 ring-4 ring-red-500/10 shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[0.85rem] font-bold text-slate-900 tracking-tight">Incidencias por Usuario</h4>
                  <p className="text-[0.68rem] text-slate-400 mt-0.5">
                    {usuariosIncidencias.length} encuestador{usuariosIncidencias.length !== 1 ? 'es' : ''} con incidencias · Semana {avanceData.semana}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.62rem] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {usuariosIncidencias.reduce((s, u) => s + u.total, 0)} incidencias en total
              </span>
            </div>

            {/* Agrupado por brigadas */}
            {(() => {
              const porBrigada = {}
              for (const u of usuariosIncidencias) {
                if (!porBrigada[u.brigada]) porBrigada[u.brigada] = []
                porBrigada[u.brigada].push(u)
              }
              const brigadasList = Object.entries(porBrigada).sort((a, b) =>
                a[0].localeCompare(b[0], undefined, { numeric: true }),
              )

              return (
                <div className="space-y-5">
                  {brigadasList.map(([brigada, usuarios], bi) => {
                    const color = getBrigadeColor(bi)
                    const totalBrigada = usuarios.reduce((s, u) => s + u.total, 0)

                    return (
                      <div key={brigada} className={`rounded-2xl border ${color.border} overflow-hidden`}>
                        {/* Header brigada */}
                        <div className={`px-5 py-3.5 ${color.bg} border-b ${color.border} flex items-center justify-between gap-3`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`shrink-0 w-1.5 h-8 rounded-full ${color.solid}`} />
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border ${color.border} shadow-sm shrink-0">
                              <svg className={`w-4 h-4 ${color.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className={`font-bold text-[0.8rem] ${color.text} truncate`}>{brigada}</div>
                              <div className="text-[0.62rem] text-slate-400">
                                {usuarios.length} encuestador{usuarios.length !== 1 ? 'es' : ''}
                              </div>
                            </div>
                          </div>
                          <div className={`shrink-0 flex items-center gap-1.5 ${color.bg} border ${color.border} rounded-lg px-2.5 py-1`}>
                            <span className={`text-sm font-extrabold ${color.text} leading-none`}>{totalBrigada}</span>
                            <span className={`text-[0.55rem] font-semibold ${color.text} opacity-70 uppercase tracking-wider`}>incid.</span>
                          </div>
                        </div>

                        {/* Usuarios de la brigada */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 px-5 py-4`}>
                          {usuarios.map((u) => {
                            const entries = Object.entries(u.incidencias).sort((a, b) => b[1] - a[1])
                            const total = u.total
                            const initials = getInitials(u.usuario)

                            return (
                              <div key={u.usuario} className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-150 overflow-hidden">
                                {/* Header usuario */}
                                <div className={`flex items-center gap-2 px-3 py-2 border-b border-slate-100 ${color.soft}`}>
                                  <div className="relative shrink-0">
                                    <div className={`flex items-center justify-center w-6 h-6 rounded-full ${color.solid} text-white text-[0.55rem] font-bold ring-2 ring-white`}>
                                      {initials}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-[0.68rem] text-slate-800 truncate">{u.usuario}</div>
                                    <div className="text-[0.55rem] text-slate-400">{total} incidencias</div>
                                  </div>
                                  <span className={`shrink-0 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-white border ${color.border} ${color.text} text-[0.62rem] font-extrabold`}>
                                    {total}
                                  </span>
                                </div>

                                {/* Detalle compacto */}
                                <div className="px-3 py-2 flex flex-col gap-1.5">
                                  {entries.map(([inc, count]) => {
                                    const badge = getIncidenciaBadge(inc)
                                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                                    const folios = (u.folios && u.folios[inc]) || []
                                    return (
                                      <div key={inc} className="flex flex-wrap items-center gap-1">
                                        <span className={`inline-flex items-center gap-1 ${badge.bg} border ${badge.border} rounded px-1.5 py-0.5`}>
                                          <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
                                          <span className={`text-[0.58rem] font-bold ${badge.text}`}>{count}</span>
                                          <span className="text-[0.56rem] font-medium text-slate-500">{inc.split(': ')[1] || inc}</span>
                                          <span className={`text-[0.52rem] font-semibold ${badge.text} opacity-70`}>{pct}%</span>
                                        </span>
                                        {folios.length > 0 && folios.map((f) => (
                                          <span key={f} className="font-mono text-[0.57rem] font-bold text-slate-500 bg-white border border-slate-200 rounded px-1 py-0.5">
                                            {f}
                                          </span>
                                        ))}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
          </div>
        )
      })}
    </div>
  )
}

export default React.memo(ReporteAvance)
