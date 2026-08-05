import { useState, useEffect, useCallback } from 'react'
import { useModal } from '../../hooks/useModal'
import {
  getPersonalAsistencia,
  getAsistencia,
  saveAsistencia,
} from '../../services/asistenciaService'
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

const DIAS = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
]

const SEMANA_ANCLA = 5
const FECHA_ANCLA = new Date(new Date().getFullYear(), 7, 3)

function getFechaSemana(semana, diaIndex) {
  const target = new Date(FECHA_ANCLA)
  target.setDate(target.getDate() + (semana - SEMANA_ANCLA) * 7 + diaIndex)
  return target
}

function getDiaFechaShort(diaIndex, semana) {
  const target = getFechaSemana(semana, diaIndex)
  const dd = String(target.getDate()).padStart(2, '0')
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function getSemanaActual() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const ancla = new Date(FECHA_ANCLA)
  ancla.setHours(0, 0, 0, 0)
  const diffDias = Math.round((hoy - ancla) / 86400000)
  return SEMANA_ANCLA + Math.floor(diffDias / 7)
}

export default function ReporteAsistencia({ sessionUser }) {
  const { alertModal, confirmModal, showAlert, closeAlert, confirmAction } =
    useModal()

  const isAdmin = sessionUser?.rol === 'administrador'
  const userDept = sessionUser?.departamento || ''

  const [departamento, setDepartamento] = useState(isAdmin ? '' : userDept)
  const [semana, setSemana] = useState(getSemanaActual())

  const [personal, setPersonal] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [diaActivo, setDiaActivo] = useState(0)

  const [loteTurno, setLoteTurno] = useState('AMBOS')
  const [loteIngreso, setLoteIngreso] = useState('')
  const [loteFIngreso, setLoteFIngreso] = useState('')
  const [loteSalida, setLoteSalida] = useState('')
  const [loteFSalida, setLoteFSalida] = useState('')
  const [loteObs, setLoteObs] = useState('')

  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const cargarDatos = useCallback(async () => {
    if (!departamento || !semana) return
    setLoading(true)
    try {
      const params = { departamento, semana }
      const [personalData, existingData] = await Promise.all([
        getPersonalAsistencia(params),
        getAsistencia(params),
      ])
      const vistos = new Set()
      const personalUnico = personalData.filter((p) => {
        if (vistos.has(p.encuestador_id)) return false
        vistos.add(p.encuestador_id)
        return true
      })
      personalUnico.sort((a, b) => {
        const numA = parseInt((a.codBrigada || '').replace(/\D/g, ''), 10) || 0
        const numB = parseInt((b.codBrigada || '').replace(/\D/g, ''), 10) || 0
        if (numA !== numB) return numA - numB
        return (a.usuario || '').localeCompare(b.usuario || '')
      })
      setPersonal(personalUnico)
      setSelectedIds(new Set())

      const map = {}
      for (const rec of existingData) {
        map[`${rec.encuestador_id}_${rec.dia}_${rec.turno}`] = rec
      }
      setAttendanceMap(map)
    } catch (err) {
      showAlert(
        'Error al cargar datos: ' + (err.response?.data?.error || err.message),
        'error',
      )
    } finally {
      setLoading(false)
    }
  }, [departamento, semana, showAlert])

  useEffect(() => {
    if (departamento && semana) {
      cargarDatos()
    }
  }, [departamento, semana, cargarDatos])

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
          brigada: brigadaPorPersona[r.encuestador_id] || '',
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
      })
      showAlert(
        `Asistencia guardada correctamente (${records.length} registros).`,
        'success',
      )
    } catch (err) {
      showAlert(
        'Error al guardar: ' + (err.response?.data?.error || err.message),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const ids = personal.map((p) => p.encuestador_id)
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id))
      return allSelected ? new Set() : new Set(ids)
    })
  }

  const aplicarLote = () => {
    if (
      !loteIngreso &&
      !loteSalida &&
      !loteFIngreso &&
      !loteFSalida &&
      !loteObs
    ) {
      showAlert('Ingrese al menos un valor para aplicar.', 'warning')
      return
    }
    if (personal.length === 0) {
      showAlert('No hay personal cargado para aplicar.', 'warning')
      return
    }

    const aplicables = personal.filter((p) => selectedIds.has(p.encuestador_id))

    if (aplicables.length === 0) {
      showAlert(
        'Seleccione al menos una persona (checkbox de la tabla) para aplicar.',
        'warning',
      )
      return
    }

    const dia = DIAS[diaActivo]
    const turnos = loteTurno === 'AMBOS' ? ['T1', 'T2'] : [loteTurno]

    setAttendanceMap((prev) => {
      const next = { ...prev }
      for (const p of aplicables) {
        for (const turno of turnos) {
          const key = `${p.encuestador_id}_${dia}_${turno}`
          const current = next[key] || {
            encuestador_id: p.encuestador_id,
            dia,
            turno,
            estatus: 'N/A',
            ingreso: '',
            fIngreso: '',
            salida: '',
            fSalida: '',
            observacion: '',
          }
          next[key] = {
            ...current,
            ingreso: loteIngreso || current.ingreso,
            fIngreso: loteFIngreso || current.fIngreso,
            salida: loteSalida || current.salida,
            fSalida: loteFSalida || current.fSalida,
            observacion: loteObs || current.observacion,
          }
        }
      }
      return next
    })

    showAlert(
      `Valores aplicados a ${aplicables.length} persona(s) en ${dia}${turnos.length > 1 ? ' (T1 y T2)' : ''}.`,
      'success',
    )

    if (
      document.activeElement &&
      typeof document.activeElement.blur === 'function'
    ) {
      document.activeElement.blur()
    }

    setLoteTurno('AMBOS')
    setLoteIngreso('')
    setLoteFIngreso('')
    setLoteSalida('')
    setLoteFSalida('')
    setLoteObs('')
    setSelectedIds(new Set())
  }

  const handleLoteKeyDown = (e) => {
    if (
      e.key === 'Enter' &&
      !e.target.closest('button') &&
      !alertModal.show &&
      !confirmModal.show
    ) {
      e.preventDefault()
      aplicarLote()
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
      sheet.views = [{ state: 'normal', zoomScale: 80 }]

      const INFO_COLS = 8
      const COLS_PER_DAY = 10
      const TOTAL_COLS = INFO_COLS + DIAS.length * COLS_PER_DAY
      const dayStart = (i) => INFO_COLS + 1 + i * COLS_PER_DAY

      const WIDTH_PADDING = 5 / 7
      const INFO_WIDTHS = [11, 15.71, 10.86, 8.43, 8.14, 22, 39, 9.29]
      const DAY_WIDTHS = [12.43, 17.14, 12.43, 17.14, 14]

      const widths = [...INFO_WIDTHS]
      for (let i = 0; i < DIAS.length; i++) {
        widths.push(...DAY_WIDTHS, ...DAY_WIDTHS)
      }

      sheet.columns = widths.map((width) => ({
        width: Math.round((width + WIDTH_PADDING) * 100) / 100,
      }))

      const titleRow = sheet.getRow(1)
      titleRow.getCell(1).value =
        'REPORTE DE ASISTENCIA DE LAS BRIGADAS POR SEMANA'
      titleRow.getCell(1).font = { name: 'Calibri', size: 20, bold: true }
      titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
      titleRow.height = 28
      sheet.mergeCells(1, 1, 1, INFO_COLS)

      const semanaTrimestre = getFechaSemana(semana, 0)
      const trimestre = Math.floor(semanaTrimestre.getMonth() / 3) + 1
      const infoRow2 = sheet.getRow(2)
      infoRow2.getCell(1).value = 'TRIMESTRE'
      infoRow2.getCell(1).font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FF808080' } }
      infoRow2.getCell(3).value = trimestre
      infoRow2.getCell(3).font = {
        name: 'Calibri',
        size: 20,
        color: { argb: 'FFFF0000' },
        bold: true,
      }
      infoRow2.getCell(3).alignment = { horizontal: 'left' }

      const infoRow3 = sheet.getRow(3)
      infoRow3.getCell(1).value = 'SEMANA'
      infoRow3.getCell(1).font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FF808080' } }
      infoRow3.getCell(3).value = semana
      infoRow3.getCell(3).font = {
        name: 'Calibri',
        size: 20,
        color: { argb: 'FFFF0000' },
        bold: true,
      }
      infoRow3.getCell(3).alignment = { horizontal: 'left' }

      const borderThin = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }

      DIAS.forEach((dia, i) => {
        const start = dayStart(i)
        const end = start + COLS_PER_DAY - 1

        const fecha = getFechaSemana(semana, i)
        const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}/${String(
          fecha.getMonth() + 1,
        ).padStart(2, '0')}/${fecha.getFullYear()}`

        sheet.mergeCells(1, start, 1, end)
        const diaCell = sheet.getCell(1, start)
        diaCell.value = dia
        diaCell.font = { name: 'Calibri', size: 11, bold: true }
        diaCell.alignment = { horizontal: 'center', vertical: 'middle' }
        diaCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' },
        }

        sheet.mergeCells(2, start, 2, end)
        const fechaCell = sheet.getCell(2, start)
        fechaCell.value = fechaStr
        fechaCell.font = { name: 'Calibri', size: 11, bold: true }
        fechaCell.alignment = { horizontal: 'center', vertical: 'middle' }
        fechaCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F1F5F9' },
        }

        sheet.mergeCells(3, start, 3, start + 4)
        const turno1Cell = sheet.getCell(3, start)
        turno1Cell.value = 'TURNO 1'
        turno1Cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: '000000' },
        }
        turno1Cell.alignment = { horizontal: 'center', vertical: 'middle' }
        turno1Cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' },
        }

        sheet.mergeCells(3, start + 5, 3, end)
        const turno2Cell = sheet.getCell(3, start + 5)
        turno2Cell.value = 'TURNO 2'
        turno2Cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: '000000' },
        }
        turno2Cell.alignment = { horizontal: 'center', vertical: 'middle' }
        turno2Cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' },
        }

        for (let r = 1; r <= 3; r++) {
          for (let c = start; c <= end; c++) {
            sheet.getCell(r, c).border = borderThin
          }
        }
      })

      const headerRow = sheet.getRow(4)
      headerRow.height = 39

      const infoHeaders = [
        'ID DEP',
        'DEPARTAMENTO',
        'CÓDIGO BRIGADA',
        'SEMANA',
        'ID ENC',
        'CARGO',
        'NOMBRE',
        'USUARIO',
      ]

      infoHeaders.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = h
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFF' },
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1E293B' },
        }
        cell.border = borderThin
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        }
      })

      for (let i = 0; i < DIAS.length; i++) {
        const start = dayStart(i)
        for (let k = 0; k < COLS_PER_DAY; k++) {
          const col = start + k
          const cell = headerRow.getCell(col)
          cell.border = borderThin
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          }

          const pos = k % 5
          if (pos === 0 || pos === 2) {
            cell.value = {
              richText: [
                {
                  text: pos === 0 ? 'INGRESO' : 'SALIDA',
                  font: {
                    name: 'Calibri',
                    size: 11,
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                  },
                },
                {
                  text:
                    pos === 0
                      ? ' (FORMATO DE 24 HORAS)'
                      : ' (Formato de 24 horas)',
                  font: {
                    name: 'Calibri',
                    size: 11,
                    bold: true,
                    color: { argb: 'FFFF0000' },
                  },
                },
              ],
            }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '1E293B' },
            }
          } else if (pos === 4) {
            cell.value = 'OBSERVACIÓN'
            cell.font = {
              name: 'Calibri',
              size: 11,
              bold: true,
              color: { argb: 'FF000000' },
            }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2CC' },
            }
          } else {
            cell.value = pos === 1 ? 'DETALLE INGRESO' : 'DETALLE SALIDA'
            cell.font = {
              name: 'Calibri',
              size: 11,
              bold: true,
              color: { argb: 'FFFFFF' },
            }
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '1E293B' },
            }
          }
        }
      }

      sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: TOTAL_COLS },
      }

      let rowIdx = 5
      let hasData = false

      for (const p of personal) {
        const infoValues = [
          p.idDep || '',
          p.departamento || '',
          p.codBrigada || '',
          semana,
          '',
          p.cargo || '',
          p.nombre || '',
          p.usuario || '',
        ]

        const values = []
        for (let d = 0; d < DIAS.length; d++) {
          const dia = DIAS[d]
          const t1 = attendanceMap[`${p.encuestador_id}_${dia}_T1`] || {}
          const t2 = attendanceMap[`${p.encuestador_id}_${dia}_T2`] || {}
          values.push(
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
          )
        }

        if (!values.some((v) => v)) continue
        hasData = true

        const row = sheet.getRow(rowIdx)
        infoValues.forEach((v, i) => {
          const cell = row.getCell(i + 1)
          cell.value = v
          cell.font = { name: 'Calibri', size: 11 }
          cell.border = borderThin
          const centered = i === 0 || i === 3
          cell.alignment = {
            horizontal: centered ? 'center' : 'left',
            vertical: 'middle',
          }
        })

        values.forEach((v, i) => {
          const cell = row.getCell(INFO_COLS + 1 + i)
          cell.value = v
          cell.font = { name: 'Calibri', size: 11 }
          cell.border = borderThin
          const pos = i % 5
          const alignLeft = pos === 1 || pos === 3 || pos === 4
          cell.alignment = {
            horizontal: alignLeft ? 'left' : 'center',
            vertical: 'middle',
          }
        })

        rowIdx++
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

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full bg-blue-600"></span>
            <h2 className="text-sm font-semibold text-slate-800 tracking-wide">
              Control de Asistencia
            </h2>
          </div>
          {personal.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {personal.length} persona(s)
            </span>
          )}
        </div>
        <div className="p-4 flex flex-wrap items-end gap-x-4 gap-y-3">
          {isAdmin && (
            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                Departamento
              </label>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
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
              Semana N°
            </label>
            <input
              type="number"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              value={semana}
              onChange={(e) => setSemana(parseInt(e.target.value) || 0)}
              min={1}
              max={53}
            />
          </div>
          <div className="flex-1 hidden md:block"></div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-blue-600 text-white border-none px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              onClick={handleSave}
              disabled={saving || !departamento}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white border-none px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              onClick={exportarExcel}
              disabled={personal.length === 0}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar Excel
            </button>
            {personal.length > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-slate-600 text-white border-none px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors shadow-sm"
                onClick={cargarDatos}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Recargar
              </button>
            )}
          </div>
        </div>
        {personal.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Registro en lote
              </span>
              <span className="text-[10px] text-slate-400">
                Aplica al {DIAS[diaActivo]} (
                {getDiaFechaShort(diaActivo, semana)}) a los seleccionados (
                {selectedIds.size} de {personal.length} persona(s))
              </span>
            </div>
            <div
              className="flex flex-wrap gap-3 items-end"
              onKeyDown={handleLoteKeyDown}
            >
              <div className="flex flex-col">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Turno
                </label>
                <select
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  value={loteTurno}
                  onChange={(e) => setLoteTurno(e.target.value)}
                >
                  <option value="AMBOS">Ambos turnos</option>
                  <option value="T1">Turno 1 (Mañana)</option>
                  <option value="T2">Turno 2 (Tarde/Noche)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Hora ingreso
                </label>
                <input
                  type="time"
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm"
                  value={loteIngreso}
                  onChange={(e) => setLoteIngreso(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Detalle ingreso
                </label>
                <select
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  value={loteFIngreso}
                  onChange={(e) => setLoteFIngreso(e.target.value)}
                >
                  <option value=""></option>
                  {METODOS_VERIFICACION.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Hora salida
                </label>
                <input
                  type="time"
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm"
                  value={loteSalida}
                  onChange={(e) => setLoteSalida(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Detalle salida
                </label>
                <select
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
                  value={loteFSalida}
                  onChange={(e) => setLoteFSalida(e.target.value)}
                >
                  <option value=""></option>
                  {METODOS_VERIFICACION.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col min-w-[160px]">
                <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1">
                  Observación
                </label>
                <input
                  type="text"
                  className="border border-slate-300 rounded px-3 py-1.5 text-sm"
                  value={loteObs}
                  onChange={(e) => setLoteObs(e.target.value)}
                  placeholder="..."
                />
              </div>
              <button
                type="button"
                className="bg-indigo-600 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-indigo-700 transition-colors"
                onClick={aplicarLote}
              >
                {selectedIds.size > 0
                  ? `Aplicar a ${selectedIds.size} seleccionado(s)`
                  : 'Aplicar seleccionados'}
              </button>
              <button
                type="button"
                className="bg-slate-500 text-white border-none px-4 py-1.5 rounded text-xs font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => {
                  setLoteTurno('AMBOS')
                  setLoteIngreso('')
                  setLoteFIngreso('')
                  setLoteSalida('')
                  setLoteFSalida('')
                  setLoteObs('')
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
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
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle w-8"
                  >
                    <input
                      type="checkbox"
                      title="Seleccionar todos"
                      className="accent-blue-500 cursor-pointer"
                      checked={
                        personal.length > 0 &&
                        personal.every((p) => selectedIds.has(p.encuestador_id))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle w-8"
                  >
                    N°
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[160px]"
                  >
                    NOMBRE
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[80px]"
                  >
                    CARGO
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[80px]"
                  >
                    BRIGADA
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-700 px-1.5 py-1 text-xs align-middle text-left min-w-[90px]"
                  >
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
                      colSpan={16}
                      className="text-center py-10 text-slate-400 text-sm"
                    >
                      Cargando personal...
                    </td>
                  </tr>
                ) : personal.length === 0 ? (
                  <tr>
                    <td
                      colSpan={16}
                      className="text-center py-10 text-slate-400 text-sm"
                    >
                      Seleccione un departamento y semana para cargar el
                      personal.
                    </td>
                  </tr>
                ) : (
                  personal.map((p, idx) => {
                    const dia = DIAS[diaActivo]
                    const t1Ingreso = getValue(
                      p.encuestador_id,
                      dia,
                      'T1',
                      'ingreso',
                    )
                    const t1fIngreso = getValue(
                      p.encuestador_id,
                      dia,
                      'T1',
                      'fIngreso',
                    )
                    const t1Salida = getValue(
                      p.encuestador_id,
                      dia,
                      'T1',
                      'salida',
                    )
                    const t1fSalida = getValue(
                      p.encuestador_id,
                      dia,
                      'T1',
                      'fSalida',
                    )
                    const t1Obs = getValue(
                      p.encuestador_id,
                      dia,
                      'T1',
                      'observacion',
                    )
                    const t2Ingreso = getValue(
                      p.encuestador_id,
                      dia,
                      'T2',
                      'ingreso',
                    )
                    const t2fIngreso = getValue(
                      p.encuestador_id,
                      dia,
                      'T2',
                      'fIngreso',
                    )
                    const t2Salida = getValue(
                      p.encuestador_id,
                      dia,
                      'T2',
                      'salida',
                    )
                    const t2fSalida = getValue(
                      p.encuestador_id,
                      dia,
                      'T2',
                      'fSalida',
                    )
                    const t2Obs = getValue(
                      p.encuestador_id,
                      dia,
                      'T2',
                      'observacion',
                    )

                    return (
                      <tr
                        key={p.encuestador_id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        <td className="border border-slate-200 px-1.5 py-1 text-xs align-middle text-center">
                          <input
                            type="checkbox"
                            className="accent-blue-500 cursor-pointer"
                            checked={selectedIds.has(p.encuestador_id)}
                            onChange={() => toggleSelect(p.encuestador_id)}
                          />
                        </td>
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
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T1',
                                'ingreso',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Ingreso, t1fIngreso)}`}
                            value={t1fIngreso}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T1',
                                'fIngreso',
                                e.target.value,
                              )
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
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T1',
                                'salida',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t1Salida, t1fSalida)}`}
                            value={t1fSalida}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T1',
                                'fSalida',
                                e.target.value,
                              )
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
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T2',
                                'ingreso',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Ingreso, t2fIngreso)}`}
                            value={t2fIngreso}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T2',
                                'fIngreso',
                                e.target.value,
                              )
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
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T2',
                                'salida',
                                e.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="border border-slate-200 p-0.5 align-middle">
                          <select
                            className={`w-full border border-slate-300 rounded px-1 py-1 text-xs ${getCellStyle(t2Salida, t2fSalida)}`}
                            value={t2fSalida}
                            onChange={(e) =>
                              updateField(
                                p.encuestador_id,
                                dia,
                                'T2',
                                'fSalida',
                                e.target.value,
                              )
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
