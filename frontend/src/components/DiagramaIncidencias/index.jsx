import { useState, useEffect, useMemo, useCallback } from 'react'
import { getComportamientoIncidencias } from '../../services/incidenciaService'
import { getBrigadas } from '../../services/brigadaService'
import { useModal } from '../../hooks/useModal'
import ModalAlert from '../ui/ModalAlert'
import { INCIDENCIAS, INCIDENCIA_COMPLETA } from '../../utils/constants'
import ExcelJS from 'exceljs/dist/exceljs.min.js'
import {
  GraficoLineas,
  GraficoBarras,
  GraficoRadar,
  GraficoEvolucionUsuario,
} from './graficos'

const SEMANA_MIN = 1
const SEMANA_MAX = 13

const BASE_ROJO = [239, 68, 68]
const BASE_VERDE = [34, 197, 94]

const PALETA = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0d9488',
  '#db2777', '#4f46e5', '#0ea5e9', '#65a30d', '#e11d48', '#854d0e',
  '#9333ea', '#ca8a04', '#0891b2', '#be185d',
]

const TIPOS_GRAFICO = [
  { value: 'linea', label: 'Líneas' },
  { value: 'barrasApiladas', label: 'Barras apiladas' },
  { value: 'barrasAgrupadas', label: 'Barras agrupadas' },
  { value: 'radar', label: 'Radar' },
]

const opcionesSemanas = Array.from(
  { length: SEMANA_MAX - SEMANA_MIN + 1 },
  (_, i) => SEMANA_MIN + i,
)

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
  const [agruparPor, setAgruparPor] = useState('usuario')
  const [tipoGrafico, setTipoGrafico] = useState('linea')
  const [incidenciasActivas, setIncidenciasActivas] = useState(() =>
    INCIDENCIAS.filter((inc) => inc !== INCIDENCIA_COMPLETA),
  )
  const [ocultos, setOcultos] = useState(() => new Set())
  const [semanaInicio, setSemanaInicio] = useState(SEMANA_MIN)
  const [semanaFin, setSemanaFin] = useState(SEMANA_MAX)
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

  const semanas = useMemo(() => {
    if (!data) return []
    const min = Math.min(semanaInicio, semanaFin)
    const max = Math.max(semanaInicio, semanaFin)
    return data.semanas.filter((s) => s >= min && s <= max)
  }, [data, semanaInicio, semanaFin])

  const getCount = useCallback(
    (usuario, incidencia, semana) => {
      if (!data || !data.data[usuario]) return 0
      return data.data[usuario][incidencia]?.[semana] || 0
    },
    [data],
  )

  const esIncidenciaActiva = useCallback(
    (inc) => incidenciasActivas.includes(inc),
    [incidenciasActivas],
  )

  const getUsuarioTotalSemana = useCallback(
    (usuario, semana) => {
      if (!data || !data.data[usuario]) return 0
      let total = 0
      for (const inc of INCIDENCIAS) {
        if (!esIncidenciaActiva(inc)) continue
        total += data.data[usuario][inc]?.[semana] || 0
      }
      return total
    },
    [data, esIncidenciaActiva],
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
        if (!esIncidenciaActiva(inc)) continue
        total += getCount(usuarioSel, inc, semana)
      }
      return total
    },
    [usuarioSel, getCount, esIncidenciaActiva],
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

  const series = useMemo(() => {
    const grupos = []
    if (!data) return grupos
    if (agruparPor === 'usuario') {
      for (const u of usuariosFiltrados) {
        grupos.push({
          key: u.usuario,
          label: u.usuario,
          sub: u.nombre || u.departamento || u.brigada || '',
        })
      }
    } else if (agruparPor === 'departamento') {
      const map = new Map()
      for (const u of usuarios) {
        const k = u.departamento || 'SIN DEPARTAMENTO'
        if (!map.has(k)) map.set(k, [])
        map.get(k).push(u)
      }
      for (const [k, list] of Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        grupos.push({ key: k, label: k, sub: `${list.length} usuario(s)`, grupo: list })
      }
    } else if (agruparPor === 'brigada') {
      const map = new Map()
      for (const u of usuarios) {
        const k = u.brigada || 'SIN BRIGADA'
        if (!map.has(k)) map.set(k, [])
        map.get(k).push(u)
      }
      for (const [k, list] of Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        grupos.push({ key: k, label: k, sub: `${list.length} usuario(s)`, grupo: list })
      }
    } else if (agruparPor === 'incidencia') {
      for (const inc of INCIDENCIAS) {
        if (!esIncidenciaActiva(inc)) continue
        grupos.push({ key: inc, label: inc, sub: '' })
      }
    }
    return grupos
  }, [data, agruparPor, usuarios, usuariosFiltrados, esIncidenciaActiva])

  const seriesConColor = useMemo(
    () => series.map((s, idx) => ({ ...s, color: s.color || PALETA[idx % PALETA.length] })),
    [series],
  )

  const totalesPorSerie = useMemo(() => {
    const map = {}
    for (const serie of series) {
      map[serie.key] = {}
      for (const s of semanas) {
        let total = 0
        if (agruparPor === 'incidencia') {
          for (const u of usuarios) total += getCount(u.usuario, serie.key, s)
        } else if (agruparPor === 'usuario') {
          total = getUsuarioTotalSemana(serie.key, s)
        } else {
          for (const u of serie.grupo) total += getUsuarioTotalSemana(u.usuario, s)
        }
        map[serie.key][s] = total
      }
    }
    return map
  }, [series, agruparPor, usuarios, semanas, getCount, getUsuarioTotalSemana])

  const seriesTotales = useMemo(() => {
    const map = {}
    for (const serie of series) {
      let total = 0
      for (const s of semanas) total += totalesPorSerie[serie.key]?.[s] || 0
      map[serie.key] = total
    }
    return map
  }, [series, totalesPorSerie, semanas])

  const seriesIncidenciaUsuario = useMemo(() => {
    return INCIDENCIAS.filter((inc) => esIncidenciaActiva(inc)).map((inc) => ({
      key: inc,
      label: inc,
      color: PALETA[INCIDENCIAS.indexOf(inc) % PALETA.length],
    }))
  }, [esIncidenciaActiva])

  const totalesIncidenciaUsuario = useMemo(() => {
    const map = {}
    for (const inc of INCIDENCIAS) {
      if (!esIncidenciaActiva(inc)) continue
      map[inc] = {}
      for (const s of semanas) map[inc][s] = getCount(usuarioSel, inc, s)
    }
    return map
  }, [esIncidenciaActiva, usuarioSel, semanas, getCount])

  const totalesSemanaUsuario = useMemo(() => {
    const map = {}
    for (const s of semanas) map[s] = totalSemanaIncidencia(s)
    return map
  }, [semanas, totalSemanaIncidencia])

  const completasSemanaUsuario = useMemo(() => {
    const map = {}
    for (const s of semanas) map[s] = getCount(usuarioSel, INCIDENCIA_COMPLETA, s)
    return map
  }, [semanas, usuarioSel, getCount])

  const cambiarAgrupar = (value) => {
    setAgruparPor(value)
    setOcultos(new Set())
  }

  const toggleSerie = useCallback((key) => {
    setOcultos((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleIncidencia = (inc) => {
    setIncidenciasActivas((prev) =>
      prev.includes(inc) ? prev.filter((i) => i !== inc) : [...prev, inc],
    )
  }

  const toggleTodasIncidencias = () => {
    setIncidenciasActivas((prev) => (prev.length === INCIDENCIAS.length ? [] : [...INCIDENCIAS]))
  }

  const todasActivas = incidenciasActivas.length === INCIDENCIAS.length

  const seleccionarPunto = useCallback(
    (key) => {
      if (agruparPor === 'usuario') {
        setUsuarioSel(key)
        setVista('incidencia')
      } else if (agruparPor === 'departamento') {
        setDepartamento(departamento === key ? '' : key)
      }
    },
    [agruparPor, departamento],
  )

  const tituloGrafica = {
    usuario: 'Evolución semanal de incidencias por usuario',
    departamento: 'Evolución semanal de incidencias por departamento',
    brigada: 'Evolución semanal de incidencias por brigada',
    incidencia: 'Evolución semanal por tipo de incidencia',
  }[agruparPor]

  const mostrarValores = series.length * semanas.length <= 40

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
              Semana inicial
            </label>
            <select
              className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[110px]"
              value={semanaInicio}
              onChange={(e) => {
                const n = Number(e.target.value)
                setSemanaInicio(n)
                if (n > semanaFin) setSemanaFin(n)
              }}
            >
              {opcionesSemanas.map((s) => (
                <option key={s} value={s}>
                  S{s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Semana final
            </label>
            <select
              className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[110px]"
              value={semanaFin}
              onChange={(e) => {
                const n = Number(e.target.value)
                setSemanaFin(n)
                if (n < semanaInicio) setSemanaInicio(n)
              }}
            >
              {opcionesSemanas.map((s) => (
                <option key={s} value={s}>
                  S{s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Agrupar por
            </label>
            <select
              className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[170px]"
              value={agruparPor}
              onChange={(e) => cambiarAgrupar(e.target.value)}
            >
              <option value="usuario">Usuario</option>
              <option value="departamento">Departamento</option>
              <option value="brigada">Brigada</option>
              <option value="incidencia">Tipo de incidencia</option>
            </select>
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

        <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase mr-1">
            Incidencia(s)
          </span>
          <button
            type="button"
            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            onClick={toggleTodasIncidencias}
          >
            {todasActivas ? 'Ninguna' : 'Todas'}
          </button>
          {INCIDENCIAS.map((inc) => {
            const activa = esIncidenciaActiva(inc)
            const esCompleta = inc === INCIDENCIA_COMPLETA
            return (
              <label
                key={inc}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] cursor-pointer select-none transition-colors ${
                  activa
                    ? esCompleta
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                  checked={activa}
                  onChange={() => toggleIncidencia(inc)}
                />
                {inc}
              </label>
            )
          })}
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
              Gráfica por Usuario
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
                <h3 className="text-sm font-semibold text-slate-800">{tituloGrafica}</h3>
                <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded">
                  Rango: S{semanaInicio} a S{semanaFin}
                </span>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                  {TIPOS_GRAFICO.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`px-3 py-1.5 text-[11px] font-semibold cursor-pointer border-none transition-colors ${
                        tipoGrafico === t.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                      onClick={() => setTipoGrafico(t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {agruparPor === 'usuario' && (
                  <input
                    type="text"
                    className="ml-auto border border-slate-300 rounded px-3 py-1.5 text-xs w-56"
                    placeholder="Buscar usuario o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                )}
              </div>
              {series.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No hay series para mostrar con los filtros seleccionados.
                </div>
              ) : (
                <div className="relative p-4">
                  <div className="h-[400px]">
                    {tipoGrafico === 'linea' && (
                      <GraficoLineas
                        semanas={semanas}
                        series={seriesConColor}
                        totales={totalesPorSerie}
                        ocultos={ocultos}
                        onSelect={
                          agruparPor === 'usuario' || agruparPor === 'departamento'
                            ? seleccionarPunto
                            : undefined
                        }
                        mostrarValores={mostrarValores}
                      />
                    )}
                    {tipoGrafico === 'barrasApiladas' && (
                      <GraficoBarras
                        semanas={semanas}
                        series={seriesConColor}
                        totales={totalesPorSerie}
                        ocultos={ocultos}
                        stacked
                        onSelect={
                          agruparPor === 'usuario' || agruparPor === 'departamento'
                            ? seleccionarPunto
                            : undefined
                        }
                      />
                    )}
                    {tipoGrafico === 'barrasAgrupadas' && (
                      <GraficoBarras
                        semanas={semanas}
                        series={seriesConColor}
                        totales={totalesPorSerie}
                        ocultos={ocultos}
                        onSelect={
                          agruparPor === 'usuario' || agruparPor === 'departamento'
                            ? seleccionarPunto
                            : undefined
                        }
                      />
                    )}
                    {tipoGrafico === 'radar' && (
                      <GraficoRadar
                        semanas={semanas}
                        series={seriesConColor}
                        totales={totalesPorSerie}
                        ocultos={ocultos}
                      />
                    )}
                  </div>
                  <div className="absolute top-4 right-4 max-h-[300px] overflow-y-auto bg-white/95 border border-slate-200 rounded-lg shadow-sm p-2 z-10 w-72">
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Leyenda</span>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                        onClick={() => setOcultos(new Set())}
                      >
                        Mostrar todas
                      </button>
                    </div>
                    {seriesConColor.map((serie) => {
                      const color = serie.color
                      const oculto = ocultos.has(serie.key)
                      return (
                        <button
                          key={serie.key}
                          type="button"
                          className={`w-full flex items-center gap-2 px-1.5 py-1 rounded text-left text-[11px] cursor-pointer transition-colors ${
                            oculto ? 'opacity-50 hover:opacity-80' : 'hover:bg-slate-100'
                          }`}
                          onClick={() => toggleSerie(serie.key)}
                          title="Clic para mostrar/ocultar esta serie"
                        >
                          <span
                            className="inline-block w-3 h-1 rounded-sm shrink-0"
                            style={{ backgroundColor: oculto ? '#cbd5e1' : color }}
                          ></span>
                          <span
                            className={`truncate flex-1 ${oculto ? 'line-through text-slate-400' : 'text-slate-700'}`}
                            title={serie.sub ? `${serie.label} — ${serie.sub}` : serie.label}
                          >
                            {serie.label}
                          </span>
                          <span className="font-mono font-semibold text-slate-800 shrink-0">
                            {seriesTotales[serie.key] ?? 0}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>Eje X: semanas · Eje Y: total de incidencias</span>
                <span>Click en la leyenda para mostrar/ocultar series</span>
                <span>Cambia entre líneas, barras apiladas/agrupadas y radar</span>
                {agruparPor === 'usuario' && (
                  <span>Click en un punto/barra para ver el detalle por incidencia</span>
                )}
                {agruparPor === 'departamento' && (
                  <span>Click en un punto/barra para filtrar por departamento</span>
                )}
              </div>
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
                        <span className="text-[11px] font-normal text-slate-500">
                          ({incidenciasActivas.length} de {INCIDENCIAS.length} incidencias activas)
                        </span>
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
                            const activa = esIncidenciaActiva(inc)
                            return (
                              <tr
                                key={inc}
                                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${activa ? '' : 'opacity-50'}`}
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
                      Evolución semanal (incidencias vs. entrevistas completas) — {usuarioSel}
                    </h3>
                    <div className="h-[320px]">
                      <GraficoEvolucionUsuario
                        semanas={semanas}
                        totalesSemana={totalesSemanaUsuario}
                        completasSemana={completasSemanaUsuario}
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">
                      Incidencias por semana (apiladas) — {usuarioSel}
                    </h3>
                    <div className="h-[320px]">
                      <GraficoBarras
                        semanas={semanas}
                        series={seriesIncidenciaUsuario}
                        totales={totalesIncidenciaUsuario}
                        ocultos={ocultos}
                        stacked
                      />
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
