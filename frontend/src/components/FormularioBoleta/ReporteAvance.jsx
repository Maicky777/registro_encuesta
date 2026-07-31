import React, { useMemo } from 'react'
import { MAX_POR_UPM, INCIDENCIA_TRASLADO, INCIDENCIAS } from '../../utils/constants'

function getInitials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

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

const BRIGADA_COLORS = [
  { bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', chip: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-violet-500', bgLight: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', chip: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', chip: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', chip: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-cyan-500', bgLight: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', chip: 'bg-cyan-100 text-cyan-700' },
  { bg: 'bg-indigo-500', bgLight: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', chip: 'bg-indigo-100 text-indigo-700' },
  { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', chip: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-teal-500', bgLight: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', chip: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-pink-500', bgLight: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', chip: 'bg-pink-100 text-pink-700' },
]

function getIncidenciaColor(inc) {
  if (inc.startsWith('1:'))
    return { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', ring: 'ring-emerald-500/20' }
  if (inc === INCIDENCIA_TRASLADO)
    return { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200', ring: 'ring-slate-500/10' }
  return INCIDENCIA_COLOR
}

const StatCard = ({ label, value, color, sub }) => (
  <div className={`flex flex-col items-center px-4 py-3 rounded-xl ${color.bg} border ${color.border} ring-1 ${color.ring}`}>
    <span className={`text-2xl font-extrabold ${color.text} leading-none`}>{value}</span>
    <span className="text-[0.65rem] font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    {sub && <span className="text-[0.6rem] text-slate-400 mt-0.5">{sub}</span>}
  </div>
)

const ReporteAvance = ({ registros, semana }) => {
  const avanceData = useMemo(() => {
    const SEMANA_DEFAULT = semana || 3
    const registrosSemana = registros.filter(
      (r) => parseInt(r.semana, 10) === SEMANA_DEFAULT,
    )

    const agrupado = {}
    for (const r of registrosSemana) {
      const key = r.brigada
      if (!agrupado[key]) agrupado[key] = {}
      if (!agrupado[key][r.upm]) agrupado[key][r.upm] = { total: 0, validas: 0, traslados: 0, observadas: 0, incidencias: {} }
      agrupado[key][r.upm].total++
      agrupado[key][r.upm].incidencias[r.incidencia] = (agrupado[key][r.upm].incidencias[r.incidencia] || 0) + 1
      if (r.incidencia === INCIDENCIA_TRASLADO) {
        agrupado[key][r.upm].traslados++
      } else {
        agrupado[key][r.upm].validas++
      }
      if (r.boletaObservada === 'SI') {
        agrupado[key][r.upm].observadas++
      }
    }

    let totalValidasGeneral = 0
    let totalMaxGeneral = 0
    let totalObservadasGeneral = 0
    let totalTrasladosGeneral = 0
    for (const brigada of Object.values(agrupado)) {
      for (const upm of Object.values(brigada)) {
        totalValidasGeneral += upm.validas
        totalMaxGeneral += MAX_POR_UPM
        totalObservadasGeneral += upm.observadas
        totalTrasladosGeneral += upm.traslados
      }
    }

    return {
      agrupado,
      semana: SEMANA_DEFAULT,
      maxPorUpm: MAX_POR_UPM,
      totalValidasGeneral,
      totalMaxGeneral,
      totalObservadasGeneral,
      totalTrasladosGeneral,
      pctGeneral: totalMaxGeneral > 0 ? Math.round((totalValidasGeneral / totalMaxGeneral) * 100) : 0,
    }
  }, [registros, semana])

  const usuariosIncidencias = useMemo(() => {
    const semanaVal = semana || 3
    const registrosSemana = registros.filter(
      (r) => parseInt(r.semana, 10) === semanaVal,
    )

    const porUsuario = {}
    for (const r of registrosSemana) {
      if (r.incidencia?.startsWith('1:')) continue
      const key = r.nombreEncuestador || r.usuarioEncuestador
      if (!porUsuario[key]) porUsuario[key] = { brigada: r.brigada, incidencias: {} }
      if (!porUsuario[key].incidencias[r.incidencia]) porUsuario[key].incidencias[r.incidencia] = []
      porUsuario[key].incidencias[r.incidencia].push(r.folio)
    }

    return Object.entries(porUsuario)
      .map(([usuario, info]) => {
        const total = Object.values(info.incidencias).reduce((a, folios) => a + folios.length, 0)
        return { usuario, brigada: info.brigada, incidencias: info.incidencias, total }
      })
      .filter((u) => u.total > 0)
      .sort(
        (a, b) =>
          a.brigada.localeCompare(b.brigada, undefined, { numeric: true }) ||
          a.usuario.localeCompare(b.usuario),
      )
  }, [registros, semana])

  const incidenciasResumen = useMemo(() => {
    const semanaVal = semana || 3
    const registrosSemana = registros.filter(
      (r) => parseInt(r.semana, 10) === semanaVal,
    )

    const counts = {}
    for (const r of registrosSemana) {
      counts[r.incidencia] = (counts[r.incidencia] || 0) + 1
    }

    return INCIDENCIAS.map((inc) => ({
      inc,
      count: counts[inc] || 0,
    }))
  }, [registros, semana])

  const brigadas = Object.keys(avanceData.agrupado)
  if (brigadas.length === 0) return null

  const generalColor = getColor(avanceData.pctGeneral)

  const resumenIncidencias = useMemo(() => {
    const counts = {}
    let total = 0
    for (const u of usuariosIncidencias) {
      for (const [inc, folios] of Object.entries(u.incidencias)) {
        counts[inc] = (counts[inc] || 0) + folios.length
        total += folios.length
      }
    }
    return {
      counts: Object.entries(counts).sort(
        (a, b) => INCIDENCIAS.indexOf(a[0]) - INCIDENCIAS.indexOf(b[0]),
      ),
      total,
    }
  }, [usuariosIncidencias])

  const brigadasPorColor = useMemo(() => {
    const brigadas = [...new Set(usuariosIncidencias.map((u) => u.brigada))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    return brigadas.map((brigada, i) => ({
      brigada,
      color: BRIGADA_COLORS[i % BRIGADA_COLORS.length],
      usuarios: usuariosIncidencias.filter((u) => u.brigada === brigada),
    }))
  }, [usuariosIncidencias])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reporte de Avance</h3>
            <p className="text-[0.75rem] text-slate-400 mt-0.5">
              Semana <span className="font-semibold text-slate-600">{avanceData.semana}</span>
              <span className="mx-1.5 text-slate-300">|</span>
              {brigadas.length} brigada{brigadas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[0.65rem] text-slate-400 uppercase tracking-wider font-medium">Progreso General</div>
              <div className="text-[0.72rem] text-slate-500 mt-0.5">{avanceData.totalValidasGeneral} / {avanceData.totalMaxGeneral} encuestas</div>
            </div>
            <div className={`w-16 h-16 rounded-2xl ${generalColor.bg} border ${generalColor.border} flex flex-col items-center justify-center ring-1 ${generalColor.ring}`}>
              <span className={`text-xl font-extrabold ${generalColor.text} leading-none`}>{avanceData.pctGeneral}%</span>
            </div>
          </div>
        </div>
        {/* Barra general */}
        <div className="mt-4">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${generalColor.bar} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${avanceData.pctGeneral}%` }}
            />
          </div>
        </div>

      </div>

      {/* Stats row */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard label="UPMs" value={Object.values(avanceData.agrupado).reduce((s, b) => s + Object.keys(b).length, 0)} color={{ bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', ring: 'ring-blue-500/20' }} sub="visitadas" />
          <StatCard label="Validas" value={avanceData.totalValidasGeneral} color={getColor(100)} sub={`${avanceData.totalMaxGeneral} max`} />
          <StatCard label="Observadas" value={avanceData.totalObservadasGeneral} color={avanceData.totalObservadasGeneral > 0 ? getColor(10) : getColor(100)} sub="boletas" />
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
          {brigadas.map((brigada) => {
            const upms = avanceData.agrupado[brigada]
            const upmKeys = Object.keys(upms).sort()
            const totalValidasBrigada = upmKeys.reduce((s, u) => s + upms[u].validas, 0)
            const totalObservadas = upmKeys.reduce((s, u) => s + upms[u].observadas, 0)
            const totalTraslados = upmKeys.reduce((s, u) => s + upms[u].traslados, 0)
            const totalMaxBrigada = upmKeys.length * avanceData.maxPorUpm
            const pctBrigada = totalMaxBrigada > 0 ? Math.round((totalValidasBrigada / totalMaxBrigada) * 100) : 0
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

      
      {/* Incidencias table */}
      {usuariosIncidencias.length > 0 && (
        <div className="border-t border-slate-100">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <h4 className="text-[0.8rem] font-bold text-slate-700 uppercase tracking-wider">Incidencias por Usuario</h4>
              </div>
              <span className="flex flex-wrap items-center justify-end gap-1.5 max-w-[60%]">
                <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-[0.62rem] font-bold px-2.5 py-1 rounded-full">
                  {resumenIncidencias.total} en total
                </span>
                {resumenIncidencias.counts.map(([inc, count]) => {
                  const color = getIncidenciaColor(inc)
                  return (
                    <span key={inc} className={`inline-flex items-center gap-1 text-[0.6rem] font-semibold bg-white border ${color.border} ${color.text} px-2 py-1 rounded-full`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                      {inc.split(': ')[1]}: {count}
                    </span>
                  )
                })}
              </span>
            </div>

            <div className="space-y-6">
              {brigadasPorColor.map(({ brigada, color, usuarios }) => (
                <div key={brigada}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${color.bg} ring-2 ring-offset-1 ${color.bgLight}`} />
                    <h5 className={`text-[0.75rem] font-bold uppercase tracking-wider ${color.text}`}>{brigada}</h5>
                    <span className="text-[0.62rem] text-slate-400">· {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {usuarios.map((u) => (
                      <div key={u.usuario} className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-md">
                        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${color.bgLight} border ${color.border} flex items-center justify-center shrink-0`}>
                            <span className={`${color.text} font-bold text-sm`}>{getInitials(u.usuario)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[0.78rem] text-slate-900 truncate">{u.usuario}</div>
                            <span className={`inline-flex items-center ${color.chip} text-[0.58rem] font-bold px-1.5 py-0.5 rounded-md`}>
                              {u.brigada}
                            </span>
                          </div>
                          <div className="flex flex-col items-center shrink-0">
                            <span className="text-lg font-extrabold text-red-600 leading-none">{u.total}</span>
                            <span className="text-[0.55rem] text-slate-400 uppercase tracking-wider">incidencias</span>
                          </div>
                        </div>

                        <div className="p-3 space-y-2">
                          {Object.entries(u.incidencias)
                            .sort((a, b) => INCIDENCIAS.indexOf(a[0]) - INCIDENCIAS.indexOf(b[0]))
                            .map(([inc, folios]) => {
                              const incColor = getIncidenciaColor(inc)
                              return (
                                <div key={inc} className={`rounded-lg border ${incColor.border} bg-slate-50/40 p-2.5`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wide ${incColor.text}`}>
                                      <span className={`w-2 h-2 rounded-full ${incColor.dot}`} />
                                      {inc.split(': ')[1]}
                                    </span>
                                    <span className={`text-[0.65rem] font-extrabold ${incColor.text}`}>{folios.length}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {folios.map((folio) => (
                                      <span key={folio} className="font-mono font-semibold text-[0.6rem] text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                                        {folio}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ReporteAvance)
