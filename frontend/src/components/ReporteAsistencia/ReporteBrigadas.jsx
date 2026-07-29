import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PanelMasivo from './PanelMasivo'
import CeldasTurno from './CeldasTurno'
import {
  getPersonalAsistencia,
  getAsistencia,
  saveAsistencia,
} from '../../services/asistenciaService'
import {
  normalizarCargo,
  getDiasSemana,
  getSemanaInfo,
  getMondayFromWeek,
  formatDateRange,
} from '../../utils/helpers'

const CELDA_CLS = 'border-r border-gray-200 p-1 text-center bg-slate-50'

export default function ReporteBrigadas({
  sessionUser,
  dias: diasProp,
  personal: personalProp,
}) {
  const semanaInicial = getSemanaInfo()
  const [semana, setSemana] = useState(semanaInicial.week)
  const [cycle, setCycle] = useState(semanaInicial.cycle)

  const monday = useMemo(() => getMondayFromWeek(semana, cycle), [semana, cycle])
  const dias = diasProp || useMemo(() => getDiasSemana(monday), [monday])

  const rawDept = sessionUser?.departamento || ''
  const userBrigadas = Array.isArray(sessionUser?.brigadas)
    ? sessionUser.brigadas
    : []
  const userDept =
    sessionUser?.rol === 'administrador'
      ? ''
      : rawDept

  const [loading, setLoading] = useState(!personalProp)
  const [saving, setSaving] = useState(false)
  const [personal, setPersonal] = useState(normalizarCargo(personalProp))
  const [asistencia, setAsistencia] = useState({})
  const [seleccionados, setSeleccionados] = useState([])
  const [brigadaSel, setBrigadaSel] = useState(
    userBrigadas.length === 1 ? userBrigadas[0] : '',
  )

  const [bulkDia, setBulkDia] = useState('lun')
  const [bulkTurno, setBulkTurno] = useState('t1')
  const [bulkEstatus, setBulkEstatus] = useState('ASISTENCIA')
  const [bulkIngreso, setBulkIngreso] = useState('08:00')
  const [bulkSalida, setBulkSalida] = useState('16:00')
  const [bulkFIngreso, setBulkFIngreso] = useState('')
  const [bulkFSalida, setBulkFSalida] = useState('')

  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState(new Set())

  const isDirtyRef = useRef(false)
  const dirtyCountRef = useRef(0)

  const markDirty = useCallback(() => {
    if (!isDirtyRef.current) {
      isDirtyRef.current = true
      setIsDirty(true)
    }
    dirtyCountRef.current += 1
  }, [])

  const markClean = useCallback(() => {
    isDirtyRef.current = false
    dirtyCountRef.current = 0
    setIsDirty(false)
  }, [])

  useEffect(() => {
    if (personalProp && personalProp.length > 0) {
      setPersonal(normalizarCargo(personalProp))
      setLoading(false)
      return
    }
    if (!sessionUser || !userDept) {
      setPersonal([])
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const params = { semana, brigada: brigadaSel || undefined }

        const [personalData, asistenciaData] = await Promise.all([
          getPersonalAsistencia(params),
          getAsistencia({ semana, brigada: brigadaSel || undefined }),
        ])

        const filtered = personalData || []

        if (sessionUser.rol !== 'administrador' && userDept) {
          filtered.forEach((p) => (p.departamento = userDept))
        }

        setPersonal(normalizarCargo(filtered))

        const asistenciaMap = {}
        ;(asistenciaData || []).forEach((r) => {
          const key = `${r.encuestador_id}_${r.dia}_${r.turno}`
          asistenciaMap[key] = {
            estatus: r.estatus,
            ingreso: r.ingreso,
            fIngreso: r.fIngreso,
            salida: r.salida,
            fSalida: r.fSalida,
            observacion: r.observacion,
          }
        })
        setAsistencia(asistenciaMap)
        markClean()
      } catch (err) {
        console.error('Error al cargar datos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionUser, brigadaSel, semana])

  useEffect(() => {
    const handler = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const handleGuardarRef = useRef(undefined)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && handleGuardarRef.current) {
        e.preventDefault()
        handleGuardarRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCellChange = (personaUid, diaId, turno, campo, valor) => {
    const key = `${personaUid}_${diaId}_${turno}`
    setAsistencia((prev) => {
      const celda = prev[key] || {
        estatus: 'N/A',
        ingreso: '',
        fIngreso: '',
        salida: '',
        fSalida: '',
        observacion: '',
      }
      const nuevaCelda = { ...celda, [campo]: valor }

      if (campo === 'estatus' && valor === 'ASISTENCIA') {
        nuevaCelda.ingreso = turno === 't1' ? '08:00' : '16:00'
        nuevaCelda.salida = turno === 't1' ? '16:00' : '00:00'
      } else if (
        campo === 'estatus' &&
        (valor === 'FALTA' || valor === 'N/A')
      ) {
        nuevaCelda.ingreso = ''
        nuevaCelda.salida = ''
        nuevaCelda.fIngreso = ''
        nuevaCelda.fSalida = ''
      }
      return { ...prev, [key]: nuevaCelda }
    })
    markDirty()
  }

  const rellenarSemana = (personaUid) => {
    setAsistencia((prev) => {
      const next = { ...prev }
      const primerDia = dias[0].id
      const t1SrcKey = `${personaUid}_${primerDia}_t1`
      const t2SrcKey = `${personaUid}_${primerDia}_t2`
      const t1Src = next[t1SrcKey]
      const t2Src = next[t2SrcKey]
      if (!t1Src && !t2Src) return prev

      for (let i = 1; i < dias.length; i++) {
        const diaId = dias[i].id
        if (t1Src) next[`${personaUid}_${diaId}_t1`] = { ...t1Src }
        if (t2Src) next[`${personaUid}_${diaId}_t2`] = { ...t2Src }
      }
      return next
    })
    markDirty()
  }

  const toggleDayCollapse = (dayId) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }

  const ejecutarAsignacionMasiva = () => {
    if (seleccionados.length === 0)
      return alert('Selecciona al menos un brigadista.')

    setAsistencia((prev) => {
      const copias = structuredClone(prev)
      seleccionados.forEach((uid) => {
        const key = `${uid}_${bulkDia}_${bulkTurno}`
        copias[key] = {
          ...(copias[key] || {}),
          estatus: bulkEstatus,
          ...(bulkEstatus === 'ASISTENCIA'
            ? {
                ingreso: bulkIngreso,
                salida: bulkSalida,
                ...(bulkFIngreso ? { fIngreso: bulkFIngreso } : {}),
                ...(bulkFSalida ? { fSalida: bulkFSalida } : {}),
              }
            : {
                ingreso: '',
                fIngreso: '',
                salida: '',
                fSalida: '',
              }),
        }
      })
      return copias
    })
    markDirty()
  }

  const personalFiltrado = useMemo(() => {
    if (!searchTerm.trim()) return personal
    const term = searchTerm.toLowerCase().trim()
    return personal.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.usuario || '').toLowerCase().includes(term),
    )
  }, [personal, searchTerm])

  const handleGuardar = async () => {
    setSaving(true)
    setSaveMessage({ text: '', type: '' })
    try {
      const records = []
      personal.forEach((p) => {
        dias.forEach((dia) => {
          ;['t1', 't2'].forEach((turno) => {
            const key = `${p.uid}_${dia.id}_${turno}`
            const celda = asistencia[key]
            if (celda && celda.estatus && celda.estatus !== 'N/A') {
              records.push({
                encuestador_id: parseInt(p.uid, 10),
                departamento: p.departamento || userDept,
                brigada: p.codBrigada,
                semana: parseInt(semana, 10),
                dia: dia.id,
                turno,
                ...celda,
              })
            }
          })
        })
      })

      if (records.length === 0) {
        setSaveMessage({
          text: 'No hay registros con estatus diferente de N/A para guardar.',
          type: 'warning',
        })
        return
      }

      await saveAsistencia({
        records,
        semana,
        departamento: userDept,
        brigada: brigadaSel,
      })
      markClean()
      setSaveMessage({
        text: `Guardado correctamente (${records.length} registros).`,
        type: 'success',
      })
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000)
    } catch (err) {
      console.error('Error al guardar:', err)
      setSaveMessage({ text: 'Error al guardar. Revisa la consola.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }
  handleGuardarRef.current = handleGuardar

  if (loading) {
    return (
      <div className="w-full p-4 text-center text-gray-400">
        Cargando reporte de asistencia...
      </div>
    )
  }

  return (
    <div className="w-full p-4 bg-slate-50 min-h-screen text-xs">
      <div className="mb-4 space-y-3">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-slate-800">Registro de Asistencia</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Semana <span className="font-semibold text-slate-700">{semana}/13</span>
                {userDept && <span> — <span className="font-semibold text-slate-700">{userDept}</span></span>}
                {brigadaSel && <span> — Brigada <span className="font-semibold text-slate-700">{brigadaSel}</span></span>}
                {sessionUser?.rol === 'administrador' && <span> — <span className="font-semibold text-slate-700">Todos los departamentos</span></span>}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <button
                onClick={() => {
                  if (semana === 1) { setSemana(13); setCycle(c => c - 1) }
                  else setSemana(s => s - 1)
                }}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                aria-label="Semana anterior"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center min-w-[160px]">
                <div className="text-xs font-bold text-slate-800">
                  <span className="bg-blue-600 text-white rounded px-1.5 py-0.5 text-[11px] mr-1">SEMANA</span>
                  {semana}/13
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formatDateRange(monday)}
                </div>
              </div>
              <button
                onClick={() => {
                  if (semana === 13) { setSemana(1); setCycle(c => c + 1) }
                  else setSemana(s => s + 1)
                }}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                aria-label="Semana siguiente"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userBrigadas.length > 0 && !personalProp && (
            <div className="flex items-center gap-2">
              <label htmlFor="brigada-sel" className="text-[11px] font-semibold uppercase text-gray-500">
                Brigada:
              </label>
              <select
                id="brigada-sel"
                value={brigadaSel}
                onChange={(e) => setBrigadaSel(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="">Todas</option>
                {userBrigadas.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 pl-6 w-48"
            />
            <svg className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex-1" />

          {isDirty && (
            <span className="text-amber-600 text-[11px] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Cambios sin guardar
            </span>
          )}

          {!personalProp && (
            <button
              onClick={handleGuardar}
              disabled={saving}
              aria-busy={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-1.5 rounded shadow transition-all text-xs flex items-center gap-1"
            >
              {saving ? 'Guardando...' : 'Guardar Asistencia'}
              <span className="text-[9px] opacity-60 ml-0.5">Ctrl+S</span>
            </button>
          )}
          {saveMessage.text && (
            <span
              role="status"
              aria-live="polite"
              className={`text-xs font-semibold ${
                saveMessage.type === 'error'
                  ? 'text-red-500'
                  : saveMessage.type === 'warning'
                    ? 'text-amber-500'
                    : 'text-green-600'
              }`}
            >
              {saveMessage.text}
            </span>
          )}
        </div>
      </div>

      {!personalProp && (
        <PanelMasivo
          dias={dias}
          seleccionadosCount={seleccionados.length}
          bulkDia={bulkDia}
          setBulkDia={setBulkDia}
          bulkTurno={bulkTurno}
          setBulkTurno={setBulkTurno}
          bulkEstatus={bulkEstatus}
          setBulkEstatus={setBulkEstatus}
          bulkIngreso={bulkIngreso}
          setBulkIngreso={setBulkIngreso}
          bulkSalida={bulkSalida}
          setBulkSalida={setBulkSalida}
          bulkFIngreso={bulkFIngreso}
          setBulkFIngreso={setBulkFIngreso}
          bulkFSalida={bulkFSalida}
          setBulkFSalida={setBulkFSalida}
          onAplicar={ejecutarAsignacionMasiva}
        />
      )}

      {personal.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-lg shadow border border-gray-200">
          No hay personal asignado{' '}
          {brigadaSel ? `a ${brigadaSel}` : 'a tus brigadas'} en la semana{' '}
          {semana}.
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-13rem)] shadow border border-gray-200 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200 table-fixed border-collapse">
            <colgroup>
              <col className="w-10" />
              <col className="w-[160px]" />
              <col className="w-[100px]" />
              {dias.map((d) => (
                <React.Fragment key={d.id}>
                  <col span={6} />
                  <col span={6} />
                </React.Fragment>
              ))}
            </colgroup>

            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-white text-center text-[11px]">
                <th
                  rowSpan="2"
                  scope="col"
                  className="sticky left-0 z-[15] border-r border-b border-slate-600 p-1 w-10 align-middle bg-slate-900"
                >
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={
                      personalFiltrado.length > 0 &&
                      seleccionados.length === personalFiltrado.length &&
                      personalFiltrado.every((p) => seleccionados.includes(p.uid))
                    }
                    onChange={() => {
                      if (seleccionados.length === personalFiltrado.length) {
                        setSeleccionados([])
                      } else {
                        setSeleccionados(personalFiltrado.map((p) => p.uid))
                      }
                    }}
                    className="rounded accent-emerald-500"
                  />
                </th>
                <th
                  rowSpan="2"
                  scope="col"
                  className="sticky left-[40px] z-[15] border-r border-b border-slate-600 px-2 py-2 align-middle w-[160px] bg-slate-900"
                >
                  NOMBRE
                </th>
                <th
                  rowSpan="2"
                  scope="col"
                  className="border-r border-b border-slate-600 px-2 py-2 align-middle w-[100px] bg-slate-900"
                >
                  USUARIO
                </th>
                {dias.map((d) => {
                  const esFinSemana = d.id === 'sab' || d.id === 'dom'
                  return (
                    <th
                      key={d.id}
                      colSpan="12"
                      scope="colgroup"
                      className={`border-r border-b border-slate-600 py-1.5 ${esFinSemana ? 'bg-amber-50' : 'bg-white'} text-slate-800 ${collapsedDays.has(d.id) ? 'hidden' : ''}`}
                    >
                      <div className="font-bold flex items-center justify-center gap-1">
                        <span>{d.nombre}</span>
                        <button
                          onClick={() => toggleDayCollapse(d.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Ocultar día"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="text-red-600 text-[10px]">{d.fecha}</div>
                    </th>
                  )
                })}
              </tr>
              <tr className="bg-slate-700">
                {dias.map((d) => (
                  <React.Fragment key={d.id}>
                    <th scope="col" className={`border-r border-b border-slate-500 w-6 py-1 text-[11px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>●</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium w-[80px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>ING</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[140px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>DETALLE INGRESO</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium w-[80px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>SAL</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[140px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>DETALLE SALIDA </th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[160px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>OBS</th>
                    <th scope="col" className={`border-r border-b border-slate-500 w-6 py-1 text-[11px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>●</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium w-[80px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>ING</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[140px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>DETALLE INGRESO </th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium w-[80px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>SAL</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[140px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>DETALLE SALIDA</th>
                    <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 text-[11px] font-medium min-w-[160px] ${collapsedDays.has(d.id) ? 'hidden' : ''}`}>OBS</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-[11px]">
              {[...personalFiltrado].sort((a, b) => {
                const cmp = (a.codBrigada || '').localeCompare(b.codBrigada || '', undefined, { numeric: true })
                if (cmp !== 0) return cmp
                return (a.usuario || '').localeCompare(b.usuario || '', undefined, { numeric: true })
              }).map((persona) => {
                const esSeleccionado = seleccionados.includes(persona.uid)
                const bgRow = esSeleccionado ? 'bg-emerald-50/60' : 'hover:bg-blue-50/40'
                const bgSticky = esSeleccionado ? 'bg-emerald-50' : 'bg-white'
                return (
                  <tr
                    key={persona.uid}
                    className={`transition-colors ${bgRow}`}
                  >
                    <td className={`${CELDA_CLS} sticky left-0 z-[5] ${bgSticky}`}>
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${persona.nombre}`}
                        checked={esSeleccionado}
                        onChange={() =>
                          setSeleccionados((prev) =>
                            prev.includes(persona.uid)
                              ? prev.filter((id) => id !== persona.uid)
                              : [...prev, persona.uid],
                          )
                        }
                      />
                    </td>
                    <td className={`sticky left-[40px] z-[5] border-r border-gray-300 px-2 py-1 font-semibold whitespace-nowrap ${bgSticky}`}>
                      <div className="flex items-center gap-1">
                        <span className="truncate">{persona.nombre}</span>
                        <button
                          onClick={() => rellenarSemana(persona.uid)}
                          className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
                          title="Copiar lunes a toda la semana"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className={`${CELDA_CLS} text-gray-500 truncate`}>
                      {persona.usuario}
                    </td>

                    {dias.map((dia) => {
                      const t1 = asistencia[
                        `${persona.uid}_${dia.id}_t1`
                      ] || { estatus: 'N/A' }
                      const t2 = asistencia[
                        `${persona.uid}_${dia.id}_t2`
                      ] || { estatus: 'N/A' }

                      return (
                        <React.Fragment key={dia.id}>
                          <CeldasTurno
                            datosTurno={t1}
                            turno="t1"
                            oculto={collapsedDays.has(dia.id)}
                            onChangeCampo={(campo, valor) =>
                              handleCellChange(
                                persona.uid,
                                dia.id,
                                't1',
                                campo,
                                valor,
                              )
                            }
                          />
                          <CeldasTurno
                            datosTurno={t2}
                            turno="t2"
                            oculto={collapsedDays.has(dia.id)}
                            onChangeCampo={(campo, valor) =>
                              handleCellChange(
                                persona.uid,
                                dia.id,
                                't2',
                                campo,
                                valor,
                              )
                            }
                          />
                        </React.Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {searchTerm && personalFiltrado.length === 0 && personal.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-xs">
          No se encontraron resultados para &quot;{searchTerm}&quot;.
        </div>
      )}
    </div>
  )
}
