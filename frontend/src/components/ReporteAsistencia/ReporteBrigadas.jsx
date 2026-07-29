import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import PanelMasivo from './PanelMasivo'
import CeldasTurno from './CeldasTurno'
import SemanaNavigator from './SemanaNavigator'
import Toolbar from './Toolbar'
import DayTabs from './DayTabs'
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

  const monday = useMemo(
    () => getMondayFromWeek(semana, cycle),
    [semana, cycle],
  )
  const computedDias = useMemo(() => getDiasSemana(monday), [monday])
  const dias = diasProp || computedDias

  const rawDept = sessionUser?.departamento || ''
  const userBrigadas = Array.isArray(sessionUser?.brigadas)
    ? sessionUser.brigadas
    : []
  const userDept = sessionUser?.rol === 'administrador' ? '' : rawDept

  const [loading, setLoading] = useState(!personalProp)
  const [saving, setSaving] = useState(false)
  const [personal, setPersonal] = useState(normalizarCargo(personalProp))
  const [asistencia, setAsistencia] = useState({})
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [brigadaSel, setBrigadaSel] = useState(
    userBrigadas.length === 1 ? userBrigadas[0] : '',
  )

  const [bulk, setBulk] = useState({
    dia: 'lun',
    turno: 't1',
    estatus: 'ASISTENCIA',
    ingreso: '',
    salida: '',
    fIngreso: '',
    fSalida: '',
    observacion: '',
  })

  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [selectedDay, setSelectedDay] = useState(dias[0]?.id || 'lun')
  const [showTurno2, setShowTurno2] = useState(false)

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

  const handleBulkChange = useCallback((field, value) => {
    setBulk((prev) => ({ ...prev, [field]: value }))
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

        const filtered = (personalData || []).map((p) => {
          if (sessionUser.rol !== 'administrador' && userDept) {
            return { ...p, departamento: userDept }
          }
          return p
        })

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

  const handleGuardarRef = useRef()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleGuardarRef.current?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getPaso = (t1, t2) => {
    if (!t1.ingreso) return 1
    if (!t1.salida) return 2
    if (!t2.ingreso) return 3
    if (!t2.salida) return 4
    return 5
  }

  const esCampoPermitido = (paso, turno, campo) => {
    if (turno === 't1') {
      if (paso === 1) return ['estatus', 'ingreso', 'fIngreso'].includes(campo)
      return true
    }
    if (turno === 't2') {
      if (paso <= 2) return false
      if (paso === 3) return ['estatus', 'ingreso', 'fIngreso'].includes(campo)
      return true
    }
    return true
  }

  const handleCellChange = (personaUid, diaId, turno, campo, valor) => {
    const key = `${personaUid}_${diaId}_${turno}`
    setAsistencia((prev) => {
      const t1 = prev[`${personaUid}_${diaId}_t1`] || { estatus: 'N/A', ingreso: '', fIngreso: '', salida: '', fSalida: '', observacion: '' }
      const t2 = prev[`${personaUid}_${diaId}_t2`] || { estatus: 'N/A', ingreso: '', fIngreso: '', salida: '', fSalida: '', observacion: '' }
      const paso = getPaso(t1, t2)
      if (!esCampoPermitido(paso, turno, campo)) return prev

      const celda = prev[key] || {
        estatus: 'N/A',
        ingreso: '',
        fIngreso: '',
        salida: '',
        fSalida: '',
        observacion: '',
      }

      const nuevaCelda = { ...celda, [campo]: valor }

      if (
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

  const ejecutarAsignacionMasiva = () => {
    if (seleccionados.size === 0)
      return alert('Selecciona al menos un brigadista.')

    if (bulk.estatus === 'ASISTENCIA' && !bulk.ingreso && bulk.salida) {
      return alert('No se puede asignar hora de salida sin hora de ingreso.')
    }

    setAsistencia((prev) => {
      const copias = JSON.parse(JSON.stringify(prev))
      seleccionados.forEach((uid) => {
        const key = `${uid}_${bulk.dia}_${bulk.turno}`
        copias[key] = {
          ...(copias[key] || {}),
          estatus: bulk.estatus,
          ...(bulk.observacion ? { observacion: bulk.observacion } : {}),
          ...(bulk.estatus === 'ASISTENCIA'
            ? {
                ingreso: bulk.ingreso,
                salida: bulk.salida,
                ...(bulk.fIngreso ? { fIngreso: bulk.fIngreso } : {}),
                ...(bulk.fSalida ? { fSalida: bulk.fSalida } : {}),
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
    setBulk({
      dia: 'lun',
      turno: 't1',
      estatus: 'ASISTENCIA',
      ingreso: '',
      salida: '',
      fIngreso: '',
      fSalida: '',
      observacion: '',
    })
    setSeleccionados(new Set())
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
      const records = personal.flatMap((p) =>
        dias.flatMap((dia) =>
          ['t1', 't2'].flatMap((turno) => {
            const key = `${p.uid}_${dia.id}_${turno}`
            const celda = asistencia[key]
            if (celda && celda.estatus && celda.estatus !== 'N/A') {
              return [
                {
                  encuestador_id: parseInt(p.uid, 10),
                  departamento: p.departamento || userDept,
                  brigada: p.codBrigada,
                  semana: parseInt(semana, 10),
                  dia: dia.id,
                  turno,
                  ...celda,
                },
              ]
            }
            return []
          }),
        ),
      )

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
      setSaveMessage({
        text: 'Error al guardar. Revisa la consola.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    handleGuardarRef.current = handleGuardar
  })

  const handleSemanaChange = useCallback((newSemana, newCycle) => {
    setSemana(newSemana)
    setCycle(newCycle)
  }, [])

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
              <h1 className="text-sm font-bold text-slate-800">
                Registro de Asistencia
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Semana{' '}
                <span className="font-semibold text-slate-700">
                  {semana}/13
                </span>
                {userDept && (
                  <span>
                    {' '}
                    —{' '}
                    <span className="font-semibold text-slate-700">
                      {userDept}
                    </span>
                  </span>
                )}
                {brigadaSel && (
                  <span>
                    {' '}
                    — Brigada{' '}
                    <span className="font-semibold text-slate-700">
                      {brigadaSel}
                    </span>
                  </span>
                )}
                {sessionUser?.rol === 'administrador' && (
                  <span>
                    {' '}
                    —{' '}
                    <span className="font-semibold text-slate-700">
                      Todos los departamentos
                    </span>
                  </span>
                )}
              </p>
            </div>
            <SemanaNavigator
              semana={semana}
              cycle={cycle}
              onChange={handleSemanaChange}
              dateRange={formatDateRange(monday)}
            />
          </div>
        </div>

        <Toolbar
          userBrigadas={userBrigadas}
          brigadaSel={brigadaSel}
          onBrigadaChange={setBrigadaSel}
          personalProp={personalProp}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isDirty={isDirty}
          saving={saving}
          onGuardar={handleGuardar}
          saveMessage={saveMessage}
        />
      </div>

      {!personalProp && (
        <PanelMasivo
          dias={dias}
          seleccionadosCount={seleccionados.size}
          bulk={bulk}
          onBulkChange={handleBulkChange}
          onAplicar={ejecutarAsignacionMasiva}
        />
      )}

      <div className="mb-3 space-y-2">
        <DayTabs
          dias={dias}
          selectedDay={selectedDay}
          onSelect={(day) => {
            setSelectedDay(day)
            setBulk((prev) => ({ ...prev, dia: day }))
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTurno2((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              showTurno2
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300 shadow-sm'
                : 'bg-white text-slate-500 border-gray-200 hover:bg-slate-50'
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showTurno2 ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Turno 2 {showTurno2 ? 'visible' : '(opcional)'}
          </button>
          {showTurno2 && (
            <span className="text-[10px] text-indigo-400 italic">
              Si trabajaron corrido hasta la tarde, deja este turno sin llenar
            </span>
          )}
        </div>
      </div>

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
              <col className="w-40" />
              <col className="w-20" />
              <col span={7} />
              <col span={7} />
            </colgroup>

            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-700 text-white text-center text-[11px]">
                <th scope="col" className="sticky left-0 z-[15] border-r border-b border-slate-600 p-1 w-10 bg-slate-700">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={
                      personalFiltrado.length > 0 &&
                      seleccionados.size === personalFiltrado.length &&
                      personalFiltrado.every((p) =>
                        seleccionados.has(p.uid),
                      )
                    }
                    onChange={() => {
                      if (seleccionados.size === personalFiltrado.length) {
                        setSeleccionados(new Set())
                      } else {
                        setSeleccionados(new Set(personalFiltrado.map((p) => p.uid)))
                      }
                    }}
                    className="rounded accent-emerald-500"
                  />
                </th>
                <th scope="col" className="sticky left-10 z-15 border-r border-b border-slate-600 px-2 py-2 text-left w-40 bg-slate-700">
                  NOMBRE
                </th>
                <th scope="col" className="border-r border-b border-slate-600 px-2 py-2 text-center w-20 bg-slate-700 text-[11px] font-medium">
                  USR
                </th>

                {/* ---- TURNO 1 ---- */}
                <th scope="col" className="border-r border-b border-slate-500 w-6 py-1" title="Estado T1">●</th>
                <th scope="col" className="border-r border-b border-slate-500 px-1 py-1 font-medium w-20">
                  <span className="block text-[8px] uppercase tracking-wider text-indigo-200 leading-tight">Ingreso</span>
                  <span>ING</span>
                </th>
                <th scope="col" className="border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[110px]">
                  <span className="block text-[8px] uppercase tracking-wider text-indigo-200 leading-tight">Ingreso</span>
                  <span>FOTO</span>
                </th>
                <th scope="col" className="border-r border-b border-slate-500 w-6 py-1 text-indigo-300">
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </th>
                <th scope="col" className="border-r border-b border-slate-500 px-1 py-1 font-medium w-20">
                  <span className="block text-[8px] uppercase tracking-wider text-amber-200 leading-tight">Salida</span>
                  <span>SAL</span>
                </th>
                <th scope="col" className="border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[110px]">
                  <span className="block text-[8px] uppercase tracking-wider text-amber-200 leading-tight">Salida</span>
                  <span>FOTO</span>
                </th>
                <th scope="col" className="border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[140px]">OBS</th>

                {/* ---- TURNO 2 ---- */}
                <th scope="col" className={`border-l-2 border-l-indigo-300 border-r border-b border-slate-500 w-6 py-1 ${!showTurno2 ? 'hidden' : ''}`} title="Estado T2">●</th>
                <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 font-medium w-20 ${!showTurno2 ? 'hidden' : ''}`}>
                  <span className="block text-[8px] uppercase tracking-wider text-indigo-200 leading-tight">Ingreso</span>
                  <span>ING</span>
                </th>
                <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[110px] ${!showTurno2 ? 'hidden' : ''}`}>
                  <span className="block text-[8px] uppercase tracking-wider text-indigo-200 leading-tight">Ingreso</span>
                  <span>FOTO</span>
                </th>
                <th scope="col" className={`border-r border-b border-slate-500 w-6 py-1 text-indigo-300 ${!showTurno2 ? 'hidden' : ''}`}>
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </th>
                <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 font-medium w-20 ${!showTurno2 ? 'hidden' : ''}`}>
                  <span className="block text-[8px] uppercase tracking-wider text-amber-200 leading-tight">Salida</span>
                  <span>SAL</span>
                </th>
                <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[110px] ${!showTurno2 ? 'hidden' : ''}`}>
                  <span className="block text-[8px] uppercase tracking-wider text-amber-200 leading-tight">Salida</span>
                  <span>FOTO</span>
                </th>
                <th scope="col" className={`border-r border-b border-slate-500 px-1 py-1 font-medium min-w-[140px] ${!showTurno2 ? 'hidden' : ''}`}>OBS</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-[11px]">
              {[...personalFiltrado]
                .sort((a, b) => {
                  const cmp = (a.codBrigada || '').localeCompare(
                    b.codBrigada || '',
                    undefined,
                    { numeric: true },
                  )
                  if (cmp !== 0) return cmp
                  return (a.usuario || '').localeCompare(
                    b.usuario || '',
                    undefined,
                    { numeric: true },
                  )
                })
                .map((persona) => {
                  const esSeleccionado = seleccionados.has(persona.uid)
                  const bgRow = esSeleccionado
                    ? 'bg-emerald-50/60'
                    : 'hover:bg-blue-50/40'
                  const bgSticky = esSeleccionado ? 'bg-emerald-50' : 'bg-white'

                  const t1 = asistencia[
                    `${persona.uid}_${selectedDay}_t1`
                  ] || { estatus: 'N/A', ingreso: '', fIngreso: '', salida: '', fSalida: '', observacion: '' }
                  const t2 = asistencia[
                    `${persona.uid}_${selectedDay}_t2`
                  ] || { estatus: 'N/A', ingreso: '', fIngreso: '', salida: '', fSalida: '', observacion: '' }
                  const paso = getPaso(t1, t2)

                  return (
                    <tr
                      key={persona.uid}
                      className={`transition-colors ${bgRow}`}
                    >
                      <td
                        className={`${CELDA_CLS} sticky left-0 z-[5] ${bgSticky}`}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${persona.nombre}`}
                          checked={esSeleccionado}
                          onChange={() =>
                            setSeleccionados((prev) => {
                              const next = new Set(prev)
                              if (next.has(persona.uid)) {
                                next.delete(persona.uid)
                              } else {
                                next.add(persona.uid)
                              }
                              return next
                            })
                          }
                        />
                      </td>
                      <td
                        className={`sticky left-[40px] z-[5] border-r border-gray-300 px-2 py-1 font-semibold whitespace-nowrap ${bgSticky}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate">{persona.nombre}</span>
                          <button
                            onClick={() => rellenarSemana(persona.uid)}
                            className="text-blue-400 hover:text-blue-600 transition-colors shrink-0"
                            title="Copiar lunes a toda la semana"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className={`${CELDA_CLS} text-gray-500 truncate text-[10px]`}>
                        {persona.usuario}
                      </td>

                      <CeldasTurno
                        datosTurno={t1}
                        turno="t1"
                        paso={paso}
                        oculto={false}
                        onChangeCampo={(campo, valor) =>
                          handleCellChange(
                            persona.uid,
                            selectedDay,
                            't1',
                            campo,
                            valor,
                          )
                        }
                      />
                      <CeldasTurno
                        datosTurno={t2}
                        turno="t2"
                        paso={paso}
                        primero={showTurno2}
                        oculto={!showTurno2}
                        onChangeCampo={(campo, valor) =>
                          handleCellChange(
                            persona.uid,
                            selectedDay,
                            't2',
                            campo,
                            valor,
                          )
                        }
                      />
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

ReporteBrigadas.propTypes = {
  sessionUser: PropTypes.shape({
    departamento: PropTypes.string,
    rol: PropTypes.string,
    brigadas: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
  }),
  dias: PropTypes.array,
  personal: PropTypes.array,
}
