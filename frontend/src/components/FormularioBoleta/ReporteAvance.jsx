import React, { useMemo } from 'react'
import { MAX_POR_UPM, INCIDENCIA_TRASLADO } from '../../utils/constants'

const INCIDENCIAS_EXCLUIDAS = new Set([
  '1: ENTREVISTA COMPLETA',
  '2: ENTREVISTA INCOMPLETA',
  '8: ENTREVISTA FUERA DE PERIODO',
  '9: TRASLADO',
])

function getColor(pct) {
  if (pct >= 100) return { bar: 'bg-green-600', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600', border: 'border-green-600/20' }
  if (pct >= 75) return { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-500/20' }
  if (pct >= 50) return { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-500/20' }
  if (pct > 0) return { bar: 'bg-red-600', bg: 'bg-orange-50', text: 'text-red-600', dot: 'bg-red-600', border: 'border-red-600/20' }
  return { bar: 'bg-red-600', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-600', border: 'border-red-600/20' }
}

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
      if (!agrupado[key][r.upm]) agrupado[key][r.upm] = { total: 0, validas: 0, traslados: 0, observadas: 0 }
      agrupado[key][r.upm].total++
      if (r.incidencia === INCIDENCIA_TRASLADO) {
        agrupado[key][r.upm].traslados++
      } else {
        agrupado[key][r.upm].validas++
      }
      if (r.estadoBoleta === 'OBSERVADO') {
        agrupado[key][r.upm].observadas++
      }
    }

    let totalValidasGeneral = 0
    let totalMaxGeneral = 0
    for (const brigada of Object.values(agrupado)) {
      for (const upm of Object.values(brigada)) {
        totalValidasGeneral += upm.validas
        totalMaxGeneral += MAX_POR_UPM
      }
    }

    return {
      agrupado,
      semana: SEMANA_DEFAULT,
      maxPorUpm: MAX_POR_UPM,
      totalValidasGeneral,
      totalMaxGeneral,
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
      if (INCIDENCIAS_EXCLUIDAS.has(r.incidencia)) continue
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

  const brigadas = Object.keys(avanceData.agrupado)
  if (brigadas.length === 0) return null

  const generalColor = getColor(avanceData.pctGeneral)

  return (
    <div className="p-4 sm:p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[0.95rem] font-semibold text-slate-900">
          Reporte de Avance{' '}
          <span className="font-normal text-slate-500 text-[0.8rem] ml-2">
            Semana {avanceData.semana}
          </span>
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-[0.7rem] text-slate-500">
            {avanceData.totalValidasGeneral}/{avanceData.totalMaxGeneral} registros
          </span>
          <span className={`${generalColor.bg} ${generalColor.text} px-2.5 py-0.5 rounded-full text-[0.78rem] font-bold`}>
            {avanceData.pctGeneral}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
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
              className="bg-slate-50 rounded-md px-3 py-2.5 border border-slate-200"
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[0.82rem] text-slate-900">
                    {brigada}
                  </span>
                  <span className="text-[0.68rem] text-slate-500">
                    {upmKeys.length} UPM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {totalObservadas > 0 && (
                    <span className="text-[0.65rem] text-red-600 font-semibold">
                      {totalObservadas} obs
                    </span>
                  )}
                  {totalTraslados > 0 && (
                    <span className="text-[0.65rem] text-slate-500 font-medium">
                      {totalTraslados} trasl
                    </span>
                  )}
                  <span className={`${color.bg} ${color.text} px-1.75 py-px rounded-[10px] text-[0.72rem] font-bold`}>
                    {pctBrigada}%
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-[3px] overflow-hidden mb-2">
                <div
                  className={`h-full ${color.bar} rounded-[3px] transition-[width] duration-400 ease-in-out`}
                  style={{ width: `${pctBrigada}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {upmKeys.map((upm) => {
                  const info = upms[upm]
                  const pct = Math.round((info.validas / avanceData.maxPorUpm) * 100)
                  const upmColor = getColor(pct)
                  const shortUpm = upm.length > 10 ? upm.slice(-6) : upm

                  return (
                    <div
                      key={upm}
                      title={`${upm}\nVálidas: ${info.validas}/${avanceData.maxPorUpm}\nObservadas: ${info.observadas}\nTraslados: ${info.traslados}`}
                      className={`inline-flex items-center gap-1 ${upmColor.bg} border ${upmColor.border} rounded px-1.5 py-0.5 text-[0.65rem] cursor-default`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${upmColor.dot} shrink-0`} />
                      <span className="font-semibold text-slate-600 text-[0.62rem]">
                        {shortUpm}
                      </span>
                      <span className={`${upmColor.text} font-bold text-[0.62rem]`}>
                        {info.validas}/{avanceData.maxPorUpm}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {usuariosIncidencias.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[0.95rem] font-semibold text-slate-900">
              Usuarios con Incidencias
            </span>
            <span className="text-[0.68rem] text-slate-400">
              Excluye: entrevistas y traslados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[0.72rem]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-1.5 px-2 text-[0.65rem] font-semibold text-slate-500 uppercase">#</th>
                  <th className="text-left py-1.5 px-2 text-[0.65rem] font-semibold text-slate-500 uppercase">Usuario</th>
                  <th className="text-left py-1.5 px-2 text-[0.65rem] font-semibold text-slate-500 uppercase">Brigada</th>
                  <th className="text-center py-1.5 px-2 text-[0.65rem] font-semibold text-slate-500 uppercase">Total</th>
                  <th className="text-left py-1.5 px-2 text-[0.65rem] font-semibold text-slate-500 uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosIncidencias.map((u, i) => (
                  <tr key={u.usuario} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-1.5 px-2 font-semibold text-slate-800">{u.usuario}</td>
                    <td className="py-1.5 px-2 text-slate-500">{u.brigada}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-100 text-red-700 text-[0.68rem] font-bold">
                        {u.total}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(u.incidencias).map(([inc, count]) => (
                          <span key={inc} className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[0.62rem]">
                            <span className="text-slate-400">{count}x</span>
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
      )}
    </div>
  )
}

export default React.memo(ReporteAvance)
