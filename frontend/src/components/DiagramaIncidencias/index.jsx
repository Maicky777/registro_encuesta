import { useState, useEffect, useMemo, useCallback } from 'react'
import { getComportamientoIncidencias } from '../../services/incidenciaService'
import { getBrigadas } from '../../services/brigadaService'
import { useModal } from '../../hooks/useModal'
import ModalAlert from '../ui/ModalAlert'
import { INCIDENCIAS, INCIDENCIA_COMPLETA } from '../../utils/constants'
import ExcelJS from 'exceljs/dist/exceljs.min.js'

const SEMANA_MIN = 1
const SEMANA_MAX = 13

const BASE_ROJO = [239, 68, 68]
const BASE_AZUL = [59, 130, 246]
const BASE_VERDE = [34, 197, 94]

function colorScale(value, max, base = BASE_ROJO) {
  if (!value || value <= 0 || !max) {
    return { bg: 'transparent', fg: '#94a3b8' }
  }
  const ratio = Math.min(value / max, 1)
  const alpha = 0.15 + ratio * 0.8
  const dark = ratio > 0.5
  return {
    bg: `rgba(${base[0]}, ${base[1]}, ${base[2]}, ${alpha})`,
    fg: dark ? '#ffffff' : '#334155',
  }
}

export default function DiagramaIncidencias({ sessionUser }) {
  const { alertModal, showAlert, closeAlert } = useModal()

  const [departamento, setDepartamento] = useState('')
  const [brigadas, setBrigadas] = useState([])
  const [brigada, setBrigada] = useState('')
  const [usuarioSel, setUsuarioSel] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState('usuario')
  const [excluirCompleta, setExcluirCompleta] = useState(true)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (departamento) {
      getBrigadas(departamento).then(setBrigadas).catch(() => {})
      setBrigada('')
    } else {
      setBrigadas([])
      setBrigada('')
    }
  }, [departamento])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (departamento) params.departamento = departamento
      if (brigada) params.brigada = brigada
      const result = await getComportamientoIncidencias(params)
      setData(result)
      setUsuarioSel((prev) => {
        if (result.usuarios.some((u) => u.usuario === prev)) return prev
        return result.usuarios[0]?.usuario || ''
      })
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [departamento, brigada])

  useEffect(() => {
    cargar()
  }, [cargar])

  const departamentoOptions = useMemo(() => {
    if (!data) return []
    const set = new Set(data.usuarios.map((u) => u.departamento).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const usuarios = useMemo(() => {
    if (!data) return []
    let list = data.usuarios
    if (departamento) list = list.filter((u) => u.departamento === departamento)
    if (brigada) list = list.filter((u) => u.brigada === brigada)
    return list
  }, [data, departamento, brigada])

  const semanas = useMemo(() => data?.semanas || [], [data])

  const getCount = useCallback(
    (usuario, incidencia, semana) => {
      if (!data || !data.data[usuario]) return 0
      return data.data[usuario][incidencia]?.[semana] || 0
    },
    [data],
  )

  const getUsuarioTotalSemana = useCallback(
    (usuario, semana) => {
      if (!data || !data.data[usuario]) return 0
      let total = 0
      for (const inc of INCIDENCIAS) {
        if (excluirCompleta && inc === INCIDENCIA_COMPLETA) continue
        total += data.data[usuario][inc]?.[semana] || 0
      }
      return total
    },
    [data, excluirCompleta],
  )

  const getUsuarioTotalIncidencia = useCallback(
    (usuario, incidencia) => {
      if (!data || !data.data[usuario]) return 0
      const bySemana = data.data[usuario][incidencia] || {}
      return semanas.reduce((acc, s) => acc + (bySemana[s] || 0), 0)
    },
    [data, semanas],
  )

  const getUsuarioGranTotal = useCallback(
    (usuario) => {
      return semanas.reduce((acc, s) => acc + getUsuarioTotalSemana(usuario, s), 0)
    },
    [semanas, getUsuarioTotalSemana],
  )

  const getUsuarioTotalCompleto = useCallback(
    (usuario) => {
      if (!data || !data.data[usuario]) return 0
      return semanas.reduce((acc, s) => acc + (data.data[usuario][INCIDENCIA_COMPLETA]?.[s] || 0), 0)
    },
    [data, semanas],
  )

  const maxUsuarioSemana = useMemo(() => {
    let max = 0
    for (const u of usuarios) {
      for (const s of semanas) {
        max = Math.max(max, getUsuarioTotalSemana(u.usuario, s))
      }
    }
    return max
  }, [usuarios, semanas, getUsuarioTotalSemana])

  const maxIncidenciaSemana = useMemo(() => {
    let max = 0
    for (const inc of INCIDENCIAS) {
      for (const s of semanas) {
        max = Math.max(max, getCount(usuarioSel, inc, s))
      }
    }
    return max
  }, [usuarioSel, semanas, getCount])

  const totalSemanaIncidencia = useCallback(
    (semana) => {
      let total = 0
      for (const inc of INCIDENCIAS) {
        if (excluirCompleta && inc === INCIDENCIA_COMPLETA) continue
        total += getCount(usuarioSel, inc, semana)
      }
      return total
    },
    [usuarioSel, getCount, excluirCompleta],
  )

  const totalMaxSemanaIncidencia = useMemo(() => {
    let max = 0
    for (const s of semanas) {
      max = Math.max(max, totalSemanaIncidencia(s))
    }
    return max
  }, [semanas, totalSemanaIncidencia])

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return usuarios
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter(
      (u) =>
        (u.usuario || '').toLowerCase().includes(q) ||
        (u.nombre || '').toLowerCase().includes(q),
    )
  }, [usuarios, busqueda])

  const usuarioActual = useMemo(() => {
    return data?.usuarios.find((u) => u.usuario === usuarioSel) || null
  }, [data, usuarioSel])

  const evolucionSemanal = useMemo(() => {
    if (!usuarioSel) return []
    return semanas.map((s) => ({ semana: s, total: getUsuarioTotalSemana(usuarioSel, s) }))
  }, [semanas, usuarioSel, getUsuarioTotalSemana])

  const maxEvolucion = useMemo(() => {
    let max = 0
    for (const e of evolucionSemanal) max = Math.max(max, e.total)
    return max
  }, [evolucionSemanal])

  const exportarExcel = async () => {
    if (!data || usuarios.length === 0) {
      showAlert('No hay datos para exportar.', 'warning')
      return
    }

    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Sistema ECE - Diagrama de Incidencias'

      if (vista === 'usuario') {
        const sheet = workbook.addWorksheet('Matriz por Usuario')
        const headers = ['#', 'USUARIO', 'NOMBRE', 'DEPARTAMENTO', 'BRIGADA', ...semanas.map((s) => `S${s}`), 'TOTAL']
        sheet.columns = headers.map((h) => ({ header: h, width: h.startsWith('S') ? 7 : 18 }))
        usuariosFiltrados.forEach((u, i) => {
          const row = [i + 1, u.usuario, u.nombre, u.departamento, u.brigada]
          let total = 0
          for (const s of semanas) {
            const v = getUsuarioTotalSemana(u.usuario, s)
            row.push(v)
            total += v
          }
          row.push(total)
          sheet.addRow(row)
        })
      } else {
        if (!usuarioSel) {
          showAlert('Seleccione un usuario para exportar el detalle.', 'warning')
          return
        }
        const sheet = workbook.addWorksheet(`Detalle ${usuarioSel}`)
        const headers = ['INCIDENCIA', ...semanas.map((s) => `S${s}`), 'TOTAL']
        sheet.columns = headers.map((h) => ({ header: h, width: h.startsWith('S') ? 7 : 30 }))
        INCIDENCIAS.forEach((inc) => {
          const row = [inc]
          for (const s of semanas) row.push(getCount(usuarioSel, inc, s))
          row.push(getUsuarioTotalIncidencia(usuarioSel, inc))
          sheet.addRow(row)
        })
        sheet.addRow(['TOTAL', ...semanas.map((s) => totalSemanaIncidencia(s)), getUsuarioGranTotal(usuarioSel)])
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Diagrama_Incidencias_${vista}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showAlert('Reporte Excel generado correctamente.', 'success')
    } catch (err) {
      showAlert('Error al generar Excel: ' + err.message, 'error')
    }
  }

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Departamento
            </label>
            <select
              className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[160px]"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            >
              <option value="">TODOS</option>
              {departamentoOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Brigada
            </label>
            <select
              className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[160px]"
              value={brigada}
              onChange={(e) => setBrigada(e.target.value)}
              disabled={!departamento}
            >
              <option value="">TODAS LAS BRIGADAS</option>
              {brigadas.map((b) => (
                <option key={b.id} value={b.nombre}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Semanas
            </label>
            <span className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-slate-50 text-slate-600">
              S{SEMANA_MIN} a S{SEMANA_MAX}
            </span>
          </div>
          <div className="flex items-center gap-1.5 py-1.5">
            <input
              id="excluir-completa"
              type="checkbox"
              className="accent-blue-600 w-4 h-4 cursor-pointer"
              checked={excluirCompleta}
              onChange={(e) => setExcluirCompleta(e.target.checked)}
            />
            <label htmlFor="excluir-completa" className="text-xs font-medium text-slate-600 cursor-pointer">
              Excluir ENTREVISTA COMPLETA (1)
            </label>
          </div>
          <div className="flex flex-col ml-auto">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Usuarios con boletas
            </label>
            <span className="text-sm font-bold text-slate-700">
              {usuarios.length} en el filtro
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center mt-4 border-t border-slate-100 pt-3">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              className={`px-4 py-1.5 text-xs font-semibold cursor-pointer border-none transition-colors ${
                vista === 'usuario'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setVista('usuario')}
            >
              Matriz por Usuario
            </button>
            <button
              className={`px-4 py-1.5 text-xs font-semibold cursor-pointer border-none transition-colors ${
                vista === 'incidencia'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setVista('incidencia')}
            >
              Detalle por Incidencia
            </button>
          </div>
          <button
            className="bg-slate-600 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={cargar}
            disabled={loading}
          >
            Recargar
          </button>
          <button
            className="bg-green-700 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-green-800 transition-colors disabled:opacity-50"
            onClick={exportarExcel}
            disabled={loading || usuarios.length === 0}
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3 mb-4">
          Error al cargar datos: {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12 text-slate-400 text-sm">
          Cargando comportamiento de incidencias...
        </div>
      )}

      {!loading && !error && data && (
        <>
          {vista === 'usuario' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Matriz de comportamiento por usuario (total de incidencias por semana)
                </h3>
                <input
                  type="text"
                  className="ml-auto border border-slate-300 rounded px-3 py-1.5 text-xs w-56"
                  placeholder="Buscar usuario o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle w-8">#</th>
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[90px]">USUARIO</th>
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[120px]">NOMBRE</th>
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[110px]">DEPARTAMENTO</th>
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[80px]">BRIGADA</th>
                      {semanas.map((s) => (
                        <th
                          key={s}
                          className="border border-slate-700 px-1 py-1 text-[10px] align-middle bg-blue-800 min-w-[34px]"
                        >
                          S{s}
                        </th>
                      ))}
                      <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle bg-slate-900 min-w-[60px]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={5 + semanas.length + 1} className="text-center py-10 text-slate-400 text-sm">
                          No hay usuarios con boletas registradas para los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map((u, idx) => {
                        const total = getUsuarioGranTotal(u.usuario)
                        return (
                          <tr key={u.usuario} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-200 px-1.5 py-1 text-xs text-center font-mono">{idx + 1}</td>
                            <td
                              className="border border-slate-200 px-1.5 py-1 text-xs font-mono text-blue-700 cursor-pointer hover:underline whitespace-nowrap"
                              title="Ver detalle por incidencia"
                              onClick={() => {
                                setUsuarioSel(u.usuario)
                                setVista('incidencia')
                              }}
                            >
                              {u.usuario}
                            </td>
                            <td className="border border-slate-200 px-1.5 py-1 text-xs whitespace-nowrap">{u.nombre || '-'}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-xs whitespace-nowrap">{u.departamento || '-'}</td>
                            <td className="border border-slate-200 px-1.5 py-1 text-xs text-center whitespace-nowrap">{u.brigada || '-'}</td>
                            {semanas.map((s) => {
                              const v = getUsuarioTotalSemana(u.usuario, s)
                              const cs = colorScale(v, maxUsuarioSemana, BASE_AZUL)
                              return (
                                <td
                                  key={s}
                                  className="border border-slate-200 px-1 py-1 text-[11px] text-center font-mono"
                                  style={{ backgroundColor: cs.bg, color: cs.fg }}
                                >
                                  {v || ''}
                                </td>
                              )
                            })}
                            <td className="border border-slate-200 px-1.5 py-1 text-xs text-center font-bold bg-slate-100">
                              {total}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {usuariosFiltrados.length > 0 && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-4 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: `rgba(${BASE_AZUL.join(', ')}, 0.3)` }}></span>
                    Baja
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: `rgba(${BASE_AZUL.join(', ')}, 0.9)` }}></span>
                    Alta
                  </span>
                  <span>Click en un usuario para ver el detalle por incidencia.</span>
                </div>
              )}
            </div>
          )}

          {vista === 'incidencia' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                      Usuario
                    </label>
                    <select
                      className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[200px]"
                      value={usuarioSel}
                      onChange={(e) => setUsuarioSel(e.target.value)}
                    >
                      {usuarios.map((u) => (
                        <option key={u.usuario} value={u.usuario}>
                          {u.usuario} - {u.nombre || u.brigada || u.departamento}
                        </option>
                      ))}
                    </select>
                  </div>
                  {usuarioActual && (
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded">Nombre: <strong>{usuarioActual.nombre || '-'}</strong></span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded">Departamento: <strong>{usuarioActual.departamento || '-'}</strong></span>
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded">Brigada: <strong>{usuarioActual.brigada || '-'}</strong></span>
                      <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded">Entrevistas completas: <strong>{getUsuarioTotalCompleto(usuarioSel)}</strong></span>
                      <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded">Incidencias: <strong>{getUsuarioGranTotal(usuarioSel)}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {usuarioSel && (
                <>
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Incidencias por semana — {usuarioSel}
                        {excluirCompleta ? ' (sin ENTREVISTA COMPLETA)' : ''}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[180px]">INCIDENCIA</th>
                            {semanas.map((s) => (
                              <th key={s} className="border border-slate-700 px-1 py-1 text-[10px] align-middle bg-red-900 min-w-[34px]">
                                S{s}
                              </th>
                            ))}
                            <th className="border border-slate-700 px-1.5 py-1 text-xs align-middle bg-slate-900 min-w-[60px]">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {INCIDENCIAS.map((inc, idx) => {
                            const totalInc = getUsuarioTotalIncidencia(usuarioSel, inc)
                            const esCompleta = inc === INCIDENCIA_COMPLETA
                            return (
                              <tr
                                key={inc}
                                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${esCompleta ? 'opacity-60' : ''}`}
                              >
                                <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${esCompleta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {inc}
                                  </span>
                                </td>
                                {semanas.map((s) => {
                                  const v = getCount(usuarioSel, inc, s)
                                  const cs = colorScale(v, maxIncidenciaSemana, esCompleta ? BASE_VERDE : BASE_ROJO)
                                  return (
                                    <td
                                      key={s}
                                      className="border border-slate-200 px-1 py-1 text-[11px] text-center font-mono"
                                      style={{ backgroundColor: cs.bg, color: cs.fg }}
                                    >
                                      {v || ''}
                                    </td>
                                  )
                                })}
                                <td className="border border-slate-200 px-1.5 py-1 text-xs text-center font-bold bg-slate-100">
                                  {totalInc}
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="bg-slate-800 text-white">
                            <td className="border border-slate-700 px-1.5 py-1 text-xs font-semibold align-middle">TOTAL</td>
                            {semanas.map((s) => {
                              const v = totalSemanaIncidencia(s)
                              const cs = colorScale(v, totalMaxSemanaIncidencia, BASE_ROJO)
                              return (
                                <td
                                  key={s}
                                  className="border border-slate-700 px-1 py-1 text-[11px] text-center font-bold font-mono"
                                  style={{ backgroundColor: cs.bg, color: cs.fg }}
                                >
                                  {v || ''}
                                </td>
                              )
                            })}
                            <td className="border border-slate-700 px-1.5 py-1 text-xs text-center font-bold bg-slate-900 text-white">
                              {getUsuarioGranTotal(usuarioSel)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: `rgba(${BASE_ROJO.join(', ')}, 0.3)` }}></span>
                        Baja
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: `rgba(${BASE_ROJO.join(', ')}, 0.9)` }}></span>
                        Alta
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">
                      Diagrama de evolución semanal — {usuarioSel}
                    </h3>
                    <div className="flex items-end gap-1 h-44 px-2">
                      {evolucionSemanal.map((e) => {
                        const pct = maxEvolucion ? (e.total / maxEvolucion) * 100 : 0
                        return (
                          <div key={e.semana} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                            <span className="text-[10px] font-semibold text-slate-600">{e.total || ''}</span>
                            <div
                              className="w-full rounded-t bg-blue-600 transition-all"
                              style={{ height: `${Math.max(pct, 2)}%` }}
                            ></div>
                            <span className="text-[9px] text-slate-400">S{e.semana}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {!usuarioSel && (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center text-slate-400 text-sm">
                  No hay usuarios para los filtros seleccionados.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !error && !data && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 text-center text-slate-400 text-sm">
          No hay datos disponibles.
        </div>
      )}

      <ModalAlert show={alertModal.show} message={alertModal.message} type={alertModal.type} onClose={closeAlert} />
    </div>
  )
}
