import React, { useMemo } from 'react'
import { MAX_POR_UPM, INCIDENCIA_TRASLADO, INCIDENCIAS } from '../../utils/constants'

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
      const key = r.nombreEncuestador || r.usuarioEncuestador
      if (!porUsuario[key]) porUsuario[key] = { brigada: r.brigada, incidencias: {} }
      porUsuario[key].incidencias[r.incidencia] = (porUsuario[key].incidencias[r.incidencia] || 0) + 1
    }

    return Object.entries(porUsuario)
      .map(([usuario, info]) => {
        const total = Object.values(info.incidencias).reduce((a, b) => a + b, 0)
        return { usuario, brigada: info.brigada, incidencias: info.incidencias, total }
      })
      .sort((a, b) => b.total - a.total)
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
              <span className="text-[0.65rem] text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                Todos los tipos de incidencia
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-[0.72rem]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                    <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Brigada</th>
                    <th className="text-center py-2.5 px-3 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider w-16">Total</th>
                    <th className="text-left py-2.5 px-3 text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wider">Detalle de Incidencias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosIncidencias.map((u, i) => (
                    <tr key={u.usuario} className="hover:bg-slate-50/80 transition-colors duration-100">
                      <td className="py-2.5 px-3 text-slate-300 font-medium text-[0.68rem]">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{u.usuario}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[0.62rem] font-semibold px-2 py-0.5 rounded-md">
                          {u.brigada}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[0.7rem] font-bold">
                          {u.total}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(u.incidencias).map(([inc, count]) => (
                            <span key={inc} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-2 py-0.5 text-[0.62rem]">
                              <span className="font-bold text-slate-400">{count}x</span>
                              <span className="font-medium">{inc.split(': ')[1] || inc}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ReporteAvance)
