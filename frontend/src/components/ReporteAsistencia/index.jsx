import { useState, useEffect, useCallback } from 'react'
import { useModal } from '../../hooks/useModal'
import { getBrigadas } from '../../services/brigadaService'
import { getPersonalAsistencia, getAsistencia, saveAsistencia } from '../../services/asistenciaService'
import ModalAlert from '../ui/ModalAlert'
import ModalConfirm from '../ui/ModalConfirm'
import { DEPARTAMENTOS } from '../../utils/constants'
import ExcelJS from 'exceljs/dist/exceljs.min.js'

const METODOS_VERIFICACION = [
  'FOTOGRAFIA GRUPAL Y PUNTO',
  'FOTOGRAFIA PERSONAL Y PUNTO',
  'SOLO FOTOGRAFIA',
  'SOLO PUNTO',
  'SIN SEÑAL',
  'S/R',
]

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

function getDiaFecha(semana, diaIndex) {
  const year = new Date().getFullYear()
  const target = new Date(year, 0, 1 + (semana - 1) * 7)
  const dow = target.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  target.setDate(target.getDate() + diff + diaIndex)
  const dd = String(target.getDate()).padStart(2, '0')
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  return `${DIAS[diaIndex]} (${dd}/${mm}/${year})`
}

function getDiaFechaShort(diaIndex, semana) {
  const year = new Date().getFullYear()
  const target = new Date(year, 0, 1 + (semana - 1) * 7)
  const dow = target.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  target.setDate(target.getDate() + diff + diaIndex)
  const dd = String(target.getDate()).padStart(2, '0')
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

export default function ReporteAsistencia({ sessionUser }) {
  const { alertModal, confirmModal, showAlert, closeAlert, showConfirm, confirmAction } = useModal()

  const isAdmin = sessionUser?.rol === 'administrador'
  const userDept = sessionUser?.departamento || ''

  const [departamento, setDepartamento] = useState(isAdmin ? '' : userDept)
  const [brigadas, setBrigadas] = useState([])
  const [brigada, setBrigada] = useState('')
  const [semana, setSemana] = useState(4)

  const [personal, setPersonal] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [diaActivo, setDiaActivo] = useState(0)

  useEffect(() => {
    if (departamento) {
      getBrigadas(departamento).then(setBrigadas).catch(() => {})
      setBrigada('')
    } else {
      setBrigadas([])
      setBrigada('')
    }
  }, [departamento])

  const cargarDatos = useCallback(async () => {
    if (!departamento || !semana) return
    setLoading(true)
    try {
      const params = { departamento, semana }
      if (brigada) params.brigada = brigada
      const [personalData, existingData] = await Promise.all([
        getPersonalAsistencia(params),
        getAsistencia(params),
      ])
      personalData.sort((a, b) => {
        const numA = parseInt((a.codBrigada || '').replace(/\D/g, ''), 10) || 0
        const numB = parseInt((b.codBrigada || '').replace(/\D/g, ''), 10) || 0
        if (numA !== numB) return numA - numB
        return (a.usuario || '').localeCompare(b.usuario || '')
      })
      setPersonal(personalData)

      const map = {}
      for (const rec of existingData) {
        map[`${rec.encuestador_id}_${rec.dia}_${rec.turno}`] = rec
      }
      setAttendanceMap(map)
    } catch (err) {
      showAlert('Error al cargar datos: ' + (err.response?.data?.error || err.message), 'error')
    } finally {
      setLoading(false)
    }
  }, [departamento, brigada, semana, showAlert])

  useEffect(() => {
    if (departamento && semana) {
      cargarDatos()
    }
  }, [departamento, brigada, semana, cargarDatos])

  const updateField = (encuestadorId, dia, turno, field, value) => {
    const key = `${encuestadorId}_${dia}_${turno}`
    setAttendanceMap((prev) => {
      const current = prev[key] || {
        encuestador_id: encuestadorId,
        dia,
        turno,
        estatus: 'N/A',
        ingreso: '',
        fIngreso: '',
        salida: '',
        fSalida: '',
        observacion: '',
      }
      return { ...prev, [key]: { ...current, [field]: value } }
    })
  }

  const getValue = (encuestadorId, dia, turno, field) => {
    const rec = attendanceMap[`${encuestadorId}_${dia}_${turno}`]
    return rec ? rec[field] || '' : ''
  }

  const getCellStyle = (hora, detalle) => {
    if (hora && !detalle) return 'bg-red-100'
    if (detalle === 'S/R' || detalle === 'SIN SEÑAL') return 'bg-yellow-100'
    return ''
  }

  const handleSave = async () => {
    const brigadaPorPersona = {}
    for (const p of personal) {
      if (!brigadaPorPersona[p.encuestador_id]) {
        brigadaPorPersona[p.encuestador_id] = p.codBrigada
      }
    }

    const records = []
    for (const key in attendanceMap) {
      const r = attendanceMap[key]
      if (r.ingreso || r.salida || r.fIngreso || r.fSalida || r.observacion) {
        records.push({
          encuestador_id: r.encuestador_id,
          dia: r.dia,
          turno: r.turno,
          estatus: r.fIngreso || r.fSalida || 'N/A',
          ingreso: r.ingreso || '',
          fIngreso: r.fIngreso || '',
          salida: r.salida || '',
          fSalida: r.fSalida || '',
          observacion: r.observacion || '',
          brigada: brigadaPorPersona[r.encuestador_id] || brigada || '',
          departamento,
        })
      }
    }

    if (records.length === 0) {
      showAlert('No hay datos para guardar.', 'warning')
      return
    }

    setSaving(true)
    try {
      await saveAsistencia({
        records,
        semana: parseInt(semana, 10),
        departamento,
        brigada: brigada || undefined,
      })
      showAlert(`Asistencia guardada correctamente (${records.length} registros).`, 'success')
    } catch (err) {
      showAlert('Error al guardar: ' + (err.response?.data?.error || err.message), 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportarExcel = async () => {
    if (personal.length === 0) {
      showAlert('No hay personal cargado para exportar.', 'warning')
      return
    }

    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Sistema de Asistencia'
      const sheet = workbook.addWorksheet(`ASISTENCIA SEM ${semana}`)

      const headers = [
        'ID DEP',
        'DEPARTAMENTO',
        'CÓDIGO BRIGADA',
        'SEMANA',
        'ID',
        'CARGO',
        'NOMBRE',
        'USUARIO',
        'DÍA / FECHA',
        'INGRESO T1',
        'DETALLE INGRESO T1',
        'SALIDA T1',
        'DETALLE SALIDA T1',
        'OBSERVACIÓN T1',
        'INGRESO T2',
        'DETALLE INGRESO T2',
        'SALIDA T2',
        'DETALLE SALIDA T2',
        'OBSERVACIÓN T2',
      ]

      sheet.columns = headers.map(() => ({ width: 18 }))

      const headerRow = sheet.getRow(1)
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      })

      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      }

      let rowIdx = 2
      let hasData = false

      for (const p of personal) {
        for (let d = 0; d < DIAS.length; d++) {
          const dia = DIAS[d]
          const t1 = attendanceMap[`${p.encuestador_id}_${dia}_T1`] || {}
          const t2 = attendanceMap[`${p.encuestador_id}_${dia}_T2`] || {}

          if (!t1.ingreso && !t1.salida && !t2.ingreso && !t2.salida) continue
          hasData = true

          const row = sheet.getRow(rowIdx)
          const values = [
            p.idDep || '',
            p.departamento || '',
            p.codBrigada || '',
            semana,
            p.usuario || '',
            p.cargo || '',
            p.nombre || '',
            p.usuario || '',
            getDiaFecha(semana, d),
            t1.ingreso || '',
            t1.fIngreso || '',
            t1.salida || '',
            t1.fSalida || '',
            t1.observacion || '',
            t2.ingreso || '',
            t2.fIngreso || '',
            t2.salida || '',
            t2.fSalida || '',
            t2.observacion || '',
          ]

          values.forEach((v, i) => {
            const cell = row.getCell(i + 1)
            cell.value = v
            cell.font = { name: 'Calibri', size: 10 }
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            }
            cell.alignment = {
              horizontal: i >= 9 ? 'center' : 'left',
              vertical: 'middle',
            }
          })

          rowIdx++
        }
      }

      if (!hasData) {
        showAlert('No hay registros de asistencia para exportar.', 'warning')
        return
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte_Asistencia_Sem${semana}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showAlert('Reporte Excel generado correctamente.', 'success')
    } catch (err) {
      showAlert('Error al generar Excel: ' + err.message, 'error')
    }
  }

  const brigadaOptions = brigadas.map((b) => ({
    value: b.nombre,
    label: b.nombre,
  }))

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          {isAdmin && (
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Departamento
              </label>
              <select
                className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[160px]"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Filtrar por Brigada
              </label>
              <select
                className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white min-w-[160px]"
                value={brigada}
                onChange={(e) => setBrigada(e.target.value)}
                disabled={!departamento}
              >
                <option value="">TODAS LAS BRIGADAS</option>
                {brigadaOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Semana N°
            </label>
            <input
              type="number"
              className="border border-slate-300 rounded px-3 py-1.5 text-sm w-20"
              value={semana}
              onChange={(e) => setSemana(parseInt(e.target.value) || 0)}
              min={1}
              max={53}
            />
          </div>
          {personal.length > 0 && (
            <div className="flex items-center text-xs text-slate-500 ml-2">
              <span className="font-semibold text-slate-700">{personal.length}</span> personas
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 mb-4 flex flex-wrap gap-2 items-center">
        <button
          className="bg-blue-600 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50"
          onClick={handleSave}
          disabled={saving || !departamento}
        >
          {saving ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
        <button
          className="bg-green-700 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-green-800 transition-colors disabled:opacity-50"
          onClick={exportarExcel}
          disabled={personal.length === 0}
        >
          Exportar Excel
        </button>
        {personal.length > 0 && (
          <button
            className="bg-slate-600 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={cargarDatos}
          >
            Recargar
          </button>
        )}
      </div>

      {personal.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="flex border-b border-slate-200 bg-slate-50">
            {DIAS.map((dia, i) => (
              <button
                key={dia}
                className={`flex-1 py-2.5 text-xs font-semibold cursor-pointer transition-colors border-none ${
                  diaActivo === i
                    ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setDiaActivo(i)}
              >
                <span className="block">{dia}</span>
                <span className="block text-[10px] font-normal text-slate-400">
                  {getDiaFechaShort(i, semana)}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th rowSpan={2} className="border border-slate-700 px-1.5 py-1 text-xs align-middle w-8">
                    N°
                  </th>
                  <th rowSpan={2} className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[160px]">
                    NOMBRE
                  </th>
                  <th rowSpan={2} className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[80px]">
                    CARGO
                  </th>
                  <th rowSpan={2} className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[80px]">
                    BRIGADA
                  </th>
                  <th rowSpan={2} className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[90px]">
                    USUARIO
                  </th>
                  <th
                    colSpan={5}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle bg-blue-800 text-center"
                  >
                    TURNO 1 (Mañana)
                  </th>
                  <th
                    colSpan={5}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle bg-indigo-800 text-center"
                  >
                    TURNO 2 (Tarde/Noche)
                  </th>
                </tr>
                <tr className="bg-slate-700 text-white">
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[60px]">
                    Ingreso
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[120px]">
                    Detalle Ingreso
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[60px]">
                    Salida
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[120px]">
                    Detalle Salida
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[100px]">
                    Observación
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[60px]">
                    Ingreso
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[120px]">
                    Detalle Ingreso
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[60px]">
                    Salida
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[120px]">
                    Detalle Salida
                  </th>
                  <th className="border border-slate-600 px-1 py-0.5 text-[10px] align-middle min-w-[100px]">
                    Observación
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="text-center py-10 text-slate-400 text-sm"
                    >
                      Cargando personal...
                    </td>
                  </tr>
                ) : personal.length === 0 ? (
                  <tr>
                    <td
                      colSpan={15}
                      className="text-center py-10 text-slate-400 text-sm"
                    >
                      Seleccione un departamento y semana para cargar el personal.
                    </td>
                  </tr>
                ) : (
                  personal.map((p, idx) => {
                    const dia = DIAS[diaActivo]
                    const t1Ingreso = getValue(p.encuestador_id, dia, 'T1', 'ingreso')
                    const t1fIngreso = getValue(p.encuestador_id, dia, 'T1', 'fIngreso')
                    const t1Salida = getValue(p.encuestador_id, dia, 'T1', 'salida')
                    const t1fSalida = getValue(p.encuestador_id, dia, 'T1', 'fSalida')
                    const t1Obs = getValue(p.encuestador_id, dia, 'T1', 'observacion')
                    const t2Ingreso = getValue(p.encuestador_id, dia, 'T2', 'ingreso')
                    const t2fIngreso = getValue(p.encuestador_id, dia, 'T2', 'fIngreso')
                    const t2Salida = getValue(p.encuestador_id, dia, 'T2', 'salida')
                    const t2fSalida = getValue(p.encuestador_id, dia, 'T2', 'fSalida')
                    const t2Obs = getValue(p.encuestador_id, dia, 'T2', 'observacion')

                    return (
                      <tr
                        key={p.encuestador_id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle font-medium whitespace-nowrap">
                          {p.nombre}
                        </td>
                        <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.cargo === 'SUPERVISOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.cargo}
                          </span>
                        </td>
                        <td className="border border-slate-200 px-1.5 py-1 text-xs text-center align-middle font-mono text-slate-600">
                          {(p.codBrigada || '').replace(/BRIGADA\s*/i, '')}
                        </td>
                        <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle font-mono text-slate-700">
                          {p.usuario}
                        </td>

                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="time"
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Ingreso, t1fIngreso)}`}
                            value={t1Ingreso}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T1', 'ingreso', e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Ingreso, t1fIngreso)}`}
                            value={t1fIngreso}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T1', 'fIngreso', e.target.value)
                            }
                          >
                            <option value=""></option>
                            {METODOS_VERIFICACION.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="time"
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Salida, t1fSalida)}`}
                            value={t1Salida}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T1', 'salida', e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Salida, t1fSalida)}`}
                            value={t1fSalida}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T1', 'fSalida', e.target.value)
                            }
                          >
                            <option value=""></option>
                            {METODOS_VERIFICACION.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-1 py-1 text-xs"
                            value={t1Obs}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T1',
                                'observacion',
                                e.target.value,
                              )
                            }
                            placeholder="..."
                          />
                        </td>

                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="time"
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Ingreso, t2fIngreso)}`}
                            value={t2Ingreso}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T2', 'ingreso', e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Ingreso, t2fIngreso)}`}
                            value={t2fIngreso}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T2', 'fIngreso', e.target.value)
                            }
                          >
                            <option value=""></option>
                            {METODOS_VERIFICACION.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="time"
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Salida, t2fSalida)}`}
                            value={t2Salida}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T2', 'salida', e.target.value)
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Salida, t2fSalida)}`}
                            value={t2fSalida}
                            onChange={(e) =>
                              updateField(p.encuestador_id, dia, 'T2', 'fSalida', e.target.value)
                            }
                          >
                            <option value=""></option>
                            {METODOS_VERIFICACION.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <input
                            type="text"
                            className="w-full border border-slate-300 rounded px-1 py-1 text-xs"
                            value={t2Obs}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T2',
                                'observacion',
                                e.target.value,
                              )
                            }
                            placeholder="..."
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && personal.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300"></span>
                Alerta: hora sin detalle
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>
                Advertencia: S/R o SIN SEÑAL
              </span>
            </div>
          )}
        </div>
      )}

      <ModalAlert
        show={alertModal.show}
        message={alertModal.message}
        type={alertModal.type}
        onClose={closeAlert}
      />
      <ModalConfirm
        show={confirmModal.show}
        message={confirmModal.message}
        onConfirm={() => confirmAction(true)}
        onCancel={() => confirmAction(false)}
      />
    </div>
  )
}
